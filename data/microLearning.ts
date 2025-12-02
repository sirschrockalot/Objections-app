import { DailyTip, ResponseTechnique } from '@/types';

export const dailyTips: DailyTip[] = [
  {
    id: 'tip-1',
    title: 'Acknowledge Before You Respond',
    content: 'Always acknowledge the buyer\'s concern before jumping into your response. A simple "I totally understand" or "That makes sense" shows empathy and builds rapport before you address the objection.',
    category: 'communication',
    difficulty: 'beginner',
  },
  {
    id: 'tip-2',
    title: 'Use the "Feel, Felt, Found" Technique',
    content: 'When handling objections, use this structure: "I understand how you feel. Other investors have felt the same way. What they found was..." This creates connection and provides social proof.',
    category: 'technique',
    difficulty: 'beginner',
  },
  {
    id: 'tip-3',
    title: 'Always End with a Next Step',
    content: 'Every response should end with a clear next step. Whether it\'s scheduling a walkthrough, sending more info, or getting their best number, always move the conversation forward.',
    category: 'closing',
    difficulty: 'beginner',
  },
  {
    id: 'tip-4',
    title: 'Reframe Price Objections',
    content: 'When buyers say "price is too high," reframe it as an opportunity. Instead of defending the price, focus on the spread, the potential profit, and the value they\'ll get after repairs.',
    category: 'strategy',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-5',
    title: 'Handle "I Need to Think About It"',
    content: 'When buyers need time, don\'t just say "okay." Ask "What specifically do you need to think about?" This helps you address their real concern and keeps the conversation moving.',
    category: 'technique',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-6',
    title: 'Use Specific Numbers',
    content: 'Instead of saying "good deal," use specific numbers: "$35k in potential profit" or "15% ROI." Specificity builds credibility and helps buyers visualize the opportunity.',
    category: 'communication',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-7',
    title: 'Create Urgency Without Pressure',
    content: 'Mention that other investors are looking at the property, but frame it as helpful information, not pressure. "Just so you know, I have 3 other investors interested" creates natural urgency.',
    category: 'strategy',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-8',
    title: 'Address Trust Issues Head-On',
    content: 'When buyers don\'t trust wholesalers, acknowledge it: "I completely get that - some wholesalers give the industry a bad name." Then immediately explain what makes you different.',
    category: 'psychology',
    difficulty: 'advanced',
  },
  {
    id: 'tip-9',
    title: 'Use Questions to Uncover Real Objections',
    content: 'When buyers give vague objections like "not interested," ask clarifying questions: "Is it the price, location, or condition?" This helps you address their actual concern.',
    category: 'technique',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-10',
    title: 'Turn Objections into Opportunities',
    content: 'Every objection is an opportunity to provide value. If they say "needs too much work," explain why heavy-rehab deals often have the highest upside and best spreads.',
    category: 'strategy',
    difficulty: 'advanced',
  },
  {
    id: 'tip-11',
    title: 'Match Their Communication Style',
    content: 'Pay attention to how buyers communicate. If they\'re direct and numbers-focused, be direct. If they\'re relationship-oriented, build rapport first. Adapt your style to theirs.',
    category: 'communication',
    difficulty: 'advanced',
  },
  {
    id: 'tip-12',
    title: 'Use Stories and Examples',
    content: 'Instead of just explaining concepts, use real examples: "Last month, an investor had the same concern, but after walking the property, they found $10k more in spread than expected."',
    category: 'communication',
    difficulty: 'intermediate',
  },
  {
    id: 'tip-13',
    title: 'Handle Multiple Objections Strategically',
    content: 'When buyers raise multiple concerns, address them in order of importance. Start with their biggest concern, then work through the others. Don\'t try to address everything at once.',
    category: 'strategy',
    difficulty: 'advanced',
  },
  {
    id: 'tip-14',
    title: 'Build Rapport Before Pitching',
    content: 'Take 30 seconds to build rapport before diving into the deal. Ask about their investing experience, what they\'re looking for, or how their day is going. People buy from people they like.',
    category: 'psychology',
    difficulty: 'beginner',
  },
  {
    id: 'tip-15',
    title: 'Use Silence Strategically',
    content: 'After you respond to an objection, don\'t immediately fill the silence. Give buyers a moment to process. Often, they\'ll reveal more information or agree to your next step.',
    category: 'technique',
    difficulty: 'advanced',
  },
];

export const responseTechniques: ResponseTechnique[] = [
  {
    id: 'technique-1',
    name: 'The Acknowledge-Reframe-Value-Next Step Framework',
    description: 'A structured approach to handling any objection by acknowledging the concern, reframing the perspective, highlighting value, and ending with a clear next step.',
    steps: [
      'Acknowledge: "I totally understand..." or "That makes sense..."',
      'Reframe: "Here\'s another way to look at it..."',
      'Value: "The benefit to you is..."',
      'Next Step: "Let\'s do this..." or "Here\'s what I suggest..."',
    ],
    examples: [
      'Price objection: "I understand price is a concern. Here\'s the thing - the spread on this deal is $35k after repairs. Let\'s walk it so you can see the upside yourself."',
      'Timing objection: "I get you\'re busy. That\'s exactly why I\'m calling - this will move fast. Let me text you the photos now and we\'ll find a walkthrough time that works."',
    ],
    category: 'Framework',
    difficulty: 'beginner',
  },
  {
    id: 'technique-2',
    name: 'The Feel-Felt-Found Method',
    description: 'A powerful technique that creates connection and provides social proof by relating to the buyer\'s feelings, sharing similar experiences, and revealing positive outcomes.',
    steps: [
      'Feel: "I understand how you feel..."',
      'Felt: "Other investors have felt the same way..."',
      'Found: "What they found was..."',
    ],
    examples: [
      'Trust objection: "I understand how you feel about wholesalers. Other investors have felt the same way. What they found was that we\'re different because we\'re direct to seller and file memorandums."',
      'Price objection: "I get that the price feels high. Most investors feel that way initially. What they found after walking it was that there\'s more spread than the numbers show."',
    ],
    category: 'Psychology',
    difficulty: 'beginner',
  },
  {
    id: 'technique-3',
    name: 'The Question-to-Uncover Method',
    description: 'Instead of immediately defending, ask questions to understand the real objection. This helps you address their actual concern rather than what they initially said.',
    steps: [
      'Acknowledge their initial concern',
      'Ask an open-ended question to dig deeper',
      'Listen actively to their response',
      'Address the real objection they reveal',
    ],
    examples: [
      '"Not interested" → "Got it - just so I don\'t send you stuff that doesn\'t fit, is it the price, location, or condition that makes this one a pass?"',
      '"I need to think about it" → "No problem at all. What specifically do you need to think about? Is it the numbers, the area, or something else?"',
    ],
    category: 'Technique',
    difficulty: 'intermediate',
  },
  {
    id: 'technique-4',
    name: 'The Reframe-and-Value Method',
    description: 'Take their objection and reframe it as a positive, then immediately show the value. This shifts their perspective from problem to opportunity.',
    steps: [
      'Acknowledge their concern',
      'Reframe: "Here\'s another way to look at it..."',
      'Show value: "The benefit is..."',
      'Provide proof or example',
    ],
    examples: [
      '"Needs too much work" → "For the right investor, that\'s exactly why the spread is so good. Heavy-rehab deals usually have the highest upside. Come walk it - you might find a deal with big equity."',
      '"Market is slowing" → "Actually, that\'s creating more opportunity. With less competition, you can negotiate better terms and take your time on the rehab."',
    ],
    category: 'Strategy',
    difficulty: 'intermediate',
  },
  {
    id: 'technique-5',
    name: 'The Assumptive Close',
    description: 'Instead of asking "if" they want to move forward, assume they do and ask "how" or "when." This creates forward momentum and reduces resistance.',
    steps: [
      'Address their objection',
      'Assume they\'re moving forward',
      'Ask "when" or "how" questions',
      'Provide options for next steps',
    ],
    examples: [
      'After handling price objection: "Great, so when can you walk it? I have availability tomorrow afternoon or Thursday morning."',
      'After handling timing objection: "Perfect. Let\'s get you scheduled. Do you prefer mornings or afternoons?"',
    ],
    category: 'Closing',
    difficulty: 'advanced',
  },
  {
    id: 'technique-6',
    name: 'The Social Proof Method',
    description: 'Use examples of other successful investors to build credibility and reduce risk perception. People are more likely to act when they see others have succeeded.',
    steps: [
      'Acknowledge their concern',
      'Share a relevant example or statistic',
      'Connect it to their situation',
      'Invite them to experience the same success',
    ],
    examples: [
      '"We move 30-40 deals a month, so we\'re a strong source for you. Think of us as another pipeline sending you deeply discounted inventory."',
      '"A lot of our flippers buy in this neighborhood and do extremely well - mainly because the entry price is so low."',
    ],
    category: 'Psychology',
    difficulty: 'intermediate',
  },
];

export function getDailyTip(date?: string): DailyTip {
  const today = date || new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date(today).getTime() - new Date(new Date(today).getFullYear(), 0, 0).getTime()) / 86400000);
  const tipIndex = dayOfYear % dailyTips.length;
  return dailyTips[tipIndex];
}

export function getRandomTip(): DailyTip {
  return dailyTips[Math.floor(Math.random() * dailyTips.length)];
}

export function getTipsByCategory(category: DailyTip['category']): DailyTip[] {
  return dailyTips.filter(tip => tip.category === category);
}

export function getTipsByDifficulty(difficulty: DailyTip['difficulty']): DailyTip[] {
  return dailyTips.filter(tip => tip.difficulty === difficulty);
}

export function getTechniqueById(id: string): ResponseTechnique | undefined {
  return responseTechniques.find(tech => tech.id === id);
}

export function getTechniquesByCategory(category: string): ResponseTechnique[] {
  return responseTechniques.filter(tech => tech.category === category);
}

export function getTechniquesByDifficulty(difficulty: ResponseTechnique['difficulty']): ResponseTechnique[] {
  return responseTechniques.filter(tech => tech.difficulty === difficulty);
}

