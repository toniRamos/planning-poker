// DEPRECATED: This file is no longer used
// Session routes are now initialized directly in app.ts using RepositoryFactory
// This file is kept for reference only

import { Router } from 'express';

const router = Router();

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

// This router is empty - routes are now handled in app.ts
export { router as sessionRoutes };