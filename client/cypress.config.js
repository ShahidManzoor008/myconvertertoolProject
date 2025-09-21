const { defineConfig } = require("cypress");
const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
      // implement node event listeners here
    },
    baseUrl: "http://localhost:5173", // Dev server URL
  },
});
