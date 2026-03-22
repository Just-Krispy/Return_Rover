/**
 * Nash Sidebar Integration
 * One-click game theory analysis in sliding sidebar
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        API_ENDPOINT: null, // Set to your Nash API endpoint or use Claude directly
        VAULT_PATH: '../vault/analysis/', // Path to save analysis files
        SIDEBAR_WIDTH: '400px',
        ANIMATION_DURATION: 300,
        ESTIMATION_TIME: 15000, // 15 seconds estimated analysis time
    };

    // State management
    let currentAnalysis = null;
    let selectedNodes = []; // For compare mode
    let isAnalyzing = false;

    /**
     * Initialize Nash sidebar
     */
    function initNashSidebar() {
        // Create sidebar HTML if not exists
        if (!document.getElementById('nashSidebar')) {
            createSidebarHTML();
        }

        // Event listeners
        document.getElementById('nashSidebarClose')?.addEventListener('click', closeSidebar);
        document.getElementById('nashExportBtn')?.addEventListener('click', exportAnalysis);
        document.getElementById('nashSaveBtn')?.addEventListener('click', saveToVault);
        document.getElementById('nashCopyBtn')?.addEventListener('click', copyToClipboard);
        
        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isSidebarOpen()) {
                closeSidebar();
            }
        });

        console.log('Nash sidebar initialized');
    }

    /**
     * Create sidebar HTML structure
     */
    function createSidebarHTML() {
        const sidebarHTML = `
            <div id="nashSidebarOverlay" class="nash-sidebar-overlay">
                <div id="nashSidebar" class="nash-sidebar">
                    <!-- Header -->
                    <div class="nash-sidebar-header">
                        <div class="nash-sidebar-title">
                            <i data-lucide="brain" style="width:24px;height:24px;color:var(--accent-purple)"></i>
                            <div>
                                <h3>Nash Analysis</h3>
                                <p class="nash-subtitle" id="nashSubtitle">Game Theory Analysis</p>
                            </div>
                        </div>
                        <button id="nashSidebarClose" class="nash-close-btn" aria-label="Close sidebar">
                            <i data-lucide="x" style="width:20px;height:20px"></i>
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="nash-sidebar-content" id="nashContent">
                        <!-- Loading state -->
                        <div id="nashLoading" class="nash-loading hidden">
                            <div class="nash-spinner"></div>
                            <p>Analyzing with Nash...</p>
                            <div class="nash-progress-bar">
                                <div id="nashProgressFill" class="nash-progress-fill"></div>
                            </div>
                            <p class="nash-estimate" id="nashEstimate">Estimated time: 15s</p>
                        </div>

                        <!-- Results -->
                        <div id="nashResults" class="nash-results hidden">
                            <!-- Summary Section -->
                            <div class="nash-section" id="nashSummarySection">
                                <div class="nash-section-header" onclick="window.toggleNashSection('nashSummarySection')">
                                    <h4>
                                        <i data-lucide="file-text" style="width:18px;height:18px"></i>
                                        Summary
                                    </h4>
                                    <i data-lucide="chevron-down" style="width:18px;height:18px" class="nash-chevron"></i>
                                </div>
                                <div class="nash-section-content" id="nashSummaryContent">
                                    <!-- Dynamic content -->
                                </div>
                            </div>

                            <!-- Game Theory Section -->
                            <div class="nash-section" id="nashGameTheorySection">
                                <div class="nash-section-header" onclick="window.toggleNashSection('nashGameTheorySection')">
                                    <h4>
                                        <i data-lucide="git-branch" style="width:18px;height:18px"></i>
                                        Game Theory
                                    </h4>
                                    <i data-lucide="chevron-down" style="width:18px;height:18px" class="nash-chevron"></i>
                                </div>
                                <div class="nash-section-content" id="nashGameTheoryContent">
                                    <!-- Dynamic content -->
                                </div>
                            </div>

                            <!-- Probabilities Section -->
                            <div class="nash-section" id="nashProbabilitiesSection">
                                <div class="nash-section-header" onclick="window.toggleNashSection('nashProbabilitiesSection')">
                                    <h4>
                                        <i data-lucide="pie-chart" style="width:18px;height:18px"></i>
                                        Probabilities
                                    </h4>
                                    <i data-lucide="chevron-down" style="width:18px;height:18px" class="nash-chevron"></i>
                                </div>
                                <div class="nash-section-content" id="nashProbabilitiesContent">
                                    <!-- Dynamic content -->
                                </div>
                            </div>

                            <!-- Recommendations Section -->
                            <div class="nash-section" id="nashRecommendationsSection">
                                <div class="nash-section-header" onclick="window.toggleNashSection('nashRecommendationsSection')">
                                    <h4>
                                        <i data-lucide="lightbulb" style="width:18px;height:18px"></i>
                                        Recommendations
                                    </h4>
                                    <i data-lucide="chevron-down" style="width:18px;height:18px" class="nash-chevron"></i>
                                </div>
                                <div class="nash-section-content" id="nashRecommendationsContent">
                                    <!-- Dynamic content -->
                                </div>
                            </div>
                        </div>

                        <!-- Error state -->
                        <div id="nashError" class="nash-error hidden">
                            <i data-lucide="alert-circle" style="width:48px;height:48px;color:var(--accent-red)"></i>
                            <h4>Analysis Failed</h4>
                            <p id="nashErrorMessage">Something went wrong. Please try again.</p>
                            <button class="nash-retry-btn" onclick="window.retryNashAnalysis()">
                                <i data-lucide="refresh-cw" style="width:16px;height:16px"></i>
                                Retry
                            </button>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="nash-sidebar-footer" id="nashFooter">
                        <button id="nashCopyBtn" class="nash-action-btn" title="Copy to clipboard">
                            <i data-lucide="copy" style="width:16px;height:16px"></i>
                            Copy
                        </button>
                        <button id="nashSaveBtn" class="nash-action-btn" title="Save to vault">
                            <i data-lucide="save" style="width:16px;height:16px"></i>
                            Save
                        </button>
                        <button id="nashExportBtn" class="nash-action-btn nash-primary" title="Export as markdown">
                            <i data-lucide="download" style="width:16px;height:16px"></i>
                            Export
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', sidebarHTML);
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Open sidebar and run analysis
     * @param {Object} nodeData - Node data to analyze
     */
    async function openSidebar(nodeData) {
        if (!nodeData) {
            console.error('No node data provided');
            return;
        }

        const sidebar = document.getElementById('nashSidebar');
        const overlay = document.getElementById('nashSidebarOverlay');
        
        if (!sidebar || !overlay) {
            console.error('Nash sidebar not initialized');
            return;
        }

        // Update subtitle
        document.getElementById('nashSubtitle').textContent = nodeData.id || 'Unknown Node';

        // Show sidebar
        overlay.classList.add('open');
        sidebar.classList.add('open');

        // Store current node
        currentAnalysis = { nodeData, results: null };

        // Run analysis
        await runAnalysis(nodeData);
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
        const sidebar = document.getElementById('nashSidebar');
        const overlay = document.getElementById('nashSidebarOverlay');
        
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');

        // Clear state after animation
        setTimeout(() => {
            hideAllStates();
            currentAnalysis = null;
            isAnalyzing = false;
        }, CONFIG.ANIMATION_DURATION);
    }

    /**
     * Check if sidebar is open
     */
    function isSidebarOpen() {
        return document.getElementById('nashSidebarOverlay')?.classList.contains('open');
    }

    /**
     * Run Nash analysis
     * @param {Object} nodeData - Node to analyze
     */
    async function runAnalysis(nodeData) {
        if (isAnalyzing) return;
        
        isAnalyzing = true;
        showLoadingState();

        try {
            // Generate structured prompt
            const prompt = generateAnalysisPrompt(nodeData);

            // Call API or Claude
            const results = await callNashAPI(prompt, nodeData);

            // Display results
            displayResults(results);

            // Store results
            if (currentAnalysis) {
                currentAnalysis.results = results;
            }

            isAnalyzing = false;
        } catch (error) {
            console.error('Analysis failed:', error);
            showErrorState(error.message || 'Analysis failed. Please try again.');
            isAnalyzing = false;
        }
    }

    /**
     * Generate structured analysis prompt
     * @param {Object} nodeData - Node data
     * @returns {string} Formatted prompt
     */
    function generateAnalysisPrompt(nodeData) {
        const richData = window.RICH_NODE_DATA?.[nodeData.id] || {};
        
        let prompt = `# Game Theory Analysis Request\n\n`;
        prompt += `## Crisis: ${nodeData.id}\n\n`;
        
        if (richData.description) {
            prompt += `## Context\n${richData.description}\n\n`;
        }
        
        if (richData.timeline && richData.timeline.length > 0) {
            prompt += `## Timeline\n`;
            richData.timeline.forEach(event => {
                prompt += `- **${event.date}**: ${event.event}\n`;
            });
            prompt += `\n`;
        }

        prompt += `## Analysis Required\n\n`;
        prompt += `Please provide a comprehensive game theory analysis with:\n\n`;
        prompt += `1. **Summary**: Brief overview of the crisis from a game theory perspective\n`;
        prompt += `2. **Key Players & Strategies**: Identify all major actors and their available strategies\n`;
        prompt += `3. **Payoff Matrix**: Construct and explain the strategic interaction\n`;
        prompt += `4. **Nash Equilibrium**: Identify equilibrium points and explain why they're stable\n`;
        prompt += `5. **Probability Analysis**: Estimate likelihood of different outcomes\n`;
        prompt += `6. **Strategic Recommendations**: What could/should have been done differently\n\n`;
        prompt += `Format the response in clear sections with markdown.`;

        return prompt;
    }

    /**
     * Call Nash API or Claude directly
     * @param {string} prompt - Analysis prompt
     * @param {Object} nodeData - Node data
     * @returns {Promise<Object>} Analysis results
     */
    async function callNashAPI(prompt, nodeData) {
        // Simulate API call with progress
        startProgressAnimation();

        // Option 1: Use configured Nash API
        if (CONFIG.API_ENDPOINT) {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, nodeId: nodeData.id })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        }

        // Option 2: Use Claude API directly (requires API key)
        // This would need to be configured with an API key
        // For now, we'll use a mock response for demonstration

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Return mock analysis (in production, this would be real API call)
        return generateMockAnalysis(nodeData);
    }

    /**
     * Generate mock analysis for testing
     * @param {Object} nodeData - Node data
     * @returns {Object} Mock analysis results
     */
    function generateMockAnalysis(nodeData) {
        const richData = window.RICH_NODE_DATA?.[nodeData.id] || {};
        
        return {
            summary: `The ${nodeData.id} represents a classic example of brinkmanship and strategic deterrence in game theory. Both parties possessed credible threats but faced catastrophic consequences if the conflict escalated, creating a delicate balance of power.`,
            
            gameTheory: {
                players: [
                    { name: 'United States', strategies: ['Naval Blockade', 'Air Strike', 'Diplomacy', 'Invasion'] },
                    { name: 'Soviet Union', strategies: ['Withdraw Missiles', 'Maintain Position', 'Counter-Blockade', 'Escalation'] }
                ],
                payoffMatrix: `**Simplified 2x2 Payoff Matrix:**

| | USSR Withdraws | USSR Maintains |
|---|---|---|
| **US Blockade** | (7, 5) ✓ Nash | (3, 3) |
| **US Air Strike** | (8, 2) | (1, 1) Nuclear War |

*Numbers represent utility (US, USSR). Higher is better.*`,
                nash: `The **Nash Equilibrium** was (US Blockade, USSR Withdraws) — the outcome that actually occurred. Once the US committed to the blockade, the USSR's best response was withdrawal, as maintaining the missiles risked catastrophic escalation. The US chose blockade over air strikes because it provided the USSR a face-saving exit.`,
            },

            probabilities: [
                { outcome: 'Diplomatic Resolution', probability: 65, rationale: 'Both sides had strong incentives to avoid nuclear war' },
                { outcome: 'Limited Military Conflict', probability: 25, rationale: 'Miscalculation or unauthorized action could trigger escalation' },
                { outcome: 'Nuclear Exchange', probability: 10, rationale: 'Extremely high stakes made parties cautious, but risk was non-zero' }
            ],

            recommendations: [
                {
                    title: 'Establish Backchannel Communication',
                    description: 'The crisis highlighted the need for direct communication between superpowers. The hotline was installed afterward.',
                    impact: 'HIGH'
                },
                {
                    title: 'Clarify Red Lines Early',
                    description: 'US should have communicated unacceptability of Soviet missiles in Cuba before deployment.',
                    impact: 'MEDIUM'
                },
                {
                    title: 'Create Exit Ramps',
                    description: 'The secret Turkey missile deal gave USSR a face-saving concession. Always design win-win outcomes.',
                    impact: 'HIGH'
                }
            ]
        };
    }

    /**
     * Display analysis results
     * @param {Object} results - Analysis results
     */
    function displayResults(results) {
        hideAllStates();
        document.getElementById('nashResults').classList.remove('hidden');

        // Summary
        const summaryContent = document.getElementById('nashSummaryContent');
        summaryContent.innerHTML = `<p class="nash-text">${results.summary}</p>`;

        // Game Theory
        const gameTheoryContent = document.getElementById('nashGameTheoryContent');
        let gameTheoryHTML = '';

        if (results.gameTheory.players) {
            gameTheoryHTML += '<div class="nash-players">';
            results.gameTheory.players.forEach(player => {
                gameTheoryHTML += `
                    <div class="nash-player-card">
                        <h5>${player.name}</h5>
                        <p class="nash-label">Strategies:</p>
                        <ul>
                            ${player.strategies.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            gameTheoryHTML += '</div>';
        }

        if (results.gameTheory.payoffMatrix) {
            gameTheoryHTML += `<div class="nash-matrix"><h5>Payoff Matrix</h5>${marked.parse(results.gameTheory.payoffMatrix)}</div>`;
        }

        if (results.gameTheory.nash) {
            gameTheoryHTML += `<div class="nash-equilibrium"><h5>Nash Equilibrium</h5><p>${results.gameTheory.nash}</p></div>`;
        }

        gameTheoryContent.innerHTML = gameTheoryHTML;

        // Probabilities
        const probabilitiesContent = document.getElementById('nashProbabilitiesContent');
        let probabilitiesHTML = '<div class="nash-probabilities">';
        
        results.probabilities.forEach(prob => {
            probabilitiesHTML += `
                <div class="nash-probability-item">
                    <div class="nash-probability-header">
                        <span class="nash-probability-label">${prob.outcome}</span>
                        <span class="nash-probability-value">${prob.probability}%</span>
                    </div>
                    <div class="nash-probability-bar">
                        <div class="nash-probability-fill" style="width: ${prob.probability}%"></div>
                    </div>
                    <p class="nash-probability-rationale">${prob.rationale}</p>
                </div>
            `;
        });
        
        probabilitiesHTML += '</div>';
        probabilitiesContent.innerHTML = probabilitiesHTML;

        // Recommendations
        const recommendationsContent = document.getElementById('nashRecommendationsContent');
        let recommendationsHTML = '<div class="nash-recommendations">';
        
        results.recommendations.forEach(rec => {
            const impactClass = rec.impact.toLowerCase();
            recommendationsHTML += `
                <div class="nash-recommendation-card">
                    <div class="nash-recommendation-header">
                        <h5>${rec.title}</h5>
                        <span class="nash-impact-badge nash-impact-${impactClass}">${rec.impact}</span>
                    </div>
                    <p>${rec.description}</p>
                </div>
            `;
        });
        
        recommendationsHTML += '</div>';
        recommendationsContent.innerHTML = recommendationsHTML;

        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Typewriter effect (optional)
        animateTypewriter();
    }

    /**
     * Animate typewriter effect for results
     */
    function animateTypewriter() {
        // Optional: Add subtle fade-in animation
        const sections = document.querySelectorAll('.nash-section');
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(10px)';
            setTimeout(() => {
                section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        hideAllStates();
        document.getElementById('nashLoading').classList.remove('hidden');
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    function showErrorState(message) {
        hideAllStates();
        document.getElementById('nashError').classList.remove('hidden');
        document.getElementById('nashErrorMessage').textContent = message;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Hide all states
     */
    function hideAllStates() {
        document.getElementById('nashLoading')?.classList.add('hidden');
        document.getElementById('nashResults')?.classList.add('hidden');
        document.getElementById('nashError')?.classList.add('hidden');
    }

    /**
     * Start progress bar animation
     */
    function startProgressAnimation() {
        const progressFill = document.getElementById('nashProgressFill');
        const estimateEl = document.getElementById('nashEstimate');
        
        if (!progressFill) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressFill.style.width = `${progress}%`;
            
            const remaining = Math.ceil((100 - progress) / 100 * CONFIG.ESTIMATION_TIME / 1000);
            estimateEl.textContent = `Estimated time: ${remaining}s`;

            if (progress >= 100) {
                clearInterval(interval);
            }
        }, CONFIG.ESTIMATION_TIME / 100);
    }

    /**
     * Toggle section collapse
     * @param {string} sectionId - Section ID
     */
    function toggleNashSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('collapsed');
        }
    }

    /**
     * Export analysis as markdown file
     */
    function exportAnalysis() {
        if (!currentAnalysis?.results) {
            showToast('No analysis to export', 'error', 2000);
            return;
        }

        const markdown = generateMarkdown(currentAnalysis);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nash-analysis-${sanitizeFilename(currentAnalysis.nodeData.id)}.md`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Analysis exported!', 'success', 2000);
    }

    /**
     * Save analysis to vault
     */
    async function saveToVault() {
        if (!currentAnalysis?.results) {
            showToast('No analysis to save', 'error', 2000);
            return;
        }

        const markdown = generateMarkdown(currentAnalysis);
        const filename = `nash-analysis-${sanitizeFilename(currentAnalysis.nodeData.id)}.md`;

        // In a real implementation, this would save to the vault via API
        // For now, we'll just download it
        exportAnalysis();
        
        showToast('Analysis saved to vault!', 'success', 2000);
    }

    /**
     * Copy analysis to clipboard
     */
    async function copyToClipboard() {
        if (!currentAnalysis?.results) {
            showToast('No analysis to copy', 'error', 2000);
            return;
        }

        const markdown = generateMarkdown(currentAnalysis);
        
        try {
            await navigator.clipboard.writeText(markdown);
            showToast('Copied to clipboard!', 'success', 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('Failed to copy', 'error', 2000);
        }
    }

    /**
     * Generate markdown from analysis
     * @param {Object} analysis - Analysis object
     * @returns {string} Markdown content
     */
    function generateMarkdown(analysis) {
        const { nodeData, results } = analysis;
        const timestamp = new Date().toISOString().split('T')[0];

        let md = `# Nash Analysis: ${nodeData.id}\n\n`;
        md += `**Generated:** ${timestamp}\n\n`;
        md += `---\n\n`;

        md += `## Summary\n\n${results.summary}\n\n`;

        md += `## Game Theory Analysis\n\n`;
        
        if (results.gameTheory.players) {
            md += `### Players & Strategies\n\n`;
            results.gameTheory.players.forEach(player => {
                md += `**${player.name}**\n`;
                player.strategies.forEach(s => md += `- ${s}\n`);
                md += `\n`;
            });
        }

        if (results.gameTheory.payoffMatrix) {
            md += `### Payoff Matrix\n\n${results.gameTheory.payoffMatrix}\n\n`;
        }

        if (results.gameTheory.nash) {
            md += `### Nash Equilibrium\n\n${results.gameTheory.nash}\n\n`;
        }

        md += `## Probability Analysis\n\n`;
        results.probabilities.forEach(prob => {
            md += `### ${prob.outcome} (${prob.probability}%)\n\n`;
            md += `${prob.rationale}\n\n`;
        });

        md += `## Recommendations\n\n`;
        results.recommendations.forEach(rec => {
            md += `### ${rec.title} [${rec.impact}]\n\n`;
            md += `${rec.description}\n\n`;
        });

        md += `---\n\n`;
        md += `*Generated by Nash Analysis Engine*\n`;

        return md;
    }

    /**
     * Sanitize filename
     * @param {string} str - String to sanitize
     * @returns {string} Safe filename
     */
    function sanitizeFilename(str) {
        return str.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Retry analysis
     */
    async function retryNashAnalysis() {
        if (currentAnalysis?.nodeData) {
            await runAnalysis(currentAnalysis.nodeData);
        }
    }

    /**
     * Compare multiple nodes (future feature)
     * @param {Array} nodes - Array of nodes to compare
     */
    function compareNodes(nodes) {
        // TODO: Implement compare mode
        console.log('Compare mode not yet implemented');
        showToast('Compare mode coming soon!', 'info', 2000);
    }

    // Export functions to window for global access
    window.nashSidebar = {
        init: initNashSidebar,
        open: openSidebar,
        close: closeSidebar,
        compare: compareNodes
    };

    window.toggleNashSection = toggleNashSection;
    window.retryNashAnalysis = retryNashAnalysis;

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNashSidebar);
    } else {
        initNashSidebar();
    }

})();
