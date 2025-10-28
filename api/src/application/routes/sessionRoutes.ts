import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { SessionService } from '../services/SessionService';

const router = Router();
const sessionService = new SessionService();
const sessionController = new SessionController(sessionService);

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique session identifier (UUID)
 *         name:
 *           type: string
 *           description: Session name
 *         description:
 *           type: string
 *           description: Session description
 *         createdBy:
 *           type: string
 *           description: Session creator name
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *           description: Whether the session is active
 *         maxUsers:
 *           type: number
 *           description: Maximum number of users allowed
 *         settings:
 *           type: object
 *           properties:
 *             allowSpectators:
 *               type: boolean
 *             autoRevealCards:
 *               type: boolean
 *             cardSet:
 *               type: array
 *               items:
 *                 type: string
 *             timerDuration:
 *               type: number
 */

// Session CRUD routes
router.post('/sessions', sessionController.createSession);
router.get('/sessions', sessionController.getAllSessions);
router.get('/sessions/:id', sessionController.getSession);
router.put('/sessions/:id', sessionController.updateSession);
router.delete('/sessions/:id', sessionController.deleteSession);

export { router as sessionRoutes, sessionService };