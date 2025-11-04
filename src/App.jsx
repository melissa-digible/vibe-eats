import { useState, useEffect } from 'react'
import './App.css'
import { searchRestaurants, getRestaurantReviews, getRecipesForRestaurant } from './utils/api'

const VIBES = [
  { id: 'chill', emoji: '😌', label: 'Chill & Casual', description: 'Just want to relax and enjoy' },
  { id: 'adventurous', emoji: '🌶️', label: 'Adventurous', description: 'Ready to try something new' },
  { id: 'fancy', emoji: '✨', label: 'Fancy & Special', description: 'Feeling fancy tonight' },
  { id: 'comfort', emoji: '🍜', label: 'Comfort Food', description: 'Need something familiar' },
  { id: 'healthy', emoji: '🥗', label: 'Healthy Vibes', description: 'Feeling health-conscious' },
  { id: 'party', emoji: '🎉', label: 'Party Mode', description: 'Ready to celebrate' },
  { id: 'cozy', emoji: '☕', label: 'Cozy & Warm', description: 'Want something cozy' },
  { id: 'quick', emoji: '⚡', label: 'Quick Bite', description: 'Need food fast' },
]

const CUISINES = [
  'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 
  'Indian', 'Thai', 'Japanese', 'French', 'BBQ', 'Pizza', 'Burgers'
]

const PRICE_RANGES = [
  { id: 'budget', label: '$', description: 'Budget-friendly' },
  { id: 'moderate', label: '$$', description: 'Moderate' },
  { id: 'splurge', label: '$$$', description: 'Splurge-worthy' },
]

const ATMOSPHERES = [
  { id: 'quiet', label: 'Quiet', emoji: '🔇' },
  { id: 'lively', label: 'Lively', emoji: '🎵' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
  { id: 'family', label: 'Family-Friendly', emoji: '👨‍👩‍👧‍👦' },
]

function App() {
  const [step, setStep] = useState(1)
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [selectedAtmosphere, setSelectedAtmosphere] = useState(null)
  const [avoidBusy, setAvoidBusy] = useState(false)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [similarRestaurants, setSimilarRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  
  // Tinder-style swiping state
  const [swipeMode, setSwipeMode] = useState(false)
  const [swipeRestaurants, setSwipeRestaurants] = useState([])
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0)
  const [likedRestaurants, setLikedRestaurants] = useState([])
  const [maybeRestaurants, setMaybeRestaurants] = useState([])
  const [dislikedRestaurants, setDislikedRestaurants] = useState([])
  const [loadingSwipeData, setLoadingSwipeData] = useState(false)

  // Get user location
  const getLocation = (forSwipe = false) => {
    setLoadingLocation(true)
    setLocationError(null)
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({
          latitude,
          longitude,
          city: 'Your Area',
          state: ''
        })
        setLoadingLocation(false)
        
        if (forSwipe) {
          setSwipeMode(true)
          loadSwipeRestaurants({ latitude, longitude })
        } else {
          setStep(2)
        }
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location permissions.')
        setLoadingLocation(false)
      }
    )
  }

  // Load restaurants for swiping
  const loadSwipeRestaurants = async (location) => {
    setLoadingSwipeData(true)
    try {
      // Load a diverse set of restaurants for swiping
      const results = await searchRestaurants(location, {
        cuisine: null, // No filter to get variety
        price: null,
        vibe: null,
        avoidBusy: false
      })
      
      // Filter restaurants that have at least one image (either in photos array or main image)
      const withPhotos = results.filter(r => {
        const hasPhotos = r.photos && r.photos.length > 0
        const hasImage = r.image && r.image !== 'https://via.placeholder.com/400x300' && r.image.trim() !== ''
        return hasPhotos || hasImage
      })
      
      console.log('Total results:', results.length)
      console.log('Results with photos/images:', withPhotos.length)
      console.log('Sample restaurant:', results[0])
      
      // If we have restaurants with images, use them
      if (withPhotos.length > 0) {
        setSwipeRestaurants(withPhotos.slice(0, 30)) // Limit to 30 for swiping
        setCurrentSwipeIndex(0)
        setStep(9) // Step 9 = Tinder-style swiping
      } else if (results.length > 0) {
        // If no restaurants with photos, still show restaurants but with fallback images
        console.log('No restaurants with photos, using all restaurants with fallbacks')
        setSwipeRestaurants(results.slice(0, 20)) // Take up to 20 restaurants
        setCurrentSwipeIndex(0)
        setStep(9)
      } else {
        // No restaurants found at all
        setSwipeRestaurants([])
        setStep(9)
      }
    } catch (error) {
      console.error('Error loading swipe restaurants:', error)
      setLocationError('Error loading restaurants. Please try again.')
      setLoadingSwipeData(false)
    } finally {
      setLoadingSwipeData(false)
    }
  }

  // Handle swipe actions
  const handleSwipe = (action) => {
    if (currentSwipeIndex >= swipeRestaurants.length) return
    
    const currentRestaurant = swipeRestaurants[currentSwipeIndex]
    
    if (action === 'like') {
      setLikedRestaurants([...likedRestaurants, currentRestaurant])
    } else if (action === 'maybe') {
      setMaybeRestaurants([...maybeRestaurants, currentRestaurant])
    } else if (action === 'dislike') {
      setDislikedRestaurants([...dislikedRestaurants, currentRestaurant])
    }
    
    // Move to next restaurant
    if (currentSwipeIndex < swipeRestaurants.length - 1) {
      setCurrentSwipeIndex(currentSwipeIndex + 1)
    } else {
      // No more restaurants, show recommendations
      showSwipeRecommendations()
    }
  }

  // Show recommendations based on swipe preferences
  const showSwipeRecommendations = async () => {
    setLoading(true)
    try {
      // Create sets of IDs for filtering
      const likedIds = new Set(likedRestaurants.map(r => r.id))
      const maybeIds = new Set(maybeRestaurants.map(r => r.id))
      const dislikedIds = new Set(dislikedRestaurants.map(r => r.id))
      
      // Combine liked and maybe restaurants as our base
      const preferredRestaurants = [...likedRestaurants, ...maybeRestaurants]
      
      // Analyze liked restaurants to determine preferences for finding similar ones
      const likedCuisines = new Set()
      const likedPrices = new Set()
      
      likedRestaurants.forEach(r => {
        r.categories?.forEach(cat => {
          CUISINES.forEach(c => {
            if (cat.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(cat.toLowerCase())) {
              likedCuisines.add(c)
            }
          })
        })
        if (r.price) {
          if (r.price.length === 1) likedPrices.add('budget')
          else if (r.price.length === 2) likedPrices.add('moderate')
          else if (r.price.length >= 3) likedPrices.add('splurge')
        }
      })
      
      // Get most common preferences
      const preferredCuisine = likedCuisines.size > 0 ? Array.from(likedCuisines)[0] : null
      const preferredPrice = likedPrices.size > 0 ? Array.from(likedPrices)[0] : null
      
      // Search for similar restaurants
      const similarResults = await searchRestaurants(location, {
        cuisine: preferredCuisine,
        price: preferredPrice,
        vibe: null,
        avoidBusy: false
      })
      
      // Filter out disliked restaurants and duplicates
      const filtered = similarResults.filter(r => {
        // Exclude disliked restaurants
        if (dislikedIds.has(r.id)) return false
        // Exclude already liked/maybe restaurants (we'll add them separately)
        if (likedIds.has(r.id) || maybeIds.has(r.id)) return false
        return true
      })
      
      // Combine: preferred restaurants first, then similar ones
      // Prioritize liked over maybe, then by rating
      const sortedPreferred = preferredRestaurants.sort((a, b) => {
        const aLiked = likedIds.has(a.id) ? 1 : 0
        const bLiked = likedIds.has(b.id) ? 1 : 0
        if (aLiked !== bLiked) return bLiked - aLiked
        return (b.rating || 0) - (a.rating || 0)
      })
      
      // Sort similar restaurants by rating
      const sortedSimilar = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      
      // Combine: preferred first, then similar (limit similar to top 10)
      const finalResults = [...sortedPreferred, ...sortedSimilar.slice(0, 10)]
      
      setRestaurants(finalResults)
      setStep(6)
    } catch (error) {
      console.error('Error showing recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search for restaurants
  const searchForRestaurants = async () => {
    if (!location) return

    setLoading(true)
    try {
      const results = await searchRestaurants(location, {
        cuisine: selectedCuisine,
        price: selectedPrice,
        vibe: selectedVibe,
        avoidBusy
      })
      setRestaurants(results)
      setStep(6)
    } catch (error) {
      console.error('Error searching restaurants:', error)
      setLocationError('Error searching restaurants. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load reviews for a restaurant
  const loadReviews = async (restaurantId) => {
    const restaurantReviews = await getRestaurantReviews(restaurantId)
    setReviews(restaurantReviews)
  }

  // Load recipes for a restaurant
  const loadRecipes = async (restaurant) => {
    setLoadingRecipes(true)
    try {
      const restaurantRecipes = await getRecipesForRestaurant(restaurant)
      setRecipes(restaurantRecipes)
    } catch (error) {
      console.error('Error loading recipes:', error)
      setRecipes([])
    } finally {
      setLoadingRecipes(false)
    }
  }

  // Find similar restaurants based on the selected restaurant
  const findSimilarRestaurants = async (restaurant) => {
    if (!location || !restaurant) return

    setLoadingSimilar(true)
    try {
      // Extract cuisine from restaurant categories
      const restaurantCategories = restaurant.categories || []
      let similarCuisine = null
      
      // Try to match category to our cuisine list
      for (const cat of restaurantCategories) {
        const matchedCuisine = CUISINES.find(c => 
          cat.toLowerCase().includes(c.toLowerCase()) || 
          c.toLowerCase().includes(cat.toLowerCase())
        )
        if (matchedCuisine) {
          similarCuisine = matchedCuisine
          break
        }
      }

      // Map price to our price range
      let similarPrice = null
      if (restaurant.price) {
        const priceLength = restaurant.price.length
        if (priceLength === 1) similarPrice = 'budget'
        else if (priceLength === 2) similarPrice = 'moderate'
        else if (priceLength >= 3) similarPrice = 'splurge'
      }

      // Search for similar restaurants
      const results = await searchRestaurants(location, {
        cuisine: similarCuisine,
        price: similarPrice,
        vibe: selectedVibe,
        avoidBusy
      })

      // Filter out the current restaurant and limit results
      const filtered = results
        .filter(r => r.id !== restaurant.id)
        .slice(0, 6) // Show up to 6 similar restaurants

      setSimilarRestaurants(filtered)
      setStep(8)
    } catch (error) {
      console.error('Error finding similar restaurants:', error)
    } finally {
      setLoadingSimilar(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && location) {
      setStep(2)
    } else if (step === 1 && !location) {
      getLocation()
    } else if (step === 2 && selectedVibe) {
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    } else if (step === 4) {
      setStep(5)
    } else if (step === 5) {
      searchForRestaurants()
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedVibe(null)
    setSelectedCuisine(null)
    setSelectedPrice(null)
    setSelectedAtmosphere(null)
    setAvoidBusy(false)
    setRestaurants([])
    setSelectedRestaurant(null)
    setReviews([])
    setRecipes([])
    setSwipeMode(false)
    setSwipeRestaurants([])
    setCurrentSwipeIndex(0)
    setLikedRestaurants([])
    setMaybeRestaurants([])
    setDislikedRestaurants([])
  }

  const handleSkip = () => {
    if (step === 3) {
      setSelectedCuisine(null)
    } else if (step === 4) {
      setSelectedPrice(null)
    } else if (step === 5) {
      setSelectedAtmosphere(null)
    }
    handleNext()
  }

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant)
    loadReviews(restaurant.id)
    loadRecipes(restaurant)
    setStep(7)
  }

  const formatDistance = (meters) => {
    if (!meters) return ''
    // Convert meters to feet and miles (USA standard)
    const feet = meters * 3.28084 // 1 meter = 3.28084 feet
    const miles = meters * 0.000621371 // 1 meter = 0.000621371 miles
    
    if (miles < 0.25) {
      // Less than 0.25 miles (1320 feet) - show in feet
      return `${Math.round(feet)} ft away`
    } else {
      // 0.25 miles or more - show in miles
      return `${miles.toFixed(1)} mi away`
    }
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    return (
      <div className="stars">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="star">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <span key={i} className="star empty">☆</span>
        ))}
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>🍽️ Vibe Eats</h1>
          <p className="subtitle">Find your perfect restaurant based on your vibe</p>
        </header>

        {step === 1 && (
          <div className="step">
            <h2>How would you like to find your perfect meal? 🍽️</h2>
            <p className="location-info">
              Choose your adventure style
            </p>
            
            <div className="experience-options">
              <button 
                className="experience-card swipe-option"
                onClick={() => getLocation(true)}
                disabled={loadingLocation || loadingSwipeData}
              >
                <div className="experience-emoji">💕</div>
                <h3>Swipe & Discover</h3>
                <p>Swipe through food photos and we'll learn your taste! Say "Yes!", "Maybe?", or "Nah" to pictures of real dishes.</p>
                {(loadingLocation || loadingSwipeData) && (
                  <div className="loading-text">Loading delicious options...</div>
                )}
              </button>
              
              <button 
                className="experience-card vibe-option"
                onClick={() => getLocation(false)}
                disabled={loadingLocation}
              >
                <div className="experience-emoji">✨</div>
                <h3>Vibe Selection</h3>
                <p>Tell us your mood and preferences to get personalized recommendations.</p>
                {loadingLocation && (
                  <div className="loading-text">Getting your location...</div>
                )}
              </button>
            </div>
            
            {locationError && (
              <div className="error-message">{locationError}</div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <h2>What's your vibe today?</h2>
            <div className="vibe-grid">
              {VIBES.map(vibe => (
                <button
                  key={vibe.id}
                  className={`vibe-card ${selectedVibe === vibe.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVibe(vibe.id)}
                >
                  <span className="emoji">{vibe.emoji}</span>
                  <span className="label">{vibe.label}</span>
                  <span className="description">{vibe.description}</span>
                </button>
              ))}
            </div>
            <button 
              className="btn-primary" 
              onClick={handleNext}
              disabled={!selectedVibe}
            >
              Next →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <h2>Any cuisine preference? (Optional)</h2>
            <div className="cuisine-grid">
              {CUISINES.map(cuisine => (
                <button
                  key={cuisine}
                  className={`cuisine-btn ${selectedCuisine === cuisine ? 'selected' : ''}`}
                  onClick={() => setSelectedCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleNext}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <h2>Price range? (Optional)</h2>
            <div className="price-grid">
              {PRICE_RANGES.map(price => (
                <button
                  key={price.id}
                  className={`price-card ${selectedPrice === price.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPrice(price.id)}
                >
                  <span className="price-label">{price.label}</span>
                  <span className="price-desc">{price.description}</span>
                </button>
              ))}
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleNext}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step">
            <h2>Any other preferences? (Optional)</h2>
            <div className="atmosphere-grid">
              {ATMOSPHERES.map(atmos => (
                <button
                  key={atmos.id}
                  className={`atmosphere-card ${selectedAtmosphere === atmos.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAtmosphere(atmos.id)}
                >
                  <span className="emoji">{atmos.emoji}</span>
                  <span className="label">{atmos.label}</span>
                </button>
              ))}
            </div>
            <div className="busy-time-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={avoidBusy}
                  onChange={(e) => setAvoidBusy(e.target.checked)}
                />
                <span>🚫 Avoid busy times (show less crowded places)</span>
              </label>
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleNext} disabled={loading}>
                {loading ? 'Searching...' : 'Find Restaurants 🎯'}
              </button>
            </div>
          </div>
        )}

        {step === 6 && restaurants.length > 0 && (
          <div className="step">
            <h2>🍽️ Restaurants Near You</h2>
            <p className="results-count">Found {restaurants.length} restaurants matching your vibe!</p>
            <div className="restaurants-grid">
              {restaurants.map(restaurant => (
                <div 
                  key={restaurant.id} 
                  className="restaurant-card"
                  onClick={() => handleRestaurantClick(restaurant)}
                >
                  <div className="restaurant-image-container">
                    <img 
                      src={restaurant.image || restaurant.photos?.[0] || 'https://via.placeholder.com/400x300'} 
                      alt={restaurant.name}
                      className="restaurant-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Restaurant'
                      }}
                    />
                    {restaurant.isClosed && (
                      <div className="closed-badge">Closed</div>
                    )}
                  </div>
                  <div className="restaurant-info">
                    <h3 className="restaurant-name">{restaurant.name}</h3>
                    <div className="restaurant-rating">
                      {renderStars(restaurant.rating)}
                      <span className="rating-text">{restaurant.rating}</span>
                      <span className="review-count">({restaurant.reviewCount} reviews)</span>
                    </div>
                    <div className="restaurant-details">
                      {restaurant.price && (
                        <span className="detail-badge">{restaurant.price}</span>
                      )}
                      {restaurant.categories?.slice(0, 2).map((cat, i) => (
                        <span key={i} className="detail-badge">{cat}</span>
                      ))}
                      {restaurant.distance && (
                        <span className="detail-badge">📍 {formatDistance(restaurant.distance)}</span>
                      )}
                    </div>
                    <div className="restaurant-address">{restaurant.location.address}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary large" onClick={handleReset}>
              Search Again 🔄
            </button>
          </div>
        )}

        {step === 6 && restaurants.length === 0 && !loading && (
          <div className="step">
            <div className="no-results">
              <h2>No restaurants found</h2>
              <p>Try adjusting your preferences or search again.</p>
              <button className="btn-primary" onClick={handleReset}>
                Start Over
              </button>
            </div>
          </div>
        )}

        {step === 7 && selectedRestaurant && (
          <div className="step">
            <div className="restaurant-detail">
              <button className="btn-back-detail" onClick={() => setStep(6)}>
                ← Back to Results
              </button>
              
              <div className="restaurant-detail-header">
                <h2>{selectedRestaurant.name}</h2>
                <div className="restaurant-rating-large">
                  {renderStars(selectedRestaurant.rating)}
                  <span className="rating-text-large">{selectedRestaurant.rating}</span>
                  <span className="review-count-large">({selectedRestaurant.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Photo Gallery */}
              {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 && (
                <div className="photo-gallery">
                  <h3>📸 Food Photos ({selectedRestaurant.photos.length})</h3>
                  <div className="gallery-grid">
                    {selectedRestaurant.photos.slice(0, 12).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${selectedRestaurant.name} - Photo ${index + 1}`}
                        className="gallery-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ))}
                  </div>
                  {selectedRestaurant.photos.length > 12 && (
                    <p className="more-photos-note">+ {selectedRestaurant.photos.length - 12} more photos</p>
                  )}
                </div>
              )}

              <div className="restaurant-detail-info">
                <div className="info-section">
                  <h4>📍 Location</h4>
                  <p>{selectedRestaurant.location.address}</p>
                  {selectedRestaurant.distance && (
                    <p className="distance">{formatDistance(selectedRestaurant.distance)}</p>
                  )}
                </div>

                {selectedRestaurant.phone && (
                  <div className="info-section">
                    <h4>📞 Phone</h4>
                    <p>{selectedRestaurant.phone}</p>
                  </div>
                )}

                {selectedRestaurant.categories && selectedRestaurant.categories.length > 0 && (
                  <div className="info-section">
                    <h4>🍴 Categories</h4>
                    <div className="categories-list">
                      {selectedRestaurant.categories.map((cat, i) => (
                        <span key={i} className="category-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRestaurant.price && (
                  <div className="info-section">
                    <h4>💰 Price Range</h4>
                    <p className="price-range">{selectedRestaurant.price}</p>
                  </div>
                )}

                {/* Menu Link */}
                {(selectedRestaurant.menuUrl || selectedRestaurant.name) && (
                  <div className="info-section">
                    <h4>📋 Menu</h4>
                    {selectedRestaurant.menuUrl && selectedRestaurant.menuUrl !== '#' ? (
                      <a 
                        href={selectedRestaurant.menuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="menu-link"
                      >
                        View Menu →
                      </a>
                    ) : (
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(selectedRestaurant.name + ' menu ' + selectedRestaurant.location.address)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="menu-link"
                      >
                        Search for Menu →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="reviews-section">
                <h3>⭐ Reviews</h3>
                {reviews.length > 0 ? (
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                          <div className="review-author">
                            <strong>{review.user}</strong>
                            <span className="review-date">
                              {new Date(review.timeCreated).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="review-text">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-reviews">Loading reviews...</p>
                )}
              </div>

              {/* Recipes Section */}
              <div className="recipes-section">
                <h3>🍳 Make It at Home</h3>
                <p className="recipes-intro">
                  Want to stay home instead? Try these recipes similar to what {selectedRestaurant.name} serves!
                </p>
                {loadingRecipes ? (
                  <p className="loading-recipes">Loading recipes...</p>
                ) : recipes.length > 0 ? (
                  <div className="recipes-grid">
                    {recipes.map(recipe => (
                      <div key={recipe.id} className="recipe-card">
                        <div className="recipe-image-container">
                          <img 
                            src={recipe.image} 
                            alt={recipe.name}
                            className="recipe-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Recipe'
                            }}
                          />
                          {recipe.category && (
                            <div className="recipe-category-badge">{recipe.category}</div>
                          )}
                        </div>
                        <div className="recipe-info">
                          <h4 className="recipe-name">{recipe.name}</h4>
                          {recipe.area && (
                            <p className="recipe-area">📍 {recipe.area}</p>
                          )}
                          {recipe.ingredients && recipe.ingredients.length > 0 && (
                            <div className="recipe-ingredients">
                              <strong>Key Ingredients:</strong>
                              <ul>
                                {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                                  <li key={idx}>
                                    {ing.measure ? `${ing.measure} ` : ''}{ing.name}
                                  </li>
                                ))}
                                {recipe.ingredients.length > 4 && (
                                  <li className="more-ingredients">
                                    +{recipe.ingredients.length - 4} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          <div className="recipe-actions">
                            {recipe.source && (
                              <a 
                                href={recipe.source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="recipe-link"
                              >
                                View Recipe →
                              </a>
                            )}
                            {recipe.youtube && (
                              <a 
                                href={recipe.youtube} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="recipe-link youtube-link"
                              >
                                Watch Video 🎥
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-recipes">No recipes found. Try searching online for "{selectedRestaurant.categories?.[0] || 'recipes'}"!</p>
                )}
              </div>

              <div className="external-links">
                {selectedRestaurant.url && selectedRestaurant.url !== '#' && (
                  <a 
                    href={selectedRestaurant.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary large external-link"
                  >
                    View on Yelp →
                  </a>
                )}
              </div>

              <button 
                className="btn-primary large" 
                onClick={() => findSimilarRestaurants(selectedRestaurant)}
                disabled={loadingSimilar}
                style={{ marginTop: '1rem' }}
              >
                {loadingSimilar ? 'Finding Similar Places...' : '🔍 Show Me More Like This'}
              </button>

              <button className="btn-secondary large" onClick={handleReset}>
                Find Another Restaurant
              </button>
            </div>
          </div>
        )}

        {step === 8 && similarRestaurants.length > 0 && (
          <div className="step">
            <div className="similar-restaurants">
              <button className="btn-back-detail" onClick={() => setStep(7)}>
                ← Back to Restaurant
              </button>
              
              <h2>🔍 Similar Restaurants</h2>
              <p className="similar-description">
                Here are more places similar to <strong>{selectedRestaurant?.name}</strong>
              </p>
              
              <div className="restaurants-grid">
                {similarRestaurants.map(restaurant => (
                  <div 
                    key={restaurant.id} 
                    className="restaurant-card"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="restaurant-image-container">
                      <img 
                        src={restaurant.image || restaurant.photos?.[0] || 'https://via.placeholder.com/400x300'} 
                        alt={restaurant.name}
                        className="restaurant-image"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Restaurant'
                        }}
                      />
                      {restaurant.isClosed && (
                        <div className="closed-badge">Closed</div>
                      )}
                    </div>
                    <div className="restaurant-info">
                      <h3 className="restaurant-name">{restaurant.name}</h3>
                      <div className="restaurant-rating">
                        {renderStars(restaurant.rating)}
                        <span className="rating-text">{restaurant.rating}</span>
                        <span className="review-count">({restaurant.reviewCount} reviews)</span>
                      </div>
                      <div className="restaurant-details">
                        {restaurant.price && (
                          <span className="detail-badge">{restaurant.price}</span>
                        )}
                        {restaurant.categories?.slice(0, 2).map((cat, i) => (
                          <span key={i} className="detail-badge">{cat}</span>
                        ))}
                        {restaurant.distance && (
                          <span className="detail-badge">📍 {formatDistance(restaurant.distance)}</span>
                        )}
                      </div>
                      <div className="restaurant-address">{restaurant.location.address}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="button-group" style={{ marginTop: '2rem' }}>
                <button className="btn-secondary" onClick={() => setStep(7)}>
                  ← Back to Restaurant
                </button>
                <button className="btn-primary" onClick={handleReset}>
                  Start New Search
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 8 && similarRestaurants.length === 0 && !loadingSimilar && (
          <div className="step">
            <div className="no-results">
              <button className="btn-back-detail" onClick={() => setStep(7)}>
                ← Back to Restaurant
              </button>
              <h2>No similar restaurants found</h2>
              <p>Try adjusting your preferences or search again.</p>
              <button className="btn-primary" onClick={() => setStep(7)}>
                Back to Restaurant
              </button>
            </div>
          </div>
        )}

        {/* Tinder-style Swiping Interface */}
        {step === 9 && swipeRestaurants.length > 0 && currentSwipeIndex < swipeRestaurants.length && (
          <div className="step swipe-step">
            <div className="swipe-header">
              <h2>💕 Swipe Your Way to Great Food!</h2>
              <p className="swipe-counter">
                {currentSwipeIndex + 1} of {swipeRestaurants.length} • 
                <span className="liked-count"> {likedRestaurants.length} Yes!</span> • 
                <span className="maybe-count"> {maybeRestaurants.length} Maybe?</span>
              </p>
            </div>

            <div className="swipe-container">
              {currentSwipeIndex < swipeRestaurants.length && (() => {
                const currentRestaurant = swipeRestaurants[currentSwipeIndex]
                // Try to get photo from photos array first, then main image, then fallback
                const currentPhoto = currentRestaurant.photos?.[0] || 
                                   currentRestaurant.image || 
                                   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
                
                return (
                  <div className="swipe-card">
                    <div className="swipe-image-container">
                      <img 
                        src={currentPhoto} 
                        alt={`Food from ${currentRestaurant.name}`}
                        className="swipe-image"
                        onError={(e) => {
                          // Fallback to a food-related placeholder
                          e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
                        }}
                      />
                      <div className="swipe-overlay">
                        <div className="swipe-restaurant-info">
                          <h3 className="swipe-restaurant-name">{currentRestaurant.name}</h3>
                          <div className="swipe-restaurant-details">
                            {renderStars(currentRestaurant.rating)}
                            <span className="swipe-rating">{currentRestaurant.rating}</span>
                            {currentRestaurant.price && (
                              <span className="swipe-price">{currentRestaurant.price}</span>
                            )}
                            {currentRestaurant.categories?.[0] && (
                              <span className="swipe-category">{currentRestaurant.categories[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="swipe-actions">
              <button 
                className="swipe-btn dislike-btn"
                onClick={() => handleSwipe('dislike')}
              >
                <span className="swipe-btn-emoji">👎</span>
                <span className="swipe-btn-label">Nah</span>
              </button>
              
              <button 
                className="swipe-btn maybe-btn"
                onClick={() => handleSwipe('maybe')}
              >
                <span className="swipe-btn-emoji">🤔</span>
                <span className="swipe-btn-label">Maybe?</span>
              </button>
              
              <button 
                className="swipe-btn like-btn"
                onClick={() => handleSwipe('like')}
              >
                <span className="swipe-btn-emoji">❤️</span>
                <span className="swipe-btn-label">Yes!</span>
              </button>
            </div>

            <button 
              className="btn-primary large show-vibe-btn"
              onClick={showSwipeRecommendations}
              disabled={loading}
            >
              {loading ? 'Finding Your Perfect Match...' : '✨ Show Me My Vibe'}
            </button>
          </div>
        )}

        {step === 9 && swipeRestaurants.length === 0 && !loadingSwipeData && (
          <div className="step">
            <div className="no-results">
              <h2>No restaurants found</h2>
              <p>We couldn't find any restaurants in your area. Try the vibe selection option instead or check your location settings.</p>
              <button className="btn-primary" onClick={() => {
                setStep(1)
                setSwipeMode(false)
              }}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {step > 1 && step < 6 && (
          <button className="btn-back" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

export default App
