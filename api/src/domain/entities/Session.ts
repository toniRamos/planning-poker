export interface Session {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  maxUsers?: number;
  settings?: SessionSettings;
}

export interface SessionSettings {
  allowSpectators: boolean;
  autoRevealCards: boolean;
  cardSet: string[];
  timerDuration?: number;
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
  createdBy: string;
  maxUsers?: number;
  settings?: Partial<SessionSettings>;
}

export interface UpdateSessionRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  maxUsers?: number;
  settings?: Partial<SessionSettings>;
}