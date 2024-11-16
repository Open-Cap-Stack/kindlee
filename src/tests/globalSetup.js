// src/tests/globalSetup.js
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_TEST_URI = mongod.getUri();
  global.__MONGOD__ = mongod;
};