// Flight Inventory and Generator for FS Cheap Fare Network
export const airlines = [
  { name: 'Eurostar Express', code: 'ES', logo: '🚄', color: '#1a365d' },
  { name: 'British Airways', code: 'BA', logo: '✈️', color: '#075aaa' },
  { name: 'Air France', code: 'AF', logo: '🛫', color: '#002157' },
  { name: 'Emirates', code: 'EK', logo: '✨', color: '#d71921' },
  { name: 'Lufthansa', code: 'LH', logo: '🦅', color: '#05164d' },
  { name: 'Delta Air Lines', code: 'DL', logo: '🔺', color: '#c01933' },
  { name: 'Qatar Airways', code: 'QR', logo: '🇶🇦', color: '#5c0632' },
  { name: 'Singapore Airlines', code: 'SQ', logo: '🌟', color: '#cb9a32' }
];

export const badges = [
  { text: 'Cheapest', class: 'badge-cheapest' },
  { text: 'Best seller', class: 'badge-bestseller' },
  { text: 'Recommended', class: 'badge-recommended' },
  { text: 'Fastest', class: 'badge-fastest' }
];

export function generateFlights(originCode, destCode, dateString) {
  // Generate a realistic list of flight options for given origin & destination
  const basePrice = Math.floor(140 + Math.random() * 90);
  
  return [
    {
      id: 'FS-101',
      airline: 'Eurostar Express',
      flightNumber: 'ES-9014',
      badge: 'Cheapest',
      badgeClass: 'badge-cheapest',
      depTime: '06:01',
      arrTime: '09:20',
      duration: '2h 19m',
      stops: 'Direct',
      origin: originCode || 'STP',
      destination: destCode || 'XPG',
      basePriceUSD: 171,
      fareType: 'Standard',
      aircraft: 'High-Speed E320',
      seatsRemaining: 4,
      amenities: ['Free WiFi', 'Power Outlets', 'Buffet Bar']
    },
    {
      id: 'FS-102',
      airline: 'Eurostar Express',
      flightNumber: 'ES-9022',
      badge: 'Best seller',
      badgeClass: 'badge-bestseller',
      depTime: '08:01',
      arrTime: '11:20',
      duration: '2h 19m',
      stops: 'Direct',
      origin: originCode || 'STP',
      destination: destCode || 'XPG',
      basePriceUSD: 250,
      fareType: 'Standard Premier',
      aircraft: 'High-Speed E320',
      seatsRemaining: 2,
      amenities: ['Extra Legroom', 'Complimentary Meal', 'Free WiFi', 'Quiet Coach']
    },
    {
      id: 'FS-103',
      airline: 'Air France',
      flightNumber: 'AF-1681',
      badge: 'Fastest',
      badgeClass: 'badge-fastest',
      depTime: '10:15',
      arrTime: '12:35',
      duration: '1h 20m',
      stops: 'Direct',
      origin: originCode || 'LHR',
      destination: destCode || 'CDG',
      basePriceUSD: 198,
      fareType: 'Economy Classic',
      aircraft: 'Airbus A220-300',
      seatsRemaining: 7,
      amenities: ['In-flight Snack', 'USB Port', 'Carry-on Bag Included']
    },
    {
      id: 'FS-104',
      airline: 'British Airways',
      flightNumber: 'BA-308',
      badge: 'Recommended',
      badgeClass: 'badge-recommended',
      depTime: '12:40',
      arrTime: '15:05',
      duration: '1h 25m',
      stops: 'Direct',
      origin: originCode || 'LHR',
      destination: destCode || 'CDG',
      basePriceUSD: 215,
      fareType: 'Standard',
      aircraft: 'Airbus A320neo',
      seatsRemaining: 5,
      amenities: ['High Speed WiFi', 'Complimentary Drink', 'Entertainment']
    },
    {
      id: 'FS-105',
      airline: 'Lufthansa',
      flightNumber: 'LH-924',
      badge: null,
      badgeClass: '',
      depTime: '14:20',
      arrTime: '18:45',
      duration: '3h 25m',
      stops: '1 stop (FRA)',
      origin: originCode || 'STP',
      destination: destCode || 'XPG',
      basePriceUSD: 155,
      fareType: 'Economy Light',
      aircraft: 'Boeing 737 MAX',
      seatsRemaining: 9,
      amenities: ['Drink Service', 'USB Charging']
    },
    {
      id: 'FS-106',
      airline: 'Emirates Connect',
      flightNumber: 'EK-702',
      badge: 'Recommended',
      badgeClass: 'badge-recommended',
      depTime: '17:30',
      arrTime: '20:45',
      duration: '2h 15m',
      stops: 'Direct',
      origin: originCode || 'LHR',
      destination: destCode || 'CDG',
      basePriceUSD: 280,
      fareType: 'Flexi Economy',
      aircraft: 'Boeing 777-300ER',
      seatsRemaining: 3,
      amenities: ['Gourmet Meal', 'Live TV & ICE', 'Free Baggage 30kg']
    }
  ];
}

// Currency Conversion rates relative to USD
export const currencyRates = {
  USD: { symbol: '$', rate: 1.0, name: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.92, name: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.79, name: 'GBP (£)' },
  INR: { symbol: '₹', rate: 83.5, name: 'INR (₹)' },
  AED: { symbol: 'AED ', rate: 3.67, name: 'AED' }
};

export function formatPrice(amountUSD, currencyCode = 'EUR') {
  const curr = currencyRates[currencyCode] || currencyRates['EUR'];
  const converted = Math.round(amountUSD * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}
