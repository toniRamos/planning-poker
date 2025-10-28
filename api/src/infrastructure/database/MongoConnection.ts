import { MongoClient, Db } from 'mongodb';

export class MongoConnection {
  private static instance: MongoConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      const mongoUsername = process.env.MONGO_USERNAME;
      const mongoPassword = process.env.MONGO_PASSWORD;
      const mongoHost = process.env.MONGODB_HOST || 'db';
      const mongoPort = process.env.MONGODB_PORT || '27017';
      const dbName = process.env.MONGODB_DB_NAME || 'planning-poker';

      // Build connection URL with or without authentication
      let mongoUrl: string;
      if (mongoUsername && mongoPassword) {
        mongoUrl = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}`;
      } else {
        mongoUrl = `mongodb://${mongoHost}:${mongoPort}`;
      }

      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db(dbName);

      console.log('✅ Successfully connected to MongoDB');
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('✅ Successfully disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    return this.db;
  }

  public isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}
