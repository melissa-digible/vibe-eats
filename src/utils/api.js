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

    return businessesWithDetails.map(business => ({
      id: business.id,
      name: business.name,
      image: business.image_url,
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
      photos: business.photos || [],
      menuUrl: business.menuUrl || null,
      categories: business.categories.map(c => c.title),
      coordinates: {
        latitude: business.coordinates.latitude,
        longitude: business.coordinates.longitude
      },
      isClosed: business.is_closed,
      distance: business.distance
    }))
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

