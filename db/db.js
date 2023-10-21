const { MongoClient, ObjectId } = require('mongodb');

// const clientDb = new MongoClient(process.env.MONGO_URI);

// exports.connection = async function () {
//   await clientDb.connect();
//   console.log('MongoClient connect');
//   const db = clientDb.db('session-test');
//   return db;
// };
const clientDb = new MongoClient(process.env.MONGO_URI);

async function getDb() {
  const clientDb = new MongoClient(process.env.MONGO_URI);
  return clientDb.connect();
  // return clientDb;
}

exports.findUserByUsername = async (username) => {
  try {
    const clientDb = await getDb();
    const db = clientDb.db('session-test');
    return db.collection('users').findOne({ username });
  } catch (err) {
    console.error(err);
  } finally {
    clientDb.close();
  }
};

exports.addLocalUser = async ({ username, password }) => {
  try {
    const clientDb = await getDb();
    const db = clientDb.db('session-test');
    db.collection('users').insertOne({
      username,
      password,
      provider: 'local',
    });
  } catch (err) {
    console.error(err);
  } finally {
    clientDb.close();
  }
};

exports.findOrAddFederatedUser = async (profile) => {
  try {
    const clientDb = await getDb();
    const db = clientDb.db('session-test');
    const federatedUser = await db.collection('federatedCredentials').findOne({
      'profile.id': profile.id,
    });
    console.log('federatedUser!!:', federatedUser, 'profile.id', profile.id);
    if (!federatedUser) {
      let resAddUser = await db.collection('federatedCredentials').insertOne({ profile });
      console.log('resAddUser_id:', resAddUser['insertedId'].toString());
      const user = {
        _id: resAddUser['insertedId'],
        username: profile.displayName,
        provider: profile.provider,
      };
      await db.collection('users').insertOne(user);
      return user;
    } else {
      const user = await db.collection('users').findOne({ _id: federatedUser._id });
      console.log(
        'federatedUser._id:',
        federatedUser._id,
        new ObjectId('653285e014856c867e7828fb')
      );
      console.log('else user!!:', user);
      return user;
    }
  } catch (err) {
    console.error(err);
    return err;
  } finally {
    clientDb.close();
  }
};
