const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
require('dotenv').config();
const MongoDBStore = require('connect-mongodb-session')(sessions);

const app = express();

app.use(
  sessions({
    secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
    cookie: { maxAge: 1000 * 60 * 2 }, // милисекунд
    saveUninitialized: false,
    resave: false,
    name: 'sessionIdCookie',
    store: new MongoDBStore({
      uri: process.env.MONGO_URI + 'session-test',
      collection: 'mySessions',
    }),
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// let session = {};

app.get('/', (req, res) => {
  console.log(req.session, req.sessionID);
  if (req.session.userName) {
    res.sendFile(path.resolve('./pages/index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.userName) {
    res.redirect('/');
  } else {
    res.sendFile(path.resolve('./pages/login.html'));
  }
});

app.post('/api/login', (req, res) => {
  if (req.body.username == 'q' && req.body.password == 'q') {
    // session = req.session;
    req.session.userName = req.body.username;
    // req.session.sessionId = nanoid();
    // res.send(`Hey there, welcome <a href=\'/logout'>click to logout</a>`);
    res.redirect('/');
  } else {
    res.send('Invalid username or password');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('sessionIdCookie');
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('app listening port 3000');
});
