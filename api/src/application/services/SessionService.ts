import { v4 as uuidv4 } from 'uuid';
import { Session, CreateSessionRequest, UpdateSessionRequest, SessionSettings } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { VoteRepository } from '../../domain/repositories/VoteRepository';

export class SessionService {
  constructor(
    private sessionRepository: SessionRepository,
    private voteRepository?: VoteRepository
  ) {}

  async createSession(request: CreateSessionRequest): Promise<Session> {
    const sessionId = uuidv4();
    const now = new Date();
    
    const defaultSettings: SessionSettings = {
      allowSpectators: true,
      autoRevealCards: false,
      cardSet: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
      timerDuration: undefined
    };

    const session: Session = {
      id: sessionId,
      name: request.name,
      description: request.description,
      createdBy: request.createdBy,
      creatorName: request.creatorName,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isClosed: false,
      maxUsers: request.maxUsers || 20,
      settings: { ...defaultSettings, ...request.settings },
      userStories: [],
      currentStoryId: undefined,
      reactionStats: {}
    };

    return await this.sessionRepository.create(session);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return await this.sessionRepository.findById(sessionId);
  }

  async updateSession(sessionId: string, request: UpdateSessionRequest): Promise<Session | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    const updatedSession: Session = {
      ...session,
      ...request,
      updatedAt: new Date(),
      settings: request.settings 
        ? { ...session.settings!, ...request.settings }
        : session.settings
    };

    return await this.sessionRepository.update(sessionId, updatedSession);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.sessionRepository.delete(sessionId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllSessions(): Promise<Session[]> {
    return await this.sessionRepository.findAll();
  }

  async getActiveSessions(): Promise<Session[]> {
    const allSessions = await this.getAllSessions();
    return allSessions.filter(session => session.isActive);
  }

  async deactivateSession(sessionId: string): Promise<Session | null> {
    return await this.updateSession(sessionId, { isActive: false });
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.findById(sessionId);
    return session !== null;
  }

  async getSessionCount(): Promise<number> {
    const sessions = await this.getAllSessions();
    return sessions.length;
  }

  async getActiveSessionCount(): Promise<number> {
    const activeSessions = await this.getActiveSessions();
    return activeSessions.length;
  }

  async closeSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    // Calculate user averages if voteRepository is available
    let userAverages: { [userId: string]: number } = {};
    if (this.voteRepository) {
      try {
        // Get all votes for all stories in the session
        const allVotes = await Promise.all(
          session.userStories.map(story => 
            this.voteRepository!.findByUserStory(story.id)
          )
        );

        // Flatten the votes array
        const flatVotes = allVotes.flat();

        // Group votes by userId and calculate average
        const userVotesMap = new Map<string, number[]>();
        
        flatVotes.forEach((vote: any) => {
          const numericValue = parseFloat(vote.value);
          // Only include numeric votes (exclude '?', '☕', etc.)
          if (!isNaN(numericValue)) {
            if (!userVotesMap.has(vote.userId)) {
              userVotesMap.set(vote.userId, []);
            }
            userVotesMap.get(vote.userId)!.push(numericValue);
          }
        });

        // Calculate averages
        userVotesMap.forEach((votes, userId) => {
          if (votes.length > 0) {
            const sum = votes.reduce((acc, val) => acc + val, 0);
            const average = sum / votes.length;
            userAverages[userId] = Math.round(average * 10) / 10; // Round to 1 decimal
          }
        });
      } catch (error) {
        console.error('Error calculating user averages:', error);
      }
    }

    const updatedSession: Session = {
      ...session,
      isClosed: true,
      userAverages,
      updatedAt: new Date()
    };

    return await this.sessionRepository.update(sessionId, updatedSession);
  }

  async recordReaction(sessionId: string, userId: string, emoji: string): Promise<Session | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    // Don't allow reactions if session is closed
    if (session.isClosed) {
      return session;
    }

    // Initialize reactionStats if it doesn't exist
    if (!session.reactionStats) {
      session.reactionStats = {};
    }

    // Initialize user reactions if they don't exist
    if (!session.reactionStats[userId]) {
      session.reactionStats[userId] = {};
    }

    // Increment emoji count for this user
    if (!session.reactionStats[userId][emoji]) {
      session.reactionStats[userId][emoji] = 0;
    }
    session.reactionStats[userId][emoji]++;

    session.updatedAt = new Date();

    return await this.sessionRepository.update(sessionId, session);
  }
}