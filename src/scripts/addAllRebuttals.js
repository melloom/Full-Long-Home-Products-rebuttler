import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

// All the new rebuttals
const NEW_REBUTTALS = [
  // Curious category
  {
    title: "Just Looking - Curious",
    category: "Curious",
    objection: "I'm just looking, I was just curious",
    response: {
      pt1: "I totally get it—most homeowners are in that stage when they get the estimate, so they can prepare. It is free, and the quote is good for 12 months, so it's simply valuable info to have. What is your schedule like tomorrow?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🤔",
    color: "#FFEEAD",
    tags: ["curious", "just looking", "free estimate", "promotion"],
    steps: ["Acknowledge curiosity", "Explain value", "Offer promotion", "Schedule appointment"],
    tips: ["Be understanding", "Focus on value", "Don't pressure", "Make it easy"]
  },
  {
    title: "Design Consultation - Curious",
    category: "Curious",
    objection: "I'm just looking, I was just curious",
    response: {
      pt1: "That is perfect, the design consultation is meant for that purpose, we'll come out and show you options with our professional designer at no cost to you! If you see something you like you have a full year to act on the quote. Does morning, afternoon, or evening work best for you?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🎨",
    color: "#FFEEAD",
    tags: ["design", "consultation", "professional", "no cost"],
    steps: ["Explain purpose", "Offer professional service", "Mention time flexibility", "Schedule"],
    tips: ["Emphasize no cost", "Highlight professional service", "Be flexible with timing"]
  },

  // Not Ready category
  {
    title: "Not Ready to Start",
    category: "Not Ready",
    objection: "Not ready to start/ Want to hold off/Uninterested",
    response: {
      pt1: "I totally understand — just to clarify, you reached out recently, which usually means something sparked concern or interest. Even if you're not ready to move forward, the free estimate gives you the information you need to plan, budget, and avoid any surprises down the line, when are you usually home from work?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Does morning, afternoon, or evening work best for you?"
    },
    icon: "⏳",
    color: "#96CEB4",
    tags: ["not ready", "planning", "budget", "promotion"],
    steps: ["Acknowledge concern", "Explain value of planning", "Offer promotion", "Schedule"],
    tips: ["Be understanding", "Focus on planning value", "Don't pressure"]
  },
  {
    title: "Big Decision - Not Ready",
    category: "Not Ready",
    objection: "Not ready to start/ Want to hold off/Uninterested",
    response: {
      pt1: "Of course—it's a big decision. Just so I can give you the right information to think over, what specific concerns do you have with your roof/bath?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🤔",
    color: "#96CEB4",
    tags: ["big decision", "concerns", "information", "promotion"],
    steps: ["Acknowledge decision size", "Ask about concerns", "Offer information", "Schedule"],
    tips: ["Be patient", "Listen to concerns", "Provide information"]
  },
  {
    title: "No Pressure - Not Ready",
    category: "Not Ready",
    objection: "Not ready to start/ Want to hold off/Uninterested",
    response: {
      pt1: "That is perfect. We are not here to pressure, just give you the information you need for when the time is right. Locking in your pricing now though, can save tons of money later, when are you usually home from work so we can provide that information?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🕊️",
    color: "#96CEB4",
    tags: ["no pressure", "information", "pricing", "savings"],
    steps: ["Reassure no pressure", "Explain information value", "Mention pricing lock", "Schedule"],
    tips: ["Be reassuring", "Focus on information", "Don't pressure"]
  },

  // Time Concern category
  {
    title: "Busy Schedule - Time Concern",
    category: "Time Concern",
    objection: "I'm busy / Why 60-90 min?",
    response: {
      pt1: "I totally understand. We can come out in the evenings or on weekends to accommodate your busy schedule, what do your evenings and weekends look like?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "⏰",
    color: "#D4A5A5",
    tags: ["busy", "schedule", "flexibility", "promotion"],
    steps: ["Acknowledge busy schedule", "Offer flexibility", "Mention promotion", "Find time"],
    tips: ["Be flexible", "Work around their schedule", "Show understanding"]
  },
  {
    title: "Why 60-90 Minutes - Time Concern",
    category: "Time Concern",
    objection: "I'm busy / Why 60-90 min?",
    response: {
      pt1: "Your time is certainly valuable and we want to be respectful of that. The reason we ask for 60 to 90 minutes is because we're not just dropping off a price. We'll inspect the area, walk you through your options, answer your questions, and give you an exact quote — not a ballpark. Most customers appreciate that we do it right the first time, so there are no surprises later. When are you usually home from work?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Does morning, afternoon, or evening work best for you?"
    },
    icon: "⏱️",
    color: "#D4A5A5",
    tags: ["time explanation", "thorough service", "no surprises", "promotion"],
    steps: ["Acknowledge time value", "Explain thorough process", "Mention no surprises", "Schedule"],
    tips: ["Explain the value", "Emphasize thoroughness", "Show respect for time"]
  },
  {
    title: "Expert Consultation - Time Concern",
    category: "Time Concern",
    objection: "I'm busy / Why 60-90 min?",
    response: {
      pt1: "We completely understand your time is valuable, that's exactly why we offer our expert design consultation and the Home Wellness Check, at no cost to you. To make sure we do it right, we just need about 60 to 90 minutes. Are evenings, afternoons, or mornings better for you?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "👨‍🔬",
    color: "#D4A5A5",
    tags: ["expert consultation", "wellness check", "no cost", "promotion"],
    steps: ["Acknowledge time value", "Explain expert service", "Mention no cost", "Find time"],
    tips: ["Emphasize expertise", "Highlight free service", "Be flexible"]
  },

  // Can't Afford category
  {
    title: "Flexible Financing - Can't Afford",
    category: "Can't Afford",
    objection: "Can't afford it right now.",
    response: {
      pt1: "I completely understand, that's why we have flexible financing options and various promotions but more importantly, the estimate helps you budget and plan since we honor it for 12months. It is free and no obligation. What is your schedule like tomorrow?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["financing", "budget", "planning", "promotion"],
    steps: ["Acknowledge concern", "Mention financing", "Explain planning value", "Schedule"],
    tips: ["Be understanding", "Offer solutions", "Focus on planning"]
  },
  {
    title: "Free Wellness Check - Can't Afford",
    category: "Can't Afford",
    objection: "Can't afford it right now.",
    response: {
      pt1: "Totally understand if it's not in the budget right now. Our Home Wellness Check is free—you'll get expert advice and a plan you can use anytime in the next 12 months are you usually home in the morning, afternoon, or evening?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🏠",
    color: "#9B59B6",
    tags: ["free service", "expert advice", "planning", "promotion"],
    steps: ["Acknowledge budget concern", "Offer free service", "Explain value", "Schedule"],
    tips: ["Emphasize free", "Focus on expert advice", "Don't pressure"]
  },

  // Spouse Consultation category
  {
    title: "Both Partners Needed - Spouse Consultation",
    category: "Spouse Consultation",
    objection: "My spouse doesn't need to be there/I can handle it myself.",
    response: {
      pt1: "Totally understand — but since this involves decisions on design, materials, and financing options, if interested, it's helpful to have both of you there. We've found that when both partners are involved, it avoids delays and ensures everyone is happy with the result. When are you both usually home together?",
      pt2: "As a thank you for organizing your scheduled to meet with us we can offer a 5% discount if both of you are able to attend the appointment, when are you usually both home?"
    },
    icon: "💑",
    color: "#4ECDC4",
    tags: ["both partners", "decisions", "discount", "scheduling"],
    steps: ["Acknowledge concern", "Explain benefits", "Offer discount", "Schedule both"],
    tips: ["Explain the value", "Offer incentive", "Make it easy"]
  },
  {
    title: "Avoid Second Appointment - Spouse Consultation",
    category: "Spouse Consultation",
    objection: "My spouse doesn't need to be there/I can handle it myself.",
    response: {
      pt1: "That makes sense. The reason we ask is because there are a lot of choices — and we often get feedback like: 'Let me check with my spouse first.' We'd hate to waste your time with a second appointment if we can just get it right the first time, What does tomorrow look like for the both of you?",
      pt2: "As a thank you for organizing your scheduled to meet with us we can offer a 5% discount if both of you are able to attend the appointment, when are you usually both home?"
    },
    icon: "⏰",
    color: "#4ECDC4",
    tags: ["efficiency", "choices", "discount", "scheduling"],
    steps: ["Explain reasoning", "Mention efficiency", "Offer discount", "Schedule"],
    tips: ["Focus on efficiency", "Explain the process", "Offer incentive"]
  },
  {
    title: "Big Project Decisions - Spouse Consultation",
    category: "Spouse Consultation",
    objection: "My spouse doesn't need to be there/I can handle it myself.",
    response: {
      pt1: "I'm sure you absolutely can handle this on your own. But this is a big project with lots of options, and we often find even small preferences between couples can affect the final decision. We want to make sure you both get exactly what you want — the first time around. When are you both usually home together?",
      pt2: "As a thank you for organizing your scheduled to meet with us we can offer a 5% discount if both of you are able to attend the appointment, when are you usually both home?"
    },
    icon: "🏗️",
    color: "#4ECDC4",
    tags: ["big project", "preferences", "discount", "satisfaction"],
    steps: ["Acknowledge capability", "Explain project complexity", "Focus on satisfaction", "Offer discount"],
    tips: ["Be respectful", "Explain complexity", "Focus on satisfaction"]
  },

  // Price Phone category
  {
    title: "Accurate Quote - Price Phone",
    category: "Price Phone",
    objection: "Can't you just give me a quick quote/price over phone request.",
    response: {
      pt1: "Great question—and we definitely want to give you a real number you can count on. Since every home and situation is different, giving a quote without seeing the space can be misleading. That's why we offer free in-home consultation—to make sure you get the most accurate and honest price possible. What does tomorrow look like for you?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "📞",
    color: "#E67E22",
    tags: ["accurate quote", "free consultation", "honest pricing", "promotion"],
    steps: ["Acknowledge request", "Explain accuracy need", "Offer free consultation", "Schedule"],
    tips: ["Emphasize accuracy", "Explain why in-person is better", "Offer free service"]
  },
  {
    title: "No Surprises - Price Phone",
    category: "Price Phone",
    objection: "Can't you just give me a quick quote/price over phone request.",
    response: {
      pt1: "We'd love to, but every home is different. We've found that 'quick quotes' usually lead to inaccurate pricing or missed issues — and that costs more down the road. We want to ensure you get a price that's fair, accurate, and final — no surprises. When are you usually home from work?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Do mornings, afternoons, or evenings work best for you?"
    },
    icon: "🎯",
    color: "#E67E22",
    tags: ["no surprises", "accurate pricing", "fair price", "promotion"],
    steps: ["Explain why quick quotes fail", "Emphasize accuracy", "Promise no surprises", "Schedule"],
    tips: ["Explain the risks", "Emphasize fairness", "Promise accuracy"]
  },
  {
    title: "Unique Homes - Price Phone",
    category: "Price Phone",
    objection: "Can't you just give me a quick quote/price over phone request.",
    response: {
      pt1: "I'd love to give you a quote over the phone, but every home is unique. We've found that quick estimates often miss vital details and end up costing more later. That's why we offer a free in-home consultation—it ensures your quote is accurate, fair, and final with no surprises. Does morning, evening or afternoon usually work best for you?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🏠",
    color: "#E67E22",
    tags: ["unique homes", "vital details", "free consultation", "promotion"],
    steps: ["Explain uniqueness", "Mention missed details", "Offer free service", "Schedule"],
    tips: ["Emphasize uniqueness", "Explain missed details", "Offer free service"]
  },
  {
    title: "Doctor Analogy - Price Phone",
    category: "Price Phone",
    objection: "Can't you just give me a quick quote/price over phone request.",
    response: {
      pt1: "It's like going to the doctor. You wouldn't want a diagnosis over the phone — they need to take a look, ask questions, and understand what's really going on before giving a solution. We treat your home the same way — with care and accuracy. What does tomorrow look like for you?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "👨‍⚕️",
    color: "#E67E22",
    tags: ["doctor analogy", "care", "accuracy", "promotion"],
    steps: ["Use analogy", "Explain care approach", "Emphasize accuracy", "Schedule"],
    tips: ["Use relatable analogy", "Emphasize care", "Focus on accuracy"]
  },

  // Repair category
  {
    title: "Honest Options - Repair",
    category: "Repair",
    objection: "I just want a repair, not a full replacement/ Looking for a quick fix.",
    response: {
      pt1: "That's completely understandable — no one wants to replace more than they must. That's why we offer the free in-home estimate: so, we can take a look, diagnose the issue properly, and give you honest options. If repair makes sense, we'll tell you. If a replacement is smarter long-term, we'll explain why. Do mornings afternoons or evenings usually work best for you?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🔧",
    color: "#2ECC71",
    tags: ["honest options", "diagnosis", "free estimate", "promotion"],
    steps: ["Acknowledge preference", "Explain diagnosis", "Promise honesty", "Schedule"],
    tips: ["Be honest", "Explain diagnosis", "Don't pressure"]
  },
  {
    title: "Temporary Band-Aid - Repair",
    category: "Repair",
    objection: "I just want a repair, not a full replacement/ Looking for a quick fix.",
    response: {
      pt1: "Totally get wanting to repair—it feels like the easier fix. But often, the cost adds up fast and doesn't fully solve the issue. Let's take a look first, and we'll give you the smartest, most cost-effective option, no pressure either way. What does tomorrow look like for you?",
      pt2: "I completely understand, however, we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. When are you usually home from work?"
    },
    icon: "🩹",
    color: "#2ECC71",
    tags: ["cost-effective", "smart options", "no pressure", "promotion"],
    steps: ["Acknowledge preference", "Explain cost reality", "Offer smart options", "Schedule"],
    tips: ["Be understanding", "Explain cost reality", "Don't pressure"]
  },
  {
    title: "Long-term Savings - Repair",
    category: "Repair",
    objection: "I just want a repair, not a full replacement/ Looking for a quick fix.",
    response: {
      pt1: "I hear you; repairs can seem like the cheaper route. But in most cases, they're a temporary band-aid that ends up costing more long term. A full replacement may save you money and stress. Let us at least get the expert assessment done and go from there. When do you usually get home from work?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Do mornings, afternoons, or evenings work best for you?"
    },
    icon: "💰",
    color: "#2ECC71",
    tags: ["long-term savings", "expert assessment", "stress reduction", "promotion"],
    steps: ["Acknowledge preference", "Explain long-term costs", "Offer assessment", "Schedule"],
    tips: ["Explain long-term benefits", "Offer expert assessment", "Focus on savings"]
  },

  // Government Grants category
  {
    title: "Government Grants Alternative",
    category: "Government Grants",
    objection: "Government Grants",
    response: {
      pt1: "Government grants can be a confusing and very timely process and even then you still may not qualify! We can come out and provide pricing for you so that way you have an alternate plan you can act on to ensure this project is completed, when are you usually home so we can meet and discuss your options?",
      pt2: ""
    },
    icon: "🏛️",
    color: "#34495E",
    tags: ["government grants", "confusing process", "alternate plan", "qualification"],
    steps: ["Acknowledge grant complexity", "Explain qualification uncertainty", "Offer alternate plan", "Schedule"],
    tips: ["Be honest about grants", "Offer backup plan", "Focus on completion"]
  },

  // Reset Appointment category
  {
    title: "What Changed Your Mind - Reset Appointment",
    category: "Reset Appointment",
    objection: "Want to Cancel /Reset Appt",
    response: {
      pt1: "What changed your mind? (Use appropriate rebuttal to respond) – if no specific reason given move to Option 2 or 3",
      pt2: ""
    },
    icon: "🤔",
    color: "#F1C40F",
    tags: ["cancellation", "reason", "appropriate response"],
    steps: ["Ask for reason", "Use appropriate rebuttal", "Address specific concern"],
    tips: ["Listen to reason", "Address specific concerns", "Be understanding"]
  },
  {
    title: "Current Promotion - Reset Appointment",
    category: "Reset Appointment",
    objection: "Want to Cancel /Reset Appt",
    response: {
      pt1: "We can take care of that for you—but before I cancel, I'd hate for you to miss out on our current promotion. It's a fantastic way to lock in savings in case you decide to move forward later. Let's go ahead and reschedule instead—would earlier in the day or later work better for you?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Do mornings, afternoons, or evenings work best for you?"
    },
    icon: "🎁",
    color: "#F1C40F",
    tags: ["current promotion", "lock in savings", "reschedule", "promotion"],
    steps: ["Offer to cancel", "Mention promotion", "Suggest reschedule", "Schedule"],
    tips: ["Don't pressure", "Focus on savings", "Make rescheduling easy"]
  },
  {
    title: "12 Month Quote - Reset Appointment",
    category: "Reset Appointment",
    objection: "Want to Cancel /Reset Appt",
    response: {
      pt1: "I can take care of that for you but just a quick reminder, our quotes are valid for 12 full months. Something must've prompted you to reach out about the bath/roof, and from experience, having a plan in place before issues get worse really pays off. Does your original appointment time still work, or is there a better time this week?",
      pt2: "The reason I am being so insistent is that we are running our best promotion of the year right now which will lock in with no cost and no obligation for 12 months, and I want you to be able to take advantage of that. Do mornings, afternoons, or evenings work best for you?"
    },
    icon: "📅",
    color: "#F1C40F",
    tags: ["12 month quote", "prompted contact", "plan ahead", "promotion"],
    steps: ["Offer to cancel", "Mention quote validity", "Explain planning value", "Schedule"],
    tips: ["Remind about quote validity", "Explain planning benefits", "Be flexible"]
  },

  // No Request category
  {
    title: "Family or Friend Request - No Request",
    category: "No Request",
    objection: "Did not request Info",
    response: {
      pt1: "Sometimes family or friends will submit information for someone they know needs help with a project (probe for project – how old is your roof? When was the last time you updated your bathroom?)",
      pt2: ""
    },
    icon: "👥",
    color: "#E74C3C",
    tags: ["family request", "friend request", "project probe", "roof age", "bathroom update"],
    steps: ["Explain possibility", "Probe for project", "Ask about roof age", "Ask about bathroom"],
    tips: ["Be understanding", "Probe gently", "Find the real need"]
  },

  // Bad Reviews category
  {
    title: "Show How Amazing We Are - Bad Reviews",
    category: "Bad Reviews",
    objection: "I've read bad reviews",
    response: {
      pt1: "We do our best to keep every customer happy, but even the greats can't please everyone. We would love the chance to show you how amazing we are, when is usually a good time for you?",
      pt2: ""
    },
    icon: "⭐",
    color: "#F39C12",
    tags: ["bad reviews", "customer satisfaction", "show quality", "opportunity"],
    steps: ["Acknowledge reviews", "Explain reality", "Offer to prove quality", "Schedule"],
    tips: ["Be honest", "Don't dismiss concerns", "Offer to prove yourself"]
  }
];

const addAllRebuttals = async () => {
  try {
    console.log('Adding all new rebuttals...');
    
    for (const rebuttal of NEW_REBUTTALS) {
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
      console.log(`Added rebuttal: ${rebuttal.title}`);
    }
    
    console.log('All rebuttals added successfully!');
  } catch (error) {
    console.error('Error adding rebuttals:', error);
  }
};

addAllRebuttals(); 