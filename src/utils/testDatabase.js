const mongoose = require('mongoose');

let isConnected = false;

// Connect to the test database
const connectToTestDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }

  try {
    // Include the default MongoDB port or your custom port
    const dbPort = process.env.MONGO_PORT || '27017'; // Default MongoDB port
    const dbURI = process.env.MONGO_URI_TEST || `mongodb://localhost:${dbPort}/kindlee_test`;

    console.log(`Attempting to connect to: ${dbURI}`);

    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log(`Connected to database: ${dbURI}`);
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    throw error;
  }
};

// Disconnect from the database
const disconnectFromTestDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from database');
  }
};

module.exports = { connectToTestDB, disconnectFromTestDB };
