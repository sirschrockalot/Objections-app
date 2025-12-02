import { Objection } from '@/types';

export const initialObjections: Objection[] = [
  {
    id: '1',
    text: "Price is too high.",
    category: 'Price',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '1-1',
        text: "Totally understand. Most investors feel that way until they walk it. After seeing the condition in person, they usually realize there's more spread than they thought. Let's do this — come walk it and give me your best number. If the seller agrees, I'll lock it in for you.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '2',
    text: "I need to run the numbers first.",
    category: 'Timing',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '2-1',
        text: "No problem at all — I sent you everything you need. While you look at it, let's go ahead and schedule a walkthrough. If the numbers don't match what you want after seeing it, no harm done.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '3',
    text: "I'm not interested.",
    category: 'Interest',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '3-1',
        text: "Got it — just so I don't send you stuff that doesn't fit, is it the price, location, or condition that makes this one a pass?",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '4',
    text: "I only buy in certain areas.",
    category: 'Interest',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '4-1',
        text: "Perfect — that actually helps. This one is in (market), which performs really well for our current buyers. Even if this one doesn't fit, walking it helps me know exactly what to send you next.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '5',
    text: "I'm too busy.",
    category: 'Timing',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '5-1',
        text: "Totally understand — that's exactly why I'm calling. This one will move fast, and I want you to have a shot. Let me text you the photos now, and I'll find a walkthrough time that fits your schedule.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '6',
    text: "I'm already working with other wholesalers.",
    category: 'Trust',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '6-1',
        text: "Love it — that means you're active. We move 30–40 deals a month, so we're a strong source for you. Think of us as another pipeline sending you deeply discounted inventory.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '7',
    text: "Send it to me and I'll look later.",
    category: 'Timing',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '7-1',
        text: "For sure — and I already sent it your way. While you review it, let's pencil in a walkthrough time so you don't miss it if it's a fit.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '8',
    text: "This needs too much work.",
    category: 'Property',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '8-1',
        text: "For the right investor, that's exactly why the spread is so good. The heavy-rehab deals usually have the highest upside. Come walk it — at worst, it confirms your decision. At best, you find a deal with big equity.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '9',
    text: "It's not worth that ARV.",
    category: 'Price',
    difficulty: 'advanced',
    defaultResponses: [
      {
        id: '9-1',
        text: "I hear you. ARVs are always up for debate — that's why I included comps from the last 90 days. If you have better comps, happy to adjust. Let's walk it so you can see what value you could bring.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '10',
    text: "The neighborhood isn't great.",
    category: 'Property',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '10-1',
        text: "A lot of our flippers buy in this neighborhood and do extremely well — mainly because the entry price is so low. This one hits the numbers investors look for.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '11',
    text: "I'm not liquid right now.",
    category: 'Timing',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '11-1',
        text: "No worries — totally normal. When do you expect to be ready again? I want to make sure you get deals that line up with your buying cycle.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '12',
    text: "My lender won't approve it.",
    category: 'Financial',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '12-1',
        text: "Got you — many of our buyers use lenders who don't require appraisals and close in 7–10 days. If you want, I can connect you with someone who can get you approved quickly.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '13',
    text: "Is this an assignment? I don't like assignments.",
    category: 'Trust',
    difficulty: 'advanced',
    defaultResponses: [
      {
        id: '13-1',
        text: "Yep — it's an assignment. 99% of investment deals are. The important part is: ✔ We're direct to seller ✔ We file a memorandum to protect the transaction ✔ You get the deal for cash, as-is, clean and simple.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '14',
    text: "I don't pay both sides of closing costs.",
    category: 'Financial',
    difficulty: 'advanced',
    defaultResponses: [
      {
        id: '14-1',
        text: "Totally fine — but just so you know, every investor who closes with us pays both sides because that's how we keep prices low on the front-end. Most buyers don't mind an extra $1,000–$1,500 on a deal with tens of thousands in upside.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '15',
    text: "I don't want to get into a bidding war.",
    category: 'Interest',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '15-1',
        text: "We don't do bidding wars — ever. We take best and final, and that's it. If your number makes sense, we'll take it.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '16',
    text: "I want the seller to make repairs first.",
    category: 'Interest',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '16-1',
        text: "All of our deals are cash, as-is. That's exactly why the price is discounted the way it is.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '17',
    text: "I don't trust wholesalers.",
    category: 'Trust',
    difficulty: 'advanced',
    defaultResponses: [
      {
        id: '17-1',
        text: "I completely get that — and honestly, some wholesalers give the whole industry a bad reputation. We're different because: – We are direct to seller – We file a memorandum – We close 30–40 deals a month consistently – And we only work with buyers who can perform",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '18',
    text: "I'll wait for something better.",
    category: 'Interest',
    difficulty: 'intermediate',
    defaultResponses: [
      {
        id: '18-1',
        text: "Totally fair — and I'll keep sending you deals. Just know: investors who work with us consistently usually close 2–4 deals a month because of how many opportunities we push out.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '19',
    text: "Your photos don't show enough.",
    category: 'Property',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '19-1',
        text: "No problem — that's why the walkthrough is so important. Photos never tell the full story, and that's where most investors miss out on hidden upside.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
  {
    id: '20',
    text: "Call me back later.",
    category: 'Timing',
    difficulty: 'beginner',
    defaultResponses: [
      {
        id: '20-1',
        text: "Absolutely — I will. Before I do, when's the best time? And I'll hold this deal for you till then.",
        isCustom: false,
      },
    ],
    customResponses: [],
  },
];
