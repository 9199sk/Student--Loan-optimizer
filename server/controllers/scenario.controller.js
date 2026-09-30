import Scenario from '../models/Scenario.model.js';
import { validationResult } from 'express-validator';

/**
 * GET /api/scenarios — list all scenarios for the logged-in user
 */
export const getScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: scenarios });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/scenarios/:id — get a specific scenario
 */
export const getScenarioById = async (req, res) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found.' });
    }
    return res.json({ success: true, data: scenario });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/scenarios — save a new scenario
 */
export const createScenario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const scenario = await Scenario.create({ user: req.user._id, ...req.body });
    return res.status(201).json({ success: true, data: scenario });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/scenarios/:id — delete a scenario owned by the logged-in user
 */
export const deleteScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findOne({ _id: req.params.id, user: req.user._id });
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found.' });
    }
    await scenario.deleteOne();
    return res.json({ success: true, message: 'Scenario deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
