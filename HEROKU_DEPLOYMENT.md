# Heroku Deployment Guide

This guide will walk you through deploying the ResponseReady app to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://www.heroku.com) (free tier available)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your code is committed to Git

## Step 1: Install Heroku CLI

### macOS
```bash
brew tap heroku/brew && brew install heroku
```

### Windows
Download and run the installer from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

### Linux
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

## Step 2: Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

## Step 3: Create a Heroku App

From your project directory:

```bash
heroku create your-app-name
```

Replace `your-app-name` with your desired app name (must be unique). If you don't specify a name, Heroku will generate one for you.

## Step 4: Set Environment Variables

Set the required environment variables on Heroku:

```bash
# ElevenLabs API (for Voice Practice feature)
heroku config:set NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
heroku config:set NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# OpenAI API (for AI Feedback feature)
heroku config:set NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: These are optional - the app will work without them, but Voice Practice and AI Feedback features won't function.

## Step 5: Deploy to Heroku

### Option A: Deploy via Git (Recommended)

```bash
# Add Heroku remote (if not already added)
git remote add heroku https://git.heroku.com/your-app-name.git

# Push to Heroku
git push heroku main
```

If your default branch is `master` instead of `main`:
```bash
git push heroku master
```

### Option B: Deploy via Heroku CLI

```bash
heroku git:remote -a your-app-name
git push heroku main
```

## Step 6: Open Your App

```bash
heroku open
```

Or visit: `https://your-app-name.herokuapp.com`

## Step 7: View Logs (Optional)

To monitor your app:

```bash
heroku logs --tail
```

## Updating Your App

After making changes:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. Push to Heroku:
   ```bash
   git push heroku main
   ```

## Managing Environment Variables

### View all config vars:
```bash
heroku config
```

### Set a config var:
```bash
heroku config:set VARIABLE_NAME=value
```

### Remove a config var:
```bash
heroku config:unset VARIABLE_NAME
```

## Scaling Your App

### View current dyno status:
```bash
heroku ps
```

### Scale up (if needed):
```bash
heroku ps:scale web=1
```

## Troubleshooting

### Build Fails

1. Check build logs:
   ```bash
   heroku logs --tail
   ```

2. Common issues:
   - **Missing dependencies**: Ensure all dependencies are in `package.json`
   - **TypeScript errors**: Fix any TypeScript compilation errors
   - **Environment variables**: Ensure all required env vars are set

### App Crashes

1. Check runtime logs:
   ```bash
   heroku logs --tail
   ```

2. Common issues:
   - **Port binding**: Next.js should automatically use Heroku's PORT (already configured)
   - **Memory limits**: Free tier has 512MB RAM limit
   - **API keys**: Verify environment variables are set correctly

### App Not Loading

1. Check if the app is running:
   ```bash
   heroku ps
   ```

2. Restart the app:
   ```bash
   heroku restart
   ```

## Heroku Free Tier Limitations

- **Sleeping**: Apps on the free tier sleep after 30 minutes of inactivity
- **Memory**: 512MB RAM limit
- **Dyno Hours**: 550 free dyno hours per month (shared across all apps)
- **HTTPS**: Included by default

## Production Considerations

### 1. Custom Domain (Optional)

```bash
heroku domains:add www.yourdomain.com
```

Then configure DNS to point to your Heroku app.

### 2. Database (If Needed)

For production, consider adding a database:
- **PostgreSQL**: `heroku addons:create heroku-postgresql:mini`
- **MongoDB**: `heroku addons:create mongolab:sandbox`

### 3. Monitoring

Add monitoring addons:
- **Logentries**: `heroku addons:create logentries:le_tryit`
- **New Relic**: `heroku addons:create newrelic:wayne`

### 4. SSL/HTTPS

HTTPS is enabled by default on Heroku. No additional configuration needed.

## Security Notes

1. **API Keys**: Never commit API keys to Git. Always use Heroku config vars.
2. **Environment Variables**: All `NEXT_PUBLIC_*` variables are exposed to the client. For sensitive keys, consider using a backend proxy.
3. **HTTPS**: Heroku provides HTTPS by default - use it!

## Cost Estimation

- **Free Tier**: $0/month (with limitations)
- **Hobby Tier**: $7/month (no sleeping, better performance)
- **Standard Tier**: $25/month (better performance, more resources)

## Additional Resources

- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Heroku CLI Reference](https://devcenter.heroku.com/articles/heroku-cli-commands)

## Quick Reference

```bash
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open

# Restart app
heroku restart
```

