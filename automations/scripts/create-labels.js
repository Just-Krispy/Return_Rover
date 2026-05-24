#!/usr/bin/env node

/**
 * Create GitHub repository labels
 * 
 * This script creates all the labels needed for the Kanban board
 * if they don't already exist.
 */

const { Octokit } = require('@octokit/rest');

// Configuration
const REPO_OWNER = 'Just-Krispy';
const REPO_NAME = 'Return_Rover';

// Label definitions
const LABELS = [
  // Status labels
  { name: 'backlog', color: '6a7c8d', description: 'Issues in the backlog' },
  { name: 'todo', color: '2185d0', description: 'Ready to be worked on' },
  { name: 'in-progress', color: '7c5cf4', description: 'Currently being worked on' },
  { name: 'ready-for-review', color: '28a745', description: 'Ready for code review' },
  { name: 'done', color: 'dc3545', description: 'Completed work' },
  
  // Type labels
  { name: 'bug', color: 'd73a49', description: 'Bug fixes' },
  { name: 'enhancement', color: 'a2eeef', description: 'Feature enhancements' },
  { name: 'documentation', color: '0075ca', description: 'Documentation updates' },
  { name: 'good first issue', color: '7057ff', description: 'Good for newcomers' },
  { name: 'help wanted', color: 'fbca04', description: 'Help needed' },
  
  // Priority labels
  { name: 'priority/critical', color: 'b60205', description: 'Critical priority' },
  { name: 'priority/high', color: 'd93f0b', description: 'High priority' },
  { name: 'priority/medium', color: 'fbca04', description: 'Medium priority' },
  { name: 'priority/low', color: 'e4e669', description: 'Low priority' },
  
  // Other labels
  { name: 'status/needs-triage', color: 'fbca04', description: 'Needs triage' },
  { name: 'status/blocked', color: 'e4e669', description: 'Blocked' },
  { name: 'area/automations', color: '0366d6', description: 'Automations' },
  { name: 'area/ui', color: '1d76db', description: 'User interface' },
  { name: 'area/backend', color: '0052cc', description: 'Backend' }
];

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function getExistingLabels() {
  try {
    const labels = await octokit.issues.listLabelsForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      per_page: 100
    });
    return labels.data;
  } catch (error) {
    console.error('Error fetching labels:', error.message);
    return [];
  }
}

async function createLabel(label) {
  try {
    await octokit.issues.createLabel({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      name: label.name,
      color: label.color,
      description: label.description
    });
    console.log(`Created label: ${label.name}`);
    return true;
  } catch (error) {
    if (error.status === 422) {
      // Label already exists
      console.log(`Label already exists: ${label.name}`);
      return false;
    }
    console.error(`Error creating label ${label.name}:`, error.message);
    return false;
  }
}

async function updateLabel(label) {
  try {
    await octokit.issues.updateLabel({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      name: label.name,
      color: label.color,
      description: label.description
    });
    console.log(`Updated label: ${label.name}`);
    return true;
  } catch (error) {
    console.error(`Error updating label ${label.name}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('Setting up GitHub labels...');
    
    // Get existing labels
    const existingLabels = await getExistingLabels();
    const existingLabelNames = new Set(existingLabels.map(l => l.name));
    
    console.log(`Found ${existingLabels.length} existing labels`);
    
    // Create or update labels
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const label of LABELS) {
      if (!existingLabelNames.has(label.name)) {
        if (await createLabel(label)) {
          created++;
        }
      } else {
        // Check if update is needed
        const existing = existingLabels.find(l => l.name === label.name);
        if (existing.color !== label.color || existing.description !== label.description) {
          if (await updateLabel(label)) {
            updated++;
          }
        } else {
          skipped++;
        }
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`  Created: ${created}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log('\nLabel setup complete!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error in label setup:', error);
    process.exit(1);
  }
}

main();
