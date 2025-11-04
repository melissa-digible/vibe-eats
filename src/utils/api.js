// Yelp Fusion API helper
// Get your API key from: https://www.yelp.com/developers/v3/manage_app

const YELP_API_KEY = import.meta.env.VITE_YELP_API_KEY || ''
const YELP_BASE_URL = 'https://api.yelp.com/v3'

// Map our cuisine types to Yelp categories
const CUISINE_TO_YELP = {
  'Italian': 'italian',
  'Mexican': 'mexican',
  'Asian': 'asianfusion',
  'American': 'tradamerican',
  'Mediterranean': 'mediterranean',
  'Indian': 'indpak',
  'Thai': 'thai',
  'Japanese': 'japanese',
  'French': 'french',
  'BBQ': 'bbq',
  'Pizza': 'pizza',
  'Burgers': 'burgers'
}

// Map our price ranges to Yelp price levels
const PRICE_TO_YELP = {
  'budget': '1',
  'moderate': '2',
  'splurge': '3,4'
}

// Map vibes to Yelp attributes
const VIBE_TO_YELP_ATTRIBUTES = {
  'chill': 'restaurants',
  'adventurous': 'restaurants',
  'fancy': 'upscale',
  'comfort': 'comfortfood',
  'healthy': 'healthy',
  'party': 'bars',
  'cozy': 'coffee',
  'quick': 'fastfood'
}

export async function searchRestaurants(location, preferences = {}) {
  if (!YELP_API_KEY) {
    // Fallback to mock data if no API key
    return getMockRestaurants(location, preferences)
  }

  try {
    const { latitude, longitude } = location
    const { cuisine, price, vibe, avoidBusy } = preferences

    // Build search parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: '10000', // 10km radius
      limit: '20',
      sort_by: 'rating'
    })

    // Add category filter
    if (cuisine && CUISINE_TO_YELP[cuisine]) {
      params.append('categories', CUISINE_TO_YELP[cuisine])
    } else {
      params.append('categories', 'restaurants')
    }

    // Add price filter
    if (price && PRICE_TO_YELP[price]) {
      params.append('price', PRICE_TO_YELP[price])
    }

    // Add attributes based on vibe
    if (vibe && VIBE_TO_YELP_ATTRIBUTES[vibe]) {
      params.append('attributes', VIBE_TO_YELP_ATTRIBUTES[vibe])
    }

    const response = await fetch(`${YELP_BASE_URL}/businesses/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Yelp API error')
    }

    const data = await response.json()
    let businesses = data.businesses || []

    // Filter by busy times if requested
    if (avoidBusy) {
      businesses = filterByBusyTimes(businesses)
    }

    // Get full business details for menu URLs and more photos
    const businessesWithDetails = await Promise.all(
      businesses.map(async (business) => {
        try {
          const detailResponse = await fetch(`${YELP_BASE_URL}/businesses/${business.id}`, {
            headers: {
              'Authorization': `Bearer ${YELP_API_KEY}`
            }
          })
          
          if (detailResponse.ok) {
            const details = await detailResponse.json()
            return {
              ...business,
              photos: details.photos || business.photos || [],
              menuUrl: details.menu_url || null,
              transactionTypes: details.transactions || []
            }
          }
          return business
        } catch (error) {
          console.error(`Error fetching details for ${business.id}:`, error)
          return business
        }
      })
    )

    return businessesWithDetails.map(business => {
      // Ensure we have at least the main image if photos array is empty
      const photos = business.photos && business.photos.length > 0 
        ? business.photos 
        : (business.image_url ? [business.image_url] : [])
      
      return {
        id: business.id,
        name: business.name,
        image: business.image_url || business.image || null,
        rating: business.rating,
        reviewCount: business.review_count,
        price: business.price,
        location: {
          address: business.location.display_address.join(', '),
          city: business.location.city,
          state: business.location.state
        },
        phone: business.display_phone,
        url: business.url,
        photos: photos,
        menuUrl: business.menuUrl || null,
        categories: business.categories.map(c => c.title),
        coordinates: {
          latitude: business.coordinates.latitude,
          longitude: business.coordinates.longitude
        },
        isClosed: business.is_closed,
        distance: business.distance
      }
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    // Fallback to mock data on error
    return getMockRestaurants(location, preferences)
  }
}

export async function getRestaurantReviews(businessId) {
  if (!YELP_API_KEY || !businessId) {
    return getMockReviews()
  }

  try {
    const response = await fetch(`${YELP_BASE_URL}/businesses/${businessId}/reviews`, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Yelp API error')
    }

    const data = await response.json()
    return (data.reviews || []).map(review => ({
      id: review.id,
      text: review.text,
      rating: review.rating,
      user: review.user.name,
      timeCreated: review.time_created,
      url: review.url
    }))
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return getMockReviews()
  }
}

function filterByBusyTimes(businesses) {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday

  // Typical busy times: 12-1pm (lunch), 6-8pm (dinner), weekends
  const isBusyTime = 
    (currentHour >= 12 && currentHour <= 13) || // Lunch rush
    (currentHour >= 18 && currentHour <= 20) || // Dinner rush
    (currentDay === 0 || currentDay === 6)      // Weekends

  if (isBusyTime) {
    // Filter to show only restaurants that might be less busy
    // We'll prioritize restaurants with lower review counts (less popular = less busy)
    return businesses.sort((a, b) => a.review_count - b.review_count).slice(0, 10)
  }

  return businesses
}

// Mock data for development/testing
function getMockRestaurants(location, preferences) {
  const mockRestaurants = [
    {
      id: '1',
      name: 'The Cozy Corner',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      rating: 4.5,
      reviewCount: 234,
      price: '$$',
      location: {
        address: '123 Main St',
        city: location.city || 'Your City',
        state: location.state || 'Your State'
      },
      phone: '(555) 123-4567',
      url: '#',
      menuUrl: 'https://example.com/menu',
      photos: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
      ],
      categories: ['Italian', 'Restaurants'],
      coordinates: location,
      isClosed: false,
      distance: 500
    },
    {
      id: '2',
      name: 'Spice Route',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      rating: 4.8,
      reviewCount: 456,
      price: '$$$',
      location: {
        address: '456 Oak Ave',
        city: location.city || 'Your City',
        state: location.state || 'Your State'
      },
      phone: '(555) 234-5678',
      url: '#',
      menuUrl: 'https://example.com/menu',
      photos: [
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800'
      ],
      categories: ['Indian', 'Restaurants'],
      coordinates: location,
      isClosed: false,
      distance: 1200
    },
    {
      id: '3',
      name: 'Burger Junction',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      rating: 4.3,
      reviewCount: 189,
      price: '$',
      location: {
        address: '789 Pine St',
        city: location.city || 'Your City',
        state: location.state || 'Your State'
      },
      phone: '(555) 345-6789',
      url: '#',
      menuUrl: 'https://example.com/menu',
      photos: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
        'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800'
      ],
      categories: ['Burgers', 'Fast Food'],
      coordinates: location,
      isClosed: false,
      distance: 800
    }
  ]

  return mockRestaurants
}

function getMockReviews() {
  return [
    {
      id: '1',
      text: 'Amazing food and great atmosphere! The service was excellent and the prices were reasonable. Highly recommend!',
      rating: 5,
      user: 'Sarah M.',
      timeCreated: '2024-01-15 14:30:00',
      url: '#'
    },
    {
      id: '2',
      text: 'Really enjoyed my meal here. The portions were generous and everything tasted fresh. Will definitely come back.',
      rating: 4,
      user: 'John D.',
      timeCreated: '2024-01-14 19:45:00',
      url: '#'
    },
    {
      id: '3',
      text: 'Great place for a casual dinner. The ambiance is nice and the staff is friendly. Food came out quickly too!',
      rating: 4,
      user: 'Emily R.',
      timeCreated: '2024-01-13 12:20:00',
      url: '#'
    }
  ]
}

// Map restaurant categories/cuisines to recipe search terms
const CUISINE_TO_RECIPE_SEARCH = {
  'Italian': 'pasta',
  'Mexican': 'mexican',
  'Asian': 'asian',
  'American': 'american',
  'Mediterranean': 'mediterranean',
  'Indian': 'indian',
  'Thai': 'thai',
  'Japanese': 'japanese',
  'French': 'french',
  'BBQ': 'barbecue',
  'Pizza': 'pizza',
  'Burgers': 'burger',
  'Fast Food': 'burger',
  'Restaurants': 'dinner'
}

// Get search term from restaurant categories
function getRecipeSearchTerm(categories) {
  if (!categories || categories.length === 0) {
    return 'dinner'
  }

  // Try to match categories to known cuisines
  for (const category of categories) {
    const categoryLower = category.toLowerCase()
    for (const [cuisine, searchTerm] of Object.entries(CUISINE_TO_RECIPE_SEARCH)) {
      if (categoryLower.includes(cuisine.toLowerCase()) || cuisine.toLowerCase().includes(categoryLower)) {
        return searchTerm
      }
    }
  }

  // Default to first category or 'dinner'
  return categories[0].toLowerCase() || 'dinner'
}

// Fetch recipes based on restaurant categories
export async function getRecipesForRestaurant(restaurant) {
  if (!restaurant || !restaurant.categories) {
    return getMockRecipes()
  }

  try {
    const searchTerm = getRecipeSearchTerm(restaurant.categories)
    
    // Try TheMealDB API first (free, no API key needed)
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.meals && data.meals.length > 0) {
          // Limit to 6 recipes
          return data.meals.slice(0, 6).map(meal => ({
            id: meal.idMeal,
            name: meal.strMeal,
            image: meal.strMealThumb,
            instructions: meal.strInstructions || '',
            category: meal.strCategory || '',
            area: meal.strArea || '',
            ingredients: extractIngredients(meal),
            source: meal.strSource || `https://www.google.com/search?q=${encodeURIComponent(meal.strMeal + ' recipe')}`,
            youtube: meal.strYoutube || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching from TheMealDB:', error)
    }

    // Fallback to mock recipes
    return getMockRecipes(searchTerm)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return getMockRecipes()
  }
}

// Extract ingredients from TheMealDB meal object
function extractIngredients(meal) {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      })
    }
  }
  return ingredients
}

// Mock recipes for fallback
function getMockRecipes(cuisine = 'dinner') {
  const mockRecipes = {
    italian: [
      {
        id: 'mock-1',
        name: 'Classic Spaghetti Carbonara',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600',
        category: 'Italian',
        area: 'Italian',
        instructions: 'Cook pasta, mix with eggs, cheese, and pancetta. Serve hot.',
        ingredients: [
          { name: 'Spaghetti', measure: '400g' },
          { name: 'Eggs', measure: '4' },
          { name: 'Parmesan', measure: '100g' },
          { name: 'Pancetta', measure: '200g' }
        ],
        source: 'https://example.com/carbonara',
        youtube: ''
      },
      {
        id: 'mock-2',
        name: 'Homemade Margherita Pizza',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
        category: 'Italian',
        area: 'Italian',
        instructions: 'Make dough, add tomato sauce, mozzarella, and fresh basil. Bake at 475°F.',
        ingredients: [
          { name: 'Pizza dough', measure: '1 ball' },
          { name: 'Tomato sauce', measure: '1 cup' },
          { name: 'Mozzarella', measure: '200g' },
          { name: 'Fresh basil', measure: '10 leaves' }
        ],
        source: 'https://example.com/pizza',
        youtube: ''
      }
    ],
    mexican: [
      {
        id: 'mock-3',
        name: 'Authentic Chicken Tacos',
        image: 'https://images.unsplash.com/photo-1565299585323-38174c37b73a?w=600',
        category: 'Mexican',
        area: 'Mexican',
        instructions: 'Season and cook chicken, warm tortillas, add toppings. Serve with lime.',
        ingredients: [
          { name: 'Chicken breast', measure: '500g' },
          { name: 'Corn tortillas', measure: '8' },
          { name: 'Onion', measure: '1' },
          { name: 'Cilantro', measure: '1/4 cup' },
          { name: 'Lime', measure: '2' }
        ],
        source: 'https://example.com/tacos',
        youtube: ''
      },
      {
        id: 'mock-4',
        name: 'Homemade Guacamole',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600',
        category: 'Mexican',
        area: 'Mexican',
        instructions: 'Mash avocados, mix with lime, onion, cilantro, and salt. Serve immediately.',
        ingredients: [
          { name: 'Avocados', measure: '3' },
          { name: 'Lime', measure: '1' },
          { name: 'Red onion', measure: '1/4 cup' },
          { name: 'Cilantro', measure: '2 tbsp' },
          { name: 'Salt', measure: 'to taste' }
        ],
        source: 'https://example.com/guacamole',
        youtube: ''
      }
    ],
    indian: [
      {
        id: 'mock-5',
        name: 'Butter Chicken (Murgh Makhani)',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d29b?w=600',
        category: 'Indian',
        area: 'Indian',
        instructions: 'Marinate chicken, cook with spices, add tomato sauce and cream. Serve with rice.',
        ingredients: [
          { name: 'Chicken', measure: '500g' },
          { name: 'Yogurt', measure: '1/2 cup' },
          { name: 'Tomato sauce', measure: '1 cup' },
          { name: 'Heavy cream', measure: '1/2 cup' },
          { name: 'Garam masala', measure: '1 tbsp' }
        ],
        source: 'https://example.com/butter-chicken',
        youtube: ''
      }
    ],
    default: [
      {
        id: 'mock-6',
        name: 'Classic Burger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
        category: 'American',
        area: 'American',
        instructions: 'Form patties, grill to desired doneness, assemble with bun and toppings.',
        ingredients: [
          { name: 'Ground beef', measure: '500g' },
          { name: 'Burger buns', measure: '4' },
          { name: 'Lettuce', measure: '4 leaves' },
          { name: 'Tomato', measure: '1' },
          { name: 'Cheese', measure: '4 slices' }
        ],
        source: 'https://example.com/burger',
        youtube: ''
      },
      {
        id: 'mock-7',
        name: 'Grilled Salmon',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
        category: 'Main Course',
        area: 'International',
        instructions: 'Season salmon, grill for 4-5 minutes per side. Serve with vegetables.',
        ingredients: [
          { name: 'Salmon fillets', measure: '4' },
          { name: 'Lemon', measure: '1' },
          { name: 'Olive oil', measure: '2 tbsp' },
          { name: 'Salt and pepper', measure: 'to taste' }
        ],
        source: 'https://example.com/salmon',
        youtube: ''
      }
    ]
  }

  const cuisineLower = cuisine.toLowerCase()
  if (mockRecipes[cuisineLower]) {
    return mockRecipes[cuisineLower]
  }
  return mockRecipes.default
}

