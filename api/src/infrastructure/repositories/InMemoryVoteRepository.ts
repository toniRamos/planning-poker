import { Vote } from '../../domain/entities/Vote';
import { VoteRepository } from '../../domain/repositories/VoteRepository';

export class InMemoryVoteRepository implements VoteRepository {
  private votes: Map<string, Vote> = new Map();

  async create(vote: Vote): Promise<Vote> {
    this.votes.set(vote.id, { ...vote });
    return { ...vote };
  }

  async findById(id: string): Promise<Vote | null> {
    const vote = this.votes.get(id);
    return vote ? { ...vote } : null;
  }

  async findByUserAndStory(userId: string, userStoryId: string): Promise<Vote | null> {
    const votes = Array.from(this.votes.values());
    const vote = votes.find(v => v.userId === userId && v.userStoryId === userStoryId);
    return vote ? { ...vote } : null;
  }

  async findByUserStory(userStoryId: string): Promise<Vote[]> {
    const votes = Array.from(this.votes.values());
    return votes
      .filter(vote => vote.userStoryId === userStoryId)
      .map(vote => ({ ...vote }));
  }

  async findBySession(sessionId: string): Promise<Vote[]> {
    const votes = Array.from(this.votes.values());
    return votes
      .filter(vote => vote.sessionId === sessionId)
      .map(vote => ({ ...vote }));
  }

  async update(id: string, vote: Vote): Promise<Vote> {
    if (!this.votes.has(id)) {
      throw new Error('Vote not found');
    }
    this.votes.set(id, { ...vote });
    return { ...vote };
  }

  async delete(id: string): Promise<void> {
    this.votes.delete(id);
  }

  async deleteByUserStory(userStoryId: string): Promise<void> {
    const votesToDelete = Array.from(this.votes.entries())
      .filter(([_, vote]) => vote.userStoryId === userStoryId)
      .map(([id, _]) => id);
    
    votesToDelete.forEach(id => this.votes.delete(id));
  }
}