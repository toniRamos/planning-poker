import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoConnection } from './infrastructure/database/MongoConnection';
import { UserService } from './application/services/UserService';

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

// Initialize user service
const userService = new UserService();

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user joining with their name
  socket.on('user-join', (userName: string) => {
    if (!userName || userName.trim() === '') {
      socket.emit('error', { message: 'Name is required' });
      return;
    }

    try {
      const user = userService.addUser(socket.id, userName);
      console.log(`👤 User joined: ${user.name} (${socket.id})`);
      
      // Send welcome message to the user
      socket.emit('welcome', {
        user: user,
        message: `Welcome ${user.name}!`
      });

      // Broadcast updated user list to all clients
      io.emit('users-updated', {
        users: userService.getAllUsers(),
        totalUsers: userService.getUserCount()
      });

      // Broadcast new user joined message to other users
      socket.broadcast.emit('user-joined', {
        user: user,
        message: `${user.name} joined the session`
      });

    } catch (error) {
      console.error('Error adding user:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Handle user name change
  socket.on('update-name', (newName: string) => {
    if (!newName || newName.trim() === '') {
      socket.emit('error', { message: 'Name is required' });
      return;
    }

    const oldUser = userService.getUser(socket.id);
    const updatedUser = userService.updateUserName(socket.id, newName);
    
    if (updatedUser && oldUser) {
      console.log(`📝 User renamed: ${oldUser.name} -> ${updatedUser.name}`);
      
      // Broadcast updated user list to all clients
      io.emit('users-updated', {
        users: userService.getAllUsers(),
        totalUsers: userService.getUserCount()
      });

      // Broadcast name change to other users
      socket.broadcast.emit('user-name-changed', {
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
      console.log(`👋 User disconnected: ${user.name} (${socket.id})`);
      
      // Broadcast updated user list to remaining clients
      io.emit('users-updated', {
        users: userService.getAllUsers(),
        totalUsers: userService.getUserCount()
      });

      // Broadcast user left message to other users
      socket.broadcast.emit('user-left', {
        user: user,
        message: `${user.name} left the session`
      });
    } else {
      console.log(`🔌 Anonymous user disconnected: ${socket.id}`);
    }
  });

  // Handle request for current user list
  socket.on('get-users', () => {
    socket.emit('users-updated', {
      users: userService.getAllUsers(),
      totalUsers: userService.getUserCount()
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