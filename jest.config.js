module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  testMatch: [
    "**/Tests/**/*.test.jsx"
  ]
};