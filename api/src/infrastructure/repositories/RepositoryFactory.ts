import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { VoteRepository } from '../../domain/repositories/VoteRepository';
import { InMemorySessionRepository } from './InMemorySessionRepository';
import { InMemoryVoteRepository } from './InMemoryVoteRepository';
import { MongoSessionRepository } from './MongoSessionRepository';
import { MongoVoteRepository } from './MongoVoteRepository';
import { MongoConnection } from '../database/MongoConnection';

export interface Repositories {
  sessionRepository: SessionRepository;
  voteRepository: VoteRepository;
}

export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private repositories: Repositories | null = null;

  private constructor() {}

  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  public async createRepositories(): Promise<Repositories> {
    if (this.repositories) {
      return this.repositories;
    }

    const useMongoDb = process.env.USE_MONGODB === 'true' || process.env.USE_MONGODB === '1';
    
    if (useMongoDb) {
      try {
        console.log('🔄 Attempting to connect to MongoDB...');
        const mongoConnection = MongoConnection.getInstance();
        await mongoConnection.connect();

        console.log('✅ Using MongoDB repositories');
        this.repositories = {
          sessionRepository: new MongoSessionRepository(),
          voteRepository: new MongoVoteRepository()
        };
        
        return this.repositories;
      } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        console.log('⚠️  Falling back to in-memory repositories');
      }
    } else {
      console.log('ℹ️  MongoDB disabled via environment variable');
    }

    // Fallback to in-memory repositories
    console.log('📝 Using in-memory repositories');
    this.repositories = {
      sessionRepository: new InMemorySessionRepository(),
      voteRepository: new InMemoryVoteRepository()
    };

    return this.repositories;
  }

  public getRepositories(): Repositories {
    if (!this.repositories) {
      throw new Error('Repositories not initialized. Call createRepositories() first.');
    }
    return this.repositories;
  }

  public async shutdown(): Promise<void> {
    try {
      const mongoConnection = MongoConnection.getInstance();
      if (mongoConnection.isConnected()) {
        await mongoConnection.disconnect();
      }
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}