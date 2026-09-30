import express from 'express';
import { body } from 'express-validator';
import { getScenarios, createScenario, deleteScenario } from '../controllers/scenario.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All scenario routes require authentication
router.use(protect);

router.get('/', getScenarios);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Scenario name is required'),
    body('loanInput.principal').isFloat({ gt: 0 }).withMessage('Principal must be a positive number'),
    body('loanInput.annualRate').isFloat({ gt: 0 }).withMessage('Annual rate must be positive'),
    body('loanInput.tenureMonths').isInt({ gt: 0 }).withMessage('Tenure must be a positive integer'),
    body('loanInput.startDate').isISO8601().withMessage('Start date must be a valid date'),
  ],
  createScenario
);

router.delete('/:id', deleteScenario);

export default router;
