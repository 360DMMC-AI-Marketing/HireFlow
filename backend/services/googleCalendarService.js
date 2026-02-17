import { google } from 'googleapis';
import User from '../models/user.js';

export const createGoogleCalendarEvent = async (interviewerId, interviewData) => {
  try {
    // 1. Get the Interviewer (Recruiter) to access their tokens
    const user = await User.findById(interviewerId);
    
    if (!user || !user.googleAccessToken) {
      console.log('User has not connected Google Calendar.');
      return null; // Skip if not connected
    }

    // 2. Setup Google Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    // 3. Create the Event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: `Interview: ${interviewData.jobTitle} with ${interviewData.candidateName}`,
      description: `Interview via HireFlow. \nCandidate: ${interviewData.candidateName}`,
      start: {
        dateTime: interviewData.startTime.toISOString(), // Must be ISO format
        timeZone: 'UTC', // Or user.timezone
      },
      end: {
        dateTime: interviewData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: interviewData.candidateEmail },
        { email: user.email }
      ],
      conferenceData: {
        createRequest: { requestId: "sample123", conferenceSolutionKey: { type: "hangoutsMeet" } }
      }
    };

    // 4. Insert into Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1 // Requesting a Meet Link
    });

    console.log('📅 Google Calendar Event Created:', response.data.htmlLink);
    
    return {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink, // The Google Meet URL!
      htmlLink: response.data.htmlLink
    };

  } catch (error) {
    console.error('Error creating Google Calendar event:', error.message);
    return null; // Don't crash the app if calendar fails
  }
};