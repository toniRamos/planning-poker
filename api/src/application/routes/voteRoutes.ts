import { Router } from 'express';
import { VoteController } from '../controllers/VoteController';

export function createVoteRoutes(voteController: VoteController): Router {
  const router = Router();

  // Submit or update vote
  router.post('/sessions/:sessionId/user-stories/:userStoryId/votes', 
    voteController.submitVote.bind(voteController)
  );

  // Get all votes for a story
  router.get('/sessions/:sessionId/user-stories/:userStoryId/votes', 
    voteController.getVotesForStory.bind(voteController)
  );

  // Get all votes for a session
  router.get('/sessions/:sessionId/votes', 
    voteController.getVotesForSession.bind(voteController)
  );

  // Reveal all votes for a story
  router.put('/sessions/:sessionId/user-stories/:userStoryId/votes/reveal', 
    voteController.revealVotes.bind(voteController)
  );

  // Clear all votes for a story
  router.delete('/sessions/:sessionId/user-stories/:userStoryId/votes', 
    voteController.clearVotes.bind(voteController)
  );

  // Get vote statistics for a story
  router.get('/sessions/:sessionId/user-stories/:userStoryId/votes/stats', 
    voteController.getVoteStats.bind(voteController)
  );

  // Delete specific user vote
  router.delete('/sessions/:sessionId/user-stories/:userStoryId/votes/user', 
    voteController.deleteVote.bind(voteController)
  );

  return router;
}