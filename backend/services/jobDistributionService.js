// backend/services/jobDistributionService.js
import axios from 'axios';
import Job from '../models/job.js';
import User from '../models/user.js';
import { getValidToken } from '../utils/refreshToken.js';

// ═════════════════════════════════════════════════════════════════════════════
// LINKEDIN JOB POSTING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Post a job to LinkedIn via the UGC Post API.
 * Requires: user has connected LinkedIn with appropriate permissions.
 * LinkedIn's Job Posting API requires approved Marketing Developer Platform access.
 * This uses the UGC share endpoint as a fallback to share job posts.
 */
export const postToLinkedIn = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  // Update status to pending
  job.distribution.linkedin.postingStatus = 'pending';
  await job.save();

  try {
    const accessToken = await getValidToken(userId, 'linkedin');
    const user = await User.findById(userId);
    const linkedinId = user.integrations?.linkedin?.linkedinId;

    if (!linkedinId) throw new Error('LinkedIn profile ID not found');

    // Build the LinkedIn UGC post payload
    const applicationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${job._id}`;
    
    const postBody = {
      author: `urn:li:person:${linkedinId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `🚀 We're hiring! ${job.title}\n\n` +
              `📍 ${job.location}${job.isRemote ? ' (Remote)' : ''}\n` +
              `💼 ${job.employmentType} | ${job.department}\n` +
              `${job.salary?.min && job.salary?.max ? `💰 ${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}\n` : ''}` +
              `\nApply now: ${applicationUrl}\n\n` +
              `#hiring #${job.department?.toLowerCase()?.replace(/\s+/g, '')} #careers #jobs`
          },
          shareMediaCategory: 'ARTICLE',
          media: [{
            status: 'READY',
            originalUrl: applicationUrl,
            title: { text: `${job.title} - Apply Now` },
            description: { text: job.description?.substring(0, 200) || 'Click to apply' }
          }]
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    // Success - update job with LinkedIn post ID
    job.distribution.linkedin.postingStatus = 'posted';
    job.distribution.linkedin.externalPostId = response.data.id || response.headers['x-restli-id'];
    job.distribution.linkedin.postedAt = new Date();
    job.distribution.linkedin.lastError = null;
    await job.save();

    console.log(`✅ Job "${job.title}" posted to LinkedIn (ID: ${job.distribution.linkedin.externalPostId})`);
    return { success: true, postId: job.distribution.linkedin.externalPostId };

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error(`❌ LinkedIn posting failed for "${job.title}":`, errorMsg);

    job.distribution.linkedin.postingStatus = 'failed';
    job.distribution.linkedin.lastError = errorMsg;
    await job.save();

    throw new Error(`LinkedIn posting failed: ${errorMsg}`);
  }
};

/**
 * Remove a job post from LinkedIn
 */
export const removeFromLinkedIn = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  const postId = job.distribution.linkedin.externalPostId;
  if (!postId) throw new Error('No LinkedIn post to remove');

  try {
    const accessToken = await getValidToken(userId, 'linkedin');
    
    await axios.delete(
      `https://api.linkedin.com/v2/ugcPosts/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    job.distribution.linkedin.postingStatus = 'removed';
    job.distribution.linkedin.externalPostId = null;
    await job.save();

    return { success: true };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    job.distribution.linkedin.lastError = errorMsg;
    await job.save();
    throw new Error(`Failed to remove LinkedIn post: ${errorMsg}`);
  }
};


// ═════════════════════════════════════════════════════════════════════════════
// INDEED — XML FEED GENERATION
// ═════════════════════════════════════════════════════════════════════════════
// Indeed's public API is extremely limited. The standard approach is to
// generate an XML feed that Indeed's crawler can index.

/**
 * Generate Indeed-compatible XML feed for all active jobs.
 * Indeed crawls this URL periodically to index your listings.
 * Feed URL (to register with Indeed): GET /api/jobs/indeed-feed
 */
export const generateIndeedXmlFeed = async () => {
  const jobs = await Job.find({
    status: 'Active',
    'distribution.indeed.enabled': true
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<source>\n';
  xml += '  <publisher>HireFlow</publisher>\n';
  xml += `  <publisherurl>${baseUrl}</publisherurl>\n`;
  xml += `  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>\n`;

  for (const job of jobs) {
    const applyUrl = `${baseUrl}/apply/${job._id}`;
    const salaryText = job.salary?.min && job.salary?.max
      ? `${job.salary.currency} ${job.salary.min}-${job.salary.max}`
      : '';

    xml += '  <job>\n';
    xml += `    <title><![CDATA[${job.title}]]></title>\n`;
    xml += `    <date><![CDATA[${new Date(job.createdAt).toISOString()}]]></date>\n`;
    xml += `    <referencenumber><![CDATA[${job._id}]]></referencenumber>\n`;
    xml += `    <url><![CDATA[${applyUrl}]]></url>\n`;
    xml += `    <company><![CDATA[HireFlow]]></company>\n`;
    xml += `    <city><![CDATA[${job.location || ''}]]></city>\n`;
    xml += `    <country><![CDATA[US]]></country>\n`;
    xml += `    <description><![CDATA[${job.description || ''}]]></description>\n`;
    xml += `    <jobtype><![CDATA[${job.employmentType || 'Full-time'}]]></jobtype>\n`;
    xml += `    <category><![CDATA[${job.department || ''}]]></category>\n`;
    if (salaryText && job.distribution?.indeed?.salaryDisplay !== 'Hide') {
      xml += `    <salary><![CDATA[${salaryText}]]></salary>\n`;
    }
    if (job.isRemote) {
      xml += '    <remotetype>Fully Remote</remotetype>\n';
    }
    xml += '  </job>\n';

    // Mark as posted in the DB
    if (job.distribution.indeed.postingStatus !== 'posted') {
      job.distribution.indeed.postingStatus = 'posted';
      job.distribution.indeed.postedAt = new Date();
      await job.save();
    }
  }

  xml += '</source>';
  return xml;
};

/**
 * Mark a job as posted to Indeed (manual tracking when using XML feed)
 */
export const postToIndeed = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  // With XML feeds, Indeed indexes jobs automatically.
  // We just mark the job as enabled + posted.
  job.distribution.indeed.enabled = true;
  job.distribution.indeed.postingStatus = 'posted';
  job.distribution.indeed.postedAt = new Date();
  await job.save();

  return { success: true, message: 'Job added to Indeed XML feed' };
};

/**
 * Remove a job from Indeed feed  
 */
export const removeFromIndeed = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  job.distribution.indeed.enabled = false;
  job.distribution.indeed.postingStatus = 'removed';
  await job.save();

  return { success: true, message: 'Job removed from Indeed feed' };
};


// ═════════════════════════════════════════════════════════════════════════════
// MULTI-PLATFORM DISTRIBUTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Distribute a job to all enabled platforms.
 * Returns a summary of each platform's result.
 */
export const distributeJob = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (job.status !== 'Active') throw new Error('Job must be Active to distribute');

  const results = {
    linkedin: null,
    indeed: null
  };

  // LinkedIn
  if (job.distribution?.linkedin?.enabled) {
    try {
      results.linkedin = await postToLinkedIn(jobId, userId);
    } catch (err) {
      results.linkedin = { success: false, error: err.message };
    }
  }

  // Indeed (XML feed approach)
  if (job.distribution?.indeed?.enabled) {
    try {
      results.indeed = await postToIndeed(jobId);
    } catch (err) {
      results.indeed = { success: false, error: err.message };
    }
  }

  return results;
};

/**
 * Get distribution status for a job
 */
export const getDistributionStatus = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  return {
    linkedin: {
      enabled: job.distribution?.linkedin?.enabled || false,
      postingStatus: job.distribution?.linkedin?.postingStatus || 'not_posted',
      externalPostId: job.distribution?.linkedin?.externalPostId || null,
      postedAt: job.distribution?.linkedin?.postedAt || null,
      lastError: job.distribution?.linkedin?.lastError || null
    },
    indeed: {
      enabled: job.distribution?.indeed?.enabled || false,
      postingStatus: job.distribution?.indeed?.postingStatus || 'not_posted',
      postedAt: job.distribution?.indeed?.postedAt || null,
      lastError: job.distribution?.indeed?.lastError || null,
      feedUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/jobs/indeed-feed`
    },
    hireflowPortal: {
      enabled: job.distribution?.hireflowPortal?.enabled || false,
      slug: job.distribution?.hireflowPortal?.slug || null
    }
  };
};
