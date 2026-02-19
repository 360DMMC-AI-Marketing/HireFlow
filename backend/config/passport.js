import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();

// --- GOOGLE STRATEGY ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true 
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (!user) {
        // AUTO-REGISTER if user doesn't exist
        user = new User({ email, name: profile.displayName });
      }

      if (!user.integrations) user.integrations = {};
      user.integrations.google = {
        googleId: profile.id,
        accessToken,
        refreshToken: refreshToken || (user.integrations.google?.refreshToken)
      };
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// --- LINKEDIN STRATEGY ---
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email'],
    state: true,
    passReqToCallback: true,
    profileURL: 'https://api.linkedin.com/v2/userinfo'
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails.length > 0) 
        ? profile.emails[0].value 
        : profile.email || (profile._json && profile._json.email);

      if (!email) return done(new Error('Email not found in LinkedIn profile'), null);

      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, name: profile.displayName || profile.name });
      }

      if (!user.integrations) user.integrations = {};
      user.integrations.linkedin = {
        linkedinId: profile.id || profile._json.sub,
        accessToken,
        refreshToken: refreshToken || (user.integrations.linkedin?.refreshToken)
      };
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// --- INDEED STRATEGY ---
passport.use('indeed', new OAuth2Strategy({
    authorizationURL: 'https://secure.indeed.com/oauth/v2/authorize',
    tokenURL: 'https://apis.indeed.com/oauth/v2/tokens',
    clientID: process.env.INDEED_CLIENT_ID,
    clientSecret: process.env.INDEED_CLIENT_SECRET,
    callbackURL: process.env.INDEED_CALLBACK_URL,
    scope: ['email', 'offline_access'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      // Indeed usually returns user info in 'params' during the token exchange
      // We fall back to the session user if they are already logged in
      const email = params.email || (req.user && req.user.email); 

      if (!email) {
          return done(new Error('Indeed did not return an email. Check your Indeed App scopes.'), null);
      }

      let user = await User.findOne({ email });

      if (!user) {
        // Create the user if they don't exist
        user = new User({ 
            email, 
            name: "Indeed User" // Indeed's generic strategy doesn't always send a name
        });
      }

      if (!user.integrations) user.integrations = {};
      user.integrations.indeed = {
        indeedId: params.id_token || (profile && profile.id), 
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialization 
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then(user => done(null, user)));

export default passport;