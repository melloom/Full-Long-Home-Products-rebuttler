import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, FileText, CheckCircle, ChevronRight, Phone, User, Mail, Users, CheckSquare, Square, Check, Home } from 'lucide-react';
import { safePostMessage } from '../utils/iframeErrorHandler';
import { getTimeBlocks, listenTimeBlocks, getAvailability, listenAvailability, listenAvailabilityForRegion, addBooking } from '../services/firebase/scheduling';
import { checkServiceArea } from '../utils/serviceAreaChecker';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import '../styles/ScheduleScript.css';
import RebuttalSidebar from './RebuttalSidebar';

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
  const [userName, setUserName] = useState('');

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
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    secondaryName: '',
    secondaryPhone: '',
    secondaryEmail: '',
    relationshipToPrimary: '',
    showSecondary: false
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
  const [recapMessage, setRecapMessage] = useState({
    type: 'success',
    title: '',
    message: '',
    details: ''
  });

  // Add state for progress notifications
  const [showProgressNotification, setShowProgressNotification] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  // Add state to track if there's saved progress
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

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

  // Clear all data when component mounts (for new appointments)
  useEffect(() => {
    // Only clear if we're at the beginning and no data has been entered
    if (currentStep === 0 && !callType && !projectType && !userName) {
      clearAllData();
    }
  }, []); // Empty dependency array means this runs once on mount

  // Auto-save functionality - save progress whenever data changes
  useEffect(() => {
    // Don't save if we're at step 0 with no data (fresh start)
    if (currentStep === 0 && !callType && !projectType && !userName) {
      return;
    }

    // Save current progress to localStorage
    const progressData = {
      currentStep,
      callType,
      projectType,
      userName,
      customerInfo,
      projectDetails,
      appointment,
      appointmentConfirmed,
      checklistItems,
      propertySearch,
      propertySearchCollapsed,
      basemapVisited,
      basemapVerified,
      basemapScreenshot,
      parsedPropertyInfo,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('scheduleScriptData', JSON.stringify(progressData));
    console.log('💾 Auto-saved progress:', { currentStep, callType, projectType });
    
    // Set flag that there's saved progress
    setHasSavedProgress(true);
    
    // Show brief notification that progress was saved
    setProgressMessage('Progress saved automatically');
    setShowProgressNotification(true);
    setTimeout(() => setShowProgressNotification(false), 2000);
  }, [
    currentStep,
    callType,
    projectType,
    userName,
    customerInfo,
    projectDetails,
    appointment,
    appointmentConfirmed,
    checklistItems,
    propertySearch,
    propertySearchCollapsed,
    basemapVisited,
    basemapVerified,
    basemapScreenshot,
    parsedPropertyInfo
  ]);

  // Load saved progress when component mounts
  useEffect(() => {
    const savedData = localStorage.getItem('scheduleScriptData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Check if the saved data is recent (within last 24 hours)
        const savedTime = new Date(parsedData.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log('🔄 Loading saved progress from localStorage');
          
          // Set flag that there's saved progress
          setHasSavedProgress(true);
          
          // Restore all saved state
          if (parsedData.currentStep !== undefined) setCurrentStep(parsedData.currentStep);
          if (parsedData.callType) setCallType(parsedData.callType);
          if (parsedData.projectType) setProjectType(parsedData.projectType);
          if (parsedData.userName) setUserName(parsedData.userName);
          if (parsedData.customerInfo) setCustomerInfo(parsedData.customerInfo);
          if (parsedData.projectDetails) setProjectDetails(parsedData.projectDetails);
          if (parsedData.appointment) setAppointment(parsedData.appointment);
          if (parsedData.appointmentConfirmed !== undefined) setAppointmentConfirmed(parsedData.appointmentConfirmed);
          if (parsedData.checklistItems) setChecklistItems(parsedData.checklistItems);
          if (parsedData.propertySearch) setPropertySearch(parsedData.propertySearch);
          if (parsedData.propertySearchCollapsed !== undefined) setPropertySearchCollapsed(parsedData.propertySearchCollapsed);
          if (parsedData.basemapVisited !== undefined) setBasemapVisited(parsedData.basemapVisited);
          if (parsedData.basemapVerified !== undefined) setBasemapVerified(parsedData.basemapVerified);
          if (parsedData.basemapScreenshot) setBasemapScreenshot(parsedData.basemapScreenshot);
          if (parsedData.parsedPropertyInfo) setParsedPropertyInfo(parsedData.parsedPropertyInfo);
          
          console.log('✅ Progress restored:', { 
            currentStep: parsedData.currentStep, 
            callType: parsedData.callType, 
            projectType: parsedData.projectType 
          });
          
          // Show notification that progress was restored
          setProgressMessage(`Welcome back! Continuing from step ${parsedData.currentStep + 1}`);
          setShowProgressNotification(true);
          setTimeout(() => setShowProgressNotification(false), 3000);
        } else {
          console.log('⏰ Saved data is too old, starting fresh');
          localStorage.removeItem('scheduleScriptData');
          setHasSavedProgress(false);
        }
      } catch (error) {
        console.error('❌ Error loading saved progress:', error);
        localStorage.removeItem('scheduleScriptData');
        setHasSavedProgress(false);
      }
    } else {
      setHasSavedProgress(false);
    }
  }, []); // Only run once on mount

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
      id: 'propertySearch',
      title: 'Property Search',
      type: 'property'
    },
    {
      id: 'projectType',
      title: 'Project Type Selection',
      type: 'selection'
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
      id: 'customerInfo',
      title: 'Customer Information',
      type: 'customer'
    },
    {
      id: 'commitment',
      title: 'Commitment & Scheduling',
      type: 'scheduling'
    },
    {
      id: 'buttonUp',
      title: 'Button Up & Final Steps',
      type: 'final'
    },
    {
      id: 'confirmation',
      title: 'Appointment Confirmation',
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

  const [timeBlocks, setTimeBlocks] = useState({ weekdays: [], weekends: [] });
  const [loadingTimeBlocks, setLoadingTimeBlocks] = useState(true);

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

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
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

  // Helper functions for time blocks
  const isWeekend = (date) => {
    if (!date) return false;
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  };

  const getTimeBlocksForDate = (date) => {
    return isWeekend(date) ? timeBlocks.weekends : timeBlocks.weekdays;
  };

  const getAvailableTimeBlocks = (date) => {
    const blocks = getTimeBlocksForDate(date);
    return blocks.filter(block => block.available);
  };

  // Update getAvailableTimeBlocks to accept region
  const getAvailableTimeBlocksForRegion = (date, region) => {
    if (!region) return [];
    // You may already have a function to get slots by region; if not, filter here
    const allBlocks = getAvailableTimeBlocks(date);
    return allBlocks.filter(block => block.region === region || !block.region); // fallback if region not set on block
  };

  // Load time blocks from Firestore
  useEffect(() => {
    const loadTimeBlocks = async () => {
      try {
        setLoadingTimeBlocks(true);
        const blocks = await getTimeBlocks();
        
        if (blocks && blocks.length > 0) {
          const weekdays = blocks.filter(block => block.dayType === 'weekday');
          const weekends = blocks.filter(block => block.dayType === 'weekend');
          setTimeBlocks({ weekdays, weekends });
        } else {
          console.log('No time blocks found in Firestore');
          setTimeBlocks({ weekdays: [], weekends: [] });
        }
        
        setLoadingTimeBlocks(false);
      } catch (error) {
        console.error('Error loading time blocks from Firestore:', error);
        setTimeBlocks({ weekdays: [], weekends: [] });
        setLoadingTimeBlocks(false);
      }
    };

    loadTimeBlocks();

    // Set up real-time listener for time blocks
    const unsubscribe = listenTimeBlocks((blocks) => {
      if (blocks && blocks.length > 0) {
        const weekdays = blocks.filter(block => block.dayType === 'weekday');
        const weekends = blocks.filter(block => block.dayType === 'weekend');
        setTimeBlocks({ weekdays, weekends });
        
        // Log the current time blocks for debugging
        console.log('🕐 Current time blocks updated:', { weekdays, weekends });
      }
    });

    return () => unsubscribe();
  }, []);

  // Gather session summary
  const sessionSummary = {
            address: customerInfo.address || propertySearch.address || (parsedPropertyInfo?.['Owner Address'] || ''),
        owner: `${customerInfo.firstName} ${customerInfo.lastName}`.trim() || parsedPropertyInfo?.['Owner Name'] || '',
        county: parsedPropertyInfo?.['County Name'] || '',
        countyFips: parsedPropertyInfo?.['County FIPS'] || '',
        acres: parsedPropertyInfo?.['Acres'] || '',
        apn: parsedPropertyInfo?.['APN'] || '',
    projectType: projectType || '',
    callType: callType || '',
    userName: userName || '',
    customerInfo,
    appointment: {
      date: appointment.date || '',
      time: appointment.time || ''
    },
    projectDetails: projectDetails || {},
    checklistItems,
    propertyInfo: parsedPropertyInfo,
  };

  // Rep Recap Text (for copy)
  const repRecapText = `🔍 Lead Notes – ${sessionSummary.address || 'Address not provided'}

🏠 Homeownership: Yes${sessionSummary.owner ? ` (Owner: ${sessionSummary.owner})` : ''}
👤 Decision-Makers: All required parties will be present
📌 Project Interest:
• ${sessionSummary.projectType === 'bath' ? 'Bathroom remodel – replacing old tub with walk-in shower' : sessionSummary.projectType === 'roof' ? 'Roof replacement' : sessionSummary.projectType || 'N/A'}
${sessionSummary.projectDetails?.issues ? `• ${sessionSummary.projectDetails.issues}` : ''}

🗂️ Property Details:
${sessionSummary.owner ? `• Owner: ${sessionSummary.owner}\n` : ''}${sessionSummary.county ? `• County: ${sessionSummary.county}` : ''}${sessionSummary.countyFips ? ` (FIPS: ${sessionSummary.countyFips})` : ''}
${sessionSummary.acres ? `• Acres: ${sessionSummary.acres}\n` : ''}${sessionSummary.apn ? `• APN: ${sessionSummary.apn}\n` : ''}

📅 Appointment Status: ${sessionSummary.appointment.date && sessionSummary.appointment.time ? formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time) : 'Not scheduled'}
${appointmentConfirmed ? '✅ Appointment Confirmed (No Follow-up Needed)' : '⏳ Appointment Pending (Follow-up Required)'}

✅ REP NOTES
Rep Name: ${sessionSummary.userName || 'N/A'}
Customer Name: ${sessionSummary.owner || 'N/A'}
Address: ${sessionSummary.address || 'N/A'}
Project Type: ${sessionSummary.projectType === 'bath' ? 'Bathroom remodel' : sessionSummary.projectType === 'roof' ? 'Roof replacement' : sessionSummary.projectType || 'N/A'}
Special Details: ${sessionSummary.projectDetails?.issues || 'N/A'}
Appointment Date & Time: ${sessionSummary.appointment.date && sessionSummary.appointment.time ? formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time) : 'Not scheduled'}
Confirmation Status: ${appointmentConfirmed ? 'Confirmed' : 'Pending'}
`;

  // Customer Recap Text
  const customerRecapText = `Thank you for scheduling your appointment with Long Home Products!\n\nHere's what to expect:\n• A design consultant will visit your home at ${sessionSummary.address || 'your address'}.\n• Appointment: ${sessionSummary.appointment.date && sessionSummary.appointment.time ? formatDateTime(sessionSummary.appointment.date, sessionSummary.appointment.time) : 'date and time to be confirmed'}.\n• We'll review your ${sessionSummary.projectType === 'bath' ? 'bathroom remodel' : sessionSummary.projectType === 'roof' ? 'roof replacement' : sessionSummary.projectType || 'project'} needs and provide a free estimate.\n• Please ensure all decision-makers are present.\n\nWe look forward to meeting you!`;

  // Function to resume saved progress
  const resumeProgress = useCallback(() => {
    const savedData = localStorage.getItem('scheduleScriptData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Check if the saved data is recent (within last 24 hours)
        const savedTime = new Date(parsedData.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          console.log('🔄 Resuming saved progress');
          
          // Restore all saved state
          if (parsedData.currentStep !== undefined) setCurrentStep(parsedData.currentStep);
          if (parsedData.callType) setCallType(parsedData.callType);
          if (parsedData.projectType) setProjectType(parsedData.projectType);
          if (parsedData.userName) setUserName(parsedData.userName);
          if (parsedData.customerInfo) setCustomerInfo(parsedData.customerInfo);
          if (parsedData.projectDetails) setProjectDetails(parsedData.projectDetails);
          if (parsedData.appointment) setAppointment(parsedData.appointment);
          if (parsedData.appointmentConfirmed !== undefined) setAppointmentConfirmed(parsedData.appointmentConfirmed);
          if (parsedData.checklistItems) setChecklistItems(parsedData.checklistItems);
          if (parsedData.propertySearch) setPropertySearch(parsedData.propertySearch);
          if (parsedData.propertySearchCollapsed !== undefined) setPropertySearchCollapsed(parsedData.propertySearchCollapsed);
          if (parsedData.basemapVisited !== undefined) setBasemapVisited(parsedData.basemapVisited);
          if (parsedData.basemapVerified !== undefined) setBasemapVerified(parsedData.basemapVerified);
          if (parsedData.basemapScreenshot) setBasemapScreenshot(parsedData.basemapScreenshot);
          if (parsedData.parsedPropertyInfo) setParsedPropertyInfo(parsedData.parsedPropertyInfo);
          
          // Show notification
          setProgressMessage(`Resumed from step ${parsedData.currentStep + 1}`);
          setShowProgressNotification(true);
          setTimeout(() => setShowProgressNotification(false), 2000);
        } else {
          console.log('⏰ Saved data is too old');
          localStorage.removeItem('scheduleScriptData');
          setHasSavedProgress(false);
        }
      } catch (error) {
        console.error('❌ Error resuming progress:', error);
        localStorage.removeItem('scheduleScriptData');
        setHasSavedProgress(false);
      }
    }
  }, []);

  // Function to clear all data when starting a new appointment
  const clearAllData = useCallback(() => {
    // Clear all state
    setCurrentStep(0);
    setCallType('');
    setProjectType('');
    setUserName('');
    setAppointmentConfirmed(false);
    setCustomerInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      secondaryName: '',
      secondaryPhone: '',
      secondaryEmail: '',
      relationshipToPrimary: '',
      showSecondary: false
    });
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
    setPropertySearchCollapsed(true);
    setBasemapVisited(false);
    setBasemapVerified(false);
    setBasemapScreenshot(null);
    setIsPasteActive(false);
    setOcrText('');
    setOcrLoading(false);
    setParsedPropertyInfo({});
    setShowRecap(false);
    setRepRecapCopied(false);
    setRecapMessage({
      type: 'success',
      title: '',
      message: '',
      details: ''
    });

    // Clear localStorage
    localStorage.removeItem('scheduleScriptData');
    
    // Clear any existing messages
    setRecapMessage({
      type: 'success',
      title: '',
      message: '',
      details: ''
    });
    
    // Reset saved progress flag
    setHasSavedProgress(false);
    
    console.log('🗑️ All data cleared for new appointment');
  }, []);

  // Copy to clipboard handlers
  const handleCopyRepRecap = useCallback(() => {
    navigator.clipboard.writeText(repRecapText).then(() => {
      setRepRecapCopied(true);
      setTimeout(() => setRepRecapCopied(false), 2000);
    });
  }, [repRecapText]);

  const handleCopyCustomerRecap = useCallback(() => {
    navigator.clipboard.writeText(customerRecapText).then(() => {
      // You could add a similar state for customer recap copied if needed
      alert('Customer recap copied to clipboard!');
    });
  }, [customerRecapText]);

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
            setTimeout(() => setCurrentStep(currentStep + 1), 200); // auto-advance
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
            setTimeout(() => setCurrentStep(currentStep + 1), 200); // auto-advance
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

  const renderCustomerInfoStep = () => {
    // Auto-fill from property search and parsed property info
    const autoFillFromProperty = () => {
      const updates = {};
      
      // Auto-fill address from property search
      if (propertySearch.address && !customerInfo.address) {
        updates.address = propertySearch.address;
      }
      
      // Auto-fill from parsed property info
      if (parsedPropertyInfo?.['Owner Name'] && !customerInfo.firstName && !customerInfo.lastName) {
        const ownerName = parsedPropertyInfo['Owner Name'];
        const nameParts = ownerName.split(' ');
        if (nameParts.length >= 2) {
          updates.firstName = nameParts[0];
          updates.lastName = nameParts.slice(1).join(' ');
        } else {
          updates.firstName = ownerName;
        }
      }
      
      // Auto-fill city from property info
      if (parsedPropertyInfo?.['Owner City'] && !customerInfo.city) {
        updates.city = parsedPropertyInfo['Owner City'];
      }
      
      // Auto-fill state from property info
      if (parsedPropertyInfo?.['Owner State'] && !customerInfo.state) {
        updates.state = parsedPropertyInfo['Owner State'];
      }
      
      // Auto-fill zip from property info
      if (parsedPropertyInfo?.['Owner Zip Code'] && !customerInfo.zipCode) {
        updates.zipCode = parsedPropertyInfo['Owner Zip Code'].replace(':', '').trim();
      }
      
      if (Object.keys(updates).length > 0) {
        setCustomerInfo(prev => ({
          ...prev,
          ...updates
        }));
      }
    };

    // State abbreviations for dropdown
    const stateOptions = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    return (
      <motion.div 
        className="script-step-dark"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ background: 'rgba(59,130,246,0.03)', borderRadius: 16, padding: '2.5rem 1.5rem', boxShadow: '0 2px 16px rgba(59,130,246,0.07)', maxWidth: 600, margin: '0 auto' }}
      >
        <h3 className="step-title-dark" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 10, fontSize: '2rem', marginBottom: 18 }}>
          <User style={{ color: '#2563eb', fontSize: 28 }} />
          Quick Customer Info
        </h3>
        
        {/* Auto-fill button */}
                        {(propertySearch.address || (parsedPropertyInfo && Object.keys(parsedPropertyInfo).length > 0)) && (
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '1rem', marginBottom: '1rem', border: '1px solid #334155' }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
              📋 Available property data:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {parsedPropertyInfo?.['Owner Name'] && (
                <span style={{ background: '#374151', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>
                  👤 {parsedPropertyInfo['Owner Name']}
                </span>
              )}
              {parsedPropertyInfo?.['Owner City'] && (
                <span style={{ background: '#374151', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>
                  🏙️ {parsedPropertyInfo['Owner City']}
                </span>
              )}
              {parsedPropertyInfo?.['Owner State'] && (
                <span style={{ background: '#374151', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>
                  🗺️ {parsedPropertyInfo['Owner State']}
                </span>
              )}
              {propertySearch.address && (
                <span style={{ background: '#374151', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.8rem' }}>
                  📍 {propertySearch.address}
                </span>
              )}
            </div>
            <button
              onClick={autoFillFromProperty}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              🚀 Auto-fill from property data
            </button>
          </div>
        )}

        <div className="customer-info-container-dark" style={{ background: '#1e293b', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.3)', padding: '2rem', marginBottom: 24, border: '1px solid #334155' }}>
          
          {/* Name and Phone - Most Important */}
          <div className="form-row-dark" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="form-group-dark" style={{ flex: 1, minWidth: 140 }}>
              <label className="form-label-dark">Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                value={`${customerInfo.firstName} ${customerInfo.lastName}`.trim()}
                onChange={(e) => {
                  const names = e.target.value.split(' ');
                  setCustomerInfo(prev => ({
                    ...prev,
                    firstName: names[0] || '',
                    lastName: names.slice(1).join(' ') || ''
                  }));
                }}
                className="form-input-dark"
                placeholder="First Last"
                required
              />
            </div>
            <div className="form-group-dark" style={{ flex: 1, minWidth: 140 }}>
              <label className="form-label-dark">Phone <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                className="form-input-dark"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          {/* Email - Optional */}
          <div className="form-group-dark" style={{ marginBottom: 16 }}>
            <label className="form-label-dark">Email (Optional)</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
              className="form-input-dark"
              placeholder="email@example.com"
            />
          </div>

          {/* Address - Auto-filled if possible */}
          <div className="form-group-dark" style={{ marginBottom: 16 }}>
            <label className="form-label-dark">Address <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={customerInfo.address}
              onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
              className="form-input-dark"
              placeholder="Street address"
              required
            />
          </div>

          {/* City, State, ZIP - Compact */}
          <div className="form-row-dark" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group-dark" style={{ flex: 2, minWidth: 120 }}>
              <label className="form-label-dark">City <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                value={customerInfo.city}
                onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                className="form-input-dark"
                placeholder="City"
                required
              />
            </div>
            <div className="form-group-dark" style={{ flex: 1, minWidth: 80 }}>
              <label className="form-label-dark">State <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                value={customerInfo.state}
                onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                className="form-input-dark"
                required
              >
                <option value="">State</option>
                {stateOptions.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="form-group-dark" style={{ flex: 1, minWidth: 80 }}>
              <label className="form-label-dark">ZIP <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                value={customerInfo.zipCode}
                onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                className="form-input-dark"
                placeholder="ZIP"
                required
              />
            </div>
          </div>

          {/* Secondary Contact - Collapsible */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #475569', paddingTop: '1rem' }}>
            <button
              onClick={() => setCustomerInfo(prev => ({ ...prev, showSecondary: !prev.showSecondary }))}
              style={{
                background: 'transparent',
                color: '#34d399',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600
              }}
            >
              {customerInfo.showSecondary ? '▼' : '▶'} Add Secondary Contact (Optional)
            </button>
            
            {customerInfo.showSecondary && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#0f172a', borderRadius: 8 }}>
                <div className="form-row-dark" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div className="form-group-dark" style={{ flex: 1, minWidth: 140 }}>
                    <label className="form-label-dark">Secondary Name</label>
                    <input
                      type="text"
                      value={customerInfo.secondaryName}
                      onChange={(e) => handleCustomerInfoChange('secondaryName', e.target.value)}
                      className="form-input-dark"
                      placeholder="Spouse, partner, etc."
                    />
                  </div>
                  <div className="form-group-dark" style={{ flex: 1, minWidth: 140 }}>
                    <label className="form-label-dark">Secondary Phone</label>
                    <input
                      type="tel"
                      value={customerInfo.secondaryPhone}
                      onChange={(e) => handleCustomerInfoChange('secondaryPhone', e.target.value)}
                      className="form-input-dark"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="form-row-dark" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div className="form-group-dark" style={{ flex: 1, minWidth: 140 }}>
                    <label className="form-label-dark">Secondary Email</label>
                    <input
                      type="email"
                      value={customerInfo.secondaryEmail}
                      onChange={(e) => handleCustomerInfoChange('secondaryEmail', e.target.value)}
                      className="form-input-dark"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group-dark" style={{ flex: 1, minWidth: 120 }}>
                    <label className="form-label-dark">Relationship</label>
                    <select
                      value={customerInfo.relationshipToPrimary}
                      onChange={(e) => handleCustomerInfoChange('relationshipToPrimary', e.target.value)}
                      className="form-input-dark"
                    >
                      <option value="">Select</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Partner">Partner</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Roommate">Roommate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="step-navigation-dark" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
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
            disabled={!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone || !customerInfo.address || !customerInfo.city || !customerInfo.state || !customerInfo.zipCode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ opacity: (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone || !customerInfo.address || !customerInfo.city || !customerInfo.state || !customerInfo.zipCode) ? 0.5 : 1 }}
          >
            Next
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    );
  };

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
            setTimeout(() => setCurrentStep(4), 200); // auto-advance to project checklist
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
            setTimeout(() => setCurrentStep(4), 200); // auto-advance to project checklist
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

  // Add state for detected region
  const [detectedRegion, setDetectedRegion] = useState(null);
  const [regionDetectionError, setRegionDetectionError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateAvailability, setDateAvailability] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Auto-detect region when address changes
  useEffect(() => {
    if (customerInfo.address) {
      // Construct full address for region detection
      const fullAddress = [
        customerInfo.address,
        customerInfo.city,
        customerInfo.state,
        customerInfo.zipCode
      ].filter(Boolean).join(', ');
      
      console.log('🔍 Checking full address for region detection:', fullAddress);
      
      const result = checkServiceArea(fullAddress);
      if (result.inServiceArea) {
        setDetectedRegion(result.region);
        setRegionDetectionError(null);
        console.log('✅ Region detected:', result.region);
      } else {
        setDetectedRegion(null);
        setRegionDetectionError('Region could not be determined from address. Please select manually.');
        console.log('❌ Region not detected for address:', fullAddress);
      }
    } else {
      setDetectedRegion(null);
      setRegionDetectionError(null);
    }
  }, [customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.zipCode]);

  const REGION_LIST = [
    'MIDA', 'ESDE', 'NOVA', 'NENG', 'NHME', 'CTWM', 'SOPA', 'WCFL'
  ];

  // Load availability data for the selected region
  useEffect(() => {
    if (detectedRegion) {
      loadAvailabilityForRegion(detectedRegion);
      
      // Set up real-time listener for availability updates
      const unsubscribe = listenAvailabilityForRegion(detectedRegion, (availability) => {
        console.log('🔄 Real-time availability update for region:', detectedRegion, availability);
        setDateAvailability(availability || {});
        
        // Update available dates
        const availableDatesList = availability ? Object.keys(availability).filter(date => {
          const dayAvailability = availability[date];
          if (!dayAvailability) return false;
          
          let hasAvailableSlots = false;
          Object.values(dayAvailability).forEach(slotData => {
            if (typeof slotData === 'object' && slotData.available) {
              if (slotData.available > 0) hasAvailableSlots = true;
            } else if (typeof slotData === 'number') {
              if (slotData > 0) hasAvailableSlots = true;
            }
          });
          
          return hasAvailableSlots;
        }) : [];
        
        setAvailableDates(availableDatesList);
      });
      
      return () => unsubscribe();
    }
  }, [detectedRegion]);

  const loadAvailabilityForRegion = async (region) => {
    setLoadingAvailability(true);
    try {
      console.log('🔄 Loading availability for region:', region);
      const availability = await getAvailability(region);
      console.log('📅 Raw availability data:', availability);
      
      setDateAvailability(availability);
      
      // Extract available dates with better filtering
      const availableDatesList = availability ? Object.keys(availability).filter(date => {
        const dayAvailability = availability[date];
        console.log('📊 Checking availability for date:', date, dayAvailability);
        
        if (!dayAvailability) return false;
        
        // Check if any slots are available
        let hasAvailableSlots = false;
        if (typeof dayAvailability === 'object' && dayAvailability !== null) {
          Object.values(dayAvailability).forEach(slotData => {
            if (typeof slotData === 'object' && slotData.available) {
              if (slotData.available > 0) hasAvailableSlots = true;
            } else if (typeof slotData === 'number') {
              if (slotData > 0) hasAvailableSlots = true;
            }
          });
        }
        
        return hasAvailableSlots;
      }) : [];
      
      console.log('✅ Available dates:', availableDatesList);
      setAvailableDates(availableDatesList);
    } catch (error) {
      console.error('❌ Error loading availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayAvailability = dateAvailability[dateStr];
    
    if (!dayAvailability) return null;
    
    // Debug: log the actual data structure
    console.log('📅 Day availability for', dateStr, ':', dayAvailability);
    
    // Calculate total slots - handle different data structures
    let totalSlots = 0;
    if (typeof dayAvailability === 'object' && dayAvailability !== null) {
      Object.values(dayAvailability).forEach(slotData => {
        if (typeof slotData === 'object' && slotData.available) {
          totalSlots += slotData.available;
        } else if (typeof slotData === 'number') {
          totalSlots += slotData;
        }
      });
    }
    
    console.log('📊 Total slots for', dateStr, ':', totalSlots);
    
    if (totalSlots === 0) return null;
    
    return (
      <div className="calendar-slot-count">
        <span className="slot-count-badge">{totalSlots}</span>
      </div>
    );
  };

  // Custom tile class for calendar
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayAvailability = dateAvailability[dateStr];
    
    if (!dayAvailability) return 'calendar-day-unavailable';
    
    // Calculate total slots - handle different data structures
    let totalSlots = 0;
    if (typeof dayAvailability === 'object' && dayAvailability !== null) {
      Object.values(dayAvailability).forEach(slotData => {
        if (typeof slotData === 'object' && slotData.available) {
          totalSlots += slotData.available;
        } else if (typeof slotData === 'number') {
          totalSlots += slotData;
        }
      });
    }
    
    if (totalSlots === 0) return 'calendar-day-unavailable';
    if (totalSlots <= 2) return 'calendar-day-limited';
    if (totalSlots <= 5) return 'calendar-day-moderate';
    return 'calendar-day-available';
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setAppointment(prev => ({ ...prev, date: date.toISOString().split('T')[0], time: '' }));
  };

  // Get available time blocks for selected date and region
  const getAvailableTimeBlocksForDate = (date, region) => {
    if (!date || !region) return [];
    
    // Defensive: treat null as empty object
    const safeDateAvailability = dateAvailability || {};

    // Block same-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    if (selected.getTime() === today.getTime()) {
      return [];
    }

    const dateStr = date.toISOString().split('T')[0];
    const dayAvailability = safeDateAvailability[dateStr];

    if (!dayAvailability) return [];

    // Get current time blocks for this date type (weekday/weekend)
    const isWeekendDate = isWeekend(date);
    const currentTimeBlocks = isWeekendDate ? timeBlocks.weekends : timeBlocks.weekdays;
    
    // Debug logging
    console.log('📅 Date:', dateStr, 'Weekend:', isWeekendDate);
    console.log('🕐 Current time blocks:', currentTimeBlocks);
    console.log('📊 Day availability:', dayAvailability);

    // Handle both old and new availability data formats
    let availableSlots = [];
    
    if (dayAvailability.slots) {
      // New format: dayAvailability.slots[timeBlockId][regionId]
      for (const [timeBlockId, regionData] of Object.entries(dayAvailability.slots)) {
        if (regionData[region] && regionData[region].available > 0) {
          const timeBlock = currentTimeBlocks.find(block => block.id === timeBlockId);
          if (timeBlock) {
            availableSlots.push({
              time: timeBlock.time,
              timeId: timeBlockId,
              availableSlots: regionData[region].available,
              label: `${timeBlock.time} (${regionData[region].available} slot${regionData[region].available > 1 ? 's' : ''} available)`
            });
          }
        }
      }
    } else {
      // Old format: dayAvailability[timeId] = { available, capacity, etc }
      for (const [timeId, slotData] of Object.entries(dayAvailability)) {
        // Map old time IDs to new format
        const timeBlockMapping = {
          'morning': 'weekday-morning',
          'late-morning': 'weekday-morning',
          'early-afternoon': 'weekday-afternoon', 
          'late-afternoon': 'weekday-afternoon',
          'evening': 'weekday-evening'
        };
        
        if (isWeekendDate) {
          timeBlockMapping['morning'] = 'weekend-morning';
          timeBlockMapping['late-morning'] = 'weekend-morning';
          timeBlockMapping['early-afternoon'] = 'weekend-afternoon';
          timeBlockMapping['late-afternoon'] = 'weekend-afternoon';
        }
        
        const mappedTimeId = timeBlockMapping[timeId];
        const timeBlock = currentTimeBlocks.find(block => block.id === mappedTimeId);
        
        if (timeBlock && slotData.available > 0) {
          availableSlots.push({
            time: timeBlock.time,
            timeId: mappedTimeId,
            availableSlots: slotData.available,
            label: `${timeBlock.time} (${slotData.available} slot${slotData.available > 1 ? 's' : ''} available)`
          });
        }
      }
    }

    console.log('✅ Available slots:', availableSlots);
    return availableSlots;
  };

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
            {/* Region Selection */}
            <div className="region-selection-container">
              <h5>Service Region:</h5>
              {detectedRegion ? (
                <div className="region-info">
                  <span className="region-badge">Region: {detectedRegion}</span>
                </div>
              ) : (
                <div className="region-info error">
                  <span>{regionDetectionError || 'Region not detected.'}</span>
                  <select
                    value={detectedRegion || ''}
                    onChange={e => setDetectedRegion(e.target.value)}
                    className="region-select"
                  >
                    <option value="">Select Region</option>
                    {REGION_LIST.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Modern Calendar */}
            {detectedRegion && (
              <div className="calendar-container">
                <h5>Select Appointment Date:</h5>
                {loadingAvailability ? (
                  <div className="loading-calendar">
                    <div className="loading-spinner"></div>
                    <p>Loading availability...</p>
                  </div>
                ) : (
                  <div className="modern-calendar-wrapper">
                    <Calendar
                      onChange={handleDateSelect}
                      value={selectedDate}
                      tileContent={tileContent}
                      tileClassName={tileClassName}
                      minDate={new Date(new Date().setHours(0, 0, 0, 0))} // Start of today
                      maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                      className="modern-calendar"
                      tileDisabled={({ date }) => {
                        // Disable past dates and dates without availability
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dateToCheck = new Date(date);
                        dateToCheck.setHours(0, 0, 0, 0);
                        
                        // Disable if it's before today
                        if (dateToCheck < today) {
                          return true;
                        }
                        
                        // Disable if no availability data for this date
                        const dateStr = date.toISOString().split('T')[0];
                        const dayAvailability = dateAvailability?.[dateStr];
                        if (!dayAvailability) {
                          return true;
                        }
                        
                        // Check if there are any available slots
                        let hasAvailableSlots = false;
                        if (typeof dayAvailability === 'object' && dayAvailability !== null) {
                          Object.values(dayAvailability).forEach(slotData => {
                            if (typeof slotData === 'object' && slotData.available) {
                              if (slotData.available > 0) hasAvailableSlots = true;
                            } else if (typeof slotData === 'number') {
                              if (slotData > 0) hasAvailableSlots = true;
                            }
                          });
                        }
                        
                        return !hasAvailableSlots;
                      }}
                    />
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <span className="legend-color available"></span>
                        <span>Available (5+ slots)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color moderate"></span>
                        <span>Moderate (3-5 slots)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color limited"></span>
                        <span>Limited (1-2 slots)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Time Slot Selection */}
            {selectedDate && detectedRegion && (
              <div className="time-selection-container">
                <h5>Select Appointment Time:</h5>
                <div className="time-slots-grid">
                  {getAvailableTimeBlocksForDate(selectedDate, detectedRegion).map((block) => (
                    <motion.button
                      key={block.timeId}
                      className={`time-slot-modern ${appointment.time === block.time ? 'selected-modern' : ''}`}
                      onClick={() => handleAppointmentChange('time', block.time)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Clock className="time-icon" />
                      <div className="time-block-info">
                        <span className="time-block-time">{block.time}</span>
                        <span className="time-block-slots">{block.availableSlots} slot{block.availableSlots > 1 ? 's' : ''} available</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                {getAvailableTimeBlocksForDate(selectedDate, detectedRegion).length === 0 && (
                  <div className="no-availability-modern">
                    <p>No available time slots for this date. Please select a different date.</p>
                  </div>
                )}
              </div>
            )}
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

  const renderConfirmationStep = () => (
    <motion.div 
      className="script-step-dark"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(16,185,129,0.15)',
        padding: '2.5rem 1.5rem',
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(16,185,129,0.10)',
        padding: '2.5rem 2rem 2rem 2rem',
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 4px 16px rgba(16,185,129,0.15)'
        }}>
          <CheckCircle size={48} color="white" />
        </div>
        <h2 style={{
          color: '#059669',
          fontWeight: 800,
          fontSize: '2rem',
          marginBottom: 8,
          textAlign: 'center',
        }}>Appointment Confirmed!</h2>
        <p style={{
          color: '#334155',
          fontSize: '1.1rem',
          marginBottom: 28,
          textAlign: 'center',
        }}>
          Your appointment has been successfully scheduled
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.2rem 1.5rem',
          width: '100%',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>DATE</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatDateTime(appointment.date, '')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>TIME</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{appointment.time}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Home size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>PROJECT</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{projectType === 'bath' ? 'Bathroom Remodel' : projectType === 'roof' ? 'Roof Replacement' : projectType}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>CUSTOMER</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{customerInfo.firstName && customerInfo.lastName ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Not provided'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>PHONE</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{customerInfo.phone || 'Not provided'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={22} color="#6366f1" />
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>EMAIL</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{customerInfo.email || 'Not provided'}</div>
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: 16,
          padding: '0.75rem 1.5rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          marginBottom: 18,
          boxShadow: '0 2px 8px rgba(16,185,129,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircle size={20} color="white" />
          Appointment Fully Confirmed
        </div>
        <p style={{
          color: '#334155',
          fontSize: '1rem',
          marginBottom: 28,
          textAlign: 'center',
        }}>
          Customer has confirmed the appointment and no follow-up is needed. This will update the Salesforce status to <b>"Set"</b>.
        </p>
        <button 
          className="action-button"
          style={{
            background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '1rem 2.5rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            boxShadow: '0 2px 8px rgba(59,130,246,0.10)',
            marginTop: 8,
            marginBottom: 0,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => {
            setAppointmentConfirmed(true);
          }}
        >
          <Check size={20} style={{ marginRight: 10, verticalAlign: 'middle' }} />
          Confirm with Customer
        </button>
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
              "Before I finalize everything, could you do a few things for me? Please mention the appointment to any other parties involved, and mark your calendar to avoid rescheduling. Also, do not make any decisions until Long gets a chance to show you our product and how we can offer you peace of mind at a great price. Does that make sense? OK FANTASTIC…. The next point of contact will be the rep at your home on {appointment.date} at {appointment.time} to do the estimate for you on a total replacement of your {projectType}. Thank you and have a wonderful day!"
            </p>
          </div>
        </div>
      </div>
      
      <motion.button 
        className="complete-button-dark"
        onClick={() => handleSendToSalesforce()}
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
                    parsedPropertyInfo && Object.keys(parsedPropertyInfo).length > 0 ? (
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
      case 'customerInfo':
        return renderCustomerInfoStep();
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
      case 'confirmation':
        return renderConfirmationStep();
      case 'buttonUp':
        return renderButtonUpStep();
      default:
        return renderGreetingStep();
    }
  };

  // Add state for duplicate modal
  const [duplicateModal, setDuplicateModal] = useState({ open: false, duplicates: [], allowSave: false });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Define the handleSendToSalesforce function
  const handleSendToSalesforce = async (forceCreate = false) => {
    try {
      console.log('Sending data to Salesforce...', { forceCreate });
      // Collect necessary data
      const data = {
        appointment,
        propertyInfo: parsedPropertyInfo,
        customerInfo,
        projectType,
        callType,
        userName,
        appointmentConfirmed,
        allowSave: forceCreate
      };

      console.log('Data being sent:', data);

      // Make API call to Salesforce
      // Use the correct endpoint based on environment
      const apiUrl = '/.netlify/functions/sendToSalesforce';
      
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is not empty
      const text = await response.text();
      console.log('Raw response text:', text);
      
      const result = text ? JSON.parse(text) : {};
      console.log('Parsed result:', result);

      if (response.ok) {
        console.log('Data sent successfully:', result);
        setRecapMessage({ type: 'success', title: 'Success', message: 'Data sent to Salesforce successfully.' });
      } else if (response.status === 409 && result.error === 'DUPLICATE') {
        // Handle duplicate case
        console.log('Duplicate detected:', result);
        
        // If no actual duplicates found, proceed with creation
        if (!result.duplicates || result.duplicates.length === 0) {
          console.log('No actual duplicates found, proceeding with creation');
          // Retry with force create, but only if not already forcing
          if (!forceCreate) {
            return handleSendToSalesforce(true);
          } else {
            // If we're already forcing and still getting duplicates, just proceed
            console.log('Already forcing creation, proceeding anyway');
            setRecapMessage({ type: 'success', title: 'Success', message: 'Data sent to Salesforce successfully.' });
            return; // Exit early to prevent modal from showing
          }
        }
        
        // If we reach here and forceCreate is true, just proceed with success
        if (forceCreate) {
          console.log('Force create is true, proceeding with success');
          setRecapMessage({ type: 'success', title: 'Success', message: 'Data sent to Salesforce successfully.' });
          return;
        }
        
        // Only show modal if we have actual duplicates
        console.log('Checking duplicates array:', result.duplicates);
        console.log('Duplicates length:', result.duplicates ? result.duplicates.length : 'undefined');
        
        if (result.duplicates && result.duplicates.length > 0) {
          console.log('Setting duplicate modal with:', {
            open: true,
            duplicates: result.duplicates || [],
            allowSave: result.allowSave || false
          });
          setDuplicateModal({
            open: true,
            duplicates: result.duplicates || [],
            allowSave: result.allowSave || false
          });
        } else {
          console.log('No duplicates to show, proceeding with success message');
          setRecapMessage({ type: 'success', title: 'Success', message: 'Data sent to Salesforce successfully.' });
        }
      } else {
        console.error('Error sending data:', result);
        setRecapMessage({ type: 'error', title: 'Error', message: 'Failed to send data to Salesforce.', details: result.error || 'No error details provided.' });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setRecapMessage({ type: 'error', title: 'Error', message: 'An unexpected error occurred.', details: error.message });
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
            <motion.button
              onClick={clearAllData}
              className="nav-button-dark"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 600
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start New Appointment
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
              if (step.type === 'scheduling') StepIcon = CalendarIcon;
              if (step.type === 'confirmation') StepIcon = CheckCircle;
              return (
                <motion.div
                  key={step.id}
                  className={`progress-step-prominent ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
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

        {/* Use grid layout for sidebar + main content, match Home page, and make sidebar collapsible */}
        <div style={{ display: 'grid', gridTemplateColumns: `${sidebarCollapsed ? '56px' : '300px'} 1fr`, gap: '2rem', alignItems: 'flex-start' }}>
          <RebuttalSidebar collapsed={sidebarCollapsed} onCollapseChange={setSidebarCollapsed} />
          <div className="script-main-content-dark">
            {renderCurrentStep()}
          </div>
        </div>
      </motion.div>

      {showRecap && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          padding: '2rem'
        }}>
          <motion.div 
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '2rem',
              maxWidth: 1200,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRecap(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#64748b',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e2e8f0';
                e.target.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.color = '#64748b';
              }}
            >
              ✕
            </button>

            <h1 style={{ 
              color: '#1e293b', 
              marginBottom: '2rem', 
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 700
            }}>
              📋 Appointment Recaps
            </h1>

            <div style={{
              display: 'flex', 
              flexDirection: 'row', 
              gap: '2rem', 
              justifyContent: 'center', 
              flexWrap: 'wrap'
            }}>
              {/* Rep Recap Card */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: 16,
                padding: '2rem',
                maxWidth: 500,
                minWidth: 350,
                color: '#fff',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(59,130,246,0.3)'
              }}>
                <h2 style={{ 
                  color: '#fff', 
                  marginBottom: 16,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👨‍💼 Rep Recap
                </h2>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit', 
                  fontSize: '1rem', 
                  marginBottom: 20,
                  lineHeight: '1.5',
                  color: '#e2e8f0'
                }}>
                  {repRecapText}
                </pre>
                <button
                  onClick={handleCopyRepRecap}
                  style={{
                    background: repRecapCopied ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 8,
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    if (!repRecapCopied) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!repRecapCopied) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {repRecapCopied ? '✅ Copied!' : '📋 Copy Rep Recap'}
                </button>
              </div>

              {/* Customer Recap Card */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: 16,
                padding: '2rem',
                maxWidth: 450,
                minWidth: 320,
                color: '#fff',
                boxShadow: '0 8px 32px rgba(16,185,129,0.3)'
              }}>
                <h2 style={{ 
                  color: '#fff', 
                  marginBottom: 16,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👤 Customer Recap
                </h2>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'inherit', 
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  color: '#d1fae5'
                }}>
                  {customerRecapText}
                </pre>
                <button
                  onClick={handleCopyCustomerRecap}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 8,
                    padding: '0.75rem 1.5rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    marginTop: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  📋 Copy Customer Recap
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Beautiful Salesforce Confirmation Modal */}
      {recapMessage.title && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <motion.div 
            style={{
              background: recapMessage.type === 'success' 
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              borderRadius: 20,
              padding: '2rem',
              maxWidth: 500,
              width: '90%',
              color: 'white',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {recapMessage.type === 'success' ? '✅' : '❌'}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
              {recapMessage.title}
            </h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', opacity: 0.9 }}>
              {recapMessage.message}
            </p>
            {recapMessage.details && (
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                {recapMessage.details}
              </p>
            )}
            <button
              onClick={() => {
                setRecapMessage({ type: 'success', title: '', message: '', details: '' });
                if (recapMessage.type === 'success') {
                  // Only show recap if we have actual appointment data
                  if (appointment.date && appointment.time && (customerInfo.firstName || customerInfo.lastName)) {
                    setShowRecap(true);
                  }
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 12,
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {recapMessage.type === 'success' ? 'Continue' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Progress Notification */}
      {showProgressNotification && (
        <motion.div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
            zIndex: 10000,
            maxWidth: '300px',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💾</span>
            {progressMessage}
          </div>
        </motion.div>
      )}

      {duplicateModal.open && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.8)', 
          zIndex: 9999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <motion.div 
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 24,
              padding: '2rem',
              minWidth: 480,
              maxWidth: 600,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            {/* Decorative background elements */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '50%',
              opacity: 0.3
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
              borderRadius: '50%',
              opacity: 0.3
            }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>
                ⚠️
              </div>
              <h2 style={{ 
                color: '#dc2626', 
                marginBottom: '0.5rem',
                fontSize: '1.8rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Duplicate Lead Detected
              </h2>
              <p style={{ 
                color: '#64748b', 
                fontSize: '1.1rem',
                fontWeight: 500
              }}>
                A similar lead already exists in Salesforce
              </p>
            </div>

            {/* Duplicate Details */}
            {duplicateModal.duplicates.map((dup, index) => (
              <motion.div 
                key={dup.id}
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '2px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Decorative accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)'
                }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Basic Info */}
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Name
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 600
                    }}>
                      {dup.name}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Phone
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {dup.phone}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Email
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {dup.email}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Company
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {dup.company}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Status
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {dup.status}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Lead Source
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}>
                      {dup.leadSource}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  borderRadius: 8,
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <div style={{ 
                    color: '#374151', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    📍 Address Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Address:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.address}</div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>City:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.city}</div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>State:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.state}</div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>ZIP:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.zipCode}</div>
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: 8,
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}>
                  <div style={{ 
                    color: '#374151', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    📅 Activity Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Last Activity:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.lastActivity}</div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Created:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.createdDate}</div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Last Modified:</span>
                      <div style={{ color: '#1f2937', fontWeight: 500 }}>{dup.lastModifiedDate}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dup.description && dup.description !== 'N/A' && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    background: 'rgba(245, 158, 11, 0.05)', 
                    borderRadius: 8,
                    border: '1px solid rgba(245, 158, 11, 0.1)'
                  }}>
                    <div style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      📝 Description
                    </div>
                    <div style={{ 
                      color: '#1f2937', 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {dup.description}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <a 
                    href={dup.salesforceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.2s ease',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    🔗 View in Salesforce
                  </a>
                </div>
              </motion.div>
            ))}

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <motion.button 
                onClick={() => { 
                  const url = duplicateModal.duplicates[0]?.salesforceUrl;
                  if (url && url !== 'https://login.salesforce.com' && url.startsWith('http')) {
                    window.open(url, '_blank');
                  } else {
                    alert('Unable to open Salesforce record. Please log into Salesforce and search for the lead manually.');
                  }
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '0.75rem 1.5rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                👁️ View Existing Lead
              </motion.button>
              
              {duplicateModal.allowSave && (
                <motion.button 
                  onClick={() => { setDuplicateModal({ ...duplicateModal, open: false }); handleSendToSalesforce(true); }}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 12, 
                    padding: '0.75rem 1.5rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  ➕ Create New Anyway
                </motion.button>
              )}
              
              <motion.button 
                onClick={() => setDuplicateModal({ open: false, duplicates: [], allowSave: false })}
                style={{ 
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: '#374151', 
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '0.75rem 1.5rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                }}
              >
                ❌ Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

  export default ScheduleScript; 