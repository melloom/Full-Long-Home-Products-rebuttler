// Add detailed error logging and ensure correct setup
const jsforce = require('jsforce');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Received Salesforce API request:', event.body);
    
    // Parse the request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { appointment, propertyInfo, customerInfo, projectType, callType, userName, appointmentConfirmed, allowSave } = requestData;

    // Validate required environment variables
    const requiredEnvVars = ['SALESFORCE_USERNAME', 'SALESFORCE_PASSWORD', 'SALESFORCE_SECURITY_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required environment variables',
          missing: missingVars
        })
      };
    }

    const conn = new jsforce.Connection();
    
    console.log('About to login with:');
    console.log('Username:', process.env.SALESFORCE_USERNAME);
    console.log('Password:', process.env.SALESFORCE_PASSWORD ? '***' : '(empty)');
    console.log('Token:', process.env.SALESFORCE_SECURITY_TOKEN ? '***' : '(empty)');
    console.log('Combined:', process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    
    try {
      await conn.login(
        process.env.SALESFORCE_USERNAME,
        process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
      );
      console.log('Login with token succeeded');
      console.log('Instance URL:', conn.instanceUrl);
    } catch (err) {
      console.log('Login with token failed, trying without token...');
      try {
        await conn.login(
          process.env.SALESFORCE_USERNAME,
          process.env.SALESFORCE_PASSWORD
        );
        console.log('Login without token succeeded');
      } catch (err2) {
        console.log('Login without token also failed.');
        console.error('Salesforce login error:', err2);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Salesforce authentication failed',
            details: err2.message
          })
        };
      }
    }

    // Helper functions
    const formatDateTime = (date, time) => {
      if (!date || !time) return '';
      const d = new Date(date);
      return `${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${time}`;
    };

    const getFullStateName = (abbreviation) => {
      const states = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
      };
      return states[abbreviation?.toUpperCase()] || abbreviation;
    };

    const getMarketSegment = (state) => {
      const stateAbbr = state?.toUpperCase();
      if (['CA', 'OR', 'WA'].includes(stateAbbr)) return 'West Coast';
      if (['NY', 'NJ', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME'].includes(stateAbbr)) return 'Northeast';
      if (['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'GA', 'FL', 'SC', 'NC', 'TN', 'KY', 'WV', 'VA', 'MD', 'DE'].includes(stateAbbr)) return 'Southeast';
      if (['IL', 'IN', 'OH', 'MI', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'ND', 'SD'].includes(stateAbbr)) return 'Midwest';
      if (['CO', 'WY', 'MT', 'ID', 'UT', 'AZ', 'NM', 'NV'].includes(stateAbbr)) return 'Mountain West';
      return 'Other';
    };

    // Create detailed recap for Lead notes
    const repRecapText = `
Appointment Details:
${formatDateTime(appointment?.date, appointment?.time)}
Call Type: ${callType || 'N/A'}
Confirmation Status: ${appointmentConfirmed ? 'Set' : 'Not Set'}
Market Segment: ${getMarketSegment(customerInfo?.state)}`;

    // Create comprehensive Lead with all customer information
    const leadData = {
      // Standard Lead fields
      FirstName: customerInfo?.firstName || '',
      LastName: customerInfo?.lastName || propertyInfo?.owner || "Unknown",
      Company: "Long Home Products",
      Email: customerInfo?.email || '',
      Phone: customerInfo?.phone || '',
      Street: customerInfo?.address || propertyInfo?.address || '',
      City: customerInfo?.city || '',
      State: getFullStateName(customerInfo?.state) || '',
      PostalCode: customerInfo?.zipCode || '',
      Country: customerInfo?.country || 'United States',
      Status: appointmentConfirmed ? 'Set' : 'Not Set',
      Description: repRecapText,
    };

    console.log('Creating Lead with data:', leadData);
    console.log('Original state:', customerInfo?.state);
    console.log('Converted state:', getFullStateName(customerInfo?.state));
    
    try {
      const result = await conn.sobject("Lead").create(leadData, allowSave ? { allowSave: true } : {});
      console.log('Lead created successfully:', result);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, result })
      };
    } catch (error) {
      // Handle Salesforce duplicate error
      if (error.errorCode === 'DUPLICATES_DETECTED' && error.data?.duplicateResult) {
        // Log the attempted duplicate for auditing
        console.log('Duplicate detected, logging attempt:', {
          leadData,
          duplicateResult: error.data.duplicateResult
        });
        // Extract duplicate info for frontend with comprehensive account information
        console.log('Connection instance URL:', conn.instanceUrl);
        console.log('Connection access token:', conn.accessToken);
        
        // Get full record details for each duplicate
        const duplicateRecords = (error.data.duplicateResult.matchResults || []).flatMap(match =>
          (match.matchRecords || []).map(record => record.Id).filter(id => id) // Filter out undefined IDs
        );
        
        console.log('Duplicate record IDs:', duplicateRecords);
        
        // Check if we have any duplicate records
        if (!duplicateRecords || duplicateRecords.length === 0) {
          console.log('No duplicate records found, returning basic error');
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({
              error: 'DUPLICATE',
              allowSave: error.data.duplicateResult.allowSave,
              duplicates: []
            })
          };
        }
        
        // Fetch full details for each duplicate record
        const duplicates = await Promise.all(duplicateRecords.map(async (recordId) => {
          try {
            const fullRecord = await conn.sobject("Lead").retrieve(recordId);
            console.log('Full record details for', recordId, ':', fullRecord);
            
            return {
              id: fullRecord.Id,
              name: fullRecord.Name || `${fullRecord.FirstName || ''} ${fullRecord.LastName || ''}`.trim() || 'Unknown',
              phone: fullRecord.Phone || 'N/A',
              email: fullRecord.Email || 'N/A',
              lastActivity: fullRecord.LastActivityDate || 'N/A',
              company: fullRecord.Company || 'N/A',
              address: fullRecord.Street || 'N/A',
              city: fullRecord.City || 'N/A',
              state: fullRecord.State || 'N/A',
              zipCode: fullRecord.PostalCode || 'N/A',
              status: fullRecord.Status || 'N/A',
              leadSource: fullRecord.LeadSource || 'N/A',
              description: fullRecord.Description || 'N/A',
              createdDate: fullRecord.CreatedDate || 'N/A',
              lastModifiedDate: fullRecord.LastModifiedDate || 'N/A',
              salesforceUrl: (() => {
                // Extract org ID from the record ID (first 3 characters)
                if (!fullRecord.Id) {
                  console.error('fullRecord.Id is undefined');
                  return 'https://login.salesforce.com';
                }
                const orgId = fullRecord.Id.substring(0, 3);
                return `https://${orgId}.salesforce.com/lightning/r/Lead/${fullRecord.Id}/view`;
              })()
            };
          } catch (fetchError) {
            console.error('Error fetching full record details for', recordId, ':', fetchError);
            // Fallback to basic record info
            return {
              id: recordId,
              name: 'Unknown',
              phone: 'N/A',
              email: 'N/A',
              lastActivity: 'N/A',
              company: 'N/A',
              address: 'N/A',
              city: 'N/A',
              state: 'N/A',
              zipCode: 'N/A',
              status: 'N/A',
              leadSource: 'N/A',
              description: 'N/A',
              createdDate: 'N/A',
              lastModifiedDate: 'N/A',
              salesforceUrl: (() => {
                if (!recordId) {
                  console.error('recordId is undefined');
                  return 'https://login.salesforce.com';
                }
                const orgId = recordId.substring(0, 3);
                return `https://${orgId}.salesforce.com/lightning/r/Lead/${recordId}/view`;
              })()
            };
          }
        }));
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'DUPLICATE',
            allowSave: error.data.duplicateResult.allowSave,
            duplicates
          })
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Salesforce API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 