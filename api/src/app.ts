import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoConnection } from './infrastructure/database/MongoConnection';
import { UserService } from './application/services/UserService';
import { UserStoryService } from './application/services/UserStoryService';
import { UserStoryController } from './application/controllers/UserStoryController';
import { VoteService } from './application/services/VoteService';
import { VoteController } from './application/controllers/VoteController';
import { InMemorySessionRepository } from './infrastructure/repositories/InMemorySessionRepository';
import { InMemoryVoteRepository } from './infrastructure/repositories/InMemoryVoteRepository';
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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize services
const userService = new UserService();

// Create shared repository instances
const sessionRepository = new InMemorySessionRepository();
const voteRepository = new InMemoryVoteRepository();

// Initialize session service and routes (using shared repository)
const sessionService = new SessionService(sessionRepository);
const sessionController = new SessionController(sessionService);

// Initialize user story service and routes (using same repository)
const userStoryService = new UserStoryService(sessionRepository);
const userStoryController = new UserStoryController(userStoryService);

// Initialize vote service and routes
const voteService = new VoteService(voteRepository, sessionRepository);
const voteController = new VoteController(voteService);

// Create routes
const sessionRoutes = Router();
sessionRoutes.post('/sessions', sessionController.createSession.bind(sessionController));
sessionRoutes.get('/sessions', sessionController.getAllSessions.bind(sessionController));
sessionRoutes.get('/sessions/:id', sessionController.getSession.bind(sessionController));
sessionRoutes.put('/sessions/:id', sessionController.updateSession.bind(sessionController));
sessionRoutes.delete('/sessions/:id', sessionController.deleteSession.bind(sessionController));

const userStoryRoutes = createUserStoryRoutes(userStoryController);

app.use(cors());
app.use(express.json());

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

const voteRoutes = createVoteRoutes(voteController);

// API Routes
app.use('/api', sessionRoutes);
app.use('/api', userStoryRoutes);
app.use('/api', voteRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

    // Handle user joining with their name and session
  socket.on('user-join', (data: { userName: string; sessionId: string; role?: string }) => {
    const { userName, sessionId, role = 'player' } = data;
    
    if (!userName || userName.trim() === '') {
      socket.emit('error', { message: 'Name is required' });
      return;
    }

    if (!sessionId || sessionId.trim() === '') {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }

    // Check if session exists
    sessionService.getSession(sessionId).then((session) => {
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (!session.isActive) {
        socket.emit('error', { message: 'Session is not active' });
        return;
      }

      try {
        const userRole = role === 'admin' ? UserRole.ADMIN : 
                        role === 'viewer' ? UserRole.VIEWER : UserRole.PLAYER;
        const user = userService.addUser(socket.id, userName, sessionId, userRole);
        console.log(`👤 User joined session ${sessionId}: ${user.name} (${socket.id})`);
        
        // Join the socket to the session room
        socket.join(sessionId);
        
        // Send welcome message to the user
        socket.emit('welcome', {
          user: user,
          session: session,
          message: `Welcome ${user.name} to ${session.name}!`
        });

        // Broadcast updated user list to all clients in the session
        const sessionUsers = userService.getSessionUsers(sessionId);
        io.to(sessionId).emit('users-updated', {
          users: sessionUsers,
          totalUsers: sessionUsers.length
        });

        // Broadcast new user joined message to other users in the session
        socket.to(sessionId).emit('user-joined', {
          user: user,
          message: `${user.name} joined the session`
        });

      } catch (error) {
        console.error('Error adding user:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      socket.emit('error', { message: 'Failed to get session' });
    });
  });

  // Handle user name change
  socket.on('update-name', (newName: string) => {
    if (!newName || newName.trim() === '') {
      socket.emit('error', { message: 'Name is required' });
      return;
    }

    const oldUser = userService.getUser(socket.id);
    if (!oldUser) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const updatedUser = userService.updateUserName(socket.id, newName);
    
    if (updatedUser) {
      console.log(`📝 User renamed in session ${oldUser.sessionId}: ${oldUser.name} -> ${updatedUser.name}`);
      
      // Broadcast updated user list to all clients in the session
      const sessionUsers = userService.getSessionUsers(oldUser.sessionId);
      io.to(oldUser.sessionId).emit('users-updated', {
        users: sessionUsers,
        totalUsers: sessionUsers.length
      });

      // Broadcast name change to other users in the session
      socket.to(oldUser.sessionId).emit('user-name-changed', {
        oldName: oldUser.name,
        newName: updatedUser.name,
        message: `${oldUser.name} changed their name to ${updatedUser.name}`
      });

      socket.emit('name-updated', {
        user: updatedUser,
        message: 'Name updated successfully'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = userService.removeUser(socket.id);
    if (user) {
      console.log(`👋 User disconnected from session ${user.sessionId}: ${user.name} (${socket.id})`);
      
      // Leave the session room
      socket.leave(user.sessionId);
      
      // Broadcast updated user list to remaining clients in the session
      const sessionUsers = userService.getSessionUsers(user.sessionId);
      io.to(user.sessionId).emit('users-updated', {
        users: sessionUsers,
        totalUsers: sessionUsers.length
      });

      // Broadcast user left message to other users in the session
      socket.to(user.sessionId).emit('user-left', {
        user: user,
        message: `${user.name} left the session`
      });
    } else {
      console.log(`🔌 Anonymous user disconnected: ${socket.id}`);
    }
  });

  // Handle request for current session user list
  socket.on('get-users', (sessionId: string) => {
    if (!sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }

    const sessionUsers = userService.getSessionUsers(sessionId);
    socket.emit('users-updated', {
      users: sessionUsers,
      totalUsers: sessionUsers.length
    });
  });

  // Handle switching between player and spectator mode
  socket.on('switch-mode', () => {
    const user = userService.getUser(socket.id);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const updatedUser = userService.switchUserMode(socket.id);
    if (updatedUser) {
      console.log(`🔄 User switched mode in session ${user.sessionId}: ${updatedUser.name} -> ${updatedUser.isSpectator ? 'Spectator' : 'Player'}`);
      
      // Broadcast updated user list to all clients in the session
      const sessionUsers = userService.getSessionUsers(user.sessionId);
      io.to(user.sessionId).emit('users-updated', {
        users: sessionUsers,
        totalUsers: sessionUsers.length
      });

      socket.emit('mode-updated', {
        user: updatedUser,
        message: `You are now a ${updatedUser.isSpectator ? 'spectator' : 'player'}`
      });
    }
  });

  // Handle admin changing user roles
  socket.on('change-user-role', (data: { targetUserId: string; newRole: string; sessionId: string }) => {
    const { targetUserId, newRole, sessionId } = data;
    
    // Verify that the requesting user is an admin
    const requestingUser = userService.getUser(socket.id);
    if (!requestingUser || requestingUser.role !== UserRole.ADMIN) {
      socket.emit('error', { message: 'Only admins can change user roles' });
      return;
    }

    // Verify the session matches
    if (requestingUser.sessionId !== sessionId) {
      socket.emit('error', { message: 'Invalid session' });
      return;
    }

    // Find target user by their socket ID or user ID
    const targetUser = userService.getUser(targetUserId);
    if (!targetUser) {
      socket.emit('error', { message: 'Target user not found' });
      return;
    }

    // Validate new role
    const validRoles = [UserRole.ADMIN, UserRole.PLAYER, UserRole.VIEWER];
    if (!validRoles.includes(newRole as UserRole)) {
      socket.emit('error', { message: 'Invalid role specified' });
      return;
    }

    // Change the user's role
    const updatedUser = userService.changeUserRole(targetUserId, newRole as UserRole);
    if (updatedUser) {
      console.log(`👑 Admin ${requestingUser.name} changed ${updatedUser.name}'s role to ${newRole} in session ${sessionId}`);
      
      // Broadcast updated user list to all clients in the session
      const sessionUsers = userService.getSessionUsers(sessionId);
      io.to(sessionId).emit('users-updated', {
        users: sessionUsers,
        totalUsers: sessionUsers.length
      });

      // Notify the target user about their role change
      const targetSocket = [...io.sockets.sockets.values()].find(s => s.id === targetUserId);
      if (targetSocket) {
        targetSocket.emit('role-changed', {
          newRole: newRole,
          message: `Your role has been changed to ${newRole} by ${requestingUser.name}`
        });
      }

      // Confirm to the admin
      socket.emit('role-change-success', {
        targetUser: updatedUser,
        message: `Successfully changed ${updatedUser.name}'s role to ${newRole}`
      });
    } else {
      socket.emit('error', { message: 'Failed to change user role' });
    }
  });

  // User Stories WebSocket events
  socket.on('user-story-added', (data: { sessionId: string; userStory: any }) => {
    // Broadcast to all users in the session that a new user story was added
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'added',
      userStory: data.userStory
    });
  });

  socket.on('user-story-updated', (data: { sessionId: string; userStory: any }) => {
    // Broadcast to all users in the session that a user story was updated
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'updated',
      userStory: data.userStory
    });
  });

  socket.on('user-story-deleted', (data: { sessionId: string; userStoryId: string }) => {
    // Broadcast to all users in the session that a user story was deleted
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'deleted',
      userStoryId: data.userStoryId
    });
  });

  socket.on('user-stories-reordered', (data: { sessionId: string; userStories: any[] }) => {
    // Broadcast to all users in the session that user stories were reordered
    socket.to(data.sessionId).emit('user-story-updated', {
      action: 'reordered',
      userStories: data.userStories
    });
  });

  socket.on('current-story-changed', (data: { sessionId: string; currentStoryId: string }) => {
    // Broadcast to all users in the session that the current story changed
    socket.to(data.sessionId).emit('current-story-changed', {
      currentStoryId: data.currentStoryId
    });
  });

  socket.on('story-revealed', (data: { sessionId: string; userStory: any }) => {
    // Broadcast to all users in the session that the story was revealed
    socket.to(data.sessionId).emit('story-revealed', {
      userStory: data.userStory
    });
  });

  socket.on('story-score-toggled', (data: { sessionId: string; userStory: any }) => {
    // Broadcast to all users in the session that a story score status was toggled
    socket.to(data.sessionId).emit('story-score-toggled', {
      userStory: data.userStory
    });
  });

  // Voting WebSocket events
  socket.on('vote-submitted', (data: { sessionId: string; vote: any; userId: string }) => {
    // Broadcast to all users in the session that a vote was submitted (without revealing the vote)
    socket.to(data.sessionId).emit('vote-submitted', {
      userId: data.userId,
      userStoryId: data.vote.userStoryId,
      hasVoted: true
    });
  });

  socket.on('votes-revealed', (data: { sessionId: string; userStoryId: string; votes: any[] }) => {
    // Broadcast to all users in the session that votes were revealed
    socket.to(data.sessionId).emit('votes-revealed', {
      userStoryId: data.userStoryId,
      votes: data.votes
    });
  });

  socket.on('votes-cleared', (data: { sessionId: string; userStoryId: string }) => {
    // Broadcast to all users in the session that votes were cleared
    socket.to(data.sessionId).emit('votes-cleared', {
      userStoryId: data.userStoryId
    });
  });
});

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoConnection = MongoConnection.getInstance();
    await mongoConnection.connect();
    
    server.listen(PORT, () => {
      console.log(`🎉 Look planning poker!! and more boring stuff -> Server is running on port ${PORT}`);
      console.log(`📍 Access the API at: http://localhost:${SWAGGER_HOST_PORT}`);
      console.log(`📚 API Documentation at: http://localhost:${SWAGGER_HOST_PORT}/api-docs`);
      console.log(`🔌 WebSocket server is ready for connections`);
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
    const mongoConnection = MongoConnection.getInstance();
    await mongoConnection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

export default app;