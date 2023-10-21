const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dbModule = require('../db/db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/google',
      scope: ['profile'],
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log('profile!!', profile);
      const user = await dbModule.findOrAddFederatedUser(profile);
      return cb(null, user);
    }
  )
);

router.get('/login/federated/google', passport.authenticate('google'));

router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

module.exports = router;
