import { tool } from '@openai/agents';
import { z } from 'zod';
import Timer from '../classes/Timer.js';
import Logger from '../classes/Logger.js';
import BrowserUIAnimator from '../classes/BrowserUIAnimator.js';

const waitAndScrollTool = tool({
  name: 'wait_and_scroll',
  description: 'Waits for page content to load and scrolls to see more results',
  parameters: z.object({
    waitTime: z.number().default(3000).describe('Time to wait in milliseconds (default 3000)'),
    scrollTimes: z.number().default(3).describe('Number of times to scroll down (default 3)'),
    scrollDelay: z.number().default(1000).describe('Delay between scrolls in milliseconds (default 1000)'),
  }),
  async execute({ waitTime = 3000, scrollTimes = 3, scrollDelay = 1000 }) {
    const timer = new Timer('wait_and_scroll');
    Logger.info('Waiting for content and scrolling page', { waitTime, scrollTimes, scrollDelay });

    try {
      if (!global.page) {
        throw new Error('No browser page available');
      }

      // Show loader while waiting
      await BrowserUIAnimator.showLoader(global.page, 'Waiting for results to load...');

      // Wait for initial content to load
      Logger.debug(`Waiting ${waitTime}ms for content to load`);
      await global.page.waitForTimeout(waitTime);

      // Update status
      await BrowserUIAnimator.showStatusBadge(global.page, 'Scrolling to load more content...');

      // Scroll down multiple times to load more content
      for (let i = 0; i < scrollTimes; i++) {
        Logger.debug(`Scrolling ${i + 1}/${scrollTimes}`);

        // Scroll to bottom of page
        await global.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        // Show progress
        const progress = Math.round(((i + 1) / scrollTimes) * 100);
        await BrowserUIAnimator.showProgressBar(global.page, progress, `Scrolling ${i + 1}/${scrollTimes}`);

        // Wait between scrolls
        if (i < scrollTimes - 1) {
          await global.page.waitForTimeout(scrollDelay);
        }
      }

      // Wait a bit more for any lazy-loaded content
      await global.page.waitForTimeout(1000);

      // Get page info after scrolling
      const pageInfo = await global.page.evaluate(() => {
        return {
          scrollHeight: document.body.scrollHeight,
          viewportHeight: window.innerHeight,
          currentScroll: window.pageYOffset,
          visibleElements: document.querySelectorAll('*').length,
          videos: document.querySelectorAll('[data-context-item-id], .ytd-video-renderer, .ytd-compact-video-renderer').length
        };
      });

      // Hide loader and show completion
      await BrowserUIAnimator.hideLoader(global.page);
      await BrowserUIAnimator.showStatusBadge(global.page, 'Content loaded and scrolled!');

      const duration = timer.end();

      Logger.tool('wait_and_scroll', 'completed', duration, {
        waitTime,
        scrollTimes,
        scrollDelay,
        finalScrollHeight: pageInfo.scrollHeight,
        videosFound: pageInfo.videos
      });

      return {
        success: true,
        pageInfo,
        message: `Waited ${waitTime}ms and scrolled ${scrollTimes} times. Found ${pageInfo.videos} video elements.`
      };

    } catch (error) {
      const duration = timer.end();

      // Hide loader on error
      if (global.page) {
        await BrowserUIAnimator.hideLoader(global.page);
      }

      Logger.tool('wait_and_scroll', 'failed', duration, {
        error: error.message,
        waitTime,
        scrollTimes
      });
      throw error;
    }
  }
});

export default waitAndScrollTool;