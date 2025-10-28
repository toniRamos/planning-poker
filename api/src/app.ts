import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { MongoConnection } from './infrastructure/database/MongoConnection';

const app = express();
const PORT = process.env.PORT || 3000;
const SWAGGER_HOST_PORT = process.env.SWAGGER_HOST_PORT || PORT;

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

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoConnection = MongoConnection.getInstance();
    await mongoConnection.connect();
    
    app.listen(PORT, () => {
      console.log(`🎉 Look planning poker!! and more boring stuff -> Server is running on port ${PORT}`);
      console.log(`📍 Access the API at: http://localhost:${SWAGGER_HOST_PORT}`);
      console.log(`📚 API Documentation at: http://localhost:${SWAGGER_HOST_PORT}/api-docs`);
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