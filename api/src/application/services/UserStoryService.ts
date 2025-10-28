import { v4 as uuidv4 } from 'uuid';
import { UserStory } from '../../domain/entities/Session';
import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { VoteService } from './VoteService';

export class UserStoryService {
  constructor(
    private sessionRepository: SessionRepository,
    private voteService?: VoteService
  ) {}

  async addUserStory(
    sessionId: string, 
    title: string, 
    description?: string, 
    acceptanceCriteria?: string
  ): Promise<UserStory> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const newUserStory: UserStory = {
      id: uuidv4(),
      title,
      description,
      acceptanceCriteria,
      order: session.userStories.length,
      estimatedPoints: undefined,
      isRevealed: false,
      isScored: false,
      createdAt: new Date()
    };

    session.userStories.push(newUserStory);
    session.updatedAt = new Date();
    
    await this.sessionRepository.update(sessionId, session);
    return newUserStory;
  }

  async updateUserStory(
    sessionId: string, 
    userStoryId: string, 
    updates: Partial<Pick<UserStory, 'title' | 'description' | 'acceptanceCriteria'>>
  ): Promise<UserStory> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userStoryIndex = session.userStories.findIndex((us: UserStory) => us.id === userStoryId);
    if (userStoryIndex === -1) {
      throw new Error('User story not found');
    }

    session.userStories[userStoryIndex] = {
      ...session.userStories[userStoryIndex],
      ...updates
    };
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);
    return session.userStories[userStoryIndex];
  }

  async reorderUserStories(sessionId: string, userStoryOrders: { id: string; order: number }[]): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Actualizar el order de cada user story
    userStoryOrders.forEach(({ id, order }) => {
      const userStory = session.userStories.find((us: UserStory) => us.id === id);
      if (userStory) {
        userStory.order = order;
      }
    });

    // Ordenar el array por el nuevo order
    session.userStories.sort((a: UserStory, b: UserStory) => a.order - b.order);
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);
  }

  async setCurrentStory(sessionId: string, userStoryId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userStory = session.userStories.find((us: UserStory) => us.id === userStoryId);
    if (!userStory) {
      throw new Error('User story not found');
    }

    session.currentStoryId = userStoryId;
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);
  }

  async revealCurrentStory(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.currentStoryId) {
      throw new Error('No current story set');
    }

    const currentStory = session.userStories.find((us: UserStory) => us.id === session.currentStoryId);
    if (!currentStory) {
      throw new Error('Current story not found');
    }

    currentStory.isRevealed = true;
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);
  }

  async deleteUserStory(sessionId: string, userStoryId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userStoryIndex = session.userStories.findIndex((us: UserStory) => us.id === userStoryId);
    if (userStoryIndex === -1) {
      throw new Error('User story not found');
    }

    // Si es la historia actual, limpiar currentStoryId
    if (session.currentStoryId === userStoryId) {
      session.currentStoryId = undefined;
    }

    session.userStories.splice(userStoryIndex, 1);
    
    // Reordenar las historias restantes
    session.userStories.forEach((story: UserStory, index: number) => {
      story.order = index;
    });

    session.updatedAt = new Date();
    await this.sessionRepository.update(sessionId, session);
  }

  async getUserStories(sessionId: string): Promise<UserStory[]> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return session.userStories.sort((a: UserStory, b: UserStory) => a.order - b.order);
  }

  async toggleUserStoryScore(sessionId: string, userStoryId: string): Promise<UserStory> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userStoryIndex = session.userStories.findIndex((us: UserStory) => us.id === userStoryId);
    if (userStoryIndex === -1) {
      throw new Error('User story not found');
    }

    const userStory = session.userStories[userStoryIndex];
    userStory.isScored = !userStory.isScored;
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);
    return userStory;
  }

  async resetUserStoryVoting(sessionId: string, userStoryId: string): Promise<UserStory> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userStoryIndex = session.userStories.findIndex((us: UserStory) => us.id === userStoryId);
    if (userStoryIndex === -1) {
      throw new Error('User story not found');
    }

    const userStory = session.userStories[userStoryIndex];
    // Reset voting state
    userStory.isRevealed = false;
    userStory.estimatedPoints = undefined;
    session.updatedAt = new Date();

    await this.sessionRepository.update(sessionId, session);

    // Clear all votes for this story
    if (this.voteService) {
      await this.voteService.clearVotesForStory(userStoryId);
    }

    return userStory;
  }
}