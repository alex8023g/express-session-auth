const express = require('express');
const router = express.Router();
const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const dbModule = require('../db/db');

passport.use(
  new YandexStrategy(
    {
      clientID: process.env['YANDEX_CLIENT_ID'],
      clientSecret: process.env['YANDEX_CLIENT_SECRET'],
      callbackURL: '/oauth2/redirect/yandex',
      // scope: ['profile'],
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log('profile!!', profile);
      const user = await dbModule.findOrAddFederatedUser(profile);
      return cb(null, user);
    }
  )
);

router.get('/auth/yandex', passport.authenticate('yandex'));

router.get(
  '/oauth2/redirect/yandex',
  passport.authenticate('yandex', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

module.exports = router;
