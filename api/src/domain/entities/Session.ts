export interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  tags?: string[];
  order: number;
  estimatedPoints?: string;
  isRevealed: boolean;
  isScored: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  creatorName: string; // Store the creator's name for direct access
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  maxUsers?: number;
  settings?: SessionSettings;
  userStories: UserStory[];
  currentStoryId?: string;
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
  creatorName: string;
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