export interface Vote {
  id: string;
  userId: string;
  userName: string;
  userStoryId: string;
  sessionId: string;
  points: string;
  isRevealed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoteRequest {
  userId: string;
  userName: string;
  userStoryId: string;
  sessionId: string;
  points: string;
}

export interface UpdateVoteRequest {
  points: string;
}