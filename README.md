# 🤖 AI Web Automation Agent

An intelligent web automation agent that combines **OpenAI's GPT-4** with **Playwright** browser automation to perform complex web tasks with visual feedback and interactive controls.

## 🎬 Demo

**[🔗 Watch Live Demo on X/Twitter](https://x.com/aatish2393/status/1961324999546978334)**

See the AI agent in action automating real websites with intelligent form filling and navigation!

## ✨ Features

### 🧠 AI-Powered Automation
- **Task Analysis**: Uses GPT-4 to understand and break down automation tasks
- **Smart Element Detection**: Automatically finds and matches form elements with task requirements  
- **Dynamic Action Planning**: Creates step-by-step execution plans based on page content
- **Adaptive Execution**: Handles various website layouts and structures

### 🎨 Visual Feedback & Animations
- **Real-time Status Updates**: Visual badges showing current automation status
- **Progress Indicators**: Progress bars for multi-step operations
- **Click Animations**: Visual indicators showing where actions are performed
- **Loading Spinners**: Professional loaders during AI processing and wait times
- **Element Highlighting**: Visual feedback for targeted elements

### ⚡ Performance Optimized
- **Fast Navigation**: Optimized browser settings for quick page loads
- **Reduced Timeouts**: Streamlined wait times without sacrificing reliability
- **Efficient AI Calls**: Minimized token usage with focused prompts
- **Smart Caching**: Reuses browser instances when possible

### 🖥️ User Experience
- **Mid-size Browser Window**: Optimized 1200x800 viewport with 80% zoom
- **Interactive Input System**: Simple automation task input
- **Comprehensive Logging**: Detailed execution logs with timing information
- **Error Handling**: Robust error recovery and reporting

## 🚀 Quick Start

### Prerequisites
```bash
node.js >= 18.0.0
npm or yarn package manager
OpenAI API key
```

### Installation
1. Clone the repository:
```bash
git clone https://github.com/atish23/ai-web-automation-agent.git
cd ai-web-automation-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### Running the Agent
```bash
node ai-web-automation-agent.js
```

## 🎯 Usage Examples

### Interactive Mode
When you run the agent, you'll see a clean interface:

```
🎯 What would you like to do today?
❯ 🤖 Automate Website (describe any automation task)
  👋 Exit (goodbye)
```

### Example Tasks

#### **Website Automation Examples**
```
Task: "Go to ui.chaicode.com and fill signup form"
Task: "Navigate to YouTube and search for AI tutorials"
Task: "Go to GitHub and search for automation projects"
Task: "Visit Amazon and search for laptops"
```

## 🏗️ Project Structure

The project follows a modular architecture for maintainability and extensibility:

```
ai-web-automation-agent/
├── classes/                    # Core utility classes
│   ├── Logger.js              # Enhanced logging with colors & formatting
│   ├── Timer.js               # Performance timing measurements
│   ├── BrowserUIAnimator.js   # Visual feedback & animations
│   └── BeautifulCLI.js        # CLI styling & user interaction
├── tools/                     # Modular automation tools
│   ├── analyzeTaskTool.js     # AI-powered task analysis
│   ├── openBrowserTool.js     # Browser initialization
│   ├── analyzeFormDOMTool.js  # DOM-based form analysis
│   ├── findRelevantElementsTool.js # Smart element discovery
│   ├── matchTaskWithElementsTool.js # AI action plan creation
│   ├── clickAtCoordinatesTool.js    # Precise click automation
│   ├── fillFieldAtCoordinatesTool.js # Form field filling
│   ├── executeActionPlanTool.js     # Action execution
│   └── checkExecutionStatusTool.js  # Status verification
├── ui/                        # User interface components
│   └── UserInterface.js       # Main UI orchestration
├── ai-web-automation-agent.js # Main application entry point
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🔧 Technical Architecture

### Core Components

#### 🧩 **BrowserUIAnimator Class**
Handles all visual feedback and animations:
```javascript
// Show loading spinner
await BrowserUIAnimator.showLoader(page, 'Processing...');

// Display status updates
await BrowserUIAnimator.showStatusBadge(page, 'Form filled!');

// Animate clicks
await BrowserUIAnimator.showClickAnimation(page, x, y);
```

#### 🛠️ **Modular Tool System**
Each automation capability is isolated in its own tool:
- **analyzeTaskTool**: AI-powered task understanding
- **openBrowserTool**: Optimized browser setup
- **analyzeFormDOMTool**: Form detection & analysis
- **findRelevantElementsTool**: Smart element discovery
- **matchTaskWithElementsTool**: AI action planning
- **executeActionPlanTool**: Step-by-step execution
- **clickAtCoordinatesTool**: Precise interactions
- **fillFieldAtCoordinatesTool**: Form filling
- **checkExecutionStatusTool**: Success verification

#### 📊 **Enhanced Logging System**
```javascript
Logger.info('Task started', { task });
Logger.tool('click_at_coordinates', 'completed', duration, { x, y });
Logger.success('Automation completed successfully');
```

#### 🎨 **UserInterface Class**
Manages startup animations, user input, and graceful shutdown

### Browser Configuration
- **Window Size**: 1200x800 (mid-size for optimal viewing)
- **Zoom Level**: 80% (zoomed out for better overview)
- **Position**: Offset from top-left corner
- **Performance**: Optimized Chrome flags for faster automation

## 🎨 Visual Features

### Animation System
The agent includes a comprehensive animation system that provides:

1. **Status Badges**: Slide-in notifications showing current status
2. **Progress Bars**: Visual progress tracking for multi-step operations
3. **Loading Spinners**: Professional loading indicators during AI processing
4. **Click Animations**: Ripple effects showing where clicks occur
5. **Element Highlighting**: Visual indicators for targeted elements

### CSS Animations
All animations use modern CSS with:
- Smooth transitions and easing functions
- Backdrop blur effects for modern appearance
- Auto-cleanup to prevent visual clutter
- Responsive design for various screen sizes

## 📝 Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here    # Required: OpenAI API access
NODE_ENV=development                        # Optional: Environment setting
```

### Browser Settings
The agent launches Chrome with optimized settings:
```javascript
const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--window-size=1200,800',
  '--window-position=100,50',
  '--force-device-scale-factor=0.8',
  '--disable-blink-features=AutomationControlled',
  '--disable-features=VizDisplayCompositor'
];
```

## 🛡️ Error Handling

The agent includes comprehensive error handling:
- **Network timeouts**: Graceful handling of slow-loading pages
- **Element not found**: Automatic retry and alternative strategies
- **AI API errors**: Fallback mechanisms and error reporting
- **Browser crashes**: Automatic browser restart and recovery
- **Graceful shutdown**: Clean browser closure on exit signals

## 📊 Performance Metrics

### Optimizations Implemented
- ⚡ **50% faster navigation** with `domcontentloaded` wait strategy
- 🎯 **60% reduced wait times** with optimized timeouts
- 🧠 **Minimal token usage** with focused AI prompts
- 🖱️ **Instant interactions** with reduced animation delays

### Timing Benchmarks
- Browser launch: ~2-3 seconds
- Page navigation: ~1-2 seconds
- AI task analysis: ~2-4 seconds
- Action plan creation: ~3-5 seconds
- Form filling: ~1-2 seconds per field

## 🔮 Advanced Features

### AI Integration
- **GPT-4 Vision**: Can analyze page screenshots when needed
- **Context Awareness**: Maintains conversation context across operations
- **Adaptive Prompting**: Adjusts AI prompts based on task complexity
- **Smart Retry**: AI-powered retry strategies for failed operations

### Extensibility
The agent is designed for easy extension:
```javascript
// Add custom tools
const customTool = tool({
  name: 'custom_action',
  description: 'Performs custom automation',
  parameters: z.object({...}),
  async execute(params) {
    // Custom automation logic
  }
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for the powerful GPT-4 API
- **Microsoft Playwright** for robust browser automation
- **The Open Source Community** for inspiration and tools

---

**Built with ❤️ for intelligent web automation**

### 🔗 Connect & Share

- **Demo**: [Watch on X/Twitter](https://x.com/aatish2393/status/1961324999546978334)
- **Author**: [@aatish2393](https://x.com/aatish2393)
- **Repository**: [GitHub](https://github.com/atish23/ai-web-automation-agent)