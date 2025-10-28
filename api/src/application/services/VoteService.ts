import { v4 as uuidv4 } from 'uuid';
import { Vote, CreateVoteRequest } from '../../domain/entities/Vote';
import { VoteRepository } from '../../domain/repositories/VoteRepository';
import { SessionRepository } from '../../domain/repositories/SessionRepository';

export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
    private sessionRepository: SessionRepository
  ) {}

  async createOrUpdateVote(request: CreateVoteRequest): Promise<Vote> {
    // Check if session exists and is active
    const session = await this.sessionRepository.findById(request.sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or inactive');
    }

    // Check if user story exists in session
    const userStory = session.userStories.find(us => us.id === request.userStoryId);
    if (!userStory) {
      throw new Error('User story not found in session');
    }

    // Check if current story is being voted (optional validation)
    if (session.currentStoryId !== request.userStoryId) {
      throw new Error('This story is not currently being estimated');
    }

    // Check if user already voted for this story
    const existingVote = await this.voteRepository.findByUserAndStory(
      request.userId, 
      request.userStoryId
    );

    if (existingVote) {
      // Update existing vote
      const updatedVote: Vote = {
        ...existingVote,
        points: request.points,
        updatedAt: new Date()
      };
      
      return await this.voteRepository.update(existingVote.id, updatedVote);
    } else {
      // Create new vote
      const newVote: Vote = {
        id: uuidv4(),
        userId: request.userId,
        userStoryId: request.userStoryId,
        sessionId: request.sessionId,
        points: request.points,
        isRevealed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.voteRepository.create(newVote);
    }
  }

  async getVotesForStory(userStoryId: string): Promise<Vote[]> {
    return await this.voteRepository.findByUserStory(userStoryId);
  }

  async getVotesForSession(sessionId: string): Promise<Vote[]> {
    return await this.voteRepository.findBySession(sessionId);
  }

  async revealVotes(userStoryId: string): Promise<Vote[]> {
    const votes = await this.voteRepository.findByUserStory(userStoryId);
    
    // Mark all votes as revealed
    const revealedVotes = await Promise.all(
      votes.map(async (vote) => {
        const updatedVote: Vote = {
          ...vote,
          isRevealed: true,
          updatedAt: new Date()
        };
        return await this.voteRepository.update(vote.id, updatedVote);
      })
    );

    return revealedVotes;
  }

  async clearVotesForStory(userStoryId: string): Promise<void> {
    await this.voteRepository.deleteByUserStory(userStoryId);
  }

  async checkAllUsersVoted(sessionId: string, userStoryId: string): Promise<boolean> {
    // Get session to know active users (this would need UserService integration)
    // For now, we'll implement a simple check based on votes count vs expected players
    const votes = await this.voteRepository.findByUserStory(userStoryId);
    
    // This is a simplified implementation
    // In real scenario, we'd check against active players in the session
    // For now, let's assume all voted if we have at least 1 vote (we'll improve this)
    return votes.length > 0;
  }

  async getVoteStats(userStoryId: string): Promise<{
    totalVotes: number;
    revealedVotes: Vote[];
    hasAllVoted: boolean;
  }> {
    const votes = await this.voteRepository.findByUserStory(userStoryId);
    
    return {
      totalVotes: votes.length,
      revealedVotes: votes.filter(vote => vote.isRevealed),
      hasAllVoted: false // We'll implement proper logic later
    };
  }

  async deleteVote(userId: string, userStoryId: string): Promise<void> {
    const vote = await this.voteRepository.findByUserAndStory(userId, userStoryId);
    if (vote) {
      await this.voteRepository.delete(vote.id);
    }
  }
}