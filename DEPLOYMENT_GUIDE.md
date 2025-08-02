# Deployment Guide - Salesforce Integration Fix

## Issue Fixed
The app was trying to connect to `localhost:3001` in production, which caused Salesforce appointments to not show up. This has been fixed by:

1. **Created a Netlify serverless function** (`netlify/functions/sendToSalesforce.js`) to handle Salesforce API calls in production
2. **Updated the frontend code** to use the correct API endpoint based on environment
3. **Added proper CORS headers** for cross-origin requests

## Environment Variables Setup

### For Netlify Deployment

You need to set these environment variables in your Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

```
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_salesforce_security_token
```

### For Local Development

Create a `.env.local` file in the root directory:

```
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_salesforce_security_token
```

## How It Works Now

### Development Mode
- Uses `http://localhost:3001/api/sendToSalesforce` (your local server)
- Runs the Express server from `server.cjs`

### Production Mode
- Uses `/.netlify/functions/sendToSalesforce` (Netlify serverless function)
- No need for a separate server

## Deployment Steps

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Fix Salesforce integration for production"
   git push
   ```

2. **Deploy to Netlify:**
   - If using Git integration: The deployment will happen automatically
   - If using CLI: `netlify deploy --prod`

3. **Set environment variables in Netlify dashboard** (see above)

4. **Test the deployment:**
   - Go to your Netlify site
   - Try creating an appointment
   - Check if it appears in Salesforce

## Troubleshooting

### If appointments still don't appear in Salesforce:

1. **Check Netlify function logs:**
   - Go to your Netlify dashboard
   - Navigate to **Functions** tab
   - Look for any errors in the `sendToSalesforce` function

2. **Verify environment variables:**
   - Make sure all Salesforce credentials are set correctly
   - Check that the security token is included

3. **Test the function directly:**
   - Visit `https://your-site.netlify.app/.netlify/functions/sendToSalesforce`
   - You should see a "Method not allowed" error (which is expected for GET requests)

### If you see CORS errors:

The function includes proper CORS headers, but if you still see issues:
- Check that the function is deployed correctly
- Verify the redirect rule in `netlify.toml` is working

## Files Changed

- `src/components/ScheduleScript.jsx` - Updated API endpoint logic
- `netlify/functions/sendToSalesforce.js` - New serverless function
- `netlify/functions/package.json` - Dependencies for the function
- `netlify.toml` - Added redirect rule

## Next Steps

After deploying:

1. Test the appointment creation flow
2. Verify appointments appear in Salesforce
3. Check the Netlify function logs for any errors
4. Monitor the application for any issues

The fix ensures that your app will work correctly in both development and production environments. 