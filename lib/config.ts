export const config = {
  name: 'Nearby Stock Finder', city: 'Jammu', country: 'India',
  center: { lat: 32.7266, lng: 74.857 }, timezone: 'Asia/Kolkata',
  currencies: ['INR', 'USD'], radiusKm: 5,
  freshness: { freshHours: 48, staleDays: 7, hiddenDays: 30 },
  weights: { distance: 40, freshness: 35, rating: 15, availability: 10 },
  bayesian: { mean: 3.8, minimumReviews: 20 },
};
