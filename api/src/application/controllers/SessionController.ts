import { Request, Response } from 'express';
import { SessionService } from '../services/SessionService';
import { CreateSessionRequest, UpdateSessionRequest } from '../../domain/entities/Session';

export class SessionController {
  constructor(private sessionService: SessionService) {}

  /**
   * @swagger
   * /api/sessions:
   *   post:
   *     summary: Create a new session
   *     tags: [Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - createdBy
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Sprint Planning Session"
   *               description:
   *                 type: string
   *                 example: "Planning poker for user stories"
   *               createdBy:
   *                 type: string
   *                 example: "John Doe"
   *               maxUsers:
   *                 type: number
   *                 example: 10
   *     responses:
   *       201:
   *         description: Session created successfully
   *       400:
   *         description: Invalid request data
   */
  createSession = (req: Request, res: Response): void => {
    try {
      const { name, description, createdBy, maxUsers, settings } = req.body;

      if (!name || !createdBy) {
        res.status(400).json({
          error: 'Name and createdBy are required fields'
        });
        return;
      }

      const createRequest: CreateSessionRequest = {
        name,
        description,
        createdBy,
        maxUsers,
        settings
      };

      const session = this.sessionService.createSession(createRequest);

      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        error: 'Failed to create session'
      });
    }
  };

  /**
   * @swagger
   * /api/sessions/{id}:
   *   get:
   *     summary: Get session by ID
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Session UUID
   *     responses:
   *       200:
   *         description: Session found
   *       404:
   *         description: Session not found
   */
  getSession = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const session = this.sessionService.getSession(id);

      if (!session) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      res.status(500).json({
        error: 'Failed to fetch session'
      });
    }
  };

  /**
   * @swagger
   * /api/sessions:
   *   get:
   *     summary: Get all active sessions
   *     tags: [Sessions]
   *     responses:
   *       200:
   *         description: List of active sessions
   */
  getAllSessions = (req: Request, res: Response): void => {
    try {
      const sessions = this.sessionService.getActiveSessions();

      res.json({
        success: true,
        data: sessions,
        count: sessions.length
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({
        error: 'Failed to fetch sessions'
      });
    }
  };

  /**
   * @swagger
   * /api/sessions/{id}:
   *   put:
   *     summary: Update session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Session UUID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               maxUsers:
   *                 type: number
   *     responses:
   *       200:
   *         description: Session updated successfully
   *       404:
   *         description: Session not found
   */
  updateSession = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const updateRequest: UpdateSessionRequest = req.body;

      const session = this.sessionService.updateSession(id, updateRequest);

      if (!session) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({
        error: 'Failed to update session'
      });
    }
  };

  /**
   * @swagger
   * /api/sessions/{id}:
   *   delete:
   *     summary: Delete session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Session UUID
   *     responses:
   *       200:
   *         description: Session deleted successfully
   *       404:
   *         description: Session not found
   */
  deleteSession = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const deleted = this.sessionService.deleteSession(id);

      if (!deleted) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        error: 'Failed to delete session'
      });
    }
  };
}