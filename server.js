const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
require('dotenv').config();
const MongoDBStore = require('connect-mongodb-session')(sessions);
const { MongoClient } = require('mongodb');

var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');

const app = express();

app.use(async (req, res, next) => {
  try {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    req.db = client.db('session-test'); // = await MongoClient.connect(process.env.MONGO_URI).db('session-test') - не работает
    next();
  } catch (err) {
    console.error(err);
    next();
  }
});

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

async function findUserByUsername(db, username) {
  return db.collection('users').findOne({ username });
}

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const userData = await findUserByUsername(req.db, username);
    return userData;

    // db.get('SELECT * FROM users WHERE username = ?', [username], function (err, row) {
    //   if (err) {
    //     return cb(err);
    //   }
    //   if (!row) {
    //     return cb(null, false, { message: 'Incorrect username or password.' });
    //   }

    //   crypto.pbkdf2(
    //     password,
    //     row.salt,
    //     310000,
    //     32,
    //     'sha256',
    //     function (err, hashedPassword) {
    //       if (err) {
    //         return cb(err);
    //       }
    //       if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
    //         return cb(null, false, { message: 'Incorrect username or password.' });
    //       }
    //       return cb(null, row);
    //     }
    //   );
    // });
  })
);

app.get('/', (req, res) => {
  console.log(req.session, req.sessionID);
  if (req.session.username) {
    res.sendFile(path.resolve('./pages/index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.username) {
    res.redirect('/');
  } else {
    res.sendFile(path.resolve('./pages/login.html'));
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = await findUserByUsername(req.db, req.body.username);

  console.log({ username, password });
  if (req.body.username === username && req.body.password === password) {
    req.session.username = req.body.username;
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
