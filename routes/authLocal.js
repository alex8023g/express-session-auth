const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const dbModule = require('../db/db');
const crypto = require('crypto');

router.use(express.urlencoded({ extended: true }));
router.use(passport.authenticate('session'));

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await dbModule.findUserByUsername(username);
    console.log('user:', user, user?._id?.toString());
    if (!user) {
      return cb(null, false);
    }

    if (user.password !== toHash(password)) {
      console.log('пароль неверный', toHash(password));
      return cb(null, false);
    }
    return cb(null, user);
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user['_id'].toString(), username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

router.post(
  '/api/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

router.post('/api/signup', async function (req, res, next) {
  await dbModule.addLocalUser({
    username: req.body.username,
    password: toHash(req.body.password),
  });
  res.redirect('/');
});

function toHash(x) {
  let hash1 = crypto.createHash('sha256');
  hash1.update(x);
  let hash2 = hash1.digest('hex');
  return hash2;
}

module.exports = router;
