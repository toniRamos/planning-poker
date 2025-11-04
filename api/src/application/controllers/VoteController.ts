import { Request, Response } from 'express';
import { VoteService } from '../services/VoteService';
import { CreateVoteRequest } from '../../domain/entities/Vote';

export class VoteController {
  constructor(private voteService: VoteService) {}

  async submitVote(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      const { userId, userName, points } = req.body;

      if (!userId || !userName || !points) {
        res.status(400).json({ error: 'userId, userName and points are required' });
        return;
      }

      const voteRequest: CreateVoteRequest = {
        userId,
        userName,
        userStoryId,
        sessionId,
        points
      };

      const result = await this.voteService.createOrUpdateVoteWithAutoReveal(voteRequest);

      res.status(201).json({
        vote: result.vote,
        shouldAutoReveal: result.shouldAutoReveal,
        allVotes: result.allVotes
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to submit vote' });
      }
    }
  }

  async getVotesForStory(req: Request, res: Response): Promise<void> {
    try {
      const { userStoryId } = req.params;
      const votes = await this.voteService.getVotesForStory(userStoryId);
      
      res.json(votes);
    } catch (error) {
      console.error('Error getting votes:', error);
      res.status(500).json({ error: 'Failed to get votes' });
    }
  }

  async getVotesForSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const votes = await this.voteService.getVotesForSession(sessionId);
      
      res.json(votes);
    } catch (error) {
      console.error('Error getting session votes:', error);
      res.status(500).json({ error: 'Failed to get session votes' });
    }
  }

  async revealVotes(req: Request, res: Response): Promise<void> {
    try {
      const { userStoryId } = req.params;
      const result = await this.voteService.revealVotesWithStory(userStoryId);
      
      res.json(result);
    } catch (error) {
      console.error('Error revealing votes:', error);
      res.status(500).json({ error: 'Failed to reveal votes' });
    }
  }

  async clearVotes(req: Request, res: Response): Promise<void> {
    try {
      const { userStoryId } = req.params;
      await this.voteService.clearVotesForStory(userStoryId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing votes:', error);
      res.status(500).json({ error: 'Failed to clear votes' });
    }
  }

  async getVoteStats(req: Request, res: Response): Promise<void> {
    try {
      const { userStoryId } = req.params;
      const stats = await this.voteService.getVoteStats(userStoryId);
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting vote stats:', error);
      res.status(500).json({ error: 'Failed to get vote stats' });
    }
  }

  async deleteVote(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userStoryId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      await this.voteService.deleteVote(userId, userStoryId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting vote:', error);
      res.status(500).json({ error: 'Failed to delete vote' });
    }
  }
}