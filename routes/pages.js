const express = require('express');
const path = require('path');
const router = express.Router();
const session = require('express-session');

router.use(
  session({
    secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
  })
);

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

module.exports = router;
