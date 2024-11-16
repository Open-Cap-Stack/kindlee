// jest.config.js
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
    testTimeout: 120000,
    forceExit: true,
    detectOpenHandles: true,
    verbose: true,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/tests/**"
    ],
    testMatch: [
        "**/tests/**/*.test.js"
    ],
    moduleDirectories: ['node_modules', 'src']
};
