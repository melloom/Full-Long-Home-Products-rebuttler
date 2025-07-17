const express = require('express');
const jsforce = require('jsforce');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

console.log('USERNAME:', process.env.SALESFORCE_USERNAME);
console.log('PASSWORD:', process.env.SALESFORCE_PASSWORD ? '***' : '(empty)');
console.log('TOKEN:', process.env.SALESFORCE_SECURITY_TOKEN ? '***' : '(empty)');

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Salesforce backend is running!');
});

app.post('/api/sendToSalesforce', async (req, res) => {
  console.log('Received Salesforce API request:', req.body);
  const { appointment, propertyInfo, customerInfo, projectType, callType, userName, appointmentConfirmed } = req.body;

  const conn = new jsforce.Connection();
  try {
    console.log('About to login with:');
    console.log('Username:', process.env.SALESFORCE_USERNAME);
    console.log('Password:', process.env.SALESFORCE_PASSWORD);
    console.log('Token:', process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('Combined:', process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    try {
      await conn.login(
        process.env.SALESFORCE_USERNAME,
        process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
      );
      console.log('Login with token succeeded');
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
        throw err2;
      }
    }

    // Create detailed recap for Lead notes
    const formatDateTime = (date, time) => {
      if (!date || !time) return '';
      const d = new Date(date);
      return `${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${time}`;
    };

    // Convert state abbreviation to full state name for Salesforce
    const getFullStateName = (stateAbbr) => {
      const stateMap = {
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
      return stateMap[stateAbbr?.toUpperCase()] || stateAbbr;
    };

    // Determine market segment based on state/region
    const getMarketSegment = (state) => {
      const stateUpper = state ? state.toUpperCase() : '';
      if (['MD', 'MARYLAND'].includes(stateUpper)) return 'MIDA';
      if (['VA', 'VIRGINIA'].includes(stateUpper)) return 'MIDA';
      if (['PA', 'PENNSYLVANIA'].includes(stateUpper)) return 'MIDA';
      if (['DE', 'DELAWARE'].includes(stateUpper)) return 'MIDA';
      if (['NJ', 'NEW JERSEY'].includes(stateUpper)) return 'MIDA';
      if (['NY', 'NEW YORK'].includes(stateUpper)) return 'MIDA';
      if (['CT', 'CONNECTICUT'].includes(stateUpper)) return 'MIDA';
      if (['MA', 'MASSACHUSETTS'].includes(stateUpper)) return 'MIDA';
      if (['RI', 'RHODE ISLAND'].includes(stateUpper)) return 'MIDA';
      if (['NH', 'NEW HAMPSHIRE'].includes(stateUpper)) return 'MIDA';
      if (['VT', 'VERMONT'].includes(stateUpper)) return 'MIDA';
      if (['ME', 'MAINE'].includes(stateUpper)) return 'MIDA';
      return 'MIDA'; // Default to MIDA
    };

    const repRecapText = `🔍 Lead Notes – ${customerInfo?.address || propertyInfo?.address || 'N/A'}

🏠 Homeownership: Yes${customerInfo?.firstName ? ` (Owner: ${customerInfo.firstName} ${customerInfo.lastName})` : ''}
👤 Decision-Makers: All required parties will be present
📌 Project Interest:
• ${projectType === 'bath' ? 'Bathroom remodel – replacing old tub with walk-in shower' : projectType === 'roof' ? 'Roof replacement' : 'N/A'}

🗂️ Customer Details:
• Name: ${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}
• Phone: ${customerInfo?.phone || 'N/A'}
• Email: ${customerInfo?.email || 'N/A'}
• Address: ${customerInfo?.address || 'N/A'}, ${customerInfo?.city || ''}, ${customerInfo?.state || ''} ${customerInfo?.zipCode || ''}
${customerInfo?.secondaryName ? `• Secondary Contact: ${customerInfo.secondaryName} (${customerInfo.relationshipToPrimary || 'N/A'})\n` : ''}
${customerInfo?.secondaryPhone ? `• Secondary Phone: ${customerInfo.secondaryPhone}\n` : ''}
${customerInfo?.secondaryEmail ? `• Secondary Email: ${customerInfo.secondaryEmail}\n` : ''}

🗂️ Property Details:
${propertyInfo?.owner ? `• Owner: ${propertyInfo.owner}\n` : ''}${propertyInfo?.county ? `• County: ${propertyInfo.county}` : ''}${propertyInfo?.countyFips ? ` (FIPS: ${propertyInfo.countyFips})` : ''}
${propertyInfo?.acres ? `• Acres: ${propertyInfo.acres}\n` : ''}${propertyInfo?.apn ? `• APN: ${propertyInfo.apn}\n` : ''}

📅 Appointment Set: ${formatDateTime(appointment.date, appointment.time)}
${appointmentConfirmed ? '✅ Appointment Set (No Follow-up Needed)' : '⏳ Appointment Not Set (Follow-up Required)'}

✅ REP NOTES
Rep Name: ${userName || 'N/A'}
Customer Name: ${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}
Address: ${customerInfo?.address || 'N/A'}
Project Type: ${projectType === 'bath' ? 'Bathroom remodel' : projectType === 'roof' ? 'Roof replacement' : 'N/A'}
Appointment Date & Time: ${formatDateTime(appointment.date, appointment.time)}
Call Type: ${callType}
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
      Status: req.body.status || "Set",
      Description: repRecapText,
      
      // Custom fields (if they exist in your Salesforce org)
      // Secondary Contact Information
      // Secondary_Name__c: customerInfo?.secondaryName || '',
      // Secondary_Phone__c: customerInfo?.secondaryPhone || '',
      // Secondary_Email__c: customerInfo?.secondaryEmail || '',
      // Relationship_to_Primary__c: customerInfo?.relationshipToPrimary || '',
      
      // Project Information
      // Project_Type__c: projectType,
      // Call_Type__c: callType,
      // Rep_Name__c: userName || '',
      // Appointment_Date__c: appointment?.date || '',
      // Appointment_Time__c: appointment?.time || '',
      // Appointment_Confirmed__c: appointmentConfirmed || false,
      
      // Property Information
      // Property_County__c: propertyInfo?.county || '',
      // Property_Acres__c: propertyInfo?.acres || '',
      // APN_Number__c: propertyInfo?.apn || '',
      // Market_Segment__c: getMarketSegment(customerInfo?.state)
    };

    console.log('Creating Lead with data:', leadData);
    console.log('Original state:', customerInfo?.state);
    console.log('Converted state:', getFullStateName(customerInfo?.state));
    const result = await conn.sobject("Lead").create(leadData);
    console.log('Lead created successfully:', result);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Salesforce API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001')); 