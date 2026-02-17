import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true // Allows us to see if user is already logged in
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Scenario: User is already logged in (Recruiter connecting their calendar)
      // We are passing the JWT token in the request query or headers normally, 
      // but OAuth redirects break headers. 
      // Simplified approach: We identify user by email match.
      
      const email = profile.emails[0].value;
      
      // 1. Find existing user
      let user = await User.findOne({ email });

      if (user) {
        // Update tokens
        user.googleId = profile.id;
        user.googleAccessToken = accessToken;
        if (refreshToken) user.googleRefreshToken = refreshToken; // Google only sends this once!
        await user.save();
        return done(null, user);
      } else {
        // If we want to allow "Sign Up with Google", we'd create a user here.
        // For now, let's return error if user doesn't exist in our system
        return done(new Error('User not found. Please register via email first.'), null);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialization (Required for session support, though we mostly use JWT)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then(user => done(null, user)));