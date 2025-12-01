# Quick Start Guide

Get Agri-Chat running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- AWS Account with Bedrock access
- AWS CLI configured (`aws configure`)

## Steps

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd agri-chat-box
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for most cases)
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Open in browser**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

5. **Upload and ask!**
   - Click upload button
   - Select a document
   - Ask questions!

## First-Time AWS Bedrock Users

If you get access errors:

1. Visit: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/playgrounds/chat
2. Select Claude 3 Sonnet
3. Send a test message
4. Fill form if prompted

That's it! 🎉

## Need Help?

- See [RUN.md](RUN.md) for detailed instructions
- See [SETUP.md](SETUP.md) for troubleshooting
- Check [docs/](docs/) for architecture and API docs
