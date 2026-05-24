#!/usr/bin/env node

/**
 * Generate sprint reports
 * 
 * This script:
 * 1. Fetches all issues/PRs closed in the specified time period
 * 2. Calculates velocity and cycle time metrics
 * 3. Generates a comprehensive report
 * 4. Sends to Discord and saves as artifact
 */

const { Octokit } = require('@octokit/rest');

// Configuration
const REPO_OWNER = 'Just-Krispy';
const REPO_NAME = 'Return_Rover';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const DEFAULT_SPRINT_DURATION = 14; // days

// Get sprint dates from environment or calculate from duration
const SPRINT_START = process.env.SPRINT_START ? new Date(process.env.SPRINT_START) : 
                     new Date(Date.now() - (DEFAULT_SPRINT_DURATION * 24 * 60 * 60 * 1000));
const SPRINT_END = process.env.SPRINT_END ? new Date(process.env.SPRINT_END) : new Date();

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function fetchClosedIssues() {
  console.log('Fetching closed issues...');
  const issues = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'closed',
    since: SPRINT_START.toISOString(),
    until: SPRINT_END.toISOString(),
    per_page: 100
  });
  return issues.data.filter(issue => 
    new Date(issue.closed_at) >= SPRINT_START && 
    new Date(issue.closed_at) <= SPRINT_END
  );
}

async function fetchClosedPRs() {
  console.log('Fetching closed PRs...');
  const prs = await octokit.pulls.list({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'closed',
    per_page: 100
  });
  
  return prs.data.filter(pr => {
    const closedAt = pr.closed_at || pr.merged_at;
    return closedAt && new Date(closedAt) >= SPRINT_START && new Date(closedAt) <= SPRINT_END;
  });
}

function calculateMetrics(issues, prs) {
  const metrics = {
    total_completed: issues.length + prs.length,
    issues_completed: issues.length,
    prs_merged: prs.filter(pr => pr.merged_at).length,
    prs_closed: prs.filter(pr => pr.merged_at === null).length,
    by_type: {},
    by_label: {},
    contributors: new Set(),
    total_additions: 0,
    total_deletions: 0
  };
  
  // Count by type
  for (const issue of issues) {
    const type = issue.labels.find(l => ['bug', 'enhancement', 'documentation'].includes(l.name))?.name || 'task';
    metrics.by_type[type] = (metrics.by_type[type] || 0) + 1;
    metrics.contributors.add(issue.user.login);
  }
  
  // Count PRs
  for (const pr of prs) {
    metrics.total_additions += pr.additions || 0;
    metrics.total_deletions += pr.deletions || 0;
    metrics.contributors.add(pr.user.login);
    
    if (pr.merged_at) {
      metrics.prs_merged++;
    } else {
      metrics.prs_closed++;
    }
  }
  
  // Count by label
  const allItems = [...issues, ...prs];
  for (const item of allItems) {
    for (const label of item.labels) {
      if (!['bug', 'enhancement', 'documentation'].includes(label.name)) {
        metrics.by_label[label.name] = (metrics.by_label[label.name] || 0) + 1;
      }
    }
  }
  
  metrics.contributors = Array.from(metrics.contributors);
  
  return metrics;
}

function generateReport(issues, prs, metrics) {
  const report = {
    sprint: {
      name: `Sprint ${new Date(SPRINT_START).getDate()}-${new Date(SPRINT_START).getMonth() + 1}`,
      start: SPRINT_START.toISOString(),
      end: SPRINT_END.toISOString(),
      duration_days: Math.ceil((SPRINT_END - SPRINT_START) / (1000 * 60 * 60 * 24))
    },
    generated_at: new Date().toISOString(),
    metrics: metrics,
    items: {
      issues: issues.map(i => ({
        number: i.number,
        title: i.title,
        url: i.html_url,
        author: i.user.login,
        closed_at: i.closed_at,
        labels: i.labels.map(l => l.name)
      })),
      prs: prs.map(p => ({
        number: p.number,
        title: p.title,
        url: p.html_url,
        author: p.user.login,
        merged_at: p.merged_at,
        additions: p.additions || 0,
        deletions: p.deletions || 0,
        labels: p.labels.map(l => l.name)
      }))
    }
  };
  
  return report;
}

async function sendDiscordReport(report, metrics) {
  if (!DISCORD_WEBHOOK_URL) return;
  
  const { WebhookClient, EmbedBuilder } = require('discord.js');
  const webhook = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 Sprint Report: ${report.sprint.name}`)
    .setColor(5814783)
    .addFields(
      { name: 'Total Completed', value: metrics.total_completed.toString(), inline: true },
      { name: 'Issues', value: metrics.issues_completed.toString(), inline: true },
      { name: 'PRs Merged', value: metrics.prs_merged.toString(), inline: true },
      { name: 'PRs Closed', value: metrics.prs_closed.toString(), inline: true },
      { name: 'Contributors', value: metrics.contributors.length.toString(), inline: true },
      { name: 'Net Changes', value: `${metrics.total_additions}+ / ${metrics.total_deletions}-`, inline: true }
    )
    .setFooter({ text: 'Return Rover Automation' })
    .setTimestamp();
  
  // Add by-type breakdown
  if (Object.keys(metrics.by_type).length > 0) {
    const typeText = Object.entries(metrics.by_type)
      .map(([type, count]) => `• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`)
      .join('\n');
    embed.addFields({ name: 'By Type', value: typeText });
  }
  
  // Add top contributors
  if (metrics.contributors.length > 0) {
    const contributorsText = metrics.contributors
      .slice(0, 10)
      .map(c => `@${c}`)
      .join(', ');
    embed.addFields({ name: 'Contributors', value: contributorsText });
  }
  
  try {
    await webhook.send({ embeds: [embed] });
    console.log('Discord sprint report sent');
  } catch (error) {
    console.error('Failed to send Discord report:', error.message);
  }
}

async function main() {
  try {
    console.log(`Generating sprint report for ${SPRINT_START.toDateString()} - ${SPRINT_END.toDateString()}`);
    
    // Fetch data
    const [issues, prs] = await Promise.all([fetchClosedIssues(), fetchClosedPRs()]);
    
    console.log(`Found ${issues.length} issues and ${prs.length} PRs`);
    
    // Calculate metrics
    const metrics = calculateMetrics(issues, prs);
    
    // Generate report
    const report = generateReport(issues, prs, metrics);
    
    // Save to file
    const fs = require('fs');
    const reportsDir = 'reports';
    fs.mkdirSync(reportsDir, { recursive: true });
    
    const reportFilename = `sprint-report-${SPRINT_START.getTime()}-${SPRINT_END.getTime()}.json`;
    fs.writeFileSync(`${reportsDir}/${reportFilename}`, JSON.stringify(report, null, 2));
    console.log(`Saved report to ${reportsDir}/${reportFilename}`);
    
    // Send Discord notification
    await sendDiscordReport(report, metrics);
    
    console.log('Sprint report generation complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error generating sprint report:', error);
    process.exit(1);
  }
}

main();
