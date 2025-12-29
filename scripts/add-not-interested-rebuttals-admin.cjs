const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Not Interested rebuttals with different approaches
const notInterestedRebuttals = [
  {
    title: "Not Interested - Value Focus",
    category: "Wiiq4L9xmyRsqJQefgKJ", // Not Interested category ID
    objection: "I'm not interested in this",
    response: {
      pt1: "I completely understand. Before you go, I'd like to share what makes our service unique. Many of our customers were initially hesitant but found tremendous value in our approach.",
      pt2: "Would you be open to hearing about our current promotion? It's a limited-time offer that many of our customers have found compelling."
    },
    icon: "❌",
    color: "#FF6B6B",
    tags: ["disinterest", "value", "promotion", "benefits", "unique"],
    steps: [
      "Acknowledge position",
      "Present unique value",
      "Mention promotion",
      "Ask for consideration"
    ],
    tips: [
      "Stay positive and professional",
      "Focus on unique benefits",
      "Respect their decision",
      "Present limited-time value"
    ]
  },
  {
    title: "Not Interested - Problem Solver",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested right now",
    response: {
      pt1: "I understand this might not be a priority right now. However, many of our customers found that addressing this early prevented more urgent and costly issues later.",
      pt2: "Would you like to hear about how our service can help you avoid potential problems down the line? It might be worth a few minutes of your time."
    },
    icon: "🛡️",
    color: "#FF6B6B",
    tags: ["prevention", "priority", "cost-savings", "future-planning"],
    steps: [
      "Acknowledge timing",
      "Present prevention value",
      "Explain future benefits",
      "Offer brief overview"
    ],
    tips: [
      "Focus on prevention",
      "Highlight cost savings",
      "Respect their timeline",
      "Present future value"
    ]
  },
  {
    title: "Not Interested - Social Proof",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this service",
    response: {
      pt1: "I understand. Many of our customers felt the same way initially. What changed their mind was seeing how our service solved problems they didn't even realize they had.",
      pt2: "Would you be open to hearing a quick story about how we helped someone in a similar situation? It might give you a different perspective."
    },
    icon: "👥",
    color: "#FF6B6B",
    tags: ["social-proof", "testimonials", "similar-situations", "perspective"],
    steps: [
      "Acknowledge initial reaction",
      "Share success story",
      "Present different perspective",
      "Ask for openness"
    ],
    tips: [
      "Use relevant testimonials",
      "Focus on similar situations",
      "Present new perspective",
      "Keep it conversational"
    ]
  },
  {
    title: "Not Interested - Curiosity Approach",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested at all",
    response: {
      pt1: "I appreciate your honesty. Just out of curiosity, what specifically about our service doesn't interest you? I'd love to understand your perspective better.",
      pt2: "Sometimes what people think they know about a service is different from the reality. Would you be open to a quick 2-minute overview to see if there's anything that might actually benefit you?"
    },
    icon: "🤔",
    color: "#FF6B6B",
    tags: ["curiosity", "understanding", "perspective", "education"],
    steps: [
      "Thank for honesty",
      "Ask for specific concerns",
      "Challenge assumptions",
      "Offer brief overview"
    ],
    tips: [
      "Show genuine curiosity",
      "Ask specific questions",
      "Challenge misconceptions",
      "Keep it brief"
    ]
  },
  {
    title: "Not Interested - Urgency Approach",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything right now",
    response: {
      pt1: "I understand you're not looking for anything right now. However, our current promotion is ending soon, and it's the best value we've offered in months.",
      pt2: "Would you be open to hearing about this limited-time offer? Even if you're not ready now, you'll know about it for when you might be interested later."
    },
    icon: "⏰",
    color: "#FF6B6B",
    tags: ["urgency", "limited-time", "promotion", "future-value"],
    steps: [
      "Acknowledge current disinterest",
      "Present urgency",
      "Mention limited-time value",
      "Offer future consideration"
    ],
    tips: [
      "Create genuine urgency",
      "Focus on limited availability",
      "Respect current position",
      "Plant future seed"
    ]
  },
  {
    title: "Not Interested - Problem Identification",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in what you're offering",
    response: {
      pt1: "I understand. Before you go, I'd like to understand what problems or challenges you're currently facing. Sometimes our service can help in ways people don't expect.",
      pt2: "Could you share what specific issues you're dealing with? I might have a solution that's different from what you're imagining."
    },
    icon: "🎯",
    color: "#FF6B6B",
    tags: ["problem-solving", "needs-assessment", "solutions", "understanding"],
    steps: [
      "Acknowledge disinterest",
      "Ask about current problems",
      "Present unexpected solutions",
      "Focus on their needs"
    ],
    tips: [
      "Focus on their problems",
      "Listen actively",
      "Present unexpected value",
      "Be solution-oriented"
    ]
  },
  {
    title: "Not Interested - Educational Approach",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this type of service",
    response: {
      pt1: "I understand. Many people think they know what our service involves, but it's often quite different from what they imagine. Would you be open to a quick education?",
      pt2: "Even if you're not interested now, understanding what we actually do might be valuable for future reference or for someone you know."
    },
    icon: "📚",
    color: "#FF6B6B",
    tags: ["education", "misconceptions", "future-reference", "knowledge"],
    steps: [
      "Acknowledge assumption",
      "Challenge misconceptions",
      "Offer education",
      "Present future value"
    ],
    tips: [
      "Focus on education",
      "Challenge assumptions",
      "Provide value",
      "Think long-term"
    ]
  },
  {
    title: "Not Interested - Relationship Building",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything you have",
    response: {
      pt1: "I appreciate your directness. Even if you're not interested in our services right now, I'd love to stay connected. You never know when you might need what we offer.",
      pt2: "Would you be open to receiving occasional updates about our services? I promise to only share information that might actually be valuable to you."
    },
    icon: "🤝",
    color: "#FF6B6B",
    tags: ["relationship", "connection", "future-opportunity", "value"],
    steps: [
      "Thank for directness",
      "Propose connection",
      "Promise value",
      "Ask for permission"
    ],
    tips: [
      "Build relationships",
      "Focus on future value",
      "Respect boundaries",
      "Stay connected"
    ]
  },
  {
    title: "Not Interested - Time Investment",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I don't have time for this",
    response: {
      pt1: "I completely understand you're busy. That's exactly why our service is designed to be efficient and save you time in the long run.",
      pt2: "Would you be open to a quick 5-minute overview? I can show you how our service actually saves time and reduces stress."
    },
    icon: "⏱️",
    color: "#FF6B6B",
    tags: ["time", "efficiency", "busy", "convenience"],
    steps: [
      "Acknowledge busy schedule",
      "Present time-saving benefits",
      "Offer brief overview",
      "Focus on convenience"
    ],
    tips: [
      "Respect their time",
      "Focus on efficiency",
      "Keep it brief",
      "Highlight convenience"
    ]
  },
  {
    title: "Not Interested - Cost Concern",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I can't afford this",
    response: {
      pt1: "I understand budget concerns. Many of our customers thought the same thing, but they found our service actually saves them money in the long run.",
      pt2: "Would you like to hear about our flexible payment options and current promotion? We have solutions for different budget situations."
    },
    icon: "💰",
    color: "#FF6B6B",
    tags: ["budget", "cost", "payment", "savings"],
    steps: [
      "Acknowledge budget concern",
      "Present long-term savings",
      "Offer payment options",
      "Mention promotion"
    ],
    tips: [
      "Focus on value",
      "Present payment flexibility",
      "Highlight long-term savings",
      "Be understanding"
    ]
  }
];

async function addNotInterestedRebuttals() {
  try {
    console.log('Starting to add Not Interested rebuttals...');
    
    const rebuttalsCollection = db.collection('rebuttals');
    
    for (const rebuttal of notInterestedRebuttals) {
      const rebuttalData = {
        ...rebuttal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        archived: false
      };
      
      const docRef = await rebuttalsCollection.add(rebuttalData);
      console.log(`✅ Added rebuttal: "${rebuttal.title}" with ID: ${docRef.id}`);
    }
    
    console.log('🎉 Successfully added all Not Interested rebuttals!');
    console.log(`Total rebuttals added: ${notInterestedRebuttals.length}`);
    
  } catch (error) {
    console.error('❌ Error adding rebuttals:', error);
    throw error;
  }
}

// Run the script
addNotInterestedRebuttals()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 