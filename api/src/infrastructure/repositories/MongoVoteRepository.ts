import { Vote } from '../../domain/entities/Vote';
import { VoteRepository } from '../../domain/repositories/VoteRepository';
import { MongoConnection } from '../database/MongoConnection';
import { Collection, ObjectId } from 'mongodb';

interface VoteDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  userName: string;
  userStoryId: string;
  sessionId: string;
  points: string;
  isRevealed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoVoteRepository implements VoteRepository {
  private collection: Collection<VoteDocument>;

  constructor() {
    const mongoConnection = MongoConnection.getInstance();
    const db = mongoConnection.getDatabase();
    this.collection = db.collection<VoteDocument>('votes');
    
    // Create indexes for better performance
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ userId: 1, userStoryId: 1 }, { unique: true });
      await this.collection.createIndex({ userStoryId: 1 });
      await this.collection.createIndex({ sessionId: 1 });
      await this.collection.createIndex({ createdAt: -1 });
    } catch (error) {
      console.warn('Could not create indexes:', error);
    }
  }

  private documentToVote(doc: VoteDocument): Vote {
    return {
      id: doc.id,
      userId: doc.userId,
      userName: doc.userName,
      userStoryId: doc.userStoryId,
      sessionId: doc.sessionId,
      points: doc.points,
      isRevealed: doc.isRevealed,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  private voteToDocument(vote: Vote): VoteDocument {
    return {
      id: vote.id,
      userId: vote.userId,
      userName: vote.userName,
      userStoryId: vote.userStoryId,
      sessionId: vote.sessionId,
      points: vote.points,
      isRevealed: vote.isRevealed,
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt
    };
  }

  async create(vote: Vote): Promise<Vote> {
    try {
      const document = this.voteToDocument(vote);
      await this.collection.insertOne(document);
      return vote;
    } catch (error) {
      console.error('Error creating vote in MongoDB:', error);
      throw new Error('Failed to create vote');
    }
  }

  async findById(id: string): Promise<Vote | null> {
    try {
      const document = await this.collection.findOne({ id });
      return document ? this.documentToVote(document) : null;
    } catch (error) {
      console.error('Error finding vote by id in MongoDB:', error);
      throw new Error('Failed to find vote');
    }
  }

  async findByUserAndStory(userId: string, userStoryId: string): Promise<Vote | null> {
    try {
      const document = await this.collection.findOne({ 
        userId, 
        userStoryId 
      });
      return document ? this.documentToVote(document) : null;
    } catch (error) {
      console.error('Error finding vote by user and story in MongoDB:', error);
      throw new Error('Failed to find vote by user and story');
    }
  }

  async findByUserStory(userStoryId: string): Promise<Vote[]> {
    try {
      const documents = await this.collection
        .find({ userStoryId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return documents.map(doc => this.documentToVote(doc));
    } catch (error) {
      console.error('Error finding votes by user story in MongoDB:', error);
      throw new Error('Failed to find votes by user story');
    }
  }

  async findBySession(sessionId: string): Promise<Vote[]> {
    try {
      const documents = await this.collection
        .find({ sessionId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return documents.map(doc => this.documentToVote(doc));
    } catch (error) {
      console.error('Error finding votes by session in MongoDB:', error);
      throw new Error('Failed to find votes by session');
    }
  }

  async update(id: string, vote: Vote): Promise<Vote> {
    try {
      const document = this.voteToDocument(vote);
      const result = await this.collection.replaceOne(
        { id },
        document
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Vote not found');
      }
      
      return vote;
    } catch (error) {
      console.error('Error updating vote in MongoDB:', error);
      throw error instanceof Error ? error : new Error('Failed to update vote');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        throw new Error('Vote not found');
      }
    } catch (error) {
      console.error('Error deleting vote in MongoDB:', error);
      throw error instanceof Error ? error : new Error('Failed to delete vote');
    }
  }

  async deleteByUserStory(userStoryId: string): Promise<void> {
    try {
      await this.collection.deleteMany({ userStoryId });
    } catch (error) {
      console.error('Error deleting votes by user story in MongoDB:', error);
      throw new Error('Failed to delete votes by user story');
    }
  }
}