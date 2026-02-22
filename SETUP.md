# Setup Guide

## Quick Fix for "Failed to load design system" Error

If you're seeing this error when trying to generate a new design system, it's because the API keys aren't configured. Follow these steps:

### 1. Create .env file

Create a `.env` file in the project root:

```bash
cp env.example .env
```

### 2. Add your API keys

Edit the `.env` file and add your API keys:

```env
# Required for design generation (at least ONE of these)
OPENAI_API_KEY=sk-proj-...your-key-here...
ANTHROPIC_API_KEY=sk-ant-...your-key-here...

# Required for voice features
GEMINI_API_KEY=...your-key-here...
```

**Important:** You need at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for design system generation to work.

### 3. Restart the dev server

Stop the current dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

The server needs to be restarted to pick up the environment variables from the `.env` file.

### 4. Try again

Now navigate to the "Create New" page and try generating a design system. It should work!

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it to `OPENAI_API_KEY` in your `.env` file

### Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy it to `ANTHROPIC_API_KEY` in your `.env` file

### Google Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy it to `GEMINI_API_KEY` in your `.env` file

## Troubleshooting

### Still getting errors?

1. **Check the browser console** for detailed error messages
2. **Check the terminal** where the dev server is running for server-side errors
3. **Verify your API keys** are valid and have available credits
4. **Make sure the .env file is in the project root** (same directory as `package.json`)
5. **Restart the dev server** after making changes to `.env`

### API Key Validation

You can test if your API keys are working by checking the terminal output when the dev server starts. You should see:

```
✅ API Keys configured: { openai: 'configured', anthropic: 'configured' }
```

If you see `'missing'` for both, the server couldn't find the API keys.





