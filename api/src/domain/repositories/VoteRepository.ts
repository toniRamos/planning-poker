import { Vote } from '../entities/Vote';

export interface VoteRepository {
  create(vote: Vote): Promise<Vote>;
  findById(id: string): Promise<Vote | null>;
  findByUserAndStory(userId: string, userStoryId: string): Promise<Vote | null>;
  findByUserStory(userStoryId: string): Promise<Vote[]>;
  findBySession(sessionId: string): Promise<Vote[]>;
  update(id: string, vote: Vote): Promise<Vote>;
  delete(id: string): Promise<void>;
  deleteByUserStory(userStoryId: string): Promise<void>;
}