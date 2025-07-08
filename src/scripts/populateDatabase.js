import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';

// Firebase configuration for chathub-3f128
const firebaseConfig = {
  apiKey: "AIzaSyC_placeholder_key_here",
  authDomain: "chathub-3f128.firebaseapp.com",
  projectId: "chathub-3f128",
  storageBucket: "chathub-3f128.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Not Interested', icon: '❌', color: '#FF6B6B' },
  { name: 'Spouse Consultation', icon: '💑', color: '#4ECDC4' },
  { name: 'One Legger', icon: '👤', color: '#45B7D1' },
  { name: 'Not Ready', icon: '⏳', color: '#96CEB4' },
  { name: 'Curious', icon: '🤔', color: '#FFEEAD' },
  { name: 'Time Concern', icon: '⏰', color: '#D4A5A5' },
  { name: 'Can\'t Afford', icon: '💰', color: '#9B59B6' },
  { name: 'Spouse', icon: '👫', color: '#3498DB' },
  { name: 'Price Phone', icon: '📞', color: '#E67E22' },
  { name: 'Repair', icon: '🔧', color: '#2ECC71' },
  { name: 'Government Grants', icon: '🏛️', color: '#34495E' },
  { name: 'Reset Appointment', icon: '🔄', color: '#F1C40F' },
  { name: 'No Request', icon: '🚫', color: '#E74C3C' },
  { name: 'Bad Reviews', icon: '⭐', color: '#F39C12' }
];

// Sample rebuttals for each category
const SAMPLE_REBUTTALS = [
  // Can't Afford category
  {
    title: "Can't Afford Right Now",
    category: "Can't Afford",
    objection: "I can't afford this right now",
    response: {
      pt1: "I completely understand your concern about the cost. Many of our customers felt the same way initially, but they found that our solution actually saves them money in the long run.",
      pt2: "If cost is still a concern, we have several flexible payment options and financing solutions that might work better for your budget. Would you like to hear about those?"
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["cost", "budget", "payment", "financing"],
    steps: ["Acknowledge concern", "Present value proposition", "Offer payment options"],
    tips: ["Be empathetic", "Focus on long-term value", "Present multiple options"]
  },
  {
    title: "Need to Check Finances",
    category: "Can't Afford",
    objection: "I need to check my finances",
    response: {
      pt1: "I understand you need to review your finances. We have several payment options that can accommodate different financial situations.",
      pt2: "Would you like to hear about our current promotion? It includes flexible payment terms that might work better for your financial situation."
    },
    icon: "💳",
    color: "#9B59B6",
    tags: ["finances", "payment", "options", "promotion"],
    steps: ["Acknowledge need", "Present options", "Mention promotion", "Offer flexibility"],
    tips: ["Be flexible", "Focus on options", "Present value"]
  },

  // Reset Appointment category
  {
    title: "Need to Reschedule",
    category: "Reset Appointment",
    objection: "I need to reschedule my appointment",
    response: {
      pt1: "I understand that things come up and schedules need to change. I'd be happy to help you find a new time that works better for you.",
      pt2: "What days and times would work better for your schedule? I'll make sure to find a slot that's convenient for you."
    },
    icon: "🔄",
    color: "#F1C40F",
    tags: ["schedule", "reschedule", "appointment", "flexibility"],
    steps: ["Acknowledge request", "Offer assistance", "Find alternatives"],
    tips: ["Be accommodating", "Show flexibility", "Maintain professionalism"]
  },
  {
    title: "Emergency Reschedule",
    category: "Reset Appointment",
    objection: "I have an emergency and need to reschedule",
    response: {
      pt1: "I understand this is an emergency situation. Let me help you reschedule right away to a time that works better for you.",
      pt2: "Is there a specific time or day that would work better for you? I'll do everything I can to accommodate your needs."
    },
    icon: "🚨",
    color: "#F1C40F",
    tags: ["emergency", "reschedule", "urgent", "accommodation"],
    steps: ["Acknowledge emergency", "Offer immediate help", "Find solution"],
    tips: ["Be understanding", "Act quickly", "Show empathy"]
  },

  // Not Interested category
  {
    title: "Not Interested",
    category: "Not Interested",
    objection: "I'm not interested",
    response: {
      pt1: "I understand you may not be interested right now. However, I'd like to share some information that might change your mind about our services.",
      pt2: "Many customers who initially said they weren't interested found our solutions to be exactly what they needed. Would you be open to hearing about our most popular benefits?"
    },
    icon: "❌",
    color: "#FF6B6B",
    tags: ["not interested", "persuasion", "benefits"],
    steps: ["Acknowledge disinterest", "Present value", "Ask for opportunity"],
    tips: ["Stay positive", "Focus on benefits", "Don't be pushy"]
  },
  {
    title: "Already Have Service",
    category: "Not Interested",
    objection: "I already have this service",
    response: {
      pt1: "I understand you already have a service provider. However, many customers find that our service offers unique benefits that their current provider doesn't offer.",
      pt2: "Would you be interested in learning about what makes our service different and potentially better than what you currently have?"
    },
    icon: "🏢",
    color: "#FF6B6B",
    tags: ["existing service", "comparison", "benefits"],
    steps: ["Acknowledge current service", "Present differences", "Highlight advantages"],
    tips: ["Be respectful", "Focus on differences", "Don't criticize current provider"]
  },

  // Spouse Consultation category
  {
    title: "Need to Consult Spouse",
    category: "Spouse Consultation",
    objection: "I need to talk to my spouse first",
    response: {
      pt1: "I completely understand that this is a decision you want to make together with your spouse. That's a smart approach to important decisions.",
      pt2: "When you discuss this with your spouse, I'd be happy to provide you with some key points to share that might help with the decision-making process."
    },
    icon: "💑",
    color: "#4ECDC4",
    tags: ["spouse", "consultation", "decision", "partnership"],
    steps: ["Acknowledge need", "Support decision", "Offer assistance"],
    tips: ["Be supportive", "Respect partnership", "Offer helpful information"]
  },
  {
    title: "Spouse Approval Needed",
    category: "Spouse Consultation",
    objection: "My spouse needs to approve this",
    response: {
      pt1: "I understand that your spouse's approval is important for this decision. That shows good communication in your relationship.",
      pt2: "Would it be helpful if I provided you with some information that you could share with your spouse to help explain the benefits of our service?"
    },
    icon: "👫",
    color: "#4ECDC4",
    tags: ["approval", "spouse", "communication", "benefits"],
    steps: ["Acknowledge approval need", "Support relationship", "Offer information"],
    tips: ["Be respectful", "Support relationship", "Provide helpful info"]
  },

  // Bad Reviews category
  {
    title: "Saw Bad Reviews",
    category: "Bad Reviews",
    objection: "I saw some bad reviews about your company",
    response: {
      pt1: "I appreciate you bringing that up. We take all feedback seriously and have worked hard to address any issues that were raised in those reviews.",
      pt2: "I'd be happy to share some recent positive reviews and explain how we've improved our service based on customer feedback."
    },
    icon: "⭐",
    color: "#F39C12",
    tags: ["reviews", "feedback", "improvement", "transparency"],
    steps: ["Acknowledge concern", "Address feedback", "Share improvements"],
    tips: ["Be honest", "Show improvement", "Share positive feedback"]
  },
  {
    title: "Need to Check Reviews",
    category: "Bad Reviews",
    objection: "I need to check your reviews first",
    response: {
      pt1: "I understand you want to check our reviews. We're proud of our recent customer feedback and would be happy to share some recent testimonials.",
      pt2: "Would you like to hear about some recent success stories? Many of our customers have shared their positive experiences."
    },
    icon: "⭐",
    color: "#F39C12",
    tags: ["reviews", "testimonials", "feedback", "success"],
    steps: ["Acknowledge need", "Share testimonials", "Present success stories", "Offer information"],
    tips: ["Be honest", "Share recent feedback", "Focus on improvements"]
  }
];

const populateDatabase = async () => {
  try {
    console.log('Starting database population...');

    // Check if categories already exist
    const categoriesQuery = query(collection(db, 'categories'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    
    if (!categoriesSnapshot.empty) {
      console.log('Categories already exist, skipping category creation');
    } else {
      console.log('Creating categories...');
      for (const category of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: category.name,
          icon: category.icon,
          color: category.color,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`Created category: ${category.name}`);
      }
    }

    // Check if rebuttals already exist
    const rebuttalsQuery = query(collection(db, 'rebuttals'));
    const rebuttalsSnapshot = await getDocs(rebuttalsQuery);
    
    if (!rebuttalsSnapshot.empty) {
      console.log('Rebuttals already exist, skipping rebuttal creation');
    } else {
      console.log('Creating rebuttals...');
      for (const rebuttal of SAMPLE_REBUTTALS) {
        await addDoc(collection(db, 'rebuttals'), {
          title: rebuttal.title,
          category: rebuttal.category,
          objection: rebuttal.objection,
          response: rebuttal.response,
          icon: rebuttal.icon,
          color: rebuttal.color,
          tags: rebuttal.tags,
          steps: rebuttal.steps,
          tips: rebuttal.tips,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`Created rebuttal: ${rebuttal.title}`);
      }
    }

    console.log('Database population completed successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
};

// Run the population script
populateDatabase(); 