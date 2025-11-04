import { Request, Response } from 'express';
import { SessionService } from '../services/SessionService';
import { CreateSessionRequest, UpdateSessionRequest } from '../../domain/entities/Session';
import { Server as SocketIOServer } from 'socket.io';

export class SessionController {
  private io?: SocketIOServer;

  constructor(private sessionService: SessionService) {}

  setIO(io: SocketIOServer) {
    this.io = io;
  }

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
  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, createdBy, creatorName, maxUsers, settings } = req.body;

      if (!name || !createdBy || !creatorName) {
        res.status(400).json({
          error: 'Name, createdBy, and creatorName are required fields'
        });
        return;
      }

      const createRequest: CreateSessionRequest = {
        name,
        description,
        createdBy,
        creatorName,
        maxUsers,
        settings
      };

      const session = await this.sessionService.createSession(createRequest);

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
  getSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSession(id);

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
  getAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.sessionService.getActiveSessions();

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
  updateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateRequest: UpdateSessionRequest = req.body;

      const session = await this.sessionService.updateSession(id, updateRequest);

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
  deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.sessionService.deleteSession(id);

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

  closeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const closedSession = await this.sessionService.closeSession(id);

      if (!closedSession) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      // Emit WebSocket event to notify all clients
      if (this.io) {
        this.io.to(id).emit('session-closed', {
          sessionId: id,
          message: 'Session has been closed'
        });
      }

      res.json({
        success: true,
        data: closedSession
      });
    } catch (error) {
      console.error('Error closing session:', error);
      res.status(500).json({
        error: 'Failed to close session'
      });
    }
  };

  recordReaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, emoji } = req.body;

      if (!userId || !emoji) {
        res.status(400).json({
          error: 'userId and emoji are required'
        });
        return;
      }

      const updatedSession = await this.sessionService.recordReaction(id, userId, emoji);

      if (!updatedSession) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedSession
      });
    } catch (error) {
      console.error('Error recording reaction:', error);
      res.status(500).json({
        error: 'Failed to record reaction'
      });
    }
  };
}