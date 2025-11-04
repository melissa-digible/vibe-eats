import { useState } from 'react'
import './App.css'

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
  const [recommendation, setRecommendation] = useState(null)

  const getRecommendation = () => {
    // Simple recommendation engine based on selections
    const recommendations = {
      chill: {
        Italian: ['Cozy Italian Bistro', 'Pasta Corner', 'Little Italy'],
        Mexican: ['Taco Tuesday Spot', 'Casual Cantina', 'Burrito Bar'],
        Asian: ['Noodle House', 'Dim Sum Cafe', 'Asian Fusion'],
        default: ['Neighborhood Cafe', 'Local Diner', 'Corner Bistro']
      },
      adventurous: {
        Asian: ['Szechuan Spice', 'Thai Street Food', 'Fusion Kitchen'],
        Indian: ['Spice Route', 'Curry House', 'Masala Express'],
        Mexican: ['Authentic Taqueria', 'Mole Kitchen', 'Street Tacos'],
        default: ['Fusion Restaurant', 'Experimental Kitchen', 'Adventure Eats']
      },
      fancy: {
        French: ['Le Bistro', 'Fine Dining', 'Chef\'s Table'],
        Italian: ['Upscale Italian', 'Wine Bar & Restaurant', 'Ristorante'],
        Japanese: ['Omakase Sushi', 'Fine Dining Japanese', 'Sake Bar'],
        default: ['Fine Dining Restaurant', 'Upscale Bistro', 'Gourmet Experience']
      },
      comfort: {
        American: ['Burger Joint', 'Classic Diner', 'Comfort Kitchen'],
        Italian: ['Pizza Place', 'Pasta House', 'Italian Comfort'],
        BBQ: ['BBQ Shack', 'Smokehouse', 'Ribs & More'],
        default: ['Comfort Food Cafe', 'Home-style Kitchen', 'Classic Eats']
      },
      healthy: {
        Mediterranean: ['Fresh Mediterranean', 'Healthy Bowl', 'Grain Bowl'],
        Asian: ['Sushi & Salad', 'Healthy Asian', 'Buddha Bowl'],
        default: ['Salad Bar', 'Health Cafe', 'Green Kitchen']
      },
      party: {
        Mexican: ['Party Cantina', 'Margarita Bar', 'Taco & Tequila'],
        American: ['Sports Bar', 'Pub Grub', 'Party Spot'],
        default: ['Party Restaurant', 'Lively Bar & Grill', 'Celebration Spot']
      },
      cozy: {
        Italian: ['Cozy Italian', 'Warm Bistro', 'Family Italian'],
        American: ['Cozy Cafe', 'Warm Diner', 'Comfort Spot'],
        default: ['Cozy Corner', 'Warm Cafe', 'Homey Restaurant']
      },
      quick: {
        Pizza: ['Fast Pizza', 'Pizza Express', 'Quick Slice'],
        Burgers: ['Burger Joint', 'Fast Food', 'Quick Bites'],
        default: ['Fast Casual', 'Quick Service', 'Express Eats']
      }
    }

    const vibeRecs = recommendations[selectedVibe] || {}
    const cuisineRecs = vibeRecs[selectedCuisine] || vibeRecs.default || ['Great Restaurant', 'Local Favorite', 'Perfect Spot']
    
    const randomRec = cuisineRecs[Math.floor(Math.random() * cuisineRecs.length)]
    
    // Add price and atmosphere context
    let description = `Perfect for your ${selectedVibe} vibe`
    if (selectedCuisine) description += ` with ${selectedCuisine} cuisine`
    if (selectedPrice) {
      const priceDesc = PRICE_RANGES.find(p => p.id === selectedPrice)?.description
      description += ` at ${priceDesc} prices`
    }
    if (selectedAtmosphere) {
      const atmosDesc = ATMOSPHERES.find(a => a.id === selectedAtmosphere)?.label
      description += ` in a ${atmosDesc.toLowerCase()} atmosphere`
    }

    return {
      name: randomRec,
      description,
      vibe: selectedVibe,
      cuisine: selectedCuisine,
      price: selectedPrice,
      atmosphere: selectedAtmosphere
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedVibe) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    } else if (step === 4) {
      const rec = getRecommendation()
      setRecommendation(rec)
      setStep(5)
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedVibe(null)
    setSelectedCuisine(null)
    setSelectedPrice(null)
    setSelectedAtmosphere(null)
    setRecommendation(null)
  }

  const handleSkip = () => {
    if (step === 2) {
      setSelectedCuisine(null)
    } else if (step === 3) {
      setSelectedPrice(null)
    } else if (step === 4) {
      setSelectedAtmosphere(null)
    }
    handleNext()
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

        {step === 2 && (
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

        {step === 3 && (
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

        {step === 4 && (
          <div className="step">
            <h2>Atmosphere preference? (Optional)</h2>
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
            <div className="button-group">
              <button className="btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleNext}>
                Get Recommendation 🎯
              </button>
            </div>
          </div>
        )}

        {step === 5 && recommendation && (
          <div className="step">
            <div className="recommendation-card">
              <div className="recommendation-header">
                <span className="recommendation-emoji">
                  {VIBES.find(v => v.id === recommendation.vibe)?.emoji || '🍽️'}
                </span>
                <h2>Your Perfect Match!</h2>
              </div>
              <div className="recommendation-name">{recommendation.name}</div>
              <p className="recommendation-description">{recommendation.description}</p>
              
              <div className="recommendation-details">
                {recommendation.cuisine && (
                  <div className="detail-badge">🍴 {recommendation.cuisine}</div>
                )}
                {recommendation.price && (
                  <div className="detail-badge">
                    {PRICE_RANGES.find(p => p.id === recommendation.price)?.label}
                  </div>
                )}
                {recommendation.atmosphere && (
                  <div className="detail-badge">
                    {ATMOSPHERES.find(a => a.id === recommendation.atmosphere)?.emoji} {ATMOSPHERES.find(a => a.id === recommendation.atmosphere)?.label}
                  </div>
                )}
              </div>

              <button className="btn-primary large" onClick={handleReset}>
                Find Another Restaurant 🔄
              </button>
            </div>
          </div>
        )}

        {step > 1 && step < 5 && (
          <button className="btn-back" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

export default App

