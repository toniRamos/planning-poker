import { Session } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';

export class InMemorySessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async create(session: Session): Promise<Session> {
    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async findById(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    return session ? { ...session } : null;
  }

  async update(id: string, session: Session): Promise<Session> {
    if (!this.sessions.has(id)) {
      throw new Error('Session not found');
    }
    this.sessions.set(id, { ...session });
    return { ...session };
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async findAll(): Promise<Session[]> {
    return Array.from(this.sessions.values()).map(session => ({ ...session }));
  }

  async findByCreatedBy(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.createdBy === userId)
      .map(session => ({ ...session }));
  }
}