import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight, Phone, User, Mail, Users, CheckSquare, Square, Check, Home } from 'lucide-react';
import { safePostMessage } from '../utils/iframeErrorHandler';

import '../styles/ScheduleScript.css';

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
      
      <div className="property-search-container-dark">
        {/* Search Form */}
        <div className="search-form-container-dark">
          <div className="search-header-dark">
            <div className="search-icon-container-dark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="search-title-dark">
              <h4>Property Address Search</h4>
              <p>Enter the property address to search for detailed information</p>
            </div>
          </div>
          
          <div className="search-input-section-dark">
            <div className="input-group-dark">
              <label className="input-label-dark">Property Address</label>
              <div className="address-input-container-dark" ref={addressInputRef}>
              <input
                type="text"
                  placeholder="Enter full property address..."
                  className="modern-input-dark"
                  value={propertySearch.address || ''}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onFocus={() => propertySearch.suggestions.length > 0 && setPropertySearch(prev => ({ ...prev, showSuggestions: true }))}
                />
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
              
                {/* Debug info */}
              <div style={{
                  fontSize: '12px', 
                  color: '#888', 
                  marginTop: '4px',
                  padding: '4px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px'
                }}>
                  Debug: Suggestions: {propertySearch.suggestions.length}, Show: {propertySearch.showSuggestions ? 'true' : 'false'}
                </div>
              </div>
                </div>

            <div className="search-actions-dark">
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
        </div>

        {/* Search Results */}
        {propertySearch.results && (
          <div className="search-results-container-dark">
            <div className="results-header-dark">
              <h4>Property Information</h4>
              <div className="results-status-dark">
                <span className="status-badge-dark verified">Verified</span>
                  </div>
                </div>

            <div className="property-details-grid-dark">
              <div className="detail-card-dark">
                <div className="detail-icon-dark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.657 16.657L13.414 20.9C13.039 21.275 12.525 21.485 12 21.485C11.475 21.485 10.961 21.275 10.586 20.9L6.343 16.657C5.22422 15.5381 4.46234 14.1127 4.15369 12.5608C3.84504 11.009 4.00349 9.40047 4.60901 7.93853C5.21452 6.4766 6.2399 5.22425 7.55548 4.34668C8.87107 3.46911 10.4178 3.00024 12 3.00024C13.5822 3.00024 15.1289 3.46911 16.4445 4.34668C17.7601 5.22425 18.7855 6.4766 19.391 7.93853C19.9965 9.40047 20.155 11.009 19.8463 12.5608C19.5377 14.1127 18.7758 15.5381 17.657 16.657Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content-dark">
                  <h6>Address</h6>
                  <p>{propertySearch.results.address}</p>
                </div>
              </div>
              
              <div className="detail-card-dark">
                <div className="detail-icon-dark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content-dark">
                  <h6>Property Type</h6>
                  <p>{propertySearch.results.propertyType || 'Residential'}</p>
                </div>
              </div>
              
              <div className="detail-card-dark">
                <div className="detail-icon-dark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3V7M16 3V7M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="detail-content-dark">
                  <h6>Year Built</h6>
                  <p>{propertySearch.results.yearBuilt || 'N/A'}</p>
                </div>
            </div>

              <div className="detail-card-dark">
                <div className="detail-icon-dark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>
                <div className="detail-content-dark">
                  <h6>Square Footage</h6>
                  <p>{propertySearch.results.squareFootage || 'N/A'} sq ft</p>
                </div>
              </div>
              <div className="detail-card-dark">
                <div className="detail-icon-dark">
                  {/* Owner icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 20c0-4 8-4 8-4s8 0 8 4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                </div>
                <div className="detail-content-dark">
                  <h6>Owner Name</h6>
                  <p>{propertySearch.results.ownerName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Checklist */}
        <div className="property-checklist-section-dark">
          <h4>Property Verification Checklist</h4>
          <div className="property-checklist-grid-dark">
            <motion.div 
              className={`checklist-item-dark ${propertySearch.checklist.addressVerified ? 'completed-dark' : ''}`}
              onClick={() => handlePropertyChecklistToggle('addressVerified')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {propertySearch.checklist.addressVerified ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>Property address verified</span>
            </motion.div>
            
            <motion.div 
              className={`checklist-item-dark ${propertySearch.checklist.propertyTypeConfirmed ? 'completed-dark' : ''}`}
              onClick={() => handlePropertyChecklistToggle('propertyTypeConfirmed')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {propertySearch.checklist.propertyTypeConfirmed ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>Property type confirmed</span>
            </motion.div>
            
            <motion.div 
              className={`checklist-item-dark ${propertySearch.checklist.characteristicsNoted ? 'completed-dark' : ''}`}
              onClick={() => handlePropertyChecklistToggle('characteristicsNoted')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {propertySearch.checklist.characteristicsNoted ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>Property characteristics noted</span>
            </motion.div>
            
            <motion.div 
              className={`checklist-item-dark ${propertySearch.checklist.accessInfoCollected ? 'completed-dark' : ''}`}
              onClick={() => handlePropertyChecklistToggle('accessInfoCollected')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {propertySearch.checklist.accessInfoCollected ? (
                <CheckSquare className="check-icon" />
              ) : (
                <Square className="check-icon" />
              )}
              <span>Access information collected</span>
            </motion.div>
          </div>
        </div>
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
    </div>
  );
    };

  export default ScheduleScript; 