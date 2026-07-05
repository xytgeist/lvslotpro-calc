/**
 * Home arena coordinates for rest/travel alerts (seed once, lookup at runtime).
 * Keys match Odds API / Rundown team names via normalized tokens.
 */
export type UsTzBucket = 'ET' | 'CT' | 'MT' | 'PT'

export type SportsVenueRow = {
  sportIds: number[]
  keys: string[]
  venueName: string
  city: string
  lat: number
  lng: number
  tz: UsTzBucket
}

const TZ_ORDER: Record<UsTzBucket, number> = { ET: 0, CT: 1, MT: 2, PT: 3 }

function norm(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** NBA=4, MLB=3, NFL=2, WNBA=8, NHL=6, NCAAF=1, NCAAB=5 */
export const SPORTS_VENUES: SportsVenueRow[] = [
  // NBA
  { sportIds: [4], keys: ['atlanta hawks', 'hawks'], venueName: 'State Farm Arena', city: 'Atlanta', lat: 33.757, lng: -84.396, tz: 'ET' },
  { sportIds: [4], keys: ['boston celtics', 'celtics'], venueName: 'TD Garden', city: 'Boston', lat: 42.366, lng: -71.062, tz: 'ET' },
  { sportIds: [4], keys: ['brooklyn nets', 'nets'], venueName: 'Barclays Center', city: 'Brooklyn', lat: 40.683, lng: -73.975, tz: 'ET' },
  { sportIds: [4], keys: ['charlotte hornets', 'hornets'], venueName: 'Spectrum Center', city: 'Charlotte', lat: 35.225, lng: -80.839, tz: 'ET' },
  { sportIds: [4], keys: ['chicago bulls', 'bulls'], venueName: 'United Center', city: 'Chicago', lat: 41.881, lng: -87.674, tz: 'CT' },
  { sportIds: [4], keys: ['cleveland cavaliers', 'cavaliers', 'cavs'], venueName: 'Rocket Mortgage FieldHouse', city: 'Cleveland', lat: 41.496, lng: -81.688, tz: 'ET' },
  { sportIds: [4], keys: ['dallas mavericks', 'mavericks', 'mavs'], venueName: 'American Airlines Center', city: 'Dallas', lat: 32.790, lng: -96.810, tz: 'CT' },
  { sportIds: [4], keys: ['denver nuggets', 'nuggets'], venueName: 'Ball Arena', city: 'Denver', lat: 39.748, lng: -105.007, tz: 'MT' },
  { sportIds: [4], keys: ['detroit pistons', 'pistons'], venueName: 'Little Caesars Arena', city: 'Detroit', lat: 42.341, lng: -83.055, tz: 'ET' },
  { sportIds: [4], keys: ['golden state warriors', 'warriors'], venueName: 'Chase Center', city: 'San Francisco', lat: 37.768, lng: -122.387, tz: 'PT' },
  { sportIds: [4], keys: ['houston rockets', 'rockets'], venueName: 'Toyota Center', city: 'Houston', lat: 29.751, lng: -95.362, tz: 'CT' },
  { sportIds: [4], keys: ['indiana pacers', 'pacers'], venueName: 'Gainbridge Fieldhouse', city: 'Indianapolis', lat: 39.764, lng: -86.155, tz: 'ET' },
  { sportIds: [4], keys: ['los angeles clippers', 'clippers'], venueName: 'Intuit Dome', city: 'Inglewood', lat: 33.948, lng: -118.337, tz: 'PT' },
  { sportIds: [4], keys: ['los angeles lakers', 'lakers'], venueName: 'Crypto.com Arena', city: 'Los Angeles', lat: 34.043, lng: -118.267, tz: 'PT' },
  { sportIds: [4], keys: ['memphis grizzlies', 'grizzlies'], venueName: 'FedExForum', city: 'Memphis', lat: 35.138, lng: -90.051, tz: 'CT' },
  { sportIds: [4], keys: ['miami heat', 'heat'], venueName: 'Kaseya Center', city: 'Miami', lat: 25.781, lng: -80.188, tz: 'ET' },
  { sportIds: [4], keys: ['milwaukee bucks', 'bucks'], venueName: 'Fiserv Forum', city: 'Milwaukee', lat: 43.045, lng: -87.917, tz: 'CT' },
  { sportIds: [4], keys: ['minnesota timberwolves', 'timberwolves', 'wolves'], venueName: 'Target Center', city: 'Minneapolis', lat: 44.979, lng: -93.276, tz: 'CT' },
  { sportIds: [4], keys: ['new orleans pelicans', 'pelicans'], venueName: 'Smoothie King Center', city: 'New Orleans', lat: 29.949, lng: -90.082, tz: 'CT' },
  { sportIds: [4], keys: ['new york knicks', 'knicks'], venueName: 'Madison Square Garden', city: 'New York', lat: 40.750, lng: -73.993, tz: 'ET' },
  { sportIds: [4], keys: ['oklahoma city thunder', 'thunder'], venueName: 'Paycom Center', city: 'Oklahoma City', lat: 35.463, lng: -97.515, tz: 'CT' },
  { sportIds: [4], keys: ['orlando magic', 'magic'], venueName: 'Kia Center', city: 'Orlando', lat: 28.539, lng: -81.384, tz: 'ET' },
  { sportIds: [4], keys: ['philadelphia 76ers', '76ers', 'sixers'], venueName: 'Wells Fargo Center', city: 'Philadelphia', lat: 39.901, lng: -75.172, tz: 'ET' },
  { sportIds: [4], keys: ['phoenix suns', 'suns'], venueName: 'Footprint Center', city: 'Phoenix', lat: 33.446, lng: -112.071, tz: 'MT' },
  { sportIds: [4], keys: ['portland trail blazers', 'trail blazers', 'blazers'], venueName: 'Moda Center', city: 'Portland', lat: 45.532, lng: -122.667, tz: 'PT' },
  { sportIds: [4], keys: ['sacramento kings', 'kings'], venueName: 'Golden 1 Center', city: 'Sacramento', lat: 38.580, lng: -121.500, tz: 'PT' },
  { sportIds: [4], keys: ['san antonio spurs', 'spurs'], venueName: 'Frost Bank Center', city: 'San Antonio', lat: 29.427, lng: -98.438, tz: 'CT' },
  { sportIds: [4], keys: ['toronto raptors', 'raptors'], venueName: 'Scotiabank Arena', city: 'Toronto', lat: 43.643, lng: -79.379, tz: 'ET' },
  { sportIds: [4], keys: ['utah jazz', 'jazz'], venueName: 'Delta Center', city: 'Salt Lake City', lat: 40.768, lng: -111.901, tz: 'MT' },
  { sportIds: [4], keys: ['washington wizards', 'wizards'], venueName: 'Capital One Arena', city: 'Washington', lat: 38.898, lng: -77.021, tz: 'ET' },
  // MLB
  { sportIds: [3], keys: ['arizona diamondbacks', 'diamondbacks'], venueName: 'Chase Field', city: 'Phoenix', lat: 33.445, lng: -112.067, tz: 'MT' },
  { sportIds: [3], keys: ['athletics', 'oakland athletics'], venueName: 'Sutter Health Park', city: 'Sacramento', lat: 38.580, lng: -121.500, tz: 'PT' },
  { sportIds: [3], keys: ['atlanta braves', 'braves'], venueName: 'Truist Park', city: 'Atlanta', lat: 33.891, lng: -84.468, tz: 'ET' },
  { sportIds: [3], keys: ['baltimore orioles', 'orioles'], venueName: 'Oriole Park', city: 'Baltimore', lat: 39.284, lng: -76.622, tz: 'ET' },
  { sportIds: [3], keys: ['boston red sox', 'red sox'], venueName: 'Fenway Park', city: 'Boston', lat: 42.346, lng: -71.098, tz: 'ET' },
  { sportIds: [3], keys: ['chicago cubs', 'cubs'], venueName: 'Wrigley Field', city: 'Chicago', lat: 41.948, lng: -87.656, tz: 'CT' },
  { sportIds: [3], keys: ['chicago white sox', 'white sox'], venueName: 'Guaranteed Rate Field', city: 'Chicago', lat: 41.830, lng: -87.634, tz: 'CT' },
  { sportIds: [3], keys: ['cincinnati reds', 'reds'], venueName: 'Great American Ball Park', city: 'Cincinnati', lat: 39.097, lng: -84.507, tz: 'ET' },
  { sportIds: [3], keys: ['cleveland guardians', 'guardians', 'indians'], venueName: 'Progressive Field', city: 'Cleveland', lat: 41.496, lng: -81.685, tz: 'ET' },
  { sportIds: [3], keys: ['colorado rockies', 'rockies'], venueName: 'Coors Field', city: 'Denver', lat: 39.756, lng: -104.994, tz: 'MT' },
  { sportIds: [3], keys: ['detroit tigers', 'tigers'], venueName: 'Comerica Park', city: 'Detroit', lat: 42.339, lng: -83.049, tz: 'ET' },
  { sportIds: [3], keys: ['houston astros', 'astros'], venueName: 'Minute Maid Park', city: 'Houston', lat: 29.757, lng: -95.355, tz: 'CT' },
  { sportIds: [3], keys: ['kansas city royals', 'royals'], venueName: 'Kauffman Stadium', city: 'Kansas City', lat: 39.052, lng: -94.484, tz: 'CT' },
  { sportIds: [3], keys: ['los angeles angels', 'angels'], venueName: 'Angel Stadium', city: 'Anaheim', lat: 33.800, lng: -117.883, tz: 'PT' },
  { sportIds: [3], keys: ['los angeles dodgers', 'dodgers'], venueName: 'Dodger Stadium', city: 'Los Angeles', lat: 34.074, lng: -118.240, tz: 'PT' },
  { sportIds: [3], keys: ['miami marlins', 'marlins'], venueName: 'loanDepot park', city: 'Miami', lat: 25.778, lng: -80.220, tz: 'ET' },
  { sportIds: [3], keys: ['milwaukee brewers', 'brewers'], venueName: 'American Family Field', city: 'Milwaukee', lat: 43.028, lng: -87.971, tz: 'CT' },
  { sportIds: [3], keys: ['minnesota twins', 'twins'], venueName: 'Target Field', city: 'Minneapolis', lat: 44.982, lng: -93.278, tz: 'CT' },
  { sportIds: [3], keys: ['new york mets', 'mets'], venueName: 'Citi Field', city: 'New York', lat: 40.757, lng: -73.846, tz: 'ET' },
  { sportIds: [3], keys: ['new york yankees', 'yankees'], venueName: 'Yankee Stadium', city: 'New York', lat: 40.830, lng: -73.926, tz: 'ET' },
  { sportIds: [3], keys: ['oakland athletics', 'athletics'], venueName: 'Sutter Health Park', city: 'Sacramento', lat: 38.580, lng: -121.500, tz: 'PT' },
  { sportIds: [3], keys: ['philadelphia phillies', 'phillies'], venueName: 'Citizens Bank Park', city: 'Philadelphia', lat: 39.906, lng: -75.167, tz: 'ET' },
  { sportIds: [3], keys: ['pittsburgh pirates', 'pirates'], venueName: 'PNC Park', city: 'Pittsburgh', lat: 40.447, lng: -80.006, tz: 'ET' },
  { sportIds: [3], keys: ['san diego padres', 'padres'], venueName: 'Petco Park', city: 'San Diego', lat: 32.707, lng: -117.157, tz: 'PT' },
  { sportIds: [3], keys: ['san francisco giants', 'giants'], venueName: 'Oracle Park', city: 'San Francisco', lat: 37.779, lng: -122.389, tz: 'PT' },
  { sportIds: [3], keys: ['seattle mariners', 'mariners'], venueName: 'T-Mobile Park', city: 'Seattle', lat: 47.591, lng: -122.333, tz: 'PT' },
  { sportIds: [3], keys: ['st louis cardinals', 'cardinals'], venueName: 'Busch Stadium', city: 'St. Louis', lat: 38.623, lng: -90.193, tz: 'CT' },
  { sportIds: [3], keys: ['tampa bay rays', 'rays'], venueName: 'Tropicana Field', city: 'St. Petersburg', lat: 27.768, lng: -82.653, tz: 'ET' },
  { sportIds: [3], keys: ['texas rangers', 'rangers'], venueName: 'Globe Life Field', city: 'Arlington', lat: 32.747, lng: -97.083, tz: 'CT' },
  { sportIds: [3], keys: ['toronto blue jays', 'blue jays'], venueName: 'Rogers Centre', city: 'Toronto', lat: 43.641, lng: -79.389, tz: 'ET' },
  { sportIds: [3], keys: ['washington nationals', 'nationals'], venueName: 'Nationals Park', city: 'Washington', lat: 38.873, lng: -77.007, tz: 'ET' },
  // NFL
  { sportIds: [2, 25], keys: ['arizona cardinals', 'cardinals nfl'], venueName: 'State Farm Stadium', city: 'Glendale', lat: 33.528, lng: -112.263, tz: 'MT' },
  { sportIds: [2, 25], keys: ['atlanta falcons', 'falcons'], venueName: 'Mercedes-Benz Stadium', city: 'Atlanta', lat: 33.755, lng: -84.401, tz: 'ET' },
  { sportIds: [2, 25], keys: ['baltimore ravens', 'ravens'], venueName: 'M&T Bank Stadium', city: 'Baltimore', lat: 39.278, lng: -76.623, tz: 'ET' },
  { sportIds: [2, 25], keys: ['buffalo bills', 'bills'], venueName: 'Highmark Stadium', city: 'Orchard Park', lat: 42.774, lng: -78.787, tz: 'ET' },
  { sportIds: [2, 25], keys: ['carolina panthers', 'panthers'], venueName: 'Bank of America Stadium', city: 'Charlotte', lat: 35.226, lng: -80.853, tz: 'ET' },
  { sportIds: [2, 25], keys: ['chicago bears', 'bears'], venueName: 'Soldier Field', city: 'Chicago', lat: 41.862, lng: -87.617, tz: 'CT' },
  { sportIds: [2, 25], keys: ['cincinnati bengals', 'bengals'], venueName: 'Paycor Stadium', city: 'Cincinnati', lat: 39.095, lng: -84.516, tz: 'ET' },
  { sportIds: [2, 25], keys: ['cleveland browns', 'browns'], venueName: 'Cleveland Browns Stadium', city: 'Cleveland', lat: 41.506, lng: -81.700, tz: 'ET' },
  { sportIds: [2, 25], keys: ['dallas cowboys', 'cowboys'], venueName: 'AT&T Stadium', city: 'Arlington', lat: 32.748, lng: -97.093, tz: 'CT' },
  { sportIds: [2, 25], keys: ['denver broncos', 'broncos'], venueName: 'Empower Field', city: 'Denver', lat: 39.744, lng: -105.020, tz: 'MT' },
  { sportIds: [2, 25], keys: ['detroit lions', 'lions'], venueName: 'Ford Field', city: 'Detroit', lat: 42.340, lng: -83.046, tz: 'ET' },
  { sportIds: [2, 25], keys: ['green bay packers', 'packers'], venueName: 'Lambeau Field', city: 'Green Bay', lat: 44.501, lng: -88.062, tz: 'CT' },
  { sportIds: [2, 25], keys: ['houston texans', 'texans'], venueName: 'NRG Stadium', city: 'Houston', lat: 29.685, lng: -95.411, tz: 'CT' },
  { sportIds: [2, 25], keys: ['indianapolis colts', 'colts'], venueName: 'Lucas Oil Stadium', city: 'Indianapolis', lat: 39.760, lng: -86.164, tz: 'ET' },
  { sportIds: [2, 25], keys: ['jacksonville jaguars', 'jaguars'], venueName: 'EverBank Stadium', city: 'Jacksonville', lat: 30.324, lng: -81.637, tz: 'ET' },
  { sportIds: [2, 25], keys: ['kansas city chiefs', 'chiefs'], venueName: 'Arrowhead Stadium', city: 'Kansas City', lat: 39.049, lng: -94.484, tz: 'CT' },
  { sportIds: [2, 25], keys: ['las vegas raiders', 'raiders'], venueName: 'Allegiant Stadium', city: 'Las Vegas', lat: 36.091, lng: -115.184, tz: 'PT' },
  { sportIds: [2, 25], keys: ['los angeles chargers', 'chargers'], venueName: 'SoFi Stadium', city: 'Inglewood', lat: 33.954, lng: -118.339, tz: 'PT' },
  { sportIds: [2, 25], keys: ['los angeles rams', 'rams'], venueName: 'SoFi Stadium', city: 'Inglewood', lat: 33.954, lng: -118.339, tz: 'PT' },
  { sportIds: [2, 25], keys: ['miami dolphins', 'dolphins'], venueName: 'Hard Rock Stadium', city: 'Miami Gardens', lat: 25.958, lng: -80.239, tz: 'ET' },
  { sportIds: [2, 25], keys: ['minnesota vikings', 'vikings'], venueName: 'U.S. Bank Stadium', city: 'Minneapolis', lat: 44.974, lng: -93.258, tz: 'CT' },
  { sportIds: [2, 25], keys: ['new england patriots', 'patriots'], venueName: 'Gillette Stadium', city: 'Foxborough', lat: 42.091, lng: -71.264, tz: 'ET' },
  { sportIds: [2, 25], keys: ['new orleans saints', 'saints'], venueName: 'Caesars Superdome', city: 'New Orleans', lat: 29.951, lng: -90.081, tz: 'CT' },
  { sportIds: [2, 25], keys: ['new york giants', 'giants nfl'], venueName: 'MetLife Stadium', city: 'East Rutherford', lat: 40.814, lng: -74.074, tz: 'ET' },
  { sportIds: [2, 25], keys: ['new york jets', 'jets'], venueName: 'MetLife Stadium', city: 'East Rutherford', lat: 40.814, lng: -74.074, tz: 'ET' },
  { sportIds: [2, 25], keys: ['philadelphia eagles', 'eagles'], venueName: 'Lincoln Financial Field', city: 'Philadelphia', lat: 39.901, lng: -75.168, tz: 'ET' },
  { sportIds: [2, 25], keys: ['pittsburgh steelers', 'steelers'], venueName: 'Acrisure Stadium', city: 'Pittsburgh', lat: 40.447, lng: -80.016, tz: 'ET' },
  { sportIds: [2, 25], keys: ['san francisco 49ers', '49ers'], venueName: "Levi's Stadium", city: 'Santa Clara', lat: 37.403, lng: -121.970, tz: 'PT' },
  { sportIds: [2, 25], keys: ['seattle seahawks', 'seahawks'], venueName: 'Lumen Field', city: 'Seattle', lat: 47.595, lng: -122.332, tz: 'PT' },
  { sportIds: [2, 25], keys: ['tampa bay buccaneers', 'buccaneers'], venueName: 'Raymond James Stadium', city: 'Tampa', lat: 27.976, lng: -82.503, tz: 'ET' },
  { sportIds: [2, 25], keys: ['tennessee titans', 'titans'], venueName: 'Nissan Stadium', city: 'Nashville', lat: 36.166, lng: -86.771, tz: 'CT' },
  { sportIds: [2, 25], keys: ['washington commanders', 'commanders'], venueName: 'Northwest Stadium', city: 'Landover', lat: 38.908, lng: -76.864, tz: 'ET' },
  // WNBA (reuse NBA arenas where applicable)
  { sportIds: [8], keys: ['las vegas aces', 'aces'], venueName: 'Michelob Ultra Arena', city: 'Las Vegas', lat: 36.091, lng: -115.184, tz: 'PT' },
  { sportIds: [8], keys: ['new york liberty', 'liberty'], venueName: 'Barclays Center', city: 'Brooklyn', lat: 40.683, lng: -73.975, tz: 'ET' },
  // NHL (subset — same buildings as NBA in many markets)
  { sportIds: [6], keys: ['vegas golden knights', 'golden knights'], venueName: 'T-Mobile Arena', city: 'Las Vegas', lat: 36.103, lng: -115.178, tz: 'PT' },
  { sportIds: [6], keys: ['boston bruins', 'bruins'], venueName: 'TD Garden', city: 'Boston', lat: 42.366, lng: -71.062, tz: 'ET' },
]

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatCrossTzTravelNote(fromTz: UsTzBucket, toTz: UsTzBucket): string | null {
  if (fromTz === toTz) return null
  const from = TZ_ORDER[fromTz]
  const to = TZ_ORDER[toTz]
  if (from < to) return 'East to West'
  if (from > to) return 'West to East'
  return 'cross-time-zone'
}

export function lookupSportsVenue(sportId: number, teamName: string): SportsVenueRow | null {
  const token = norm(teamName)
  if (!token) return null
  const last = token.split(' ').pop() || ''
  for (const row of SPORTS_VENUES) {
    if (!row.sportIds.includes(sportId)) continue
    for (const key of row.keys) {
      const k = norm(key)
      if (token === k || token.includes(k) || k.includes(token) || last === k) {
        return row
      }
    }
  }
  return null
}

export type GameVenueCoords = {
  lat: number
  lng: number
  tz: UsTzBucket
  city: string
  venueName: string
}

/** Where a team plays for a given game (home arena or opponent home when away). */
export function resolveGameVenueCoords(
  sportId: number,
  teamName: string,
  isHome: boolean,
  opponentName: string,
  venueLocation?: string,
): GameVenueCoords | null {
  const homeTeamName = isHome ? teamName : opponentName
  const row = lookupSportsVenue(sportId, homeTeamName)
  if (!row) return null
  return {
    lat: row.lat,
    lng: row.lng,
    tz: row.tz,
    city: row.city,
    venueName: row.venueName,
  }
}

export const TRAVEL_MILES_THRESHOLD = 800

export function detectTravelFatigue(
  last: GameVenueCoords | null,
  current: GameVenueCoords | null,
): { travelFatigue: boolean; miles?: number; tzNote?: string } {
  if (!last || !current) return { travelFatigue: false }
  const miles = Math.round(haversineMiles(last.lat, last.lng, current.lat, current.lng))
  const tzNote = formatCrossTzTravelNote(last.tz, current.tz)
  const travelFatigue = miles >= TRAVEL_MILES_THRESHOLD || Boolean(tzNote)
  return {
    travelFatigue,
    miles: miles >= TRAVEL_MILES_THRESHOLD ? miles : undefined,
    tzNote: tzNote ?? undefined,
  }
}
