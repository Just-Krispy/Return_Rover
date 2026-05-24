#!/usr/bin/env node

/**
 * Send Discord notifications for GitHub events
 * 
 * Handles:
 * - Issue opened/closed/reopened
 * - PR opened/merged/closed
 * - Label changes
 * - Assignee changes
 */

const { WebhookClient, EmbedBuilder } = require('discord.js');

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Color mapping for different event types
const COLORS = {
  issue: 5814783,
  pr: 3447003,
  bug: 10092308,
  enhancement: 3066993,
  documentation: 2066939,
  'good first issue': 10092308,
  'help wanted': 10038562,
  'in-progress': 10038562,
  'ready-for-review': 3066993,
  done: 10092308,
  default: 5814783
};

async function sendIssueNotification(event, issue, action) {
  if (!DISCORD_WEBHOOK_URL) return;
  
  const webhook = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
  
  const statusEmoji = action === 'opened' ? '🆕' : action === 'closed' ? '✅' : '🔄';
  const typeEmoji = issue.labels.some(l => l.name === 'bug') ? '🐛' : 
                    issue.labels.some(l => l.name === 'enhancement') ? '✨' : 
                    issue.labels.some(l => l.name === 'documentation') ? '📝' : '📌';
  
  const embed = new EmbedBuilder()
    .setTitle(`${statusEmoji} Issue ${action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : 'Reopened'}`)
    .setDescription(`**${issue.title}**`)
    .setURL(issue.html_url)
    .setColor(issue.labels.some(l => l.name === 'bug') ? COLORS.bug : 
               issue.labels.some(l => l.name === 'enhancement') ? COLORS.enhancement : 
               COLORS.issue)
    .addFields(
      { name: 'Author', value: `@${issue.user.login}`, inline: true },
      { name: 'Labels', value: issue.labels.map(l => `#${l.name}`).join(' ') || 'None', inline: true }
    )
    .setFooter({ text: 'Return Rover Automation' })
    .setTimestamp();
  
  if (issue.body) {
    const bodyPreview = issue.body.length > 1000 ? issue.body.substring(0, 1000) + '...' : issue.body;
    embed.addFields({ name: 'Description', value: bodyPreview });
  }
  
  try {
    await webhook.send({ embeds: [embed] });
    console.log(`Discord notification sent for issue #${issue.number}`);
  } catch (error) {
    console.error('Failed to send Discord notification:', error.message);
  }
}

async function sendPRNotification(event, pr, action) {
  if (!DISCORD_WEBHOOK_URL) return;
  
  const webhook = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
  
  const statusEmoji = action === 'opened' ? '🆕' : action === 'merged' ? '🔀' : action === 'closed' ? '❌' : '🔄';
  const mergeEmoji = pr.merged_at ? '🔀' : '🚧';
  
  const embed = new EmbedBuilder()
    .setTitle(`${statusEmoji} PR ${action === 'merged' ? 'Merged' : action === 'closed' ? 'Closed' : action === 'opened' ? 'Opened' : 'Updated'}`)
    .setDescription(`**${pr.title}** ${mergeEmoji}`)
    .setURL(pr.html_url)
    .setColor(pr.merged_at ? COLORS['done'] : COLORS.pr)
    .addFields(
      { name: 'Author', value: `@${pr.user.login}`, inline: true },
      { name: 'Changes', value: `${pr.additions || 0}+ / ${pr.deletions || 0}-`, inline: true },
      { name: 'Labels', value: pr.labels.map(l => `#${l.name}`).join(' ') || 'None', inline: true }
    )
    .setFooter({ text: 'Return Rover Automation' })
    .setTimestamp();
  
  if (pr.body) {
    const bodyPreview = pr.body.length > 500 ? pr.body.substring(0, 500) + '...' : pr.body;
    embed.addFields({ name: 'Description', value: bodyPreview });
  }
  
  if (pr.merged_at) {
    embed.addFields({ name: 'Merged At', value: new Date(pr.merged_at).toLocaleString() });
  }
  
  try {
    await webhook.send({ embeds: [embed] });
    console.log(`Discord notification sent for PR #${pr.number}`);
  } catch (error) {
    console.error('Failed to send Discord notification:', error.message);
  }
}

async function main() {
  try {
    // Read event data from stdin or environment
    const eventData = process.env.GITHUB_EVENT;
    if (!eventData) {
      console.log('No event data provided');
      return;
    }
    
    const event = JSON.parse(eventData);
    const action = event.action;
    
    // Handle different event types
    if (event.issue) {
      await sendIssueNotification(event, event.issue, action);
    } else if (event.pull_request) {
      await sendPRNotification(event, event.pull_request, action);
    }
    
    console.log('Discord notification processing complete');
    
  } catch (error) {
    console.error('Error processing Discord notification:', error);
    process.exit(1);
  }
}

main();
