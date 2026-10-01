import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit primary dataset path: services/airport.json
const servicesAirportPath = path.join(__dirname, 'airport.json');
const fallbackAirportsPath = path.join(__dirname, '..', 'data', 'airports.json');
const rawAirportsPath = fs.existsSync(servicesAirportPath) && fs.statSync(servicesAirportPath).size > 1000
  ? servicesAirportPath
  : fallbackAirportsPath;

let airportsList = [];
let airportsByIata = new Map();

try {
  if (fs.existsSync(rawAirportsPath)) {
    const raw = fs.readFileSync(rawAirportsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    airportsList = Array.isArray(parsed) ? parsed : Object.values(parsed);
    for (const a of airportsList) {
      if (a.iata && a.iata.trim()) {
        airportsByIata.set(a.iata.trim().toUpperCase(), a);
      }
    }
    console.log(`[AirportSearchService] Successfully loaded all ${airportsList.length} airports directly from ${path.basename(rawAirportsPath)} (${airportsByIata.size} indexed with valid IATA).`);
  }
} catch (e) {
  console.error('[AirportSearchService] Error loading raw airports dataset:', e);
}

// Major commercial hubs prioritization set
const majorCommercialHubs = new Set([
  'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'ATL', 'SFO', 'SEA', 'LAS', 'MCO',
  'EWR', 'CLT', 'PHX', 'IAH', 'MIA', 'BOS', 'MSP', 'FLL', 'DTW', 'PHL',
  'LGA', 'BWI', 'SLC', 'SAN', 'IAD', 'DCA', 'TPA', 'MDW', 'HNL', 'PDX',
  'LHR', 'CDG', 'FRA', 'AMS', 'DXB', 'SIN', 'HND', 'NRT', 'SYD', 'DEL', 'BOM',
  'YYZ', 'YVR', 'DOH', 'AUH', 'MAD', 'BCN', 'FCO', 'IST', 'ICN', 'BKK'
]);

// Prominent operating airlines mapped to top commercial airports
const AIRPORT_AIRLINES = {
  // US Major Hubs
  'ATL': ['Delta', 'Southwest', 'Spirit', 'Frontier'],
  'DFW': ['American Airlines', 'Delta', 'United', 'Spirit'],
  'DEN': ['United', 'Southwest', 'Frontier', 'Delta'],
  'ORD': ['United', 'American Airlines', 'Delta', 'Spirit'],
  'LAX': ['Delta', 'American Airlines', 'United', 'Southwest', 'Alaska'],
  'JFK': ['Delta', 'American Airlines', 'JetBlue', 'British Airways', 'Air France'],
  'LAS': ['Southwest', 'Spirit', 'Allegiant', 'Frontier', 'Delta'],
  'MCO': ['Southwest', 'Delta', 'Spirit', 'American Airlines', 'JetBlue'],
  'MIA': ['American Airlines', 'Delta', 'United', 'Spirit', 'Avianca'],
  'CLT': ['American Airlines', 'Delta', 'United', 'Southwest'],
  'SEA': ['Alaska Airlines', 'Delta', 'United', 'American Airlines'],
  'PHX': ['American Airlines', 'Southwest', 'Delta', 'United'],
  'EWR': ['United', 'Delta', 'American Airlines', 'Spirit', 'JetBlue'],
  'SFO': ['United', 'Alaska Airlines', 'Delta', 'American Airlines'],
  'IAH': ['United', 'Spirit', 'American Airlines', 'Delta'],
  'BOS': ['JetBlue', 'Delta', 'American Airlines', 'United'],
  'MSP': ['Delta', 'Sun Country', 'American Airlines', 'United'],
  'DTW': ['Delta', 'Spirit', 'American Airlines', 'United'],
  'FLL': ['JetBlue', 'Spirit', 'Southwest', 'Delta'],
  'PHL': ['American Airlines', 'Southwest', 'Frontier', 'Delta'],
  'LGA': ['Delta', 'American Airlines', 'Southwest', 'JetBlue'],
  'BWI': ['Southwest', 'Spirit', 'Delta', 'American Airlines'],
  'SLC': ['Delta', 'Southwest', 'American Airlines', 'United'],
  'SAN': ['Southwest', 'Alaska Airlines', 'United', 'Delta'],
  'IAD': ['United', 'Delta', 'American Airlines', 'British Airways'],
  'DCA': ['American Airlines', 'Delta', 'Southwest', 'United'],
  'TPA': ['Southwest', 'Delta', 'American Airlines', 'United'],
  'MDW': ['Southwest', 'Frontier', 'Delta', 'Allegiant'],
  'HNL': ['Hawaiian Airlines', 'United', 'Delta', 'Southwest'],
  'PDX': ['Alaska Airlines', 'Southwest', 'Delta', 'United'],
  'AUS': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'BNA': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'RDU': ['Delta', 'American Airlines', 'Southwest', 'United'],
  'SJC': ['Southwest', 'Alaska Airlines', 'Delta', 'American Airlines'],
  'OAK': ['Southwest', 'Spirit', 'Allegiant', 'Hawaiian Airlines'],
  'SMF': ['Southwest', 'United', 'Delta', 'American Airlines'],
  'SAT': ['Southwest', 'American Airlines', 'United', 'Delta'],
  'MCI': ['Southwest', 'Delta', 'American Airlines', 'United'],
  'IND': ['Southwest', 'Delta', 'American Airlines', 'United'],
  'CVG': ['Delta', 'Allegiant', 'American Airlines', 'United'],
  'PIT': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'CLE': ['United', 'American Airlines', 'Delta', 'Southwest'],
  'CMH': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'MSY': ['Southwest', 'Delta', 'American Airlines', 'United'],
  'STL': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'JAX': ['Delta', 'American Airlines', 'Southwest', 'United'],
  'RSW': ['Southwest', 'Delta', 'American Airlines', 'JetBlue'],
  'PBI': ['JetBlue', 'Delta', 'American Airlines', 'United'],
  'BUF': ['Southwest', 'Delta', 'American Airlines', 'JetBlue'],
  'ABQ': ['Southwest', 'American Airlines', 'Delta', 'United'],
  'ANC': ['Alaska Airlines', 'Delta', 'United', 'American Airlines'],
  'OGG': ['Hawaiian Airlines', 'United', 'Alaska Airlines', 'Delta'],
  'DAL': ['Southwest'],
  'HOU': ['Southwest', 'Delta'],

  // International Hubs
  'LHR': ['British Airways', 'Virgin Atlantic', 'American Airlines', 'Delta', 'United'],
  'LGW': ['British Airways', 'easyJet', 'Norse Atlantic', 'TUI'],
  'MAN': ['easyJet', 'Ryanair', 'Virgin Atlantic', 'British Airways'],
  'CDG': ['Air France', 'Delta', 'United', 'American Airlines', 'Lufthansa'],
  'ORY': ['Air France', 'Transavia', 'easyJet', 'Vueling'],
  'FRA': ['Lufthansa', 'United', 'Condor', 'Singapore Airlines'],
  'MUC': ['Lufthansa', 'United', 'Condor', 'Air Dolomiti'],
  'AMS': ['KLM', 'Delta', 'easyJet', 'Transavia'],
  'MAD': ['Iberia', 'Air Europa', 'Ryanair', 'American Airlines'],
  'BCN': ['Vueling', 'Ryanair', 'Iberia', 'Delta'],
  'FCO': ['ITA Airways', 'Ryanair', 'Wizz Air', 'Delta', 'United'],
  'MXP': ['ITA Airways', 'easyJet', 'Ryanair', 'Emirates'],
  'ZRH': ['SWISS', 'Edelweiss Air', 'United', 'Lufthansa'],
  'VIE': ['Austrian Airlines', 'Ryanair', 'Wizz Air', 'Lufthansa'],
  'BRU': ['Brussels Airlines', 'Ryanair', 'TUI fly'],
  'DUB': ['Aer Lingus', 'Ryanair', 'Delta', 'United', 'American Airlines'],
  'CPH': ['SAS Scandinavian', 'Norwegian', 'Ryanair'],
  'ARN': ['SAS Scandinavian', 'Norwegian', 'Ryanair'],
  'OSL': ['SAS Scandinavian', 'Norwegian', 'Widerøe'],
  'HEL': ['Finnair', 'Norwegian', 'Ryanair'],
  'IST': ['Turkish Airlines', 'Pegasus Airlines', 'Emirates'],
  'SAW': ['Pegasus Airlines', 'Turkish Airlines'],
  'ATH': ['Aegean Airlines', 'Sky Express', 'Ryanair'],
  'LIS': ['TAP Air Portugal', 'easyJet', 'Ryanair'],

  // Middle East
  'DXB': ['Emirates', 'flydubai', 'Air India', 'IndiGo', 'British Airways'],
  'AUH': ['Etihad Airways', 'Wizz Air', 'Air Arabia', 'Air India'],
  'DOH': ['Qatar Airways', 'British Airways', 'IndiGo', 'American Airlines'],
  'RUH': ['Saudia', 'Flynas', 'flyadeal', 'Emirates'],
  'JED': ['Saudia', 'Flynas', 'flyadeal', 'Emirates'],
  'KWI': ['Kuwait Airways', 'Jazeera Airways', 'Emirates'],
  'BAH': ['Gulf Air', 'flydubai', 'Air Arabia'],

  // Asia / India
  'DEL': ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'Emirates'],
  'BOM': ['Air India', 'IndiGo', 'Vistara', 'Akasa Air', 'Emirates'],
  'BLR': ['IndiGo', 'Air India', 'Akasa Air', 'Vistara'],
  'MAA': ['IndiGo', 'Air India', 'SpiceJet', 'Emirates'],
  'HYD': ['IndiGo', 'Air India', 'SpiceJet', 'Emirates'],
  'CCU': ['IndiGo', 'Air India', 'SpiceJet'],
  'COK': ['Air India Express', 'IndiGo', 'SpiceJet', 'Emirates'],
  'AMD': ['IndiGo', 'Air India', 'SpiceJet', 'Emirates'],
  'SIN': ['Singapore Airlines', 'Scoot', 'Jetstar Asia', 'Emirates'],
  'BKK': ['Thai Airways', 'Bangkok Airways', 'AirAsia', 'Emirates'],
  'DMK': ['AirAsia', 'Nok Air', 'Lion Air'],
  'KUL': ['Malaysia Airlines', 'AirAsia', 'Batik Air'],
  'HKG': ['Cathay Pacific', 'Hong Kong Airlines', 'Greater Bay Airlines'],
  'HND': ['ANA', 'Japan Airlines', 'Delta', 'United', 'American Airlines'],
  'NRT': ['Japan Airlines', 'ANA', 'United', 'Zipair', 'Delta'],
  'KIX': ['Peach', 'ANA', 'Japan Airlines', 'Jetstar Japan'],
  'ICN': ['Korean Air', 'Asiana Airlines', 'Delta', 'Jeju Air'],
  'TPE': ['EVA Air', 'China Airlines', 'Starlux Airlines'],

  // Canada & Americas
  'YYZ': ['Air Canada', 'WestJet', 'Porter Airlines', 'Air Transat', 'Delta'],
  'YVR': ['Air Canada', 'WestJet', 'Air Transat', 'Flair Airlines'],
  'YUL': ['Air Canada', 'Air Transat', 'WestJet', 'Air France'],
  'YYC': ['WestJet', 'Air Canada', 'Flair Airlines'],
  'MEX': ['Aeroméxico', 'Volaris', 'VivaAerobus', 'United', 'American Airlines'],
  'CUN': ['Volaris', 'VivaAerobus', 'Aeroméxico', 'American Airlines', 'Delta', 'United'],
  'GDL': ['Volaris', 'VivaAerobus', 'Aeroméxico', 'American Airlines'],
  'PTY': ['Copa Airlines', 'United', 'American Airlines', 'Delta'],
  'BOG': ['Avianca', 'LATAM Colombia', 'Wingo', 'American Airlines'],
  'GRU': ['LATAM Brasil', 'Gol Linhas Aéreas', 'Azul', 'American Airlines', 'United'],
  'GIG': ['LATAM Brasil', 'Gol Linhas Aéreas', 'Azul'],
  'EZE': ['Aerolíneas Argentinas', 'LATAM', 'Gol', 'American Airlines'],
  'SCL': ['LATAM Chile', 'SKY Airline', 'JetSmart', 'American Airlines'],
  'LIM': ['LATAM Perú', 'SKY Airline', 'JetSmart'],

  // Oceania
  'SYD': ['Qantas', 'Virgin Australia', 'Jetstar', 'Air New Zealand', 'Emirates'],
  'MEL': ['Qantas', 'Virgin Australia', 'Jetstar', 'Singapore Airlines'],
  'BNE': ['Qantas', 'Virgin Australia', 'Jetstar', 'Air New Zealand'],
  'AKL': ['Air New Zealand', 'Jetstar', 'Qantas', 'Emirates']
};

// Hubs and key focus cities per major airline for airline search queries
const AIRLINE_HUBS = {
  'delta': ['ATL', 'JFK', 'LGA', 'LAX', 'SEA', 'MSP', 'DTW', 'SLC', 'BOS'],
  'american': ['DFW', 'CLT', 'MIA', 'ORD', 'PHX', 'PHL', 'DCA', 'JFK', 'LAX'],
  'united': ['ORD', 'IAH', 'EWR', 'DEN', 'SFO', 'IAD', 'LAX'],
  'southwest': ['MDW', 'DAL', 'BWI', 'DEN', 'LAS', 'PHX', 'MCO', 'HOU', 'BNA', 'ATL'],
  'jetblue': ['JFK', 'BOS', 'FLL', 'MCO', 'LAX'],
  'alaska': ['SEA', 'PDX', 'ANC', 'SFO', 'LAX', 'SAN'],
  'spirit': ['FLL', 'MCO', 'LAS', 'ATL', 'DTW', 'ORD'],
  'frontier': ['DEN', 'MCO', 'LAS', 'PHL', 'ATL'],
  'air india': ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'JFK', 'SFO', 'LHR'],
  'indigo': ['DEL', 'BOM', 'BLR', 'HYD', 'CCU', 'MAA', 'DXB', 'SIN'],
  'emirates': ['DXB', 'JFK', 'LAX', 'SFO', 'ORD', 'LHR', 'DEL', 'BOM'],
  'qatar': ['DOH', 'JFK', 'LAX', 'ORD', 'MIA', 'DFW', 'LHR', 'DEL'],
  'british airways': ['LHR', 'LGW', 'JFK', 'BOS', 'LAX', 'ORD', 'DEL', 'BOM'],
  'virgin': ['LHR', 'MAN', 'JFK', 'LAX', 'BOS', 'MCO', 'MIA'],
  'lufthansa': ['FRA', 'MUC', 'JFK', 'ORD', 'LAX', 'SFO', 'DEL', 'BOM'],
  'air france': ['CDG', 'ORY', 'JFK', 'LAX', 'MIA', 'SFO', 'DEL'],
  'klm': ['AMS', 'JFK', 'ATL', 'LAX', 'SFO', 'ORD'],
  'singapore': ['SIN', 'JFK', 'LAX', 'SFO', 'SEA', 'LHR', 'DEL', 'BOM'],
  'air canada': ['YYZ', 'YVR', 'YUL', 'YYC', 'JFK', 'LAX', 'LHR']
};

const countryNames = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'FR': 'France',
  'DE': 'Germany',
  'AE': 'United Arab Emirates',
  'IN': 'India',
  'JP': 'Japan',
  'AU': 'Australia',
  'SG': 'Singapore',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'CN': 'China',
  'TH': 'Thailand',
  'TR': 'Turkey',
  'QA': 'Qatar',
  'SA': 'Saudi Arabia',
  'NZ': 'New Zealand',
  'IE': 'Ireland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'GR': 'Greece',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'KR': 'South Korea',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam'
};

const COUNTRY_DEFAULT_AIRLINES = {
  'US': ['Delta', 'American Airlines', 'United', 'Southwest'],
  'GB': ['British Airways', 'Virgin Atlantic', 'easyJet'],
  'CA': ['Air Canada', 'WestJet', 'Porter Airlines'],
  'IN': ['Air India', 'IndiGo', 'Vistara', 'SpiceJet'],
  'AE': ['Emirates', 'flydubai', 'Etihad Airways'],
  'QA': ['Qatar Airways'],
  'FR': ['Air France', 'Transavia', 'easyJet'],
  'DE': ['Lufthansa', 'Eurowings', 'Condor'],
  'IT': ['ITA Airways', 'Ryanair', 'easyJet'],
  'ES': ['Iberia', 'Vueling', 'Air Europa'],
  'NL': ['KLM', 'Transavia', 'easyJet'],
  'AU': ['Qantas', 'Virgin Australia', 'Jetstar'],
  'JP': ['ANA', 'Japan Airlines', 'Peach'],
  'MX': ['Aeroméxico', 'Volaris', 'VivaAerobus'],
  'BR': ['LATAM', 'Gol', 'Azul'],
  'TR': ['Turkish Airlines', 'Pegasus Airlines'],
  'SG': ['Singapore Airlines', 'Scoot'],
  'TH': ['Thai Airways', 'Bangkok Airways'],
  'MY': ['Malaysia Airlines', 'AirAsia'],
  'KR': ['Korean Air', 'Asiana Airlines']
};

export class AirportSearchService {
  static getCountryName(countryCode) {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    return countryNames[code] || code;
  }

  static getAirlinesForAirport(iata, countryCode) {
    if (iata && AIRPORT_AIRLINES[iata]) {
      return AIRPORT_AIRLINES[iata];
    }
    if (countryCode && COUNTRY_DEFAULT_AIRLINES[countryCode.toUpperCase()]) {
      return COUNTRY_DEFAULT_AIRLINES[countryCode.toUpperCase()];
    }
    return ['Commercial Airlines', 'Major Carriers'];
  }

  static getSuggestedAirlines() {
    return [
      { id: 'ALL', name: 'All Airlines', short: 'All' },
      { id: 'DL', name: 'Delta Air Lines', short: 'Delta', hub: 'ATL' },
      { id: 'AA', name: 'American Airlines', short: 'American', hub: 'DFW' },
      { id: 'UA', name: 'United Airlines', short: 'United', hub: 'ORD' },
      { id: 'WN', name: 'Southwest Airlines', short: 'Southwest', hub: 'MDW' },
      { id: 'B6', name: 'JetBlue', short: 'JetBlue', hub: 'JFK' },
      { id: 'AS', name: 'Alaska Airlines', short: 'Alaska', hub: 'SEA' },
      { id: 'AI', name: 'Air India', short: 'Air India', hub: 'DEL' },
      { id: '6E', name: 'IndiGo', short: 'IndiGo', hub: 'DEL' },
      { id: 'EK', name: 'Emirates', short: 'Emirates', hub: 'DXB' },
      { id: 'BA', name: 'British Airways', short: 'British Airways', hub: 'LHR' },
      { id: 'QR', name: 'Qatar Airways', short: 'Qatar Airways', hub: 'DOH' },
      { id: 'LH', name: 'Lufthansa', short: 'Lufthansa', hub: 'FRA' },
      { id: 'AF', name: 'Air France', short: 'Air France', hub: 'CDG' },
      { id: 'AC', name: 'Air Canada', short: 'Air Canada', hub: 'YYZ' },
      { id: 'SQ', name: 'Singapore Airlines', short: 'Singapore Airlines', hub: 'SIN' }
    ];
  }

  static search(query, limit = 8, airlineFilter = null) {
    if (!query || typeof query !== 'string') {
      return this.getPopularAirports(limit, airlineFilter);
    }

    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return this.getPopularAirports(limit, airlineFilter);
    }

    // Check if user typed an airline name (e.g. "delta", "american", "united", "air india", "emirates")
    for (const [airlineKey, hubCodes] of Object.entries(AIRLINE_HUBS)) {
      if (airlineKey === q || (q.length >= 3 && airlineKey.includes(q))) {
        const hubResults = [];
        for (const code of hubCodes) {
          const apt = airportsByIata.get(code);
          if (apt) {
            hubResults.push(this.formatAirportRecord(apt));
          }
        }
        if (hubResults.length > 0) {
          return hubResults.slice(0, limit);
        }
      }
    }

    const exactIataMatches = [];
    const prefixIataMatches = [];
    const majorCommercialMatches = [];
    const commercialCityMatches = [];
    const otherCityMatches = [];
    const nameMatches = [];
    const airstripMatches = [];

    const normAirlineFilter = airlineFilter && airlineFilter !== 'ALL' ? airlineFilter.toLowerCase() : null;

    for (const apt of airportsList) {
      const iata = (apt.iata || '').toLowerCase();
      const icao = (apt.icao || '').toLowerCase();
      const city = (apt.city || '').toLowerCase();
      const name = (apt.name || '').toLowerCase();
      const state = (apt.state || '').toLowerCase();
      const isCommercial = apt.iata && apt.iata.trim().length === 3;

      // Check airline filter if present
      if (normAirlineFilter) {
        const aptAirlines = this.getAirlinesForAirport(apt.iata, apt.country).map(a => a.toLowerCase());
        const hasAirline = aptAirlines.some(a => a.includes(normAirlineFilter));
        if (!hasAirline) continue;
      }

      const record = this.formatAirportRecord(apt);

      if ((iata && iata === q) || (icao && icao === q)) {
        exactIataMatches.push(record);
      } else if (iata && iata.startsWith(q)) {
        prefixIataMatches.push(record);
      } else if (record.isMajor && (city.includes(q) || name.includes(q))) {
        majorCommercialMatches.push(record);
      } else if (isCommercial && (city === q || city.startsWith(q + ' ') || city.startsWith(q) || city.includes(q))) {
        commercialCityMatches.push(record);
      } else if (isCommercial && (name.includes(q) || state.includes(q))) {
        nameMatches.push(record);
      } else if (city && (city === q || city.startsWith(q) || city.includes(q))) {
        otherCityMatches.push(record);
      } else if ((name && name.includes(q)) || (state && state.includes(q)) || (icao && icao.startsWith(q))) {
        airstripMatches.push(record);
      }
    }

    // Sort prefix matches so major commercial hubs come first
    prefixIataMatches.sort((a, b) => (b.isMajor ? 1 : 0) - (a.isMajor ? 1 : 0));
    majorCommercialMatches.sort((a, b) => (b.isMajor ? 1 : 0) - (a.isMajor ? 1 : 0));
    commercialCityMatches.sort((a, b) => (b.isMajor ? 1 : 0) - (a.isMajor ? 1 : 0));

    const combined = [
      ...exactIataMatches,
      ...majorCommercialMatches,
      ...prefixIataMatches,
      ...commercialCityMatches,
      ...nameMatches,
      ...otherCityMatches,
      ...airstripMatches
    ];

    const seen = new Set();
    const unique = [];
    for (const item of combined) {
      const code = item.iata || item.icao;
      if (code && !seen.has(code)) {
        seen.add(code);
        unique.push(item);
        if (unique.length >= limit) break;
      }
    }

    return unique;
  }

  static getPopularAirports(limit = 8, airlineFilter = null) {
    const popularCodes = [
      'JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'SFO', 'MIA', 'LHR',
      'DEL', 'BOM', 'DXB', 'DEN', 'SEA', 'BOS', 'EWR', 'LAS', 'MCO', 'CDG'
    ];
    const results = [];
    const normAirlineFilter = airlineFilter && airlineFilter !== 'ALL' ? airlineFilter.toLowerCase() : null;

    for (const code of popularCodes) {
      const found = airportsByIata.get(code);
      if (found) {
        if (normAirlineFilter) {
          const aptAirlines = this.getAirlinesForAirport(found.iata, found.country).map(a => a.toLowerCase());
          if (!aptAirlines.some(a => a.includes(normAirlineFilter))) continue;
        }
        results.push(this.formatAirportRecord(found));
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  static formatAirportRecord(found) {
    const fullCountry = this.getCountryName(found.country);
    const locParts = [];
    if (found.city) locParts.push(found.city);
    if (found.state && found.country === 'US') locParts.push(found.state);
    if (fullCountry) locParts.push(fullCountry);
    const locationText = locParts.join(', ');

    const airlines = this.getAirlinesForAirport(found.iata, found.country);
    const isCommercial = found.iata && found.iata.length === 3;
    const isMajor = isCommercial ? majorCommercialHubs.has(found.iata) : false;

    const codeDisplay = found.iata || found.icao || '';
    const formattedLabel = `${found.city || found.name} (${codeDisplay}) — ${found.name}`;

    return {
      iata: found.iata || found.icao,
      icao: found.icao,
      name: found.name,
      city: found.city,
      state: found.state,
      country: found.country,
      countryName: fullCountry,
      locationText: locationText,
      displayLabel: formattedLabel,
      airlines: airlines,
      airlinesText: airlines.join(' · '),
      isMajor: isMajor
    };
  }

  static isValidIata(code) {
    if (!code || typeof code !== 'string') return false;
    const clean = code.trim().toUpperCase();
    return airportsByIata.has(clean);
  }

  static getAirportByIata(code) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const found = airportsByIata.get(clean);
    if (!found) return null;
    return this.formatAirportRecord(found);
  }
}
