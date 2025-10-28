import { Router } from 'express';
import { UserStoryController } from '../controllers/UserStoryController';

export function createUserStoryRoutes(userStoryController: UserStoryController): Router {
  const router = Router();

  // Obtener todas las user stories de una sesión
  router.get('/sessions/:sessionId/user-stories', 
    userStoryController.getUserStories.bind(userStoryController)
  );

  // Agregar una nueva user story
  router.post('/sessions/:sessionId/user-stories', 
    userStoryController.addUserStory.bind(userStoryController)
  );

  // Actualizar una user story
  router.put('/sessions/:sessionId/user-stories/:userStoryId', 
    userStoryController.updateUserStory.bind(userStoryController)
  );

  // Reordenar user stories
  router.put('/sessions/:sessionId/user-stories/reorder', 
    userStoryController.reorderUserStories.bind(userStoryController)
  );

  // Establecer la historia actual para estimación
  router.put('/sessions/:sessionId/user-stories/:userStoryId/set-current', 
    userStoryController.setCurrentStory.bind(userStoryController)
  );

  // Revelar los resultados de la estimación actual
  router.put('/sessions/:sessionId/user-stories/reveal', 
    userStoryController.revealCurrentStory.bind(userStoryController)
  );

  // Marcar/desmarcar user story como puntuada
  router.put('/sessions/:sessionId/user-stories/:userStoryId/toggle-score', 
    userStoryController.toggleUserStoryScore.bind(userStoryController)
  );

  // Resetear la votación de una user story
  router.put('/sessions/:sessionId/user-stories/:userStoryId/reset-voting', 
    userStoryController.resetUserStoryVoting.bind(userStoryController)
  );

  // Eliminar una user story
  router.delete('/sessions/:sessionId/user-stories/:userStoryId', 
    userStoryController.deleteUserStory.bind(userStoryController)
  );

  return router;
}