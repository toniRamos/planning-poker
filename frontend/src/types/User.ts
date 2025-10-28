export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
  VIEWER = 'viewer'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  socketId?: string;
  isSpectator?: boolean;
}