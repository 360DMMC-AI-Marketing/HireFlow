// backend/controllers/jobDistributionController.js
import * as distributionService from '../services/jobDistributionService.js';

/**
 * POST /api/jobs/:id/distribute
 * Distribute a job to all enabled external platforms
 */
export const distributeJob = async (req, res) => {
  try {
    const results = await distributionService.distributeJob(req.params.id, req.user._id);
    res.json({ success: true, results });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/jobs/:id/distribute/linkedin
 * Post to LinkedIn only
 */
export const postToLinkedIn = async (req, res) => {
  try {
    const result = await distributionService.postToLinkedIn(req.params.id, req.user._id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/jobs/:id/distribute/linkedin
 * Remove from LinkedIn
 */
export const removeFromLinkedIn = async (req, res) => {
  try {
    const result = await distributionService.removeFromLinkedIn(req.params.id, req.user._id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/jobs/:id/distribute/indeed
 * Enable job in Indeed XML feed
 */
export const postToIndeed = async (req, res) => {
  try {
    const result = await distributionService.postToIndeed(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/jobs/:id/distribute/indeed
 * Remove job from Indeed feed
 */
export const removeFromIndeed = async (req, res) => {
  try {
    const result = await distributionService.removeFromIndeed(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/jobs/:id/distribute/status
 * Get distribution status for a job
 */
export const getDistributionStatus = async (req, res) => {
  try {
    const status = await distributionService.getDistributionStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/jobs/indeed-feed
 * Public XML feed for Indeed to crawl
 */
export const getIndeedFeed = async (req, res) => {
  try {
    const xml = await distributionService.generateIndeedXmlFeed();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
