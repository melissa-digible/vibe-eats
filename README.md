# 🍽️ Vibe Eats

A fun and interactive web application that helps you decide where to eat based on your current vibe and preferences. Never say "I don't know" again when asked where you want to eat!

## Features

- **📍 Location-Based Search**: Uses your device's location to find restaurants near you
- **Vibe Selection**: Choose from 8 different moods (Chill, Adventurous, Fancy, Comfort, Healthy, Party, Cozy, Quick)
- **Cuisine Preferences**: Select your favorite cuisine type (or skip if you're open to anything)
- **Price Range**: Choose your budget preference ($, $$, $$$)
- **Atmosphere**: Select the vibe you want (Quiet, Lively, Romantic, Family-Friendly)
- **🚫 Avoid Busy Times**: Filter to show less crowded restaurants during peak hours
- **📸 Food Photos**: View beautiful photos of food from restaurants
- **⭐ Reviews**: Read customer reviews and ratings
- **Real Restaurant Data**: Integration with Yelp Fusion API for real restaurant information

## Getting Started

### Installation

```bash
npm install
```

### API Key Setup (Optional)

For real restaurant data, you can add a Yelp Fusion API key:

1. Get a free API key from [Yelp Developers](https://www.yelp.com/developers/v3/manage_app)
2. Create a `.env` file in the root directory
3. Add your API key:
   ```
   VITE_YELP_API_KEY=your_yelp_api_key_here
   ```

**Note**: The app works without an API key using mock data, but you'll get better results with real restaurant data from Yelp.

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How It Works

1. **Allow Location Access**: The app requests your location to find nearby restaurants
2. Select your current vibe from the 8 options
3. Optionally choose cuisine preferences
4. Optionally select a price range
5. Optionally choose atmosphere preferences and whether to avoid busy times
6. Browse real restaurants near you with photos, ratings, and reviews!
7. Click on any restaurant to see detailed information, photos, and customer reviews

## Tech Stack

- React 18
- Vite
- Modern CSS with gradients and animations

## License

MIT

