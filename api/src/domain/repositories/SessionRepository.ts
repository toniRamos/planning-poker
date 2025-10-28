import { Session } from '../entities/Session';

export interface SessionRepository {
  create(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  update(id: string, session: Session): Promise<Session>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Session[]>;
  findByCreatedBy(userId: string): Promise<Session[]>;
}