import { useState, useEffect } from 'react'
import './App.css'
import { searchRestaurants, getRestaurantReviews } from './utils/api'

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
  const [loading, setLoading] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)

  // Get user location
  const getLocation = () => {
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
        // Reverse geocoding to get city/state (simplified - in production use a geocoding service)
        setLocation({
          latitude,
          longitude,
          city: 'Your Area',
          state: ''
        })
        setLoadingLocation(false)
        setStep(2)
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location permissions.')
        setLoadingLocation(false)
      }
    )
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
            <h2>📍 Let's find restaurants near you</h2>
            <p className="location-info">
              We'll use your location to find the best restaurants in your area
            </p>
            {locationError && (
              <div className="error-message">{locationError}</div>
            )}
            <button 
              className="btn-primary large" 
              onClick={getLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? 'Getting Location...' : '📍 Use My Location'}
            </button>
            {location && (
              <div className="location-success">
                ✅ Location found! Click Next to continue.
              </div>
            )}
            {location && (
              <button 
                className="btn-primary" 
                onClick={handleNext}
                style={{ marginTop: '1rem' }}
              >
                Next →
              </button>
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
