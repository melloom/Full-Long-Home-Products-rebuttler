// Service Area Checker Utility
// This utility checks if an address is in Long Home's service area

// Service areas data from CSV
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

// Helper function to extract county and state from address
function extractCountyState(address) {
  if (!address) return null;
  
  // Convert to uppercase for comparison
  const upperAddress = address.toUpperCase();
  
  // Look for state abbreviations
  const states = ['MD', 'VA', 'WV', 'DE', 'MA', 'RI', 'NH', 'ME', 'CT', 'PA', 'FL'];
  let foundState = null;
  let foundCounty = null;
  
  // Find state in address
  for (const state of states) {
    if (upperAddress.includes(state)) {
      foundState = state;
      break;
    }
  }
  
  // If no state found, try to guess based on common patterns
  if (!foundState) {
    // Common patterns that might indicate a state
    if (upperAddress.includes('CIR') || upperAddress.includes('CIRCLE') || 
        upperAddress.includes('DR') || upperAddress.includes('DRIVE') ||
        upperAddress.includes('ST') || upperAddress.includes('STREET') ||
        upperAddress.includes('AVE') || upperAddress.includes('AVENUE') ||
        upperAddress.includes('RD') || upperAddress.includes('ROAD') ||
        upperAddress.includes('LN') || upperAddress.includes('LANE')) {
      
      // Try to match against all counties to find the best match
      let bestMatch = null;
      let bestScore = 0;
      
      for (const [region, counties] of Object.entries(serviceAreas)) {
        for (const countyState of counties) {
          const [county, state] = countyState.split(' ');
          const countyUpper = county.toUpperCase();
          
          // Check if any part of the address contains the county name
          if (upperAddress.includes(countyUpper)) {
            const score = countyUpper.length; // Longer county names get higher score
            if (score > bestScore) {
              bestScore = score;
              bestMatch = countyState;
            }
          }
        }
      }
      
      if (bestMatch) {
        return bestMatch;
      }
    }
    
    // If still no match, return null
    return null;
  }
  
  // Try to extract county name
  for (const region of Object.values(serviceAreas)) {
    for (const countyState of region) {
      const [county, state] = countyState.split(' ');
      if (state === foundState && upperAddress.includes(county.toUpperCase())) {
        foundCounty = county;
        break;
      }
    }
    if (foundCounty) break;
  }
  
  if (foundCounty && foundState) {
    return `${foundCounty} ${foundState}`;
  }
  
  return null;
}

// Main function to check if address is in service area
export function checkServiceArea(address) {
  if (!address) return { inServiceArea: false, region: null, county: null };
  
  const countyState = extractCountyState(address);
  if (!countyState) {
    return { inServiceArea: false, region: null, county: null };
  }
  
  // Check if county is in any service area
  for (const [region, counties] of Object.entries(serviceAreas)) {
    if (counties.includes(countyState)) {
      return {
        inServiceArea: true,
        region: region,
        county: countyState
      };
    }
  }
  
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