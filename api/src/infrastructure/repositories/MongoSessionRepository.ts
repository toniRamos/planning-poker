import { Session } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { MongoConnection } from '../database/MongoConnection';
import { Collection, ObjectId } from 'mongodb';

interface SessionDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  maxUsers?: number;
  settings?: {
    allowSpectators: boolean;
    autoRevealCards: boolean;
    cardSet: string[];
    timerDuration?: number;
  };
  userStories: Array<{
    id: string;
    title: string;
    description?: string;
    acceptanceCriteria?: string;
    order: number;
    estimatedPoints?: string;
    isRevealed: boolean;
    isScored: boolean;
    createdAt: Date;
  }>;
  currentStoryId?: string;
}

export class MongoSessionRepository implements SessionRepository {
  private collection: Collection<SessionDocument>;

  constructor() {
    const mongoConnection = MongoConnection.getInstance();
    const db = mongoConnection.getDatabase();
    this.collection = db.collection<SessionDocument>('sessions');
    
    // Create indexes for better performance
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ createdBy: 1 });
      await this.collection.createIndex({ isActive: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.warn('Could not create indexes:', error);
    }
  }

  private documentToSession(doc: SessionDocument): Session {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      createdBy: doc.createdBy,
      creatorName: doc.creatorName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isActive: doc.isActive,
      maxUsers: doc.maxUsers,
      settings: doc.settings,
      userStories: doc.userStories.map(story => ({
        ...story,
        createdAt: story.createdAt
      })),
      currentStoryId: doc.currentStoryId
    };
  }

  private sessionToDocument(session: Session): SessionDocument {
    return {
      id: session.id,
      name: session.name,
      description: session.description,
      createdBy: session.createdBy,
      creatorName: session.creatorName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isActive: session.isActive,
      maxUsers: session.maxUsers,
      settings: session.settings,
      userStories: session.userStories.map(story => ({
        ...story,
        createdAt: story.createdAt
      })),
      currentStoryId: session.currentStoryId
    };
  }

  async create(session: Session): Promise<Session> {
    try {
      const document = this.sessionToDocument(session);
      await this.collection.insertOne(document);
      return session;
    } catch (error) {
      console.error('Error creating session in MongoDB:', error);
      throw new Error('Failed to create session');
    }
  }

  async findById(id: string): Promise<Session | null> {
    try {
      const document = await this.collection.findOne({ id });
      return document ? this.documentToSession(document) : null;
    } catch (error) {
      console.error('Error finding session by id in MongoDB:', error);
      throw new Error('Failed to find session');
    }
  }

  async update(id: string, session: Session): Promise<Session> {
    try {
      const document = this.sessionToDocument(session);
      const result = await this.collection.replaceOne(
        { id },
        document
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Session not found');
      }
      
      return session;
    } catch (error) {
      console.error('Error updating session in MongoDB:', error);
      throw error instanceof Error ? error : new Error('Failed to update session');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        throw new Error('Session not found');
      }
    } catch (error) {
      console.error('Error deleting session in MongoDB:', error);
      throw error instanceof Error ? error : new Error('Failed to delete session');
    }
  }

  async findAll(): Promise<Session[]> {
    try {
      const documents = await this.collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return documents.map(doc => this.documentToSession(doc));
    } catch (error) {
      console.error('Error finding all sessions in MongoDB:', error);
      throw new Error('Failed to find sessions');
    }
  }

  async findByCreatedBy(userId: string): Promise<Session[]> {
    try {
      const documents = await this.collection
        .find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return documents.map(doc => this.documentToSession(doc));
    } catch (error) {
      console.error('Error finding sessions by creator in MongoDB:', error);
      throw new Error('Failed to find sessions by creator');
    }
  }
}