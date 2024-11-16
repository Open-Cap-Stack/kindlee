// jest.global-setup.js
module.exports = async () => {
    process.env.NODE_ENV = 'test';
    global.__MONGOD__ = true;
  };
  
  // jest.global-teardown.js
  module.exports = async () => {
    global.__MONGOD__ = false;
  };