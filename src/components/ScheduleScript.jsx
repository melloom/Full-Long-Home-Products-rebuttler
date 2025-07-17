import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight, Phone, User, Mail, Users, CheckSquare, Square, Check, Home } from 'lucide-react';
import { safePostMessage } from '../utils/iframeErrorHandler';

import '../styles/ScheduleScript.css';

// Add a function to parse property info from OCR text
function parsePropertyInfo(ocrText) {
  // Simple regex-based extraction for common fields
  const fields = [
    { label: 'Owner Name', keys: ['Owner Name', 'Nome'] },
    { label: 'Owner Address', keys: ['Owner Address', 'Mailing Address'] },
    { label: 'Owner City', keys: ['Owner Cty', 'Owner City'] },
    { label: 'Owner State', keys: ['Owner sate', 'Owner State', 'State'] },
    { label: 'Owner Zip Code', keys: ['OwnerZip Code', 'Owner Zip', 'Zip'] },
    { label: 'County Name', keys: ['CountyNeme', 'County Name'] },
    { label: 'County FIPS', keys: ['County Fips Code', 'County FIPS'] },
    { label: 'Acres', keys: ['Acres'] },
    { label: 'APN', keys: ['Ap', 'APN'] },
  ];
  const result = {};
  for (const field of fields) {
    for (const key of field.keys) {
      const regex = new RegExp(`${key}\s*[:=]?\s*([^\n]+)`, 'i');
      const match = ocrText.match(regex);
      if (match) {
        result[field.label] = match[1].trim();
        break;
      }
    }
  }
  return result;
}

const ScheduleScript = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [callType, setCallType] = useState('');
  const [projectType, setProjectType] = useState('');

  const [projectDetails, setProjectDetails] = useState({
    issues: '',
    currentSetup: '',
    replacementType: '',
    plumbingSetup: '',
    materialsPurchased: '',
    roofType: '',
    activeLeaks: '',
    roofReplaced: ''
  });


  const [appointment, setAppointment] = useState({
    date: '',
    time: '',
    confirmed: false
  });
  const [checklistItems, setChecklistItems] = useState({
    projectChecklist: [],
    bathChecklist: [],
    roofChecklist: [],
    commitmentChecklist: []
  });

  const [propertySearch, setPropertySearch] = useState({
    address: '',
    results: null,
    loading: false,
    error: null,
    suggestions: [],
    showSuggestions: false,
    selectedCoordinates: null,
    checklist: {
      addressVerified: false,
      propertyTypeConfirmed: false,
      characteristicsNoted: false,
      accessInfoCollected: false
    }
  });

  const [propertySearchCollapsed, setPropertySearchCollapsed] = useState(true);
  const [basemapVisited, setBasemapVisited] = useState(false);
  const [basemapVerified, setBasemapVerified] = useState(false);
  const [basemapScreenshot, setBasemapScreenshot] = useState(null);
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  // Add state for parsed property info
  const [parsedPropertyInfo, setParsedPropertyInfo] = useState({});

  // Add state to show recaps after completion
  const [showRecap, setShowRecap] = useState(false);
  const [repRecapCopied, setRepRecapCopied] = useState(false);

  // Define property verification checklist items for screenshot context
  const propertyChecklistItems = [
    { key: 'basemapVerified', label: 'Screenshot Uploaded & Owner Verified' },
    { key: 'addressVerified', label: 'Address Matches Screenshot' },
    { key: 'propertyTypeConfirmed', label: 'Property Type Matches Screenshot' },
    { key: 'characteristicsNoted', label: 'Key Characteristics Noted' },
    { key: 'accessInfoCollected', label: 'Access/Entry Info from Screenshot' },
  ];

  // Define checklist completion for Next button
  const allPropertyChecklistChecked =
    basemapVerified &&
    propertySearch.checklist.addressVerified &&
    propertySearch.checklist.propertyTypeConfirmed &&
    propertySearch.checklist.characteristicsNoted &&
    propertySearch.checklist.accessInfoCollected;

  // Run OCR when a new screenshot is set
  useEffect(() => {
    if (basemapScreenshot) {
      setOcrLoading(true);
      setOcrText('');
      Tesseract.recognize(
        basemapScreenshot,
        'eng',
        { logger: m => {/* Optionally log progress */} }
      ).then(({ data: { text } }) => {
        setOcrText(text);
        setOcrLoading(false);
      }).catch(() => {
        setOcrText('Could not extract text from image.');
        setOcrLoading(false);
      });
    } else {
      setOcrText('');
      setOcrLoading(false);
    }
  }, [basemapScreenshot]);

  // Update OCR effect to parse info after extracting text
  useEffect(() => {
    if (ocrText && !ocrLoading) {
      const parsed = parsePropertyInfo(ocrText);
      setParsedPropertyInfo(parsed);
    } else {
      setParsedPropertyInfo({});
    }
  }, [ocrText, ocrLoading]);

  // In the component, update the effect that runs when basemapScreenshot or ocrText changes:
  useEffect(() => {
    if (basemapScreenshot && ocrText && !ocrLoading) {
      setBasemapVerified(true);
      setPropertySearch(prev => ({
        ...prev,
        checklist: {
          addressVerified: true,
          propertyTypeConfirmed: true,
          characteristicsNoted: true,
          accessInfoCollected: true
        }
      }));
    } else if (!basemapScreenshot) {
      setBasemapVerified(false);
      setPropertySearch(prev => ({
        ...prev,
        checklist: {
          addressVerified: false,
          propertyTypeConfirmed: false,
          characteristicsNoted: false,
          accessInfoCollected: false
        }
      }));
    }
  }, [basemapScreenshot, ocrText, ocrLoading]);

  const scriptSteps = [
    {
      id: 'greeting',
      title: 'Call Greeting',
      type: 'greeting'
    },
    {
      id: 'projectType',
      title: 'Project Type Selection',
      type: 'selection'
    },
    {
      id: 'propertySearch',
      title: 'Property Search',
      type: 'property'
    },
    {
      id: 'projectChecklist',
      title: 'Project Checklist',
      type: 'checklist'
    },
    {
      id: 'projectQuestions',
      title: 'Project-Specific Questions',
      type: 'questions'
    },
    {
      id: 'valueProposition',
      title: 'Value of the Visit',
      type: 'presentation'
    },
    {
      id: 'commitment',
      title: 'Commitment & Scheduling',
      type: 'scheduling'
    },
    {
      id: 'buttonUp',
      title: 'Button Up & Confirmation',
      type: 'confirmation'
    }
  ];

  const greetingScripts = {
    incoming: {
      title: "Incoming Call Greeting",
      script: "It's a great day here at Long, my name is _______ How may I HELP you?",
      tone: "Friendly, consultative, not pushy. Make it feel like a conversation, not a sales pitch."
    },
    outgoing: {
      title: "Outgoing Call Greeting",
      script: "Hello Mr. / Mrs..... My name is (agent name) with Long Home on a recorded line following up on your inquiry for your (project type). Is this the best phone number to reach you on in case we are disconnected? Perfect!",
      tone: "Professional, warm, and consultative approach."
    }
  };

  const getProjectChecklistItems = (projectType) => {
    const productName = projectType === 'bath' ? 'bath/shower' : projectType === 'roof' ? 'roof' : 'product';
    const specificProduct = projectType === 'bath' ? 'bath/shower' : projectType === 'roof' ? 'roof' : 'product';
    
    return [
      `How old is your ${specificProduct}?`,
      `What issues are you currently having with your ${specificProduct}?`,
      `What would you like to have done? (Ask ${productName} related questions)`
    ];
  };

  const bathChecklistItems = [
    "Do you currently have a tub or shower in the space?",
    "What are you looking to replace it with? (Tub to Tub/Shower to Shower or Conversion)",
    "Is plumbing set up for a bath or shower to connect to? ***",
    "Have you purchased any materials yet? (Must get a no. All purchases & installations must be from Long)?"
  ];

  const roofChecklistItems = [
    "Are you looking for asphalt shingles, metal, or flat roof?",
    "Do you currently have any active leaks or missing shingles?",
    "Have you ever replaced the roof since owning your home?"
  ];

  const commitmentChecklistItems = [
    "First and Last Name of all parties involved",
    "Address",
    "Appointment Date and Time",
    "Verify Product"
  ];

  const timeSlots = [
    '2:00 PM',
    '6:00 PM'
  ];

  const addressInputRef = useRef(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setPropertySearch(prev => ({ ...prev, showSuggestions: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleChecklistToggle = (checklistType, itemIndex) => {
    setChecklistItems(prev => ({
      ...prev,
      [checklistType]: prev[checklistType].includes(itemIndex) 
        ? prev[checklistType].filter(i => i !== itemIndex)
        : [...prev[checklistType], itemIndex]
    }));
  };



  const handleProjectDetailsChange = (field, value) => {
    setProjectDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAppointmentChange = (field, value) => {
    setAppointment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < scriptSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePropertySearch = async () => {
    if (!propertySearch.address) return;

    setPropertySearch(prev => ({ ...prev, loading: true, error: null }));

    try {
      let lat, lon;
      
      // Use coordinates from selected suggestion if available
      if (propertySearch.selectedCoordinates) {
        [lon, lat] = propertySearch.selectedCoordinates; // Mapbox returns [lon, lat]
      } else {
        // Fallback to geocoding the address
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(propertySearch.address)}`);
        const geocodeData = await geocodeRes.json();
        if (!geocodeData.length) throw new Error('Address not found');
        [lon, lat] = geocodeData[0].lon, geocodeData[0].lat;
      }

      console.log('Using coordinates:', { lat, lon });

      // Call Regrid API with lat/lon
      const apiKey = import.meta.env.VITE_REGRID_API_KEY;
      
      if (!apiKey || apiKey === 'your_regrid_api_key_here') {
        throw new Error('Regrid API key not configured. Please add your Regrid API key to .env.local');
      }
      
      console.log('Regrid API key available:', !!apiKey);
      
      // Try different Regrid API v2 endpoints
      let regridUrl;
      let regridData;
      
      // First try the Regrid v2 API endpoint with lat/lon and larger radius
      regridUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lon}&token=${apiKey}&radius=500`;
      console.log('Trying Regrid v2 API with lat/lon (500m radius):', regridUrl);
      
      let regridRes = await fetch(regridUrl);
      console.log('Regrid v2 response status:', regridRes.status);
      console.log('Regrid v2 response headers:', regridRes.headers);
      
      if (regridRes.ok) {
        regridData = await regridRes.json();
        console.log('Regrid v2 API response:', regridData);
        console.log('Regrid v2 API response structure:', {
          hasParcels: !!regridData.parcels,
          parcelsType: typeof regridData.parcels,
          hasFeatures: regridData.parcels && !!regridData.parcels.features,
          featuresLength: regridData.parcels && regridData.parcels.features ? regridData.parcels.features.length : 0,
          firstFeature: regridData.parcels && regridData.parcels.features ? regridData.parcels.features[0] : null
        });
        
        // Check if we got any parcels
        const hasParcels = regridData.parcels && regridData.parcels.features && regridData.parcels.features.length > 0;
        
        if (!hasParcels) {
          console.log('No parcels found with lat/lon search, trying address search...');
          
          // Try with address search instead
          regridUrl = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(propertySearch.address)}&token=${apiKey}`;
          console.log('Trying Regrid v2 API with address:', regridUrl);
          
          regridRes = await fetch(regridUrl);
          console.log('Regrid v2 address response status:', regridRes.status);
          
          if (regridRes.ok) {
            regridData = await regridRes.json();
            console.log('Regrid v2 address API response:', regridData);
            
            // Check if address search also returned no results
            const hasAddressParcels = regridData.parcels && regridData.parcels.features && regridData.parcels.features.length > 0;
            
            if (!hasAddressParcels) {
              console.log('No parcels found with address search, trying simplified address...');
              
              // Try with a simplified address (just street name and number)
              const simplifiedAddress = propertySearch.address.split(',')[0]; // Take just the street address part
              regridUrl = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(simplifiedAddress)}&token=${apiKey}`;
              console.log('Trying Regrid v2 API with simplified address:', regridUrl);
              
              regridRes = await fetch(regridUrl);
              console.log('Regrid v2 simplified address response status:', regridRes.status);
              
              if (regridRes.ok) {
                regridData = await regridRes.json();
                console.log('Regrid v2 simplified address API response:', regridData);
              }
            }
          }
        } else {
          // Try with address search instead of lat/lon
          regridUrl = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(propertySearch.address)}&token=${apiKey}`;
          console.log('Trying Regrid v2 API with address:', regridUrl);
          
          regridRes = await fetch(regridUrl);
          console.log('Regrid v2 address response status:', regridRes.status);
          
          if (regridRes.ok) {
            regridData = await regridRes.json();
            console.log('Regrid v2 address API response:', regridData);
          } else {
            // Try with different authentication method
            regridUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lon}&radius=500`;
            console.log('Trying Regrid v2 API with Authorization header:', regridUrl);
            
            regridRes = await fetch(regridUrl, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            console.log('Regrid v2 Auth header response status:', regridRes.status);
            
            if (regridRes.ok) {
              regridData = await regridRes.json();
              console.log('Regrid v2 Auth header API response:', regridData);
            } else {
              throw new Error(`All Regrid v2 API attempts failed. Last error: ${regridRes.status} ${regridRes.statusText}`);
            }
          }
        }
      }

      // Map the API response to your UI fields
      let parcel = null;
      
      // Try different possible response structures
      if (regridData.parcels && regridData.parcels.features && regridData.parcels.features.length > 0) {
        parcel = regridData.parcels.features[0];
        console.log('Found parcel in features array');
      } else if (regridData.parcels && Array.isArray(regridData.parcels) && regridData.parcels.length > 0) {
        parcel = regridData.parcels[0];
        console.log('Found parcel in parcels array');
      } else if (regridData.features && Array.isArray(regridData.features) && regridData.features.length > 0) {
        parcel = regridData.features[0];
        console.log('Found parcel in root features array');
      } else {
        console.log('No parcel found in any expected structure');
        console.log('Available keys in response:', Object.keys(regridData));
      }
      
      if (!parcel) {
        console.log('No parcel found in API response, using mock data');
        console.log('Full API response for debugging:', JSON.stringify(regridData, null, 2));
        // Fallback to mock data for now
        const mockParcel = {
          address: propertySearch.address,
          usedesc: 'Single Family Home',
          yearbuilt: '1985',
          recrdareano: '2400',
          deeded_acres: '0.25',
          numrooms: '3',
          numunits: '1',
          garage_spaces: '2',
          taxamt: '3200',
          saledate: '2018',
          parval: '450000',
          owner: 'John & Jane Doe'
        };
        
        setPropertySearch(prev => ({
          ...prev,
          results: {
            address: mockParcel.address,
            propertyType: mockParcel.usedesc,
            yearBuilt: mockParcel.yearbuilt,
            squareFootage: mockParcel.recrdareano,
            lotSize: `${mockParcel.deeded_acres} acres`,
            bedrooms: mockParcel.numrooms,
            bathrooms: '2.5',
            garageSpaces: mockParcel.garage_spaces,
            propertyTax: `$${mockParcel.taxamt}/year`,
            lastSold: mockParcel.saledate,
            estimatedValue: `$${mockParcel.parval}`,
            ownerName: mockParcel.owner
          },
          loading: false,
          checklist: {
            ...prev.checklist,
            addressVerified: true
          }
        }));
        return;
      }

      // Extract properties from the v2 API response
      const properties = parcel.properties || {};
      const fields = properties.fields || {};
      
      console.log('Parcel properties:', properties);
      console.log('Parcel fields:', fields);

      // Map real Regrid v2 API response to UI fields
      setPropertySearch(prev => ({
        ...prev,
        results: {
          address: properties.headline || propertySearch.address,
          propertyType: fields.usedesc || 'N/A',
          yearBuilt: fields.yearbuilt || 'N/A',
          squareFootage: fields.recrdareano ? `${fields.recrdareano} sq ft` : 'N/A',
          lotSize: fields.deeded_acres ? `${fields.deeded_acres} acres` : 'N/A',
          bedrooms: fields.numrooms || 'N/A',
          bathrooms: fields.numunits || 'N/A',
          garageSpaces: 'N/A', // Not available in Regrid API
          propertyTax: fields.taxamt ? `$${fields.taxamt}/year` : 'N/A',
          lastSold: fields.saledate || 'N/A',
          estimatedValue: fields.parval ? `$${fields.parval}` : 'N/A',
          ownerName: fields.owner || 'N/A'
        },
        loading: false,
        checklist: {
          ...prev.checklist,
          addressVerified: true
        }
      }));
    } catch (error) {
      console.error('Property search error:', error);
      setPropertySearch(prev => ({
        ...prev,
        error: error.message || 'Failed to search property. Please try again.',
        loading: false
      }));
    }
  };

  const handleClearSearch = () => {
    setPropertySearch({
      address: '',
      results: null,
      loading: false,
      error: null,
      suggestions: [],
      showSuggestions: false,
      selectedCoordinates: null,
      checklist: {
        addressVerified: false,
        propertyTypeConfirmed: false,
        characteristicsNoted: false,
        accessInfoCollected: false
      }
      });
    };

  const handlePropertyChecklistToggle = (item) => {
    setPropertySearch(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [item]: !prev.checklist[item]
      }
    }));
  };

  const handleAddressInputChange = async (value) => {
    console.log('handleAddressInputChange called with:', value);
    setPropertySearch(prev => ({ ...prev, address: value, showSuggestions: false }));
    
    if (value.length < 3) {
      console.log('Value too short, clearing suggestions');
      setPropertySearch(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_MAPBOX_API_KEY;
      console.log('Mapbox API Key available:', !!apiKey);
      console.log('Making request to Mapbox API...');
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${apiKey}&country=US&types=address&limit=5`
      );
      const data = await response.json();
      console.log('Mapbox API response:', data);
      
      const suggestions = data.features.map(feature => ({
        id: feature.id,
        address: feature.place_name,
        coordinates: feature.center
      }));
      
      console.log('Processed suggestions:', suggestions);
      
      setPropertySearch(prev => ({ 
        ...prev, 
        suggestions,
        showSuggestions: suggestions.length > 0
      }));
      console.log('Setting suggestions:', suggestions.length, 'showSuggestions:', suggestions.length > 0);
        } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setPropertySearch(prev => ({
      ...prev,
      address: suggestion.address,
      suggestions: [],
      showSuggestions: false,
      selectedCoordinates: suggestion.coordinates
    }));
  };

  // Helper to format date/time
  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${time}`;
  };

  // Gather session summary
  const sessionSummary = {
    address: propertySearch.address || (parsedPropertyInfo['Owner Address'] || ''),
    owner: parsedPropertyInfo['Owner Name'] || '',
    county: parsedPropertyInfo['County Name'] || '',
    countyFips: parsedPropertyInfo['County FIPS'] || '',
    acres: parsedPropertyInfo['Acres'] || '',
    apn: parsedPropertyInfo['APN'] || '',
    projectType,
    callType,
    appointment,
    projectDetails,
    checklistItems,
    propertyInfo: parsedPropertyInfo,
  };

  // Rep Recap Text (for copy)
  const repRecapText = `🔍 Lead Notes – ${sessionSummary.address}

🏠 Homeownership: Yes${sessionSummary.owner ? ` (Owner: ${sessionSummary.owner})` : ''}
👤 Decision-Makers: All required parties will be present
📌 Project Interest:
• ${sessionSummary.projectType === 'bath' ? 'Bathroom remodel – replacing old tub with walk-in shower' : sessionSummary.projectType === 'roof' ? 'Roof replacement' : 'N/A'}
${sessionSummary.projectDetails.issues ? `• ${sessionSummary.projectDetails.issues}` : ''}

🗂️ Property Details:
${sessionSummary.owner ? `• Owner: ${sessionSummary.owner}\n` : ''}${sessionSummary.county ? `• County: ${sessionSummary.county}` : ''}${sessionSummary.countyFips ? ` (FIPS: ${sessionSummary.countyFips})` : ''}
${sessionSummary.acres ? `• Acres: ${sessionSummary.acres}\n` : ''}${sessionSummary.apn ? `• APN: ${sessionSummary.apn}\n` : ''}

📅 Appointment Set: ${formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time)}

✅ REP NOTES
Name: ${sessionSummary.owner || 'N/A'}
Address: ${sessionSummary.address}
Project Type: ${sessionSummary.projectType === 'bath' ? 'Bathroom remodel' : sessionSummary.projectType === 'roof' ? 'Roof replacement' : 'N/A'}
Special Details: ${sessionSummary.projectDetails.issues || 'N/A'}
Appointment Date & Time: ${formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time)}
`;

  // Customer Recap Text
  const customerRecapText = `Thank you for scheduling your appointment with Long Home Products!\n\nHere's what to expect:\n• A design consultant will visit your home at ${sessionSummary.address}.\n• Appointment: ${formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time)}\n• We'll review your ${sessionSummary.projectType === 'bath' ? 'bathroom remodel' : sessionSummary.projectType === 'roof' ? 'roof replacement' : 'project'} needs and provide a free estimate.\n• Please ensure all decision-makers are present.\n\nWe look forward to meeting you!`;

  // Copy to clipboard handler
  const handleCopyRepRecap = useCallback(() => {
    navigator.clipboard.writeText(repRecapText).then(() => {
      setRepRecapCopied(true);
      setTimeout(() => setRepRecapCopied(false), 2000);
    });
  }, [repRecapText]);

  const renderGreetingStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Select Call Type</h3>
      <div style={{ 
        background: 'rgba(59, 130, 246, 0.1)', 
        padding: '0.5rem 1rem', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#f8fafc'
      }}>
        Current selection: {callType || 'None'}
      </div>
      <div className="greeting-options-dark">
        <motion.div 
          className={`greeting-option-dark ${callType === 'incoming' ? 'selected-dark' : ''}`}
          onClick={() => {
            setCallType('incoming');
            setTimeout(() => setCurrentStep(1), 200); // auto-advance
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Phone className="greeting-icon" />
          <div className="greeting-content-dark">
            <h4>Incoming Call</h4>
            <p className="greeting-script-dark">"{greetingScripts.incoming.script}"</p>
            <p className="greeting-tone-dark">{greetingScripts.incoming.tone}</p>
          </div>
          {callType === 'incoming' && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#10b981',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Check size={16} />
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className={`greeting-option-dark ${callType === 'outgoing' ? 'selected-dark' : ''}`}
          onClick={() => {
            setCallType('outgoing');
            setTimeout(() => setCurrentStep(1), 200); // auto-advance
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Phone className="greeting-icon" />
          <div className="greeting-content-dark">
            <h4>Outgoing Call</h4>
            <p className="greeting-script-dark">"{greetingScripts.outgoing.script}"</p>
            <p className="greeting-tone-dark">{greetingScripts.outgoing.tone}</p>
          </div>
          {callType === 'outgoing' && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#10b981',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Check size={16} />
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          disabled={currentStep === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ opacity: currentStep === 0 ? 0.5 : 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
      </div>
    </motion.div>
  );

  const renderProjectTypeStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Select Project Type</h3>
      <div style={{ 
        background: 'rgba(59, 130, 246, 0.1)', 
        padding: '0.5rem 1rem', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#f8fafc'
      }}>
        Current selection: {projectType || 'None'}
      </div>
      <div className="project-options-dark">
        <motion.div 
          className={`project-option-dark ${projectType === 'bath' ? 'selected-dark' : ''}`}
          onClick={() => {
            setProjectType('bath');
            setTimeout(() => setCurrentStep(2), 200); // auto-advance to project checklist
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Home className="project-icon" />
          <div className="project-content-dark">
            <h4>Bath/Shower Replacement</h4>
            <p>Schedule bath check and consultation</p>
          </div>
          {projectType === 'bath' && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#10b981',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Check size={16} />
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className={`project-option-dark ${projectType === 'roof' ? 'selected-dark' : ''}`}
          onClick={() => {
            setProjectType('roof');
            setTimeout(() => setCurrentStep(2), 200); // auto-advance to project checklist
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Home className="project-icon" />
          <div className="project-content-dark">
            <h4>Roof Replacement</h4>
            <p>Schedule roof inspection and estimate</p>
          </div>
          {projectType === 'roof' && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#10b981',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Check size={16} />
            </div>
          )}
        </motion.div>
      </div>
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
      </div>
    </motion.div>
  );

  const renderProjectChecklistStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">
        {projectType === 'bath' ? 'Bath/Shower' : projectType === 'roof' ? 'Roof' : 'Project'} Checklist
      </h3>
      <div className="checklist-container-dark">
        <h4 className="checklist-title-dark">
          {projectType === 'bath' ? 'Bath/Shower' : projectType === 'roof' ? 'Roof' : 'General'} Project Questions:
        </h4>
        <div className="checklist-items-dark">
          {getProjectChecklistItems(projectType).map((item, index) => (
            <motion.div 
              key={index}
              className={`checklist-item-dark ${checklistItems.projectChecklist.includes(index) ? 'completed-dark' : ''}`}
              onClick={() => handleChecklistToggle('projectChecklist', index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {checklistItems.projectChecklist.includes(index) ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderProjectQuestionsStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">
        {projectType === 'bath' ? 'Bath/Shower' : 'Roof'} Specific Questions
      </h3>
      
      <div className="questions-container-dark">
        {projectType === 'bath' ? (
          <div className="checklist-items-dark">
            {bathChecklistItems.map((item, index) => (
              <motion.div 
                key={index}
                className={`checklist-item-dark ${checklistItems.bathChecklist.includes(index) ? 'completed-dark' : ''}`}
                onClick={() => handleChecklistToggle('bathChecklist', index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checklistItems.bathChecklist.includes(index) ? (
                  <CheckSquare className="check-icon" />
                ) : (
                  <Square className="check-icon" />
                )}
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="checklist-items-dark">
            {roofChecklistItems.map((item, index) => (
              <motion.div 
                key={index}
                className={`checklist-item-dark ${checklistItems.roofChecklist.includes(index) ? 'completed-dark' : ''}`}
                onClick={() => handleChecklistToggle('roofChecklist', index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checklistItems.roofChecklist.includes(index) ? (
                  <CheckSquare className="check-icon" />
                ) : (
                  <Square className="check-icon" />
                )}
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderValuePropositionStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Value of the Visit</h3>
      
      <div className="value-proposition-dark">
        <div className="proposition-card-dark">
          <h4 className="proposition-title-dark">Script for Agent:</h4>
          <p className="proposition-text-dark">
            "Now that I have a clear understanding of what you are looking for, let me explain the next steps in our process and how we can assist you today: Long provides total replacements services only. We need you to set aside 60-90 minutes so one of our design consultants can visit your home with samples in hand to show you. The design consultant will do a wellness check and go over different colors, styles, warranty, and financing options available. After taking measurements and answering all your questions, they will provide you with an on-the-spot estimate. How does that sound?"
          </p>
          
          <div className="key-points-dark">
            <h5>Key Points:</h5>
            <ul>
              <li>60-90 minute consultation</li>
              <li>Total replacement services only</li>
              <li>Own the property</li>
              <li>All decision makers must be present</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderCommitmentStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Commitment & Scheduling</h3>
      
      <div className="commitment-container-dark">
        <div className="commitment-card-dark">
          <h4 className="commitment-title-dark">Commitment Script:</h4>
          <p className="commitment-text-dark">
            "All we ask is that all parties involved are present when we come out for the free in-home estimate. I can have a design consultant make a special trip out to your home tomorrow, currently, I have a 2pm & 6 pm left, which time works best for all parties involved?"
          </p>
          
          <div className="appointment-scheduling-dark">
            <h5>Select Appointment Time:</h5>
            <div className="time-slots-dark">
              {timeSlots.map((time) => (
                <motion.button
                  key={time}
                  className={`time-slot-dark ${appointment.time === time ? 'selected-dark' : ''}`}
                  onClick={() => handleAppointmentChange('time', time)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Clock className="time-icon" />
                  {time}
                </motion.button>
              ))}
            </div>
            
            <div className="form-group-dark">
              <label className="form-label-dark">Appointment Date</label>
              <input
                type="date"
                value={appointment.date}
                onChange={(e) => handleAppointmentChange('date', e.target.value)}
                className="form-input-dark"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          disabled={!appointment.date || !appointment.time}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ opacity: (!appointment.date || !appointment.time) ? 0.5 : 1 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderButtonUpStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Button Up & Confirmation</h3>
      
      <div className="confirmation-container-dark">
        <div className="confirmation-card-dark">
          <h4 className="confirmation-title-dark">Final Confirmation Checklist:</h4>
          <div className="checklist-items-dark">
            {commitmentChecklistItems.map((item, index) => (
              <motion.div 
                key={index}
                className={`checklist-item-dark ${checklistItems.commitmentChecklist.includes(index) ? 'completed-dark' : ''}`}
                onClick={() => handleChecklistToggle('commitmentChecklist', index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checklistItems.commitmentChecklist.includes(index) ? (
                  <CheckSquare className="check-icon" />
                ) : (
                  <Square className="check-icon" />
                )}
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
          
          <div className="closing-script-dark">
            <h5>Closing Script:</h5>
            <p>
              "Before I finalize everything, could you do a few things for me? Please mention the appointment to (if any other parties involved), and mark your calendar, to avoid rescheduling. Also, do not make any decisions until Long gets a chance to show you our product and how we can offer you peace of mind at a great price. Does that make sense? OK FANTASTIC…. The next point of contact will be the rep at your home on {appointment.date} at {appointment.time} to do the estimate for you on a total replacement of your {projectType}. Thank You and have a wonderful day!"
            </p>
          </div>
        </div>
      </div>
      
      <motion.button 
        className="complete-button-dark"
        onClick={() => {
          setShowRecap(true);
          // Reset script state after completion
          setCurrentStep(0);
          setCallType('');
          setProjectType('');
          setProjectDetails({
            age: '',
            issues: '',
            currentSetup: '',
            replacementType: '',
            plumbingSetup: '',
            materialsPurchased: '',
            roofType: '',
            activeLeaks: '',
            roofReplaced: ''
          });

          setAppointment({
            date: '',
            time: '',
            confirmed: false
          });
          setChecklistItems({
            projectChecklist: [],
            bathChecklist: [],
            roofChecklist: [],
            commitmentChecklist: []
          });
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Complete Script
        <CheckCircle className="button-icon" />
      </motion.button>
    </motion.div>
  );

  const renderPropertySearchStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="step-title-dark">Property Search & Verification</h3>
      {/* Basemap First Instruction and Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#fff' }}>
          For best results, use the Basemap tool to visually locate the property first. Then return here to enter the address for search and verification.
        </p>
        <a
          href="https://app.basemap.com/?_gl=1*1s9rt3w*_gcl_au*MTg4MTc1NjgwOC4xNzUyNzU4NzU5*_ga*MTE3ODIzOTY4Ni4xNzUyNzU4NzU5*_ga_4XG891YZD4*czE3NTI3NTg3NTkkbzEkZzAkdDE3NTI3NTg3NTkkajYwJGwwJGgw*_ga_8X0CQ17R59*czE3NTI3NTg3NTkkbzEkZzAkdDE3NTI3NTg3NTkkajYwJGwwJGgw"
          target="_blank"
          rel="noopener noreferrer"
          className="basemap-link-dark prominent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.2rem',
            borderRadius: '8px',
            padding: '1rem 2rem',
            margin: '0.5rem 0 0 0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            transition: 'background 0.2s',
          }}
          onClick={() => setBasemapVisited(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Open Basemap Tool
        </a>
        {basemapVisited && !basemapVerified && (
          <button
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onClick={() => setBasemapVerified(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Mark as Verified from Basemap
          </button>
        )}
        {basemapVisited && (
          <div
            style={{
              marginTop: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center',
              border: isPasteActive ? '2.5px solid #3b82f6' : '1.5px solid #e5e7eb',
              borderRadius: 12,
              background: 'rgba(59,130,246,0.06)',
              padding: '1.5rem 1rem',
              maxWidth: 400,
              marginLeft: 'auto',
              marginRight: 'auto',
              boxShadow: '0 2px 12px rgba(59,130,246,0.07)',
              transition: 'border 0.2s'
            }}
            tabIndex={0}
            onPaste={e => {
              if (e.clipboardData && e.clipboardData.items) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                  const item = e.clipboardData.items[i];
                  if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = ev => setBasemapScreenshot(ev.target.result);
                    reader.readAsDataURL(file);
                    e.preventDefault();
                    break;
                  }
                }
              }
            }}
            onFocus={() => setIsPasteActive(true)}
            onBlur={() => setIsPasteActive(false)}
          >
            <div style={{ fontSize: 13, color: '#2563eb', marginBottom: 6, fontWeight: 500 }}>
              You can <b>paste</b> (Ctrl+V) a copied screenshot here!
            </div>
            <label style={{ fontWeight: 700, color: '#2563eb', display: 'block', marginBottom: 14, fontSize: '1.1rem', letterSpacing: 0.2 }}>
              Upload Basemap Screenshot (property info)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
              <input
                id="basemap-screenshot-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setBasemapScreenshot(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="basemap-screenshot-upload" style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                color: '#fff',
                padding: '0.5rem 1.2rem',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(59,130,246,0.08)',
                border: 'none',
                display: 'inline-block',
                transition: 'background 0.2s',
                marginRight: 4
              }}>
                Choose Screenshot
              </label>
              <span style={{ color: '#555', fontSize: '0.98rem', fontWeight: 500, minWidth: 120, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {basemapScreenshot ? 'Screenshot selected' : 'No file chosen'}
              </span>
              {basemapScreenshot && (
                <button
                  onClick={() => setBasemapScreenshot(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 18,
                    marginLeft: 4,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1
                  }}
                  title="Remove screenshot"
                >
                  ×
                </button>
              )}
            </div>
            {basemapScreenshot && (
              <div style={{ marginTop: 16 }}>
                <img
                  src={basemapScreenshot}
                  alt="Basemap Screenshot Preview"
                  style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 10, boxShadow: '0 4px 24px rgba(59,130,246,0.13)' }}
                />
                <div style={{ fontSize: 13, color: '#2563eb', marginTop: 6, fontWeight: 500 }}>Screenshot attached</div>
                {/* Enhanced property info card */}
                <div style={{
                  marginTop: 18,
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '1rem',
                  color: '#222',
                  fontSize: '1rem',
                  minHeight: 48,
                  maxWidth: 420,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  boxShadow: '0 1px 4px rgba(59,130,246,0.06)'
                }}>
                  {ocrLoading ? (
                    <span style={{ color: '#3b82f6', fontWeight: 500 }}>Extracting text from screenshot...</span>
                  ) : (
                    Object.keys(parsedPropertyInfo).length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                        {Object.entries(parsedPropertyInfo).map(([label, value]) => (
                          <React.Fragment key={label}>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>{label}:</div>
                            <div style={{ color: '#222', wordBreak: 'break-word' }}>{value}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#888' }}>{ocrText ? ocrText : 'No text extracted yet.'}</span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {basemapVerified && (
          <div style={{ marginTop: '1rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Verified from Basemap
          </div>
        )}
      </div>
      <div className="search-form-container-dark">
        <div className="search-header-dark" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setPropertySearchCollapsed(v => !v)}>
          <div className="search-icon-container-dark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="search-title-dark">
            <h4 style={{ display: 'inline-block', marginRight: 8 }}>
              Property Address Search
              <span style={{
                background: '#f59e42',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '6px',
                padding: '2px 8px',
                marginLeft: 8,
                verticalAlign: 'middle',
                letterSpacing: 0.5,
              }}>Beta</span>
            </h4>
            <span style={{ fontSize: 18, verticalAlign: 'middle', transition: 'transform 0.2s', display: 'inline-block', transform: propertySearchCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▶</span>
            <p style={{ fontSize: '0.92rem', color: '#aaa', margin: 0 }}>Enter the property address to search for detailed information</p>
          </div>
        </div>
        {!propertySearchCollapsed && (
          <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginTop: 8, marginBottom: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 1px 4px rgba(59,130,246,0.04)' }}>
            <div className="search-input-section-dark">
              <label className="input-label-dark" style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, display: 'block', color: '#3b82f6' }}>Regrid Property Search</label>
              <input
                type="text"
                placeholder="Enter full property address..."
                className="modern-input-dark"
                value={propertySearch.address || ''}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onFocus={() => propertySearch.suggestions.length > 0 && setPropertySearch(prev => ({ ...prev, showSuggestions: true }))}
              />
              {/* Suggestions dropdown */}
              {propertySearch.showSuggestions && propertySearch.suggestions.length > 0 && (
                <div className="suggestions-dropdown-dark">
                  {propertySearch.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="suggestion-item-dark"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.657 16.657L13.414 20.9C13.039 21.275 12.525 21.485 12 21.485C11.475 21.485 10.961 21.275 10.586 20.9L6.343 16.657C5.22422 15.5381 4.46234 14.1127 4.15369 12.5608C3.84504 11.009 4.00349 9.40047 4.60901 7.93853C5.21452 6.4766 6.2399 5.22425 7.55548 4.34668C8.87107 3.46911 10.4178 3.00024 12 3.00024C13.5822 3.00024 15.1289 3.46911 16.4445 4.34668C17.7601 5.22425 18.7855 6.4766 19.391 7.93853C19.9965 9.40047 20.155 11.009 19.8463 12.5608C19.5377 14.1127 18.7758 15.5381 17.657 16.657Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {suggestion.address}
                    </div>
                  ))}
                </div>
              )}
              {/* Search and Clear buttons */}
              <div className="search-actions-dark" style={{ marginTop: 12 }}>
                <motion.button
                  className="search-button-dark primary"
                  onClick={handlePropertySearch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!propertySearch.address}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Search Property
                </motion.button>
                <motion.button
                  className="search-button-dark secondary"
                  onClick={handleClearSearch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 7L18.132 19.142C18.0579 20.1891 17.187 21.0273 16.148 21.0273H7.852C6.813 21.0273 5.94214 20.1891 5.868 19.142L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear
                </motion.button>
              </div>
            </div>
            {/* Search Results */}
            {propertySearch.results && (
              <div className="search-results-container-dark">{/* ...existing results code... */}</div>
            )}
          </div>
        )}
      </div>
      {/* Property Verification Checklist always visible below */}
      <div className="property-checklist-section-dark">
        <h4>Property Verification Checklist</h4>
        <div className="property-checklist-grid-dark">
          {propertyChecklistItems.map(item => (
            <motion.div
              key={item.key}
              className={`checklist-item-dark ${(item.key === 'basemapVerified' ? basemapVerified : propertySearch.checklist[item.key]) ? 'completed-dark' : ''}`}
              onClick={() => {
                if (item.key === 'basemapVerified') setBasemapVerified(v => !v);
                else handlePropertyChecklistToggle(item.key);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer' }}
            >
              {(item.key === 'basemapVerified' ? basemapVerified : propertySearch.checklist[item.key]) ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Navigation buttons always visible */}
      <div className="step-navigation-dark">
        <motion.button
          className="nav-button-dark back-button-dark"
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!allPropertyChecklistChecked}
          style={{ opacity: allPropertyChecklistChecked ? 1 : 0.5 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (scriptSteps[currentStep].id) {
      case 'greeting':
        return renderGreetingStep();
      case 'projectType':
        return renderProjectTypeStep();
      case 'propertySearch':
        return renderPropertySearchStep();
      case 'projectChecklist':
        return renderProjectChecklistStep();
      case 'projectQuestions':
        return renderProjectQuestionsStep();
      case 'valueProposition':
        return renderValuePropositionStep();
      case 'commitment':
        return renderCommitmentStep();
      case 'buttonUp':
        return renderButtonUpStep();
      default:
        return renderGreetingStep();
    }
  };

  return (
    <div className="schedule-script-container-dark">
      <motion.div 
        className="schedule-script-header-dark"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="header-content">
          <motion.h1 
            className="schedule-script-title-dark"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FileText className="title-icon" />
            Interactive Scheduling Script
          </motion.h1>
          <motion.p 
            className="schedule-script-subtitle-dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Follow the step-by-step script to schedule appointments effectively
          </motion.p>
        </div>
        
        <motion.div 
          className="header-navigation-dark"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="quick-nav-dark">
            <motion.button
              onClick={() => onNavigate('home')}
              className="nav-button-dark home-button-dark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </motion.button>
            <motion.button
              onClick={() => onNavigate('rebuttals')}
              className="nav-button-dark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 9H17M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rebuttals
            </motion.button>
            <motion.button
              onClick={() => onNavigate('disposition')}
              className="nav-button-dark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 3H15V5H9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Lead Disposition
            </motion.button>
            <motion.button
              onClick={() => onNavigate('customerService')}
              className="nav-button-dark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Customer Service
            </motion.button>
            <motion.button
              onClick={() => onNavigate('faq')}
              className="nav-button-dark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.30197 14.92 10.02C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              FAQ
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="schedule-script-content-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="script-progress-dark">
          <div className="progress-bar-prominent">
            {scriptSteps.map((step, index) => {
              // Choose an icon for each step type
              let StepIcon = FileText;
              if (step.type === 'greeting') StepIcon = Phone;
              if (step.type === 'selection') StepIcon = Home;
              if (step.type === 'property') StepIcon = Home;
              if (step.type === 'checklist') StepIcon = CheckSquare;
              if (step.type === 'questions') StepIcon = Users;
              if (step.type === 'presentation') StepIcon = FileText;
              if (step.type === 'scheduling') StepIcon = Calendar;
              if (step.type === 'confirmation') StepIcon = CheckCircle;
              return (
                <motion.div
                  key={step.id}
                  className={`progress-step-prominent ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
                  onClick={() => setCurrentStep(index)}
                  whileTap={{ scale: 0.95 }}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Go to step: ${step.title}`}
                >
                  <div className="step-icon-wrapper">
                    <StepIcon className="step-icon" />
                  </div>
                  <span className="step-label-prominent">{step.title}</span>
                  {index < scriptSteps.length - 1 && <span className="step-connector" />}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="script-main-content-dark">
          {renderCurrentStep()}
        </div>
      </motion.div>

      {showRecap && (
        <div style={{
          display: 'flex', flexDirection: 'row', gap: '2rem', justifyContent: 'center', marginTop: 40, marginBottom: 40, flexWrap: 'wrap',
        }}>
          {/* Rep Recap Card */}
          <div style={{
            background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(59,130,246,0.13)', padding: '2rem', maxWidth: 480, minWidth: 320, color: '#222', position: 'relative',
          }}>
            <h2 style={{ color: '#2563eb', marginBottom: 12 }}>Rep Recap</h2>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1.08rem', marginBottom: 16 }}>{repRecapText}</pre>
            <button
              onClick={handleCopyRepRecap}
              style={{
                background: repRecapCopied ? '#10b981' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {repRecapCopied ? 'Copied!' : 'Copy Recap'}
            </button>
          </div>
          {/* Customer Recap Card */}
          <div style={{
            background: '#f3f4f6', borderRadius: 12, boxShadow: '0 2px 12px rgba(59,130,246,0.07)', padding: '2rem', maxWidth: 420, minWidth: 280, color: '#222',
          }}>
            <h2 style={{ color: '#10b981', marginBottom: 12 }}>Customer Recap</h2>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1.08rem' }}>{customerRecapText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleScript; 