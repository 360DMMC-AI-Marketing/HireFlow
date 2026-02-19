import axios from 'axios';
import User from '../models/user.js';

// ─── Google Token Refresh ────────────────────────────────────────────────────
export const refreshGoogleToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.integrations?.google?.refreshToken;

    if (!refreshToken) throw new Error('No Google refresh token available. User must re-authenticate.');

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in; // seconds

    user.integrations.google.accessToken = newAccessToken;
    if (expiresIn) {
      user.integrations.google.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    }
    await user.save();

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing Google token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Google token');
  }
};

// ─── LinkedIn Token Refresh ──────────────────────────────────────────────────
export const refreshLinkedInToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.integrations?.linkedin?.refreshToken;

    if (!refreshToken) throw new Error('No LinkedIn refresh token available. User must re-authenticate.');

    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }
    });

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    user.integrations.linkedin.accessToken = newAccessToken;
    if (response.data.refresh_token) {
      user.integrations.linkedin.refreshToken = response.data.refresh_token;
    }
    if (expiresIn) {
      user.integrations.linkedin.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    }
    await user.save();

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing LinkedIn token:', error.response?.data || error.message);
    throw new Error('Failed to refresh LinkedIn token');
  }
};

// ─── Indeed Token Refresh ────────────────────────────────────────────────────
export const refreshIndeedToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.integrations?.indeed?.refreshToken;

    if (!refreshToken) throw new Error('No Indeed refresh token available. User must re-authenticate.');

    const response = await axios.post('https://apis.indeed.com/oauth/v2/tokens', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.INDEED_CLIENT_ID,
        client_secret: process.env.INDEED_CLIENT_SECRET
      }
    });

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    user.integrations.indeed.accessToken = newAccessToken;
    if (response.data.refresh_token) {
      user.integrations.indeed.refreshToken = response.data.refresh_token;
    }
    if (expiresIn) {
      user.integrations.indeed.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    }
    await user.save();

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing Indeed token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Indeed token');
  }
};

// ─── Helper: Get valid token (auto-refresh if expired) ───────────────────────
export const getValidToken = async (userId, platform) => {
  const user = await User.findById(userId);
  const integration = user.integrations?.[platform];
  
  if (!integration?.accessToken) {
    throw new Error(`${platform} not connected. Please connect your account first.`);
  }

  // Check if token is expired or about to expire (5 min buffer)
  if (integration.tokenExpiry && new Date(integration.tokenExpiry) < new Date(Date.now() + 5 * 60 * 1000)) {
    switch (platform) {
      case 'google': return refreshGoogleToken(userId);
      case 'linkedin': return refreshLinkedInToken(userId);
      case 'indeed': return refreshIndeedToken(userId);
      default: throw new Error(`Unknown platform: ${platform}`);
    }
  }

  return integration.accessToken;
};