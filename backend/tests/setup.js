const mongoose = require('mongoose');

// make sure token signing works regardless of which test file runs first
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

let mongod;

// use a CI-provided mongo if present, otherwise spin up an in-memory one so the
// suite is self-contained and never touches a real database
beforeAll(async () => {
  let uri = process.env.MONGO_TEST_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
