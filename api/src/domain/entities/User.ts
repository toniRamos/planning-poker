export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
  VIEWER = 'viewer'
}

export interface User {
  id: string;
  socketId: string;
  name: string;
  role: UserRole;
  sessionId: string;
  joinedAt: string;
  isActive: boolean;
}

export interface JoinSessionRequest {
  sessionId: string;
  userName: string;
  role: UserRole.PLAYER | UserRole.VIEWER; // Admin role is only for creators
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
  creatorName: string;
  maxUsers?: number;
  settings?: {
    allowSpectators?: boolean;
    autoRevealCards?: boolean;
    cardSet?: string[];
  };
}