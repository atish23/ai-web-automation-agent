#!/bin/bash

echo "🤖 AI Web Automation Agent Setup"
echo "================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    echo "   Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "🔑 Please edit .env file and add your OpenAI API key:"
    echo "   OPENAI_API_KEY=your_actual_api_key_here"
    echo ""
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo ""
else
    echo "✅ .env file exists"
fi

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Playwright browsers"
    exit 1
fi

echo "✅ Playwright browsers installed"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the AI Web Automation Agent:"
echo "   npm start"
echo ""
echo "   or"
echo ""
echo "   node ai-web-automation-agent.js"
echo ""
echo "📚 Don't forget to:"
echo "   1. Add your OpenAI API key to .env file"
echo "   2. Make sure you have sufficient OpenAI credits"
echo ""
echo "Happy automating! 🤖✨"
