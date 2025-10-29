import { v4 as uuidv4 } from 'uuid';
import { Session, CreateSessionRequest, UpdateSessionRequest, SessionSettings } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';

export class SessionService {
  constructor(private sessionRepository: SessionRepository) {}

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
      maxUsers: request.maxUsers || 20,
      settings: { ...defaultSettings, ...request.settings },
      userStories: [],
      currentStoryId: undefined
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
}