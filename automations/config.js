/**
 * Automation Configuration
 * 
 * Customize the behavior of the Return Rover automation scripts.
 */

module.exports = {
  // GitHub repository configuration
  github: {
    owner: 'Just-Krispy',
    repo: 'Return_Rover'
  },

  // Kanban board configuration
  kanban: {
    // Column definitions
    columns: {
      backlog: 'Backlog',
      todo: 'To Do',
      inProgress: 'In Progress',
      review: 'Review',
      done: 'Done'
    },

    // Label to column mapping
    labelToColumn: {
      'backlog': 'Backlog',
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'ready-for-review': 'Review',
      'done': 'Done',
      'bug': 'To Do',
      'enhancement': 'To Do',
      'documentation': 'To Do',
      'good first issue': 'Backlog',
      'help wanted': 'Backlog'
    },

    // Auto-sync settings
    autoSync: {
      enabled: true,
      interval: 300000 // 5 minutes in milliseconds
    }
  },

  // Discord notification configuration
  discord: {
    // Notification settings
    notifications: {
      onIssueOpened: true,
      onIssueClosed: true,
      onIssueAssigned: true,
      onPRMerged: true,
      onSprintComplete: true,
      onBoardUpdate: true
    },

    // Embed customization
    embed: {
      colors: {
        issueOpened: 3066993,      // Green
        issueClosed: 1002720,      // Red
        issueReopened: 15105570,   // Orange
        issueAssigned: 3447003,    // Blue
        prMerged: 3066993,         // Green
        sprintComplete: 15105570   // Orange
      },
      emojis: {
        issueOpened: '📝',
        issueClosed: '❌',
        issueReopened: '🔄',
        issueAssigned: '👤',
        prMerged: '✅',
        sprintComplete: '🏁'
      }
    }
  },

  // Sprint reporting configuration
  sprint: {
    // Default sprint duration in days
    defaultDuration: 14,

    // Velocity calculation settings
    velocity: {
      // Number of sprints to consider for average velocity
      lookback: 3,
      // Minimum items to consider a sprint as "complete"
      minimumItems: 1
    },

    // Report settings
    report: {
      // Retention days for reports
      retentionDays: 30,
      // Include burndown chart data
      includeBurndown: true,
      // Include team metrics
      includeTeamMetrics: true
    }
  },

  // GitHub Actions workflow configuration
  githubActions: {
    // Schedule for weekly sprint reports (cron format)
    sprintReportSchedule: '0 9 * * 1', // Every Monday at 9 AM UTC

    // Workflow triggers
    triggers: {
      issues: ['opened', 'closed', 'reopened', 'assigned', 'unassigned', 'labeled', 'unlabeled', 'transferred'],
      pullRequests: ['opened', 'closed', 'reopened', 'assigned', 'unassigned', 'labeled', 'unlabeled', 'transferred']
    }
  }
};
