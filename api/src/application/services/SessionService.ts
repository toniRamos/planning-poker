import { v4 as uuidv4 } from 'uuid';
import { Session, CreateSessionRequest, UpdateSessionRequest, SessionSettings } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';

export class SessionService {
  private sessions: Map<string, Session> = new Map();

  constructor(private sessionRepository?: SessionRepository) {}

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
      createdAt: now,
      updatedAt: now,
      isActive: true,
      maxUsers: request.maxUsers || 20,
      settings: { ...defaultSettings, ...request.settings },
      userStories: [],
      currentStoryId: undefined
    };

    this.sessions.set(sessionId, session);
    
    if (this.sessionRepository) {
      await this.sessionRepository.create(session);
    }
    
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    if (this.sessionRepository) {
      return await this.sessionRepository.findById(sessionId);
    }
    return this.sessions.get(sessionId) || null;
  }

  updateSession(sessionId: string, request: UpdateSessionRequest): Session | null {
    const session = this.sessions.get(sessionId);
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

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): Session[] {
    return this.getAllSessions().filter(session => session.isActive);
  }

  deactivateSession(sessionId: string): Session | null {
    return this.updateSession(sessionId, { isActive: false });
  }

  sessionExists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getActiveSessionCount(): number {
    return this.getActiveSessions().length;
  }
}