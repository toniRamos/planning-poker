import { v4 as uuidv4 } from 'uuid';
import { Vote, CreateVoteRequest } from '../../domain/entities/Vote';
import { VoteRepository } from '../../domain/repositories/VoteRepository';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { UserService } from './UserService';
import { UserRole } from '../../domain/entities/User';

export class VoteService {
  private userService?: UserService;

  constructor(
    private voteRepository: VoteRepository,
    private sessionRepository: SessionRepository
  ) {}

  // Método para inyectar el UserService después de la inicialización
  setUserService(userService: UserService): void {
    this.userService = userService;
  }

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
        userName: request.userName,
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

  async createOrUpdateVoteWithAutoReveal(request: CreateVoteRequest): Promise<{
    vote: Vote;
    shouldAutoReveal: boolean;
    allVotes?: Vote[];
  }> {
    // Create or update the vote
    const vote = await this.createOrUpdateVote(request);
    
    // Check if all players have voted
    const shouldAutoReveal = await this.checkAllUsersVoted(request.sessionId, request.userStoryId);
    
    let allVotes: Vote[] | undefined;
    if (shouldAutoReveal) {
      // Auto-reveal votes
      allVotes = await this.revealVotes(request.userStoryId);
    }

    return {
      vote,
      shouldAutoReveal,
      allVotes
    };
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

    // Calculate average of numeric votes and update user story
    await this.updateUserStoryEstimate(userStoryId, revealedVotes);

    return revealedVotes;
  }

  async revealVotesWithStory(userStoryId: string): Promise<{ votes: Vote[]; userStory: any }> {
    const votes = await this.revealVotes(userStoryId);
    
    // Get the updated user story with estimatedPoints
    const sessions = await this.sessionRepository.findAll();
    let userStory = null;
    
    for (const session of sessions) {
      const story = session.userStories.find(us => us.id === userStoryId);
      if (story) {
        userStory = story;
        break;
      }
    }

    return {
      votes,
      userStory
    };
  }

  private async updateUserStoryEstimate(userStoryId: string, votes: Vote[]): Promise<void> {
    // Filter numeric votes
    const numericVotes = votes
      .map(vote => parseFloat(vote.points))
      .filter(value => !isNaN(value));

    if (numericVotes.length === 0) {
      return; // No numeric votes to calculate average
    }

    // Calculate average
    const average = numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length;
    const averageStr = average.toFixed(1);

    // Find the session and update the user story
    const sessions = await this.sessionRepository.findAll();
    for (const session of sessions) {
      const userStoryIndex = session.userStories.findIndex(us => us.id === userStoryId);
      if (userStoryIndex !== -1) {
        session.userStories[userStoryIndex].estimatedPoints = averageStr;
        session.updatedAt = new Date();
        await this.sessionRepository.update(session.id, session);
        break;
      }
    }
  }

  async clearVotesForStory(userStoryId: string): Promise<void> {
    await this.voteRepository.deleteByUserStory(userStoryId);
  }

  async checkAllUsersVoted(sessionId: string, userStoryId: string): Promise<boolean> {
    if (!this.userService) {
      return false;
    }

    // Get all players (not viewers or admins) in the session
    const players = this.userService.getUsersByRole(sessionId, UserRole.PLAYER);
    const playerUserIds = players.map(player => player.id);
    
    if (playerUserIds.length === 0) {
      return false; // No players in session
    }

    // Get all votes for this story
    const votes = await this.voteRepository.findByUserStory(userStoryId);
    const votedUserIds = votes.map(vote => vote.userId);

    // Check if all players have voted
    return playerUserIds.every(playerId => votedUserIds.includes(playerId));
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