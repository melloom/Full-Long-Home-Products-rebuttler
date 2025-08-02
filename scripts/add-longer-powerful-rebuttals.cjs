const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../long-home-c034d-firebase-adminsdk-fbsvc-9b66faca79.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// MUCH longer and more detailed Not Interested rebuttals
const longerPowerfulRebuttals = [
  {
    title: "Not Interested - Complete Pain Amplification",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested",
    response: {
      pt1: "I completely understand where you're coming from. But let me ask you something that might change your perspective - what's the biggest headache you're dealing with at home right now? Is it skyrocketing energy bills that keep going up every month? Safety concerns that keep you up at night? Or maybe it's the constant maintenance issues that seem to never end? Because I've seen hundreds of customers who said 'not interested' until they realized they were literally throwing away $300-$500 every single month on problems that could have been solved once and for all. One of my customers, Mike from your area, was paying $450 a month in energy bills alone. He said 'not interested' for 6 months, then finally let me show him the numbers. He was shocked to discover he had been wasting over $2,700 in just 6 months on energy inefficiencies that could have been fixed for $3,500. That's money he'll never get back. What's your biggest pain point right now? I'd love to show you exactly how much it's costing you.",
      pt2: "Here's what I can do for you right now - I can give you a complete analysis of what your current situation is costing you, show you exactly how much you'll save with our solution, and prove to you that it pays for itself within 6-12 months. Most people are absolutely shocked when they see the real numbers. For example, Sarah from your neighborhood was spending $380 a month on energy bills. After our solution, she's now paying $120 a month. That's $260 in savings every single month, which means our $3,200 solution paid for itself in just 12 months. Since then, she's been saving $3,120 every year. Would you be open to seeing exactly what your situation is costing you right now? I can show you the numbers in black and white, and if it doesn't make financial sense for you, I'll be the first to tell you. But I think you'll be surprised by what you see."
    },
    icon: "💸",
    color: "#FF6B6B",
    tags: ["pain-amplification", "specific-numbers", "neighbor-stories", "cost-analysis", "energy-savings"],
    steps: [
      "Acknowledge their position with empathy",
      "Ask about specific pain points",
      "Share detailed neighbor story with exact numbers",
      "Show monthly and yearly cost impact",
      "Offer complete analysis with guarantee",
      "Present specific savings example",
      "Ask for permission to show numbers"
    ],
    tips: [
      "Use specific customer names and stories",
      "Show exact dollar amounts and timeframes",
      "Create urgency with lost money",
      "Offer guarantee to reduce resistance",
      "Make it about their specific situation",
      "Use emotional language about money waste"
    ]
  },
  {
    title: "Not Interested - Comprehensive FOMO Strategy",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything right now",
    response: {
      pt1: "I totally get it - you're busy and not looking for anything right now. But here's what's happening that I think you should know about. Our current promotion ends in exactly 48 hours, and it's the biggest discount we've offered in 2 years. I'm talking about saving $3,000-$5,000 on average. But here's the real kicker - I've seen this exact scenario play out over 100 times in the last year. People say 'not interested' now, then call back in 3-6 months when they have an emergency or realize they need our services. By then, the promotion is gone and they have to pay full price. Just last week, I had a customer named Jennifer who said 'not interested' in January. She called me back in June when her energy bills hit $500 a month and her AC broke. She ended up paying $4,200 more than she would have if she had taken advantage of our January promotion. She literally cried on the phone saying 'I wish I had listened to you in January.' I don't want that to happen to you. What's your biggest concern about your home right now? I can show you exactly how much it's costing you and how much you'll save with our current promotion.",
      pt2: "Let me be completely honest with you - I'm not trying to pressure you, but I want you to have all the facts. Our current promotion is saving people an average of $3,500, and it ends in 48 hours. After that, prices go back to normal. I've seen this happen 50 times just this month alone. People say 'not interested' now, then call back next week when the promotion is gone and have to pay $3,500 more. Here's what I can do for you - I can give you a complete analysis of your current situation, show you exactly what you'll save with our promotion, and if it doesn't make sense for you, I'll be the first to tell you. But I think you'll be shocked by the numbers. Most people are. Would you rather save $3,500 now or pay $3,500 more later? It's your choice, but I want you to make an informed decision. What's your biggest concern about your home that I can help you with?"
    },
    icon: "⏰",
    color: "#FF6B6B",
    tags: ["fomo", "limited-time", "specific-savings", "emergency-costs", "regret-stories"],
    steps: [
      "Acknowledge their busy schedule",
      "Present urgent deadline with specific numbers",
      "Share detailed regret story with customer name",
      "Show exact cost of waiting",
      "Offer complete analysis with guarantee",
      "Present choice: save now or pay more later",
      "Ask about their specific concerns"
    ],
    tips: [
      "Use specific customer names and stories",
      "Show exact dollar amounts and timeframes",
      "Create urgency with real deadlines",
      "Share emotional regret stories",
      "Offer guarantee to reduce resistance",
      "Make it their informed choice"
    ]
  },
  {
    title: "Not Interested - Detailed Social Proof Power",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this service",
    response: {
      pt1: "I understand completely. But let me tell you about Sarah from your neighborhood - she said the exact same thing last month. She was busy with work and family, and just didn't think she needed our services. Then her neighbor's house had a major electrical issue that caused a fire and cost them $15,000 in damages. Sarah called me in a panic, but by then our promotion was over and she had to pay full price. She ended up paying $4,200 more than she would have if she had taken advantage of our promotion. Sarah told me on the phone 'I wish I had listened to you when you first called. I could have prevented this whole mess.' She's not the only one - 8 out of 10 people who say 'not interested' end up calling us back within 6 months, usually during an emergency or when they realize how much money they're wasting. Just last week, I had 3 customers who said 'not interested' 6 months ago call me back because their energy bills hit $500+ a month. They all said the same thing - 'I wish I had done this sooner.' What's your biggest concern about your home right now? I'd love to show you how we can prevent problems before they become emergencies.",
      pt2: "Here's what I can do for you - I can show you exactly what we've done for your neighbors, exactly how much they saved, and exactly why they're glad they listened. I have testimonials from over 50 families in your area who were initially hesitant but are now saving hundreds every month. For example, the Johnson family down the street was spending $420 a month on energy bills. After our solution, they're now paying $140 a month. That's $280 in savings every month, which means our $3,200 solution paid for itself in just 11 months. Since then, they've been saving $3,360 every year. Mrs. Johnson told me 'I wish I had done this years ago.' Would you rather be proactive and save money now, or reactive and pay more later when you have an emergency? I can show you the exact numbers for your situation."
    },
    icon: "👥",
    color: "#FF6B6B",
    tags: ["social-proof", "neighbor-stories", "emergency-costs", "proactive-vs-reactive", "testimonials"],
    steps: [
      "Share detailed neighbor story with specific events",
      "Show exact emergency costs and consequences",
      "Present regret scenario with customer name",
      "Share statistics about callbacks",
      "Show specific neighbor testimonials with numbers",
      "Present proactive vs reactive choice",
      "Offer specific analysis for their situation"
    ],
    tips: [
      "Use specific neighbor names and stories",
      "Show exact emergency costs",
      "Share emotional regret stories",
      "Use local testimonials with numbers",
      "Create fear of being reactive",
      "Make it about their specific situation"
    ]
  },
  {
    title: "Not Interested - Authority Challenge Deep Dive",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested at all",
    response: {
      pt1: "I appreciate your honesty. But let me ask you something that might change your perspective - when was the last time you made a major decision about your home without getting all the facts first? Most people who say 'not interested' are actually saying 'I don't have enough information to make a good decision.' And I completely understand that. But here's what I can offer you - I'm not just a salesperson, I'm a certified home specialist with 15 years of experience. I've helped over 2,000 families in your area make informed decisions about their homes. I can show you exactly what this would cost, exactly what you'd save, exactly what happens if you don't do it, and exactly what your neighbors who did it are saying. I have the data, the testimonials, and the proof. Most people are shocked when they see the real numbers. For example, I had a customer last month who was spending $380 a month on energy bills. He said 'not interested' until I showed him that he was literally throwing away $2,280 every year on energy inefficiencies. After our solution, he's now paying $120 a month. That's $260 in savings every month. Would you be open to getting the facts so you can make an informed decision? Or would you prefer to make a decision based on incomplete information?",
      pt2: "Here's what I can do for you right now - I can give you a complete analysis of your current situation, show you exactly what it's costing you, show you exactly what our solution would cost, show you exactly how much you'll save, and show you exactly what your neighbors who did it are saying. I have all the data, all the testimonials, and all the proof. If it doesn't make financial sense for you, I'll be the first to tell you. But I think you'll be surprised by what you see. Most people are. I've helped over 2,000 families make this decision, and 95% of them are glad they got the facts first. What's your biggest concern about your home right now? I'd love to show you exactly how we can help you save money and prevent problems."
    },
    icon: "🎯",
    color: "#FF6B6B",
    tags: ["authority", "information-gap", "informed-decision", "expertise", "data-driven"],
    steps: [
      "Thank for honesty",
      "Challenge their decision-making process",
      "Establish authority and credentials",
      "Point out information gap",
      "Offer complete facts and data",
      "Share specific customer example with numbers",
      "Present choice: informed vs uninformed decision",
      "Offer complete analysis with guarantee"
    ],
    tips: [
      "Establish yourself as expert",
      "Question their decision process",
      "Show specific credentials and experience",
      "Use data and statistics",
      "Offer guarantee to reduce resistance",
      "Make it about informed decisions"
    ]
  },
  {
    title: "Not Interested - Emotional Family Safety Deep Dive",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in what you're offering",
    response: {
      pt1: "I understand completely. But let me ask you something personal that might change your perspective - what's more important to you: saving money or protecting your family? Because I've seen families who said 'not interested' until their child got hurt because of an issue they could have prevented for $2,000. Just last month, I had a customer named Lisa who said 'not interested' in January. In March, her 8-year-old son got an electrical shock from an outlet that could have been fixed for $1,800. Thankfully he was okay, but the medical bills were $3,500, and the emotional trauma was priceless. Lisa called me crying saying 'I wish I had listened to you in January. My son's safety is worth more than $1,800.' I'm not trying to scare you, but I am trying to make you think about what's really important. Is saving $2,000 worth risking your family's safety? Most people say no when they really think about it. What's your family's safety worth to you? I can show you exactly what safety issues might exist in your home and exactly how much it would cost to fix them. Would you rather be safe now or sorry later?",
      pt2: "Here's what I can do for you - I can give you a complete safety analysis of your home, show you exactly what potential issues exist, show you exactly what it would cost to fix them, and show you exactly what could happen if you don't. I have testimonials from families who were glad they took action, and stories from families who wish they had. For example, the Martinez family had an electrical issue that was causing flickering lights. They said 'not interested' until their daughter got a shock from an outlet. They ended up paying $4,200 for emergency repairs and medical bills. If they had fixed it proactively, it would have cost $1,800. Mrs. Martinez told me 'I would pay anything to keep my family safe. I wish I had done this sooner.' What's your family's safety worth to you? I can show you exactly what we can do to protect them."
    },
    icon: "❤️",
    color: "#FF6B6B",
    tags: ["family-safety", "emotional-appeal", "safety-vs-cost", "personal-stories", "medical-costs"],
    steps: [
      "Ask personal safety question",
      "Share detailed emotional story with customer name",
      "Show medical costs vs prevention costs",
      "Make it about family safety",
      "Ask what safety is worth",
      "Offer complete safety analysis",
      "Share more safety testimonials"
    ],
    tips: [
      "Use family safety angle",
      "Share emotional stories with names",
      "Show medical vs prevention costs",
      "Make it personal and emotional",
      "Appeal to parental instincts",
      "Use safety vs cost comparison"
    ]
  },
  {
    title: "Not Interested - Comprehensive Competitor Comparison",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in this",
    response: {
      pt1: "I understand completely. But let me ask you something that might change your perspective - have you compared us to other companies? Because I can show you exactly why we're different and why our customers are so much happier. Our customers save 40% more than people who go with our competitors, and we have a 98% satisfaction rate. But here's what really sets us apart - we don't just install and leave. We provide ongoing support, maintenance, and monitoring. Most of our competitors install and disappear. We're still here 5, 10, even 15 years later. Just last week, I had a customer named David who was considering one of our competitors. They offered him a $2,800 solution. We offered him a $3,200 solution. He went with the competitor to save $400. Six months later, he called me because the competitor's solution wasn't working properly, and they wouldn't return his calls. He ended up paying us $3,200 to fix what the competitor did wrong, plus the $2,800 he already paid them. That's $6,000 total vs. $3,200 if he had gone with us from the start. David told me 'I wish I had gone with you first. The $400 I saved cost me $2,800.' What if I could show you a side-by-side comparison of what you'd get with us vs. our competitors? Most people are shocked when they see the difference. Would you be open to seeing the facts, or would you prefer to make a decision without all the information?",
      pt2: "Here's what I can do for you - I can show you exactly what we offer vs. what our competitors offer, show you exactly how much our customers save vs. competitor customers, show you exactly what our ongoing support includes, and show you exactly what happens when things go wrong with competitors. I have testimonials from customers who switched from competitors to us, and they all say the same thing - 'I wish I had gone with you first.' For example, the Wilson family went with a competitor to save $500. Two years later, they had to pay us $4,200 to fix what the competitor did wrong. They could have had our solution for $3,200 from the start. That's $4,700 total vs. $3,200. Would you be open to seeing a complete comparison? I think you'll be surprised by what you see."
    },
    icon: "📊",
    color: "#FF6B6B",
    tags: ["comparison", "competitive-advantage", "specific-numbers", "ongoing-support", "testimonials"],
    steps: [
      "Ask about comparisons",
      "Present specific competitive advantages",
      "Share detailed competitor failure story",
      "Show exact cost of choosing wrong",
      "Offer side-by-side comparison",
      "Share more competitor failure stories",
      "Ask for permission to show facts"
    ],
    tips: [
      "Use specific percentages and numbers",
      "Show competitive advantages clearly",
      "Share detailed failure stories",
      "Show exact cost of wrong choice",
      "Offer complete comparisons",
      "Make them want facts"
    ]
  },
  {
    title: "Not Interested - Future Regret Deep Dive",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested right now",
    response: {
      pt1: "I completely understand. But let me ask you something that might change your perspective - what's your biggest fear about your home? Is it a safety issue that keeps you up at night? High energy bills that keep going up every month? Or maybe it's the constant maintenance issues that seem to never end? Because I've seen hundreds of people who said 'not interested' until they had a $10,000 emergency that could have been prevented for $2,000. Just last month, I had a customer named Robert who said 'not interested' in January. In June, his electrical system failed completely, causing a fire that did $12,000 in damage. If he had fixed the issues we identified in January, it would have cost him $2,200. Instead, he paid $12,000 in damages plus $2,200 to fix the original issues. That's $14,200 total vs. $2,200 if he had been proactive. Robert told me 'I wish I had listened to you in January. This could have been prevented.' Think about it this way - if something goes wrong in the next 6 months, will you be glad you saved $2,000 now, or will you wish you had spent $2,000 to prevent a $10,000 problem? Most people say they wish they had been proactive. What's your biggest concern about your home right now?",
      pt2: "Here's what I can do for you - I can give you a complete analysis of your current situation, show you exactly what potential issues exist, show you exactly what it would cost to fix them now, show you exactly what it would cost if they become emergencies, and show you exactly what your neighbors who were proactive are saying. I have testimonials from people who were glad they took action, and stories from people who wish they had. For example, the Thompson family had a small electrical issue that was causing flickering lights. They said 'not interested' until their electrical system failed completely during a storm. They ended up paying $8,500 for emergency repairs vs. $1,800 if they had fixed it proactively. Mrs. Thompson told me 'I wish we had been proactive. The $1,800 we saved cost us $6,700.' What's your biggest concern about your home? I can show you exactly how we can prevent problems before they become emergencies."
    },
    icon: "😰",
    color: "#FF6B6B",
    tags: ["future-regret", "emergency-costs", "proactive-thinking", "fear", "safety-issues"],
    steps: [
      "Ask about biggest fears",
      "Share detailed emergency story with customer name",
      "Show exact cost comparison: prevention vs emergency",
      "Create future regret scenario",
      "Ask proactive vs reactive question",
      "Offer complete analysis",
      "Share more emergency stories"
    ],
    tips: [
      "Identify their specific fears",
      "Use specific cost scenarios",
      "Share detailed emergency stories",
      "Create future regret",
      "Make them think ahead",
      "Show exact dollar amounts"
    ]
  },
  {
    title: "Not Interested - Authority Positioning Deep Dive",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything you have",
    response: {
      pt1: "I understand completely. But let me ask you something that might change your perspective - when you need expert advice about your home, who do you turn to? Because I'm not just a salesperson, I'm a certified home specialist with 15 years of experience. I've helped over 2,000 families in your area make informed decisions about their homes. I have certifications in electrical safety, energy efficiency, and home maintenance. I've been featured in local home improvement magazines and have won multiple industry awards for customer satisfaction. Most people who say 'not interested' are actually saying 'I don't trust you yet.' And I completely understand that. But here's the thing - I can show you exactly what I've done for your neighbors, exactly how much they saved, exactly why they're glad they listened, and exactly what makes me different from other companies. I have testimonials from over 50 families in your area who were initially hesitant but are now saving hundreds every month. For example, the Rodriguez family was spending $380 a month on energy bills. After my solution, they're now paying $120 a month. That's $260 in savings every month. Mrs. Rodriguez told me 'I wish I had trusted you sooner. You really know what you're talking about.' Would you be open to hearing from someone who actually knows what they're talking about?",
      pt2: "Here's what I can do for you - I can show you exactly what I've done for your neighbors, exactly how much they saved, exactly why they're glad they listened, and exactly what makes me different. I have all the credentials, all the testimonials, and all the proof. If you don't trust me after seeing all the evidence, I completely understand. But I think you'll be surprised by what you see. Most people are. I've helped over 2,000 families make this decision, and 98% of them are glad they trusted me. What's your biggest concern about your home right now? I'd love to show you exactly how I can help you save money and prevent problems."
    },
    icon: "👨‍💼",
    color: "#FF6B6B",
    tags: ["authority", "expertise", "trust", "neighbor-proof", "credentials"],
    steps: [
      "Ask about expert sources",
      "Establish detailed credentials and experience",
      "Show specific certifications and awards",
      "Share detailed neighbor results with numbers",
      "Position as trusted expert",
      "Offer complete proof and testimonials",
      "Ask for permission to show evidence"
    ],
    tips: [
      "Establish detailed authority",
      "Show specific credentials and awards",
      "Use detailed neighbor testimonials with numbers",
      "Build trust through proof",
      "Show exact results and savings",
      "Make them want to trust you"
    ]
  },
  {
    title: "Not Interested - Urgency with Specific Details",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in anything right now",
    response: {
      pt1: "I completely understand you're not looking for anything right now. But here's what's happening right now that I think you should know about - our current promotion ends in exactly 24 hours, and it's saving people $3,500 on average. That's not a sales pitch, that's a fact. I have the numbers right here from the last 50 customers. But here's the real story - I've seen this exact scenario play out over 100 times in the last year. People say 'not interested' now, then call back next week when the promotion is gone and have to pay $3,500 more. Just last week, I had a customer named Jennifer who said 'not interested' in January. She called me back in June when her energy bills hit $500 a month and her AC broke. She ended up paying $4,200 more than she would have if she had taken advantage of our January promotion. She literally cried on the phone saying 'I wish I had listened to you in January. I could have saved $4,200.' I don't want that to happen to you. What's your biggest concern about your home right now? I can show you exactly how much it's costing you and exactly how much you'll save with our current promotion.",
      pt2: "Let me be completely honest with you - I'm not trying to pressure you, but I want you to have all the facts. Our current promotion is saving people an average of $3,500, and it ends in exactly 24 hours. After that, prices go back to normal. I've seen this happen 50 times just this month alone. People say 'not interested' now, then call back next week when the promotion is gone and have to pay $3,500 more. Here's what I can do for you - I can give you a complete analysis of your current situation, show you exactly what you'll save with our promotion, show you exactly what it will cost if you wait, and if it doesn't make sense for you, I'll be the first to tell you. But I think you'll be shocked by the numbers. Most people are. I have testimonials from people who were glad they took action, and stories from people who wish they had. Would you rather save $3,500 now or pay $3,500 more later? It's your choice, but I want you to make an informed decision. What's your biggest concern about your home that I can help you with?"
    },
    icon: "🔥",
    color: "#FF6B6B",
    tags: ["urgency", "specific-savings", "time-limit", "choice", "regret-stories"],
    steps: [
      "Acknowledge their current position",
      "Present specific deadline with exact numbers",
      "Share detailed regret story with customer name",
      "Show exact cost of waiting",
      "Offer complete analysis with guarantee",
      "Present choice: save now or pay more later",
      "Ask about their specific concerns"
    ],
    tips: [
      "Use specific time limits",
      "Show exact dollar amounts",
      "Share detailed regret stories",
      "Make it their informed choice",
      "Offer guarantee to reduce resistance",
      "Use emotional language about money"
    ]
  },
  {
    title: "Not Interested - Problem Amplification Deep Dive",
    category: "Wiiq4L9xmyRsqJQefgKJ",
    objection: "I'm not interested in what you're offering",
    response: {
      pt1: "I understand completely. But let me ask you something that might change your perspective - what's the biggest headache you're dealing with at home right now? Is it high energy bills that keep going up every month? Safety concerns that keep you up at night? Or maybe it's the constant maintenance issues that seem to never end? Because I've seen hundreds of people who said 'not interested' until they realized they were literally throwing away $200-$400 every single month on problems that could have been solved once and for all. One of my customers, Mike from your area, was paying $450 a month in energy bills alone. He said 'not interested' for 6 months, then finally let me show him the numbers. He was shocked to discover he had been wasting over $2,700 in just 6 months on energy inefficiencies that could have been fixed for $3,500. That's money he'll never get back. Another customer, Sarah, was spending $380 a month on energy bills. After our solution, she's now paying $120 a month. That's $260 in savings every month, which means our $3,200 solution paid for itself in just 12 months. Since then, she's been saving $3,120 every year. What's your biggest pain point right now? I'd love to show you exactly how much it's costing you.",
      pt2: "Here's what I can do for you right now - I can give you a complete analysis of what your current situation is costing you, show you exactly how much you'll save with our solution, and prove to you that it pays for itself within 6-12 months. Most people are absolutely shocked when they see the real numbers. For example, the Johnson family was spending $420 a month on energy bills. After our solution, they're now paying $140 a month. That's $280 in savings every month, which means our $3,200 solution paid for itself in just 11 months. Since then, they've been saving $3,360 every year. Mrs. Johnson told me 'I wish I had done this years ago. I was literally throwing away $3,360 every year.' Would you be open to seeing exactly what your situation is costing you right now? I can show you the numbers in black and white, and if it doesn't make financial sense for you, I'll be the first to tell you. But I think you'll be surprised by what you see."
    },
    icon: "💡",
    color: "#FF6B6B",
    tags: ["problem-amplification", "cost-reality", "monthly-savings", "specific-numbers", "neighbor-stories"],
    steps: [
      "Ask about current problems",
      "Amplify the monthly cost impact",
      "Share detailed customer stories with exact numbers",
      "Show yearly waste amounts",
      "Offer complete cost analysis",
      "Share more neighbor success stories",
      "Ask for permission to show numbers"
    ],
    tips: [
      "Identify their specific problems",
      "Show exact monthly costs",
      "Use specific numbers and timeframes",
      "Share detailed neighbor stories",
      "Make them see the real cost",
      "Offer guarantee to reduce resistance"
    ]
  }
];

async function addLongerPowerfulRebuttals() {
  try {
    console.log('Starting to add Longer Powerful Not Interested rebuttals...');
    
    const rebuttalsCollection = db.collection('rebuttals');
    
    for (const rebuttal of longerPowerfulRebuttals) {
      const rebuttalData = {
        ...rebuttal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        archived: false
      };
      
      const docRef = await rebuttalsCollection.add(rebuttalData);
      console.log(`✅ Added rebuttal: "${rebuttal.title}" with ID: ${docRef.id}`);
    }
    
    console.log('🎉 Successfully added all Longer Powerful Not Interested rebuttals!');
    console.log(`Total rebuttals added: ${longerPowerfulRebuttals.length}`);
    
  } catch (error) {
    console.error('❌ Error adding rebuttals:', error);
    throw error;
  }
}

// Run the script
addLongerPowerfulRebuttals()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 