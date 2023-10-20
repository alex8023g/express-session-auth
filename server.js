const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();
const MongoDBStore = require('connect-mongodb-session')(session);
const { MongoClient, ObjectId } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

(async () => {
  try {
    const client = await MongoClient.connect(process.env.MONGO_URI);
    db = client.db('session-test'); // = await MongoClient.connect(process.env.MONGO_URI).db('session-test') - не работает
  } catch (err) {
    console.error(err);
  }
})();

app.use(
  session({
    secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
    // cookie: { maxAge: 1000 * 60 * 2 }, // милисекунд
    resave: false,
    saveUninitialized: false,
    name: 'sessionIdCookie',
    store: new MongoDBStore({
      uri: process.env.MONGO_URI + 'session-test',
      collection: 'mySessions',
    }),
  })
);
app.use(passport.authenticate('session'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await findUserByUsername(db, username);
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
      const id = profile.id;
      try {
        const federatedUser = await db
          .collection('federatedCredentials')
          .findOne({}, { profile: { id: profile.id } });
        console.log('federatedUser!!:', federatedUser);
        if (!federatedUser) {
          let resAddUser = await db
            .collection('federatedCredentials')
            .insertOne({ profile });
          console.log('resAddUser_id:', resAddUser['insertedId'].toString());
          const user = {
            _id: resAddUser['insertedId'],
            username: profile.displayName,
            provider: profile.provider,
          };
          await db.collection('users').insertOne(user);
          return cb(null, user);
        } else {
          const user = await db.collection('users').findOne({ _id: federatedUser._id });
          // .findOne({}, { _id: new ObjectId('653285e014856c867e7828fb') });
          // .findOne({}, { _id: new ObjectId(federatedUser._id.toString()) });
          console.log(
            'federatedUser._id:',
            federatedUser._id,
            new ObjectId('653285e014856c867e7828fb')
          );
          console.log('else user!!:', user);
          return cb(null, user);
        }
      } catch (err) {
        console.error(err);
        return err;
      }
    }
  )
);

function toHash(x) {
  let hash1 = crypto.createHash('sha256');
  hash1.update(x);
  let hash2 = hash1.digest('hex');
  return hash2;
}

async function findUserByUsername(db, username) {
  return db.collection('users').findOne({ username });
}

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

app.get('/', (req, res) => {
  console.log(req.session, req.sessionID);
  if (req.session.passport?.user) {
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

app.get('/signup', (req, res) => {
  res.sendFile(path.resolve('./pages/signup.html'));
});

app.post(
  '/api/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

app.get('/login/federated/google', passport.authenticate('google'));

app.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

app.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.clearCookie('sessionIdCookie');
    res.redirect('/');
  });
});

app.post('/signup', async function (req, res, next) {
  await db.collection('users').insertOne({
    username: req.body.username,
    password: toHash(req.body.password),
  });
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('app listening port 3000');
});
