# Setting Up Yelp API for Real Restaurant Data

## Step 1: Get Your Yelp Fusion API Key

1. **Go to Yelp Developers:**
   - Visit: https://www.yelp.com/developers/v3/manage_app
   - Sign in with your Yelp account (or create one if needed)

2. **Create a New App:**
   - Click "Create App" or "Get Started"
   - Fill in the app details:
     - App Name: "Vibe Eats" (or any name you prefer)
     - Industry: Select "Consumer"
     - Description: "Restaurant recommendation app based on user vibes"
   - Accept the Terms of Service

3. **Copy Your API Key:**
   - After creating the app, you'll see your API Key
   - **Copy this key** - you'll need it in the next step
   - It will look something like: `abc123xyz789...`

## Step 2: Create Environment File

1. **Create a `.env` file in the root directory:**
   ```bash
   # In your project root directory
   touch .env
   ```

2. **Add your API key to the file:**
   Open `.env` and add:
   ```
   VITE_YELP_API_KEY=your_actual_api_key_here
   ```
   
   Replace `your_actual_api_key_here` with the API key you copied from Yelp.

   **Example:**
   ```
   VITE_YELP_API_KEY=abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567
   ```

## Step 3: Restart Your Development Server

1. **Stop your current dev server** (if running) - Press `Ctrl+C` in the terminal

2. **Start it again:**
   ```bash
   npm run dev
   ```

   ⚠️ **Important:** Environment variables are only loaded when the server starts, so you MUST restart it after creating/updating the `.env` file.

## Step 4: Verify It's Working

1. Open your app in the browser
2. Allow location access
3. Select your vibe and preferences
4. You should now see **real restaurants** from your area instead of mock data!

## Troubleshooting

### Still seeing mock data?
- ✅ Make sure you created `.env` in the root directory (same level as `package.json`)
- ✅ Check that the variable name is exactly: `VITE_YELP_API_KEY`
- ✅ Make sure you restarted the dev server after creating the `.env` file
- ✅ Check the browser console for any API errors

### API Rate Limits
- Yelp's free tier allows 5,000 API calls per day
- If you exceed this, you'll see errors - wait 24 hours or upgrade your plan

### Security Note
- The `.env` file is already in `.gitignore` so your API key won't be committed to GitHub
- Never share your API key publicly

## That's It!

Once you've added your API key and restarted the server, your app will pull real restaurant data from Yelp! 🎉

