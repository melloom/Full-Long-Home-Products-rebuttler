const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Much more compelling Not Interested rebuttals
const betterNotInterestedRebuttals = [
  {
    title: "Not Interested - Pain Amplification",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested",
    response: {
      pt1: "I understand. But let me ask you something - what's the biggest problem you're facing with your home right now? Is it safety concerns, energy bills, or something else? Because I've seen customers who said 'not interested' until they realized how much money they were literally throwing away every month.",
      pt2: "What if I could show you exactly how much this is costing you right now, and how our solution pays for itself within 6 months? Would that change your mind? Most people are shocked when they see the real numbers."
    },
    icon: "💸",
    color: "#FF6B6B",
    tags: ["pain-points", "cost-savings", "urgency", "specific-benefits"],
    steps: [
      "Acknowledge but redirect",
      "Ask about specific problems",
      "Present shocking cost reality",
      "Offer concrete numbers"
    ],
    tips: [
      "Make them feel the pain of inaction",
      "Use specific dollar amounts",
      "Create urgency with real numbers",
      "Focus on immediate problems"
    ]
  },
  {
    title: "Not Interested - Fear of Missing Out",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything right now",
    response: {
      pt1: "I get it. But here's what's happening - our current promotion ends in 48 hours, and it's the biggest discount we've offered in 2 years. I'm talking about saving $3,000-$5,000. The people who wait always end up paying full price later.",
      pt2: "Look, I'm not trying to pressure you, but I've seen this happen 100 times. People say 'not interested' now, then call back in 3 months when they have an emergency and have to pay full price. Would you rather save $3,000 now or pay $3,000 more later?"
    },
    icon: "⏰",
    color: "#FF6B6B",
    tags: ["fomo", "limited-time", "specific-savings", "emergency-costs"],
    steps: [
      "Present urgent deadline",
      "Show specific savings",
      "Create future regret scenario",
      "Give them choice"
    ],
    tips: [
      "Use specific time limits",
      "Show exact dollar amounts",
      "Create future regret",
      "Make it their choice"
    ]
  },
  {
    title: "Not Interested - Social Proof Power",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this service",
    response: {
      pt1: "I understand. But let me tell you about Sarah from your neighborhood - she said the exact same thing last month. Then her neighbor's house had a major issue that cost them $15,000. Sarah called us in a panic, but by then our promotion was over and she had to pay full price.",
      pt2: "Sarah told me 'I wish I had listened to you when you first called.' She's not the only one - 8 out of 10 people who say 'not interested' end up calling us back within 6 months, usually during an emergency. Would you rather be proactive or reactive?"
    },
    icon: "👥",
    color: "#FF6B6B",
    tags: ["social-proof", "neighbor-story", "emergency-costs", "proactive-vs-reactive"],
    steps: [
      "Share specific neighbor story",
      "Show emergency consequences",
      "Present regret scenario",
      "Ask proactive vs reactive"
    ],
    tips: [
      "Use local neighbor stories",
      "Show real emergency costs",
      "Create fear of missing out",
      "Make them choose"
    ]
  },
  {
    title: "Not Interested - Authority Challenge",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested at all",
    response: {
      pt1: "I appreciate your honesty. But let me ask you something - when was the last time you made a major decision about your home without getting all the facts first? Most people who say 'not interested' are actually saying 'I don't have enough information to make a good decision.'",
      pt2: "What if I could show you exactly what this would cost, exactly what you'd save, and exactly what happens if you don't do it? Would you be open to getting the facts so you can make an informed decision? Or would you prefer to make a decision based on incomplete information?"
    },
    icon: "🎯",
    color: "#FF6B6B",
    tags: ["authority", "information-gap", "informed-decision", "challenge"],
    steps: [
      "Challenge their decision process",
      "Point out information gap",
      "Offer complete facts",
      "Make them choose"
    ],
    tips: [
      "Question their decision-making",
      "Highlight information gaps",
      "Position yourself as expert",
      "Force them to choose"
    ]
  },
  {
    title: "Not Interested - Emotional Trigger",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in what you're offering",
    response: {
      pt1: "I understand. But let me ask you something personal - what's more important to you: saving money or protecting your family? Because I've seen families who said 'not interested' until their child got hurt because of an issue they could have prevented for $2,000.",
      pt2: "I'm not trying to scare you, but I am trying to make you think. Is saving $2,000 worth risking your family's safety? Most people say no when they really think about it. What's your family's safety worth to you?"
    },
    icon: "❤️",
    color: "#FF6B6B",
    tags: ["family-safety", "emotional-appeal", "safety-vs-cost", "personal"],
    steps: [
      "Ask personal safety question",
      "Share emotional story",
      "Make it about family",
      "Ask what safety is worth"
    ],
    tips: [
      "Use family safety angle",
      "Share emotional stories",
      "Make it personal",
      "Appeal to emotions"
    ]
  },
  {
    title: "Not Interested - Competitor Comparison",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this",
    response: {
      pt1: "I understand. But let me ask you something - have you compared us to other companies? Because I can show you exactly why we're different. Our customers save 40% more than people who go with our competitors, and we have a 98% satisfaction rate.",
      pt2: "What if I could show you a side-by-side comparison of what you'd get with us vs. our competitors? Most people are shocked when they see the difference. Would you be open to seeing the facts, or would you prefer to make a decision without all the information?"
    },
    icon: "📊",
    color: "#FF6B6B",
    tags: ["comparison", "competitive-advantage", "specific-numbers", "information"],
    steps: [
      "Ask about comparisons",
      "Present competitive advantages",
      "Offer side-by-side facts",
      "Challenge incomplete decisions"
    ],
    tips: [
      "Use specific percentages",
      "Show competitive advantages",
      "Offer comparisons",
      "Make them want facts"
    ]
  },
  {
    title: "Not Interested - Future Regret",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested right now",
    response: {
      pt1: "I understand. But let me ask you something - what's your biggest fear about your home? Is it a safety issue, high energy bills, or something else? Because I've seen people who said 'not interested' until they had a $10,000 emergency that could have been prevented for $2,000.",
      pt2: "Think about it this way - if something goes wrong in the next 6 months, will you be glad you saved $2,000 now, or will you wish you had spent $2,000 to prevent a $10,000 problem? Most people say they wish they had been proactive."
    },
    icon: "😰",
    color: "#FF6B6B",
    tags: ["future-regret", "emergency-costs", "proactive-thinking", "fear"],
    steps: [
      "Ask about biggest fears",
      "Present emergency scenarios",
      "Show cost comparison",
      "Create future regret"
    ],
    tips: [
      "Identify their fears",
      "Use specific cost scenarios",
      "Create future regret",
      "Make them think ahead"
    ]
  },
  {
    title: "Not Interested - Authority Positioning",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything you have",
    response: {
      pt1: "I understand. But let me ask you something - when you need expert advice about your home, who do you turn to? Because I'm not just a salesperson, I'm a certified home specialist with 15 years of experience. I've helped over 2,000 families in your area.",
      pt2: "Most people who say 'not interested' are actually saying 'I don't trust you yet.' But here's the thing - I can show you exactly what I've done for your neighbors, exactly how much they saved, and exactly why they're glad they listened. Would you be open to hearing from someone who actually knows what they're talking about?"
    },
    icon: "👨‍💼",
    color: "#FF6B6B",
    tags: ["authority", "expertise", "trust", "neighbor-proof"],
    steps: [
      "Ask about expert sources",
      "Establish credentials",
      "Show neighbor results",
      "Position as trusted expert"
    ],
    tips: [
      "Establish authority",
      "Show specific credentials",
      "Use neighbor testimonials",
      "Build trust"
    ]
  },
  {
    title: "Not Interested - Urgency with Specifics",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything right now",
    response: {
      pt1: "I understand. But here's what's happening right now - our current promotion ends in exactly 24 hours, and it's saving people $3,500 on average. That's not a sales pitch, that's a fact. I have the numbers right here.",
      pt2: "Look, I'm not trying to pressure you, but I've seen this happen 50 times this month alone. People say 'not interested' now, then call back next week when the promotion is gone and have to pay $3,500 more. Do you want to save $3,500 now or pay $3,500 more later? It's your choice."
    },
    icon: "🔥",
    color: "#FF6B6B",
    tags: ["urgency", "specific-savings", "time-limit", "choice"],
    steps: [
      "Present specific deadline",
      "Show exact savings",
      "Share recent examples",
      "Give them choice"
    ],
    tips: [
      "Use specific time limits",
      "Show exact dollar amounts",
      "Share recent examples",
      "Make it their decision"
    ]
  },
  {
    title: "Not Interested - Problem Amplification",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in what you're offering",
    response: {
      pt1: "I understand. But let me ask you something - what's the biggest headache you're dealing with at home right now? Is it high energy bills, safety concerns, or something else? Because I've seen people who said 'not interested' until they realized they were literally throwing away $200-$400 every month.",
      pt2: "What if I could show you exactly how much this problem is costing you right now, and exactly how much you'll save by fixing it? Most people are shocked when they see the real numbers. Would you be open to seeing what this is actually costing you?"
    },
    icon: "💡",
    color: "#FF6B6B",
    tags: ["problem-amplification", "cost-reality", "monthly-savings", "specific-numbers"],
    steps: [
      "Ask about current problems",
      "Amplify the cost",
      "Show monthly impact",
      "Offer cost analysis"
    ],
    tips: [
      "Identify their problems",
      "Show monthly costs",
      "Use specific numbers",
      "Make them see reality"
    ]
  }
];

async function addBetterNotInterestedRebuttals() {
  try {
    console.log('Starting to add Better Not Interested rebuttals...');
    
    const rebuttalsCollection = db.collection('rebuttals');
    
    for (const rebuttal of betterNotInterestedRebuttals) {
      const rebuttalData = {
        ...rebuttal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        archived: false
      };
      
      const docRef = await rebuttalsCollection.add(rebuttalData);
      console.log(`✅ Added rebuttal: "${rebuttal.title}" with ID: ${docRef.id}`);
    }
    
    console.log('🎉 Successfully added all Better Not Interested rebuttals!');
    console.log(`Total rebuttals added: ${betterNotInterestedRebuttals.length}`);
    
  } catch (error) {
    console.error('❌ Error adding rebuttals:', error);
    throw error;
  }
}

// Run the script
addBetterNotInterestedRebuttals()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 