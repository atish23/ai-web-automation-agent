import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const checkLinksTool = tool({
  name: 'check_links',
  description: 'Checks all links on the current page and analyzes their relevance to the automation task',
  parameters: z.object({
    task: z.string().describe('The automation task to check links relevance for'),
  }),
  async execute({ task }) {
    const timer = new Timer('check_links');
    Logger.info('Checking links on current page', { task });

    try {
      if (!global.page) {
        throw new Error('No browser page available');
      }

      // Show loader while checking links
      await BrowserUIAnimator.showLoader(global.page, 'Analyzing page links...');

      // Get all links on the page
      const links = await global.page.evaluate(() => {
        const linkElements = document.querySelectorAll('a[href]');
        return Array.from(linkElements).map((link, index) => {
          const rect = link.getBoundingClientRect();
          return {
            index,
            href: link.href,
            text: link.textContent?.trim() || '',
            title: link.title || '',
            visible: rect.width > 0 && rect.height > 0,
            coordinates: {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            },
            className: link.className || '',
            id: link.id || ''
          };
        });
      });

      // Filter out invisible or irrelevant links
      const visibleLinks = links.filter(link =>
        link.visible &&
        link.text.length > 0 &&
        !link.href.includes('javascript:') &&
        !link.href.includes('mailto:') &&
        !link.href.includes('tel:')
      );

      // Analyze link relevance to the task
      const relevantLinks = visibleLinks.map(link => {
        const relevanceScore = calculateRelevance(link, task);
        return {
          ...link,
          relevanceScore,
          isRelevant: relevanceScore > 5
        };
      });

      // Sort by relevance
      relevantLinks.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Show progress update
      await BrowserUIAnimator.showProgressBar(global.page, 80, 'Links analyzed');
      await BrowserUIAnimator.hideLoader(global.page);

      const duration = timer.end();
      const relevantCount = relevantLinks.filter(l => l.isRelevant).length;

      Logger.tool('check_links', 'completed', duration, {
        totalLinks: links.length,
        visibleLinks: visibleLinks.length,
        relevantLinks: relevantCount,
        topRelevance: relevantLinks[0]?.relevanceScore || 0
      });

      // Return top 10 most relevant links
      const topLinks = relevantLinks.slice(0, 10);

      return {
        totalLinks: links.length,
        relevantLinks: topLinks,
        summary: `Found ${relevantCount} relevant links out of ${visibleLinks.length} visible links. Top relevance score: ${relevantLinks[0]?.relevanceScore || 0}`
      };

    } catch (error) {
      const duration = timer.end();

      // Hide loader on error
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }

      Logger.tool('check_links', 'failed', duration, {
        error: error.message,
        task
      });
      throw error;
    }
  }
});

// Helper function to calculate link relevance
function calculateRelevance(link, task) {
  let score = 0;
  const taskLower = task.toLowerCase();
  const linkText = link.text.toLowerCase();
  const linkHref = link.href.toLowerCase();

  // Check for direct keyword matches
  const keywords = ['sign', 'register', 'login', 'join', 'create', 'account', 'form', 'contact', 'search', 'submit'];

  for (const keyword of keywords) {
    if (taskLower.includes(keyword)) {
      if (linkText.includes(keyword)) score += 10;
      if (linkHref.includes(keyword)) score += 5;
    }
  }

  // Common automation targets
  if (taskLower.includes('signup') || taskLower.includes('sign up')) {
    if (linkText.includes('sign') && linkText.includes('up')) score += 15;
    if (linkText.includes('register')) score += 12;
    if (linkText.includes('join')) score += 10;
  }

  if (taskLower.includes('login') || taskLower.includes('log in')) {
    if (linkText.includes('log') && linkText.includes('in')) score += 15;
    if (linkText.includes('login')) score += 15;
    if (linkText.includes('sign') && linkText.includes('in')) score += 12;
  }

  if (taskLower.includes('contact')) {
    if (linkText.includes('contact')) score += 15;
    if (linkText.includes('support')) score += 10;
    if (linkText.includes('help')) score += 8;
  }

  // Boost score for common button/link indicators
  if (linkText.includes('button') || link.className.includes('btn')) score += 3;
  if (link.id.includes('submit') || link.className.includes('submit')) score += 5;

  // Penalize very long or very short text
  if (linkText.length < 2 || linkText.length > 50) score -= 2;

  return Math.max(0, score);
}

export default checkLinksTool;