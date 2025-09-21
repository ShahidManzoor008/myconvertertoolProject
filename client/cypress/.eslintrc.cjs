module.exports = {
  env: {
    'cypress/globals': true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:cypress/recommended',
  ],
  plugins: [
    'cypress',
  ],
  rules: {
    // Add any specific rules for Cypress tests here
  },
};
