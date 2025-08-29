// Browser UI Animation Helper Class
class BrowserUIAnimator {
  static async injectAnimationCSS(page) {
    await page.addStyleTag({
      content: `
        /* Automation Visual Indicators */
        .automation-highlight {
          position: absolute;
          border: 3px solid #ff6b6b;
          border-radius: 8px;
          background: rgba(255, 107, 107, 0.1);
          pointer-events: none;
          z-index: 999999;
          animation: highlight-pulse 1s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }
        
        .automation-click-indicator {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #4ecdc4;
          border-radius: 50%;
          background: rgba(78, 205, 196, 0.2);
          pointer-events: none;
          z-index: 999999;
          animation: click-ripple 0.8s ease-out;
          transform: translate(-50%, -50%);
        }
        
        .automation-typing-indicator {
          position: absolute;
          background: #45b7d1;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: Arial, sans-serif;
          pointer-events: none;
          z-index: 999999;
          animation: typing-bounce 0.5s ease-in-out infinite alternate;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .automation-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 4px;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
          z-index: 999999;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
        
        .automation-status-badge {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 15px;
          border-radius: 25px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          z-index: 999999;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: status-fade-in 0.3s ease-in;
        }
        
        @keyframes highlight-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        
        @keyframes click-ripple {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(3); }
        }
        
        @keyframes typing-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-3px); }
        }
        
        @keyframes status-fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .automation-element-label {
          position: absolute;
          background: #2c3e50;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-family: Arial, sans-serif;
          pointer-events: none;
          z-index: 999999;
          white-space: nowrap;
        }
      `
    });
  }

  static async showProgressBar(page, progress, status) {
    await page.evaluate(({ progress, status }) => {
      // Remove existing progress bar
      const existing = document.querySelector('.automation-progress-bar');
      if (existing) existing.remove();

      // Create new progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'automation-progress-bar';
      progressBar.style.width = `${progress}%`;
      document.body.appendChild(progressBar);
    }, { progress, status });
  }

  static async showStatusBadge(page, status) {
    await page.evaluate((status) => {
      const existing = document.querySelector('.automation-status-badge');
      if (existing) existing.remove();

      const badge = document.createElement('div');
      badge.className = 'automation-status-badge';
      badge.textContent = `🤖 ${status}`;
      document.body.appendChild(badge);
    }, status);
  }

  static async highlightElement(page, x, y, label = '') {
    await page.evaluate(({ x, y, label }) => {
      const highlight = document.createElement('div');
      highlight.className = 'automation-highlight';
      
      // Position the highlight
      const element = document.elementFromPoint(x, y);
      if (element) {
        const rect = element.getBoundingClientRect();
        highlight.style.left = `${rect.left - 5}px`;
        highlight.style.top = `${rect.top - 5}px`;
        highlight.style.width = `${rect.width + 10}px`;
        highlight.style.height = `${rect.height + 10}px`;
      }

      document.body.appendChild(highlight);

      // Add label if provided
      if (label) {
        const labelEl = document.createElement('div');
        labelEl.className = 'automation-element-label';
        labelEl.textContent = label;
        labelEl.style.left = `${x + 10}px`;
        labelEl.style.top = `${y - 25}px`;
        document.body.appendChild(labelEl);

        setTimeout(() => labelEl.remove(), 2000);
      }

      // Remove highlight after animation
      setTimeout(() => highlight.remove(), 3000);
    }, { x, y, label });
  }

  static async showClickAnimation(page, x, y) {
    await page.evaluate(({ x, y }) => {
      const clickIndicator = document.createElement('div');
      clickIndicator.className = 'automation-click-indicator';
      clickIndicator.style.left = `${x}px`;
      clickIndicator.style.top = `${y}px`;
      document.body.appendChild(clickIndicator);

      setTimeout(() => clickIndicator.remove(), 800);
    }, { x, y });
  }

  static async showTypingAnimation(page, x, y, text) {
    await page.evaluate(({ x, y, text }) => {
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'automation-typing-indicator';
      typingIndicator.textContent = `✍️ Typing: ${text.substring(0, 20)}...`;
      typingIndicator.style.left = `${x + 10}px`;
      typingIndicator.style.top = `${y - 35}px`;
      document.body.appendChild(typingIndicator);

      setTimeout(() => typingIndicator.remove(), 2000);
    }, { x, y, text });
  }

  static async clearAllAnimations(page) {
    await page.evaluate(() => {
      document.querySelectorAll('.automation-highlight, .automation-click-indicator, .automation-typing-indicator, .automation-element-label').forEach(el => el.remove());
    });
  }

  // Show loader/spinner
  static async showLoader(page, message = 'Processing...') {
    await page.evaluate(({ message }) => {
      // Remove existing loader
      const existing = document.querySelector('#automation-loader');
      if (existing) existing.remove();

      const loader = document.createElement('div');
      loader.id = 'automation-loader';
      loader.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loader-text">${message}</div>
      `;
      loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 30px;
        border-radius: 15px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
        font-weight: 500;
        text-align: center;
        z-index: 10003;
        backdrop-filter: blur(10px);
        animation: loaderFadeIn 0.3s ease-out;
      `;

      // Add spinner styles if not already present
      if (!document.querySelector('#loader-styles')) {
        const style = document.createElement('style');
        style.id = 'loader-styles';
        style.textContent = `
          .loader-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #2196F3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
          }
          .loader-text {
            color: #fff;
            font-size: 14px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loaderFadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes loaderFadeOut {
            from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(loader);
    }, { message });
  }

  // Hide loader
  static async hideLoader(page) {
    await page.evaluate(() => {
      const loader = document.querySelector('#automation-loader');
      if (loader) {
        loader.style.animation = 'loaderFadeOut 0.3s ease-in forwards';
        setTimeout(() => loader.remove(), 300);
      }
    });
  }
}

export default BrowserUIAnimator;
