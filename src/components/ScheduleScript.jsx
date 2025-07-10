import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, FileText, CheckCircle, ChevronRight, Phone, User, Home, Mail, Users, CheckSquare, Square, Check } from 'lucide-react';
import '../styles/ScheduleScript.css';

const ScheduleScript = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [callType, setCallType] = useState('');
  const [projectType, setProjectType] = useState('');

  const [projectDetails, setProjectDetails] = useState({
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

  const projectChecklistItems = [
    "How old is your (roof/bath/shower)?",
    "What issues are you currently having with your (product)?",
    "What would you like to have done? (Ask product related questions)"
  ];

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
            console.log('Setting call type to incoming');
            setCallType('incoming');
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
            console.log('Setting call type to outgoing');
            setCallType('outgoing');
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
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          disabled={!callType}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ opacity: !callType ? 0.5 : 1 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
            console.log('Setting project type to bath');
            setProjectType('bath');
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
            console.log('Setting project type to roof');
            setProjectType('roof');
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
        
        <motion.button
          className="nav-button-dark next-button-dark"
          onClick={handleNext}
          disabled={!projectType}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ opacity: !projectType ? 0.5 : 1 }}
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
      <h3 className="step-title-dark">Project Checklist</h3>
      <div className="checklist-container-dark">
        <h4 className="checklist-title-dark">General Project Questions:</h4>
        <div className="checklist-items-dark">
          {projectChecklistItems.map((item, index) => (
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
              <li>Samples in hand</li>
              <li>Wellness check</li>
              <li>Colors, styles, warranty options</li>
              <li>Financing options</li>
              <li>On-the-spot estimate</li>
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
          // Handle script completion
          console.log('Script completed:', {
            callType,
            projectType,
            projectDetails,
            appointment,
            checklistItems
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

  const renderCurrentStep = () => {
    switch (scriptSteps[currentStep].id) {
      case 'greeting':
        return renderGreetingStep();
      case 'projectType':
        return renderProjectTypeStep();
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
          <div className="progress-bar-dark">
            {scriptSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`progress-step-dark ${index <= currentStep ? 'active-dark' : ''} ${index === currentStep ? 'current-dark' : ''} clickable-step-dark`}
                onClick={() => setCurrentStep(index)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ cursor: 'pointer' }}
              >
                <span className="step-number-dark">{index + 1}</span>
                <span className="step-label-dark">{step.title}</span>
              </motion.div>
            ))}
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