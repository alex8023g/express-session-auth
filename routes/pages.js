const express = require('express');
const path = require('path');
const router = express.Router();
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');

router.use(
  session({
    secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
    resave: false,
    saveUninitialized: false,
    name: 'sessionIdCookie',
    store: new MongoDBStore({
      uri: process.env.MONGO_URI + 'session-test',
      collection: 'mySessions',
      expires: 1000 * 60 * 60 * 10,
    }),
  })
);

router.use(passport.initialize()); // чтобы работал req.logout()

router.get('/', (req, res) => {
  console.log('req.session:', req.session, 'req.sessionID', req.sessionID);
  if (req.session?.passport?.user) {
    res.sendFile(path.resolve('./pages/index.html'));
  } else {
    res.redirect('/login');
  }
});

router.get('/login', (req, res) => {
  if (req.session?.username) {
    res.redirect('/');
  } else {
    res.sendFile(path.resolve('./pages/login.html'));
  }
});

router.get('/signup', (req, res) => {
  res.sendFile(path.resolve('./pages/signup.html'));
});

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.clearCookie('sessionIdCookie');
    res.redirect('/');
  });
});

module.exports = router;
