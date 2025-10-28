import { Request, Response } from 'express';
import { UserStoryService } from '../services/UserStoryService';

export class UserStoryController {
  constructor(private userStoryService: UserStoryService) {}

  async addUserStory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { title, description, acceptanceCriteria } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      const userStory = await this.userStoryService.addUserStory(
        sessionId,
        title,
        description,
        acceptanceCriteria
      );

      res.status(201).json(userStory);
    } catch (error) {
      console.error('Error adding user story:', error);
      res.status(500).json({ error: 'Failed to add user story' });
    }
  }

  async getUserStories(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userStories = await this.userStoryService.getUserStories(sessionId);
      res.json(userStories);
    } catch (error) {
      console.error('Error getting user stories:', error);
      res.status(500).json({ error: 'Failed to get user stories' });
    }
  }

  async updateUserStory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      const updates = req.body;

      const updatedUserStory = await this.userStoryService.updateUserStory(
        sessionId,
        userStoryId,
        updates
      );

      res.json(updatedUserStory);
    } catch (error) {
      console.error('Error updating user story:', error);
      res.status(500).json({ error: 'Failed to update user story' });
    }
  }

  async reorderUserStories(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { userStoryOrders } = req.body;

      if (!Array.isArray(userStoryOrders)) {
        res.status(400).json({ error: 'userStoryOrders must be an array' });
        return;
      }

      await this.userStoryService.reorderUserStories(sessionId, userStoryOrders);
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering user stories:', error);
      res.status(500).json({ error: 'Failed to reorder user stories' });
    }
  }

  async setCurrentStory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      await this.userStoryService.setCurrentStory(sessionId, userStoryId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting current story:', error);
      res.status(500).json({ error: 'Failed to set current story' });
    }
  }

  async revealCurrentStory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      await this.userStoryService.revealCurrentStory(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error revealing current story:', error);
      res.status(500).json({ error: 'Failed to reveal current story' });
    }
  }

  async deleteUserStory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      await this.userStoryService.deleteUserStory(sessionId, userStoryId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user story:', error);
      res.status(500).json({ error: 'Failed to delete user story' });
    }
  }

  async toggleUserStoryScore(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      const updatedUserStory = await this.userStoryService.toggleUserStoryScore(sessionId, userStoryId);
      res.json(updatedUserStory);
    } catch (error) {
      console.error('Error toggling user story score:', error);
      res.status(500).json({ error: 'Failed to toggle user story score' });
    }
  }

  async resetUserStoryVoting(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      const updatedUserStory = await this.userStoryService.resetUserStoryVoting(sessionId, userStoryId);
      res.json(updatedUserStory);
    } catch (error) {
      console.error('Error resetting user story voting:', error);
      res.status(500).json({ error: 'Failed to reset user story voting' });
    }
  }
}