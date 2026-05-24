#!/usr/bin/env node

/**
 * Sync GitHub issues and PRs to Kanban board
 * 
 * This script:
 * 1. Fetches all open issues and PRs from the repository
 * 2. Categorizes them by status labels
 * 3. Generates a JSON report for the Kanban board
 * 4. Sends Discord notifications for changes
 */

const { Octokit } = require('@octokit/rest');

// Configuration
const REPO_OWNER = 'Just-Krispy';
const REPO_NAME = 'Return_Rover';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const BOARD_NAME = process.env.BOARD_NAME || 'Return Rover Board';

// Label to column mapping
const LABEL_TO_COLUMN = {
  'backlog': 'Backlog',
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'ready-for-review': 'Ready for Review',
  'done': 'Done'
};

// Type labels for categorization
const TYPE_LABELS = ['bug', 'enhancement', 'documentation', 'good first issue', 'help wanted'];

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function fetchIssues() {
  console.log('Fetching issues...');
  const issues = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100
  });
  return issues.data;
}

async function fetchPRs() {
  console.log('Fetching PRs...');
  const prs = await octokit.pulls.list({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100
  });
  return prs.data;
}

function categorizeItem(item) {
  const labels = item.labels.map(l => l.name);
  
  // Find status label
  let status = 'backlog';
  for (const [label, column] of Object.entries(LABEL_TO_COLUMN)) {
    if (labels.includes(label)) {
      status = label;
      break;
    }
  }
  
  // Find type label
  let type = 'task';
  for (const typeLabel of TYPE_LABELS) {
    if (labels.includes(typeLabel)) {
      type = typeLabel;
      break;
    }
  }
  
  return { status, type };
}

function generateBoardData(issues, prs) {
  const board = {
    name: BOARD_NAME,
    generated_at: new Date().toISOString(),
    columns: {
      'Backlog': { items: [], type: 'issue' },
      'To Do': { items: [], type: 'issue' },
      'In Progress': { items: [], type: 'issue' },
      'Ready for Review': { items: [], type: 'issue' },
      'Done': { items: [], type: 'issue' },
      'PRs': { items: [], type: 'pr' }
    }
  };
  
  // Process issues
  for (const issue of issues) {
    const { status, type } = categorizeItem(issue);
    const column = LABEL_TO_COLUMN[status] || 'Backlog';
    
    board.columns[column].items.push({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      author: issue.user.login,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      type: type,
      labels: issue.labels.map(l => l.name)
    });
  }
  
  // Process PRs
  for (const pr of prs) {
    const { status, type } = categorizeItem(pr);
    
    // PRs go to "Ready for Review" if they have that label, otherwise to a PRs column
    let column = 'PRs';
    if (status === 'ready-for-review') {
      column = 'Ready for Review';
    }
    
    board.columns[column].items.push({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user.login,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      type: type,
      labels: pr.labels.map(l => l.name),
      merged: pr.merged_at !== null,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0
    });
  }
  
  return board;
}

async function main() {
  try {
    // Fetch data
    const [issues, prs] = await Promise.all([fetchIssues(), fetchPRs()]);
    
    console.log(`Found ${issues.length} issues and ${prs.length} PRs`);
    
    // Generate board data
    const board = generateBoardData(issues, prs);
    
    // Save to file
    const fs = require('fs');
    const outputPath = 'automations/reports/kanban-board.json';
    fs.mkdirSync('automations/reports', { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(board, null, 2));
    console.log(`Saved board to ${outputPath}`);
    
    // Send Discord notification if webhook is configured
    if (DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification(board, issues, prs);
    }
    
    console.log('Kanban sync complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error syncing Kanban board:', error);
    process.exit(1);
  }
}

async function sendDiscordNotification(board, issues, prs) {
  const { WebhookClient } = require('discord.js');
  const webhook = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
  
  const totalItems = issues.length + prs.length;
  
  const embed = {
    title: `📊 ${BOARD_NAME} - ${new Date().toLocaleDateString()}`,
    color: 5814783,
    fields: [
      { name: 'Total Items', value: totalItems.toString(), inline: true },
      { name: 'Issues', value: issues.length.toString(), inline: true },
      { name: 'PRs', value: prs.length.toString(), inline: true }
    ],
    footer: { text: 'Return Rover Automation' },
    timestamp: new Date().toISOString()
  };
  
  // Add column summary
  for (const [columnName, columnData] of Object.entries(board.columns)) {
    if (columnName !== 'PRs' && columnData.items.length > 0) {
      embed.fields.push({
        name: `📌 ${columnName}`,
        value: columnData.items.map(item => `• [${item.title}](${item.url})`).join('\n').substring(0, 1024)
      });
    }
  }
  
  try {
    await webhook.send({ embeds: [embed] });
    console.log('Discord notification sent');
  } catch (error) {
    console.error('Failed to send Discord notification:', error.message);
  }
}

main();
