import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RepositoryFactory } from './infrastructure/repositories/RepositoryFactory';
import { UserService } from './application/services/UserService';
import { UserStoryService } from './application/services/UserStoryService';
import { UserStoryController } from './application/controllers/UserStoryController';
import { VoteService } from './application/services/VoteService';
import { VoteController } from './application/controllers/VoteController';
import { createUserStoryRoutes } from './application/routes/userStoryRoutes';
import { createVoteRoutes } from './application/routes/voteRoutes';
import { SessionService } from './application/services/SessionService';
import { UserRole } from './domain/entities/User';
import { SessionController } from './application/controllers/SessionController';
import { Router } from 'express';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const SWAGGER_HOST_PORT = process.env.SWAGGER_HOST_PORT || PORT;

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || true, // Allow all origins in development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global services and controllers (initialized asynchronously)
let sessionService: SessionService;
let voteService: VoteService;
let userStoryService: UserStoryService;

// Initialize basic services
const userService = new UserService();

// Configure Express middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Planning Poker API',
      version: '1.0.0',
      description: 'API for planning poker',
    },
    servers: [
      {
        url: 'http://localhost:' + SWAGGER_HOST_PORT,
      },
    ],
    components: {
      securitySchemes: {
      },
    },
  },
  apis: ['./src/application/routes/*.ts', './src/application/controllers/*.ts'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize repositories and services
async function initializeServices() {
  console.log('🔄 Initializing repositories and services...');
  
  const repositoryFactory = RepositoryFactory.getInstance();
  const repositories = await repositoryFactory.createRepositories();

  // Initialize services with repositories
  sessionService = new SessionService(repositories.sessionRepository);
  voteService = new VoteService(repositories.voteRepository, repositories.sessionRepository);
  userStoryService = new UserStoryService(repositories.sessionRepository, voteService);

  // Connect UserService with VoteService for auto-reveal functionality
  voteService.setUserService(userService);

  // Initialize controllers
  const sessionController = new SessionController(sessionService);
  const voteController = new VoteController(voteService);
  const userStoryController = new UserStoryController(userStoryService);

  // Create and configure routes
  const sessionRoutes = Router();
  sessionRoutes.post('/sessions', sessionController.createSession.bind(sessionController));
  sessionRoutes.get('/sessions', sessionController.getAllSessions.bind(sessionController));
  sessionRoutes.get('/sessions/:id', sessionController.getSession.bind(sessionController));
  sessionRoutes.put('/sessions/:id', sessionController.updateSession.bind(sessionController));
  sessionRoutes.delete('/sessions/:id', sessionController.deleteSession.bind(sessionController));

  const userStoryRoutes = createUserStoryRoutes(userStoryController);
  const voteRoutes = createVoteRoutes(voteController);

  // Register routes
  app.use('/api', sessionRoutes);
  app.use('/api', userStoryRoutes);
  app.use('/api', voteRoutes);

  console.log('✅ Services and routes initialized successfully');
}

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('🔗 User connected via WebSocket');

  // User management events
  socket.on('user-join', async (data: { sessionId: string; userName: string; role?: UserRole }) => {
    try {
      socket.join(data.sessionId);
      console.log(`👤 User ${data.userName} joining session ${data.sessionId} with role ${data.role || 'PLAYER'}`);

      const session = await sessionService.getSession(data.sessionId);
      if (session) {
        // Use role from frontend if provided, otherwise determine based on creator
        let userRole = data.role || UserRole.PLAYER;
        
        // Override role to ADMIN if this is the creator (regardless of frontend role)
        // We can determine this by checking if the userName matches the creatorName
        // This is a simplified approach - in a real app you'd use proper user authentication
        if (session.creatorName === data.userName.trim()) {
          userRole = UserRole.ADMIN;
        }
        
        const user = userService.addUser(socket.id, data.userName, data.sessionId, userRole);
        
        // Send welcome message to the user who just joined
        socket.emit('welcome', {
          user: user,
          message: `Welcome to the session! You are now connected as ${user.role === UserRole.ADMIN ? 'Admin 👑' : user.role}`
        });
        
        // Notify all users in the session about the updated user list
        const updatedUsers = userService.getSessionUsers(data.sessionId);
        io.to(data.sessionId).emit('users-updated', {
          users: updatedUsers,
          totalUsers: updatedUsers.length
        });
        
        // Also send user-joined event for notifications
        io.to(data.sessionId).emit('user-joined', {
          user: user,
          message: `${user.name} joined as ${user.role === UserRole.ADMIN ? 'Admin 👑' : user.role}`
        });

        // Send current voting status to the new user
        try {
          const sessionVotes = await voteService.getVotesForSession(data.sessionId);
          if (sessionVotes.length > 0) {
            console.log(`📊 Sending current voting status to new user ${data.userName}`);
            // Group votes by userStoryId and send status for each story
            const votesGrouped = sessionVotes.reduce((acc: any, vote) => {
              if (!acc[vote.userStoryId]) {
                acc[vote.userStoryId] = [];
              }
              acc[vote.userStoryId].push(vote);
              return acc;
            }, {});

            // Send vote-submitted events for each existing vote
            Object.keys(votesGrouped).forEach(storyId => {
              const storyVotes = votesGrouped[storyId];
              storyVotes.forEach((vote: any) => {
                socket.emit('vote-submitted', {
                  sessionId: data.sessionId,
                  userStoryId: storyId,
                  userId: vote.userId,
                  hasVoted: true
                });
              });
            });
          }
        } catch (error) {
          console.error('Error sending voting status to new user:', error);
        }
      }
    } catch (error) {
      console.error('Error in user-join:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('leave-session', (data: { sessionId: string; userId: string; userName: string }) => {
    try {
      socket.leave(data.sessionId);      
      const removedUser = userService.removeUser(socket.id);
      
      // Notify remaining users about the updated user list
      const updatedUsers = userService.getSessionUsers(data.sessionId);
      socket.to(data.sessionId).emit('users-updated', {
        users: updatedUsers,
        totalUsers: updatedUsers.length
      });
      
      // Also send user-left event for notifications
      const leftUser = removedUser ? { userId: removedUser.id, userName: removedUser.name } : { userId: data.userId, userName: data.userName };
      socket.to(data.sessionId).emit('user-left', {
        user: leftUser,
        message: `${leftUser.userName} left the session`
      });
    } catch (error) {
      console.error('Error in leave-session:', error);
    }
  });

  socket.on('update-name', (data: string | { sessionId: string; newName: string }) => {
    try {
      let newName: string;
      
      if (typeof data === 'string') {
        newName = data;
      } else {
        newName = data.newName;
      }

      const user = userService.getUser(socket.id);
      if (user) {
        const updatedUser = userService.updateUserName(socket.id, newName);
        
        if (updatedUser) {
          const updatedUsers = userService.getSessionUsers(user.sessionId);
          
          // Notify all users in the session about the name change
          io.to(user.sessionId).emit('user-name-updated', {
            users: updatedUsers,
            updatedUser: { userId: updatedUser.id, userName: updatedUser.name }
          });
        }
      }
    } catch (error) {
      console.error('Error in update-name:', error);
    }
  });

  socket.on('request-role-change', (data: { sessionId: string; userId: string; newRole: UserRole }) => {
    try {
      console.log(`🔄 Role change requested for user ${data.userId} to ${data.newRole} in session ${data.sessionId}`);
      
      // Verify that the requesting user is an admin
      const requestingUser = userService.getUser(socket.id);
      if (!requestingUser || requestingUser.role !== UserRole.ADMIN) {
        socket.emit('error', { message: 'Only admins can change user roles' });
        return;
      }
      
      const updatedUser = userService.changeUserRole(data.userId, data.newRole);
      
      if (updatedUser) {
        // Notify all users in the session about the role change
        const updatedUsers = userService.getSessionUsers(data.sessionId);
        io.to(data.sessionId).emit('role-changed', {
          users: updatedUsers,
          changedUser: { userId: updatedUser.id, newRole: updatedUser.role }
        });
      }
    } catch (error) {
      console.error('Error in request-role-change:', error);
      socket.emit('error', { message: 'Failed to change user role' });
    }
  });

  // User story management events
  socket.on('user-story-added', (data: { sessionId: string; userStory: any }) => {
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'added',
      userStory: data.userStory
    });
  });

  socket.on('user-story-deleted', (data: { sessionId: string; userStoryId: string }) => {
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'deleted',
      userStoryId: data.userStoryId
    });
  });

  socket.on('user-story-reordered', (data: { sessionId: string; userStories: any[] }) => {
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'reordered',
      userStories: data.userStories
    });
  });

  socket.on('current-story-changed', (data: { sessionId: string; currentStoryId: string }) => {
    socket.to(data.sessionId).emit('current-story-changed', {
      currentStoryId: data.currentStoryId
    });
  });

  socket.on('story-revealed', (data: { sessionId: string; userStory: any }) => {
    socket.to(data.sessionId).emit('story-revealed', {
      userStory: data.userStory
    });
  });

  socket.on('story-score-toggled', (data: { sessionId: string; userStory: any }) => {
    socket.to(data.sessionId).emit('story-score-toggled', {
      userStory: data.userStory
    });
  });

  socket.on('voting-reset', (data: { sessionId: string; userStoryId: string }) => {
    console.log('🔄 Broadcasting voting-reset event for story:', data.userStoryId);
    // Emit to all users in the session, including the sender
    io.to(data.sessionId).emit('voting-reset', {
      userStoryId: data.userStoryId
    });
  });

  // Voting WebSocket events
  socket.on('vote-submitted', async (data: { sessionId: string; vote: any; userId: string; userName: string; shouldAutoReveal?: boolean; allVotes?: any[] }) => {
    // Broadcast to all users in the session that a vote was submitted (without revealing the vote)
    console.log(`🗳️ Broadcasting vote-submitted for user ${data.userName} on story ${data.vote.userStoryId}`);
    io.to(data.sessionId).emit('vote-submitted', {
      userId: data.userId,
      userName: data.userName,
      userStoryId: data.vote.userStoryId,
      hasVoted: true
    });

    // If auto-reveal is triggered, broadcast votes-revealed
    if (data.shouldAutoReveal && data.allVotes) {
      console.log(`🎯 Auto-revealing votes for story ${data.vote.userStoryId} - all players voted!`);
      
      // Calculate voting metrics
      const numericVotes = data.allVotes
        .map(vote => parseFloat(vote.points))
        .filter(value => !isNaN(value));
      
      const average = numericVotes.length > 0 
        ? (numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length).toFixed(1)
        : 0;
      
      // Broadcast votes revealed with auto-reveal flag
      io.to(data.sessionId).emit('votes-revealed', {
        userStoryId: data.vote.userStoryId,
        votes: data.allVotes.map(vote => ({
          userId: vote.userId,
          userName: vote.userName,
          value: vote.points
        })),
        metrics: {
          totalVotes: data.allVotes.length,
          average: average,
          hasNumericVotes: numericVotes.length > 0
        },
        autoRevealed: true
      });
    }
  });

  socket.on('votes-revealed', (data: { sessionId: string; userStoryId: string; votes: any[] }) => {
    // Broadcast to all users in the session that votes were revealed
    console.log(`📊 Broadcasting votes-revealed for story ${data.userStoryId} with ${data.votes.length} votes`);
    
    // Calculate voting metrics
    const numericVotes = data.votes
      .map(vote => parseFloat(vote.value))
      .filter(value => !isNaN(value));
    
    const average = numericVotes.length > 0 
      ? (numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length).toFixed(1)
      : 0;
    
    io.to(data.sessionId).emit('votes-revealed', {
      userStoryId: data.userStoryId,
      votes: data.votes,
      metrics: {
        totalVotes: data.votes.length,
        average: average,
        hasNumericVotes: numericVotes.length > 0
      }
    });
  });

  socket.on('votes-cleared', (data: { sessionId: string; userStoryId: string }) => {
    // Broadcast to all users in the session that votes were cleared
    socket.to(data.sessionId).emit('votes-cleared', {
      userStoryId: data.userStoryId
    });
  });

  // Reaction events
  socket.on('reaction-sent', (data: { sessionId: string; emoji: string; userId: string; userName: string }) => {
    console.log(`😊 User ${data.userName} sent reaction ${data.emoji} in session ${data.sessionId}`);
    
    // Broadcast the reaction to all other users in the session (not the sender)
    socket.to(data.sessionId).emit('reaction-sent', {
      emoji: data.emoji,
      userName: data.userName
    });
  });

  socket.on('reactions-toggled', (data: { sessionId: string; enabled: boolean }) => {
    console.log(`🎭 Reactions ${data.enabled ? 'enabled' : 'disabled'} in session ${data.sessionId}`);
    
    // Broadcast the reactions toggle to all users in the session
    io.to(data.sessionId).emit('reactions-toggled', {
      enabled: data.enabled
    });
  });

  // Konami Code admin promotion (secret override for orphaned sessions)
  socket.on('konami-admin-promotion', (data: { sessionId: string; userId: string; userName: string }) => {
    console.log(`🎮 KONAMI CODE ACTIVATED! Promoting ${data.userName} to admin in session ${data.sessionId}`);
    
    try {
      // Change user role to admin using socket.id
      const user = userService.changeUserRole(socket.id, UserRole.ADMIN);
      
      if (user) {
        // Notify all users about the role change
        const updatedUsers = userService.getSessionUsers(data.sessionId);
        io.to(data.sessionId).emit('users-updated', {
          users: updatedUsers,
          totalUsers: updatedUsers.length
        });

        // Send success confirmation to the promoted user
        socket.emit('role-change-success', {
          user: user,
          message: `🎮 Konami Code activated! You are now Admin! 👑`
        });

        // Notify other users about the promotion
        socket.to(data.sessionId).emit('user-joined', {
          user: user,
          message: `🎮 ${data.userName} used the Konami Code and became Admin! 👑`
        });
      }
    } catch (error) {
      console.error('Error promoting user to admin via Konami Code:', error);
      socket.emit('error', { message: 'Failed to promote to admin' });
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected from WebSocket');
    
    try {
      const removedUser = userService.removeUser(socket.id);
      
      if (removedUser) {
        // Notify remaining users about the updated user list
        const updatedUsers = userService.getSessionUsers(removedUser.sessionId);
        socket.to(removedUser.sessionId).emit('users-updated', {
          users: updatedUsers,
          totalUsers: updatedUsers.length
        });
        
        // Also send user-left event for notifications
        socket.to(removedUser.sessionId).emit('user-left', {
          user: { userId: removedUser.id, userName: removedUser.name },
          message: `${removedUser.name} disconnected`
        });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Initialize application and start server
async function startServer() {
  try {
    console.log('🚀 Starting Planning Poker server...');
    
    // Initialize repositories and services
    await initializeServices();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    const repositoryFactory = RepositoryFactory.getInstance();
    await repositoryFactory.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the application
startServer();

export default app;