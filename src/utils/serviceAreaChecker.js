// Service Area Checker Utility
// This utility checks if an address is in Long Home's service area

// Service areas data from CSV - Updated with correct county mappings
const serviceAreas = {
  MIDA: [
    'Anne Arundel MD', 'Baltimore City MD', 'Baltimore County MD', 'Berkeley WV',
    'Calvert MD', 'Carroll MD', 'Cecil MD', 'Charles MD', 'District of Columbia',
    'Fredrick MD', 'Harford MD', 'Howard MD', 'Jefferson WV', 'Montgomery MD',
    'Morgan WV', 'Prince George\'s MD', 'St Mary\'s MD', 'Washington MD'
  ],
  ESDE: [
    'Caroline MD', 'Dorchester MD', 'Kent DE', 'Kent MD', 'Queen Anne\'s MD',
    'Somerset MD', 'Sussex DE', 'Talbot MD', 'Wicomico MD', 'Worcester MD'
  ],
  NOVA: [
    'Alexandria VA', 'Arlington VA', 'Caroline VA', 'Charles City VA', 'Chesterfield VA',
    'Clarke VA', 'Colonial Heights VA', 'Culpeper VA', 'Essex VA', 'Fairfax VA',
    'Falls Church VA', 'Fauquier VA', 'Fredrick VA', 'Fredricksburg VA', 'Gloucester VA',
    'Goochland VA', 'Hanover VA', 'Henrico VA', 'Hopewell VA', 'King and Queen VA',
    'King George VA', 'King William VA', 'Lancaster VA', 'Loudon VA', 'Louisa VA',
    'Madison VA', 'Manassas Park VA', 'Manassas VA', 'Mathews VA', 'Middlesex VA',
    'New Kent VA', 'Northumberland VA', 'Orange VA', 'Petersburg VA', 'Powhatan VA',
    'Prince William VA', 'Rappahanncock VA', 'Richmond City VA', 'Richmond County VA',
    'Spotsylvania VA', 'Stafford VA', 'Warren VA', 'Westmoreland VA', 'Winchester VA'
  ],
  NENG: [
    'Barnstable MA', 'Bristol MA', 'Bristol RI', 'Essex MA', 'Kent RI',
    'Middlessex MA', 'Newport RI', 'Norfolk MA', 'Plymouth MA', 'Providence RI',
    'Suffolk MA', 'Suffolk MA', 'Washington RI', 'Worcester MA'
  ],
  NHME: [
    'Bellknap NH', 'Carroll NH', 'Cheshire NH', 'Cumberland ME', 'Grafton NH',
    'Hillsborough NH', 'Merrimack NH', 'Rockingham NH', 'Strafford NH', 'Sullivan NH',
    'York ME'
  ],
  CTWM: [
    'Berkshire MA', 'Fairfield CT', 'Franklin MA', 'Hampden MA', 'Hampshire MA',
    'Hartford CT', 'Litchfield CT', 'Middlessex CT', 'New Haven CT', 'New London CT',
    'Tolland CT', 'Windham CT'
  ],
  SOPA: [
    'Adams PA', 'Berks PA', 'Carbon PA', 'Chester PA', 'Columbia PA',
    'Cumberland PA', 'Dauphin PA', 'Juniata PA', 'Lancaster PA', 'Lebanon PA',
    'Lehigh PA', 'Montour PA', 'Northumberland PA', 'Perry PA', 'Schuylkill PA',
    'Snyder PA', 'Union PA', 'York PA'
  ],
  WCFL: [
    'Citrus FL', 'DeSoto FL', 'Hardee FL', 'Hernando FL', 'Hillsborough FL',
    'Manatee FL', 'Pasco FL', 'Pinellas FL', 'Polk FL', 'Sarasota FL'
  ]
};

// Enhance the county extraction logic to better handle addresses
function extractCountyState(address) {
  if (!address) return null;
  
  console.log('🔍 Checking address:', address);
  
  // Convert to uppercase for comparison
  const upperAddress = address.toUpperCase();
  
  // Look for state abbreviations with word boundaries to avoid false matches
  const states = ['MD', 'VA', 'WV', 'DE', 'MA', 'RI', 'NH', 'ME', 'CT', 'PA', 'FL'];
  let foundState = null;
  let foundCounty = null;
  
  // Find state in address - use regex to match whole words only
  for (const state of states) {
    // Use regex to match state as a whole word (not part of another word)
    const stateRegex = new RegExp(`\\b${state}\\b`); // Corrected escaping
    if (stateRegex.test(upperAddress)) {
      foundState = state;
      console.log('📍 Found state:', foundState);
      break;
    }
  }
  
  // If no state found, try to guess based on common patterns
  if (!foundState) {
    console.log('⚠️ No state found in address');
    return null;
  }
  
  // Try to extract county name - improved logic
  for (const [region, counties] of Object.entries(serviceAreas)) {
    for (const countyState of counties) {
      const [county, state] = countyState.split(' ');
      if (state === foundState) {
        const countyUpper = county.toUpperCase();
        
        // Check if any part of the address contains the county name
        if (upperAddress.includes(countyUpper)) {
          foundCounty = county;
          console.log('📍 Found county:', foundCounty, 'in region:', region);
          break;
        }
      }
    }
    if (foundCounty) break;
  }
  
  // If no county found, try to determine by zip code or city
  if (!foundCounty && foundState === 'MD') {
    // For Maryland, try to determine county by city or zip code
    if (upperAddress.includes('SEVERN') || upperAddress.includes('21144')) {
      foundCounty = 'Anne Arundel';
      console.log('📍 Determined Anne Arundel County from city/zip');
    } else if (upperAddress.includes('HANOVER') || upperAddress.includes('21076')) {
      foundCounty = 'Howard';
      console.log('📍 Determined Howard County from city/zip');
    } else if (upperAddress.includes('BALTIMORE')) {
      foundCounty = 'Baltimore';
      console.log('📍 Determined Baltimore County from city');
    } else if (upperAddress.includes('ROCKVILLE') || upperAddress.includes('BETHESDA') || upperAddress.includes('SILVER SPRING')) {
      foundCounty = 'Montgomery';
      console.log('📍 Determined Montgomery County from city');
    } else if (upperAddress.includes('LAUREL') || upperAddress.includes('20708')) {
      foundCounty = 'Prince George\'s';
      console.log('📍 Determined Prince George\'s County from city/zip');
    }
  }
  
  if (foundCounty && foundState) {
    const result = `${foundCounty} ${foundState}`;
    console.log('✅ Final result:', result);
    return result;
  }
  
  console.log('❌ Could not determine county/state');
  return null;
}

// Main function to check if address is in service area
export function checkServiceArea(address) {
  if (!address) {
    console.log('❌ No address provided');
    return { inServiceArea: false, region: null, county: null };
  }
  
  const countyState = extractCountyState(address);
  if (!countyState) {
    console.log('❌ Could not extract county/state from address');
    return { inServiceArea: false, region: null, county: null };
  }
  
  // Check if county is in any service area
  for (const [region, counties] of Object.entries(serviceAreas)) {
    if (counties.includes(countyState)) {
      console.log('✅ Address is in service area:', region, countyState);
      return {
        inServiceArea: true,
        region: region,
        county: countyState
      };
    }
  }
  
  console.log('❌ Address not in any service area:', countyState);
  return { inServiceArea: false, region: null, county: null };
}

// Get all service areas for display
export function getAllServiceAreas() {
  return serviceAreas;
}

// Get service areas by region
export function getServiceAreasByRegion(region) {
  return serviceAreas[region] || [];
} 