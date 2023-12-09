const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
    experimentalStudio: true,
    {
      "projectId": "<your-dashboard-project-id>",
      "recordKey": "<your-dashboard-record-key>"
      // ... other configurations
    }
    
    },
  },
});
