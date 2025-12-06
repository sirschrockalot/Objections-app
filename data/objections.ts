import { Objection } from '@/types';

export const initialObjections: Objection[] = [
  {
    "id": "1",
    "text": "Price is too high.",
    "category": "Price",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "1-1",
        "text": "Totally understand. Most investors feel that way until they walk it. After seeing the condition in person, they usually realize there's more spread than they thought. Let's do this — come walk it and give me your best number. If the seller agrees, I'll lock it in for you.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "2",
    "text": "I need to run the numbers first.",
    "category": "Timing",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "2-1",
        "text": "No problem at all — I sent you everything you need. While you look at it, let's go ahead and schedule a walkthrough. If the numbers don't match what you want after seeing it, no harm done.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "3",
    "text": "I'm not interested.",
    "category": "Interest",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "3-1",
        "text": "Got it — just so I don't send you stuff that doesn't fit, is it the price, location, or condition that makes this one a pass?",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "4",
    "text": "I only buy in certain areas.",
    "category": "Interest",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "4-1",
        "text": "Perfect — that actually helps. This one is in (market), which performs really well for our current buyers. Even if this one doesn't fit, walking it helps me know exactly what to send you next.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "5",
    "text": "I'm too busy.",
    "category": "Timing",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "5-1",
        "text": "Totally understand — that's exactly why I'm calling. This one will move fast, and I want you to have a shot. Let me text you the photos now, and I'll find a walkthrough time that fits your schedule.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "6",
    "text": "I'm already working with other wholesalers.",
    "category": "Trust",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "6-1",
        "text": "Love it — that means you're active. We move 30–40 deals a month, so we're a strong source for you. Think of us as another pipeline sending you deeply discounted inventory.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "7",
    "text": "Send it to me and I'll look later.",
    "category": "Timing",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "7-1",
        "text": "For sure — and I already sent it your way. While you review it, let's pencil in a walkthrough time so you don't miss it if it's a fit.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "8",
    "text": "This needs too much work.",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "8-1",
        "text": "For the right investor, that's exactly why the spread is so good. The heavy-rehab deals usually have the highest upside. Come walk it — at worst, it confirms your decision. At best, you find a deal with big equity.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "9",
    "text": "It's not worth that ARV.",
    "category": "Price",
    "difficulty": "advanced",
    "defaultResponses": [
      {
        "id": "9-1",
        "text": "I hear you. ARVs are always up for debate — that's why I included comps from the last 90 days. If you have better comps, happy to adjust. Let's walk it so you can see what value you could bring.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "10",
    "text": "The neighborhood isn't great.",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "10-1",
        "text": "A lot of our flippers buy in this neighborhood and do extremely well — mainly because the entry price is so low. This one hits the numbers investors look for.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "11",
    "text": "I'm not liquid right now.",
    "category": "Timing",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "11-1",
        "text": "No worries — totally normal. When do you expect to be ready again? I want to make sure you get deals that line up with your buying cycle.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "12",
    "text": "My lender won't approve it.",
    "category": "Financial",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "12-1",
        "text": "Got you — many of our buyers use lenders who don't require appraisals and close in 7–10 days. If you want, I can connect you with someone who can get you approved quickly.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "13",
    "text": "Is this an assignment? I don't like assignments.",
    "category": "Trust",
    "difficulty": "advanced",
    "defaultResponses": [
      {
        "id": "13-1",
        "text": "Yep — it's an assignment. 99% of investment deals are. The important part is: ✔ We're direct to seller ✔ We file a memorandum to protect the transaction ✔ You get the deal for cash, as-is, clean and simple.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "14",
    "text": "I don't pay both sides of closing costs.",
    "category": "Financial",
    "difficulty": "advanced",
    "defaultResponses": [
      {
        "id": "14-1",
        "text": "Totally fine — but just so you know, every investor who closes with us pays both sides because that's how we keep prices low on the front-end. Most buyers don't mind an extra $1,000–$1,500 on a deal with tens of thousands in upside.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "15",
    "text": "I don't want to get into a bidding war.",
    "category": "Interest",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "15-1",
        "text": "We don't do bidding wars — ever. We take best and final, and that's it. If your number makes sense, we'll take it.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "16",
    "text": "I want the seller to make repairs first.",
    "category": "Interest",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "16-1",
        "text": "All of our deals are cash, as-is. That's exactly why the price is discounted the way it is.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "17",
    "text": "I don't trust wholesalers.",
    "category": "Trust",
    "difficulty": "advanced",
    "defaultResponses": [
      {
        "id": "17-1",
        "text": "I completely get that — and honestly, some wholesalers give the whole industry a bad reputation. We're different because: – We are direct to seller – We file a memorandum – We close 30–40 deals a month consistently – And we only work with buyers who can perform",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "18",
    "text": "I'll wait for something better.",
    "category": "Interest",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "18-1",
        "text": "Totally fair — and I'll keep sending you deals. Just know: investors who work with us consistently usually close 2–4 deals a month because of how many opportunities we push out.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "19",
    "text": "Your photos don't show enough.",
    "category": "Property",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "19-1",
        "text": "No problem — that's why the walkthrough is so important. Photos never tell the full story, and that's where most investors miss out on hidden upside.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "20",
    "text": "Call me back later.",
    "category": "Timing",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "20-1",
        "text": "Absolutely — I will. Before I do, when's the best time? And I'll hold this deal for you till then.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "d9751c8e-2544-4f3e-8d82-a8e0e020b25b",
    "text": "I get these calls all the time, I am not taking any low ball offers...",
    "category": "Timing",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "637bb4d3-23b3-4e50-ba9b-15ebc3ba5ba7",
        "text": "I get that a lot Mr. Seller, but we are one of the bigger buyers In the area which Is why they paired your property with us. I don't come up with the numbers In our office, but once I get all the necessary Information I will g e t It submitted a n d If t h e property qualifies I will have a competitive offer by the end of this call.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "26ea0b71-d6a9-4f33-9424-c45221835115",
    "text": "Get to the point, make me an offer.",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "3aa0e93f-dc54-4721-bc87-470fb3c9610f",
        "text": "Well, the hard part is over and the property did get approved which is good news! Now Mr. Seller I am on your side and am happy to go back to the underwriters to see if I can get you closer to what you need. How close to our number would you be comfortable with? Let's say they give you a much lower price than you anticipated. You could say something like: I think that's a great price on the open market. But as far as a cash offer goes, our numbers are just too far apart. If you were listing it, you might be able to get that price range—but keep in mind you'll have closing costs, fees, etc. Eric C l i n e ' s C o m m o n S e l l e r & R e b u t t a l s © 2 0 2 3 t h e e r i c c l i n e . c o m COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 3",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "e828cb20-c0af-4afa-989f-a1f0cfef3487",
    "text": "According to the tax appraisal website (or the Zestimate), my house is valued at this amount...",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "98807f37-cff0-42a9-88d7-00423f75a9b3",
        "text": "The Zestimate Isn certain mile radius which Is essentially just an average. We go off of year build, square footage, beds, and baths and the condition of each home to formulate an offer. If they want a specific price, you can restate the pros and cons redirect them to the listing: You could list the property on the open market, but that could take 60, 90 days. There are closing cost fees, commissions, all that involved. However, if we bought it cash, we would have to be at [this price], and we'll take care of all those fees and headaches for you. Is that something that's important to you? I understand that your number Is based off your tax appraisal. You could have three different appraisers come out to your home and they will all come up with a different number. It's essentially just an opinion and a home Is only worth how much someone Is willing to pay for It. This is a real offer that we are confident In going to the closing table with. • Eric Cline's Common Seller & Rebuttals © 2 0 2 3 theericcline.com COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 4",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "94a440d1-953f-424d-8f8d-699e2ec5a907",
    "text": "How can you guys make an offer without looking at it?",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "d6e38267-c0e3-4b24-b4f8-92b8ed10a19c",
        "text": "Well, we buy so many properties a month in this area, so we are very familiar with the neighborhood and the area. And based upon the condition of the property described to me—and based on our formulas and price per square foot in this area, we know what kind of price range we have to be at.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "f6e13294-d8be-4c62-9756-84acf4bbc9af",
    "text": "I have to talk to my wife or husband before I make a final decision.",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "5a61b4b4-0074-4c2e-a0b6-185e7f049708",
        "text": "Are they available right now to join our call? That way I can explain how the process works and all the benefits you'll have by working with us. What else do you need to talk over? You told me earlier that you and your wife have been thinking about this for (however long). What time can we schedule a call with your wife or husband so that we are all In the conversation together? Eric C l i n e ' s C o m m o n S e l l e r & R e b u t t a l s © 2 0 2 3 t h e e r i c c l i n e . c o m COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 6",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "1c1ba791-8e05-4a7f-a432-6e194ec60f76",
    "text": "I would rather fix up the property myself and make the profit.",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "57e0ce5e-064a-4bb0-8efc-e623066304a9",
        "text": "Yes, you can actually do that. But, it might take you awhile to get that done-we're talking repairs, there's going to be closing costs, fees and commissions on the back end. However, keep in mind, if we bought the property as is, we'll take care of the closing costs, fees, commissions and everything else. Are you really going to take the time to do al the repairs In addition to your full time job you already have? Who knows If you can get what you're looking for by the time you are finished with the way the market Is shifting.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "5a294523-b6be-4d84-a7c4-57015ca51083",
    "text": "I a n d won't b a c k out?",
    "category": "General",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "06d858bd-8b57-46ca-a964-0ab422c2bcf8",
        "text": "I completely understand Mr./Mrs. Seller and unfortunately we can make everyone happy, that's just the world we live In. I can ensure you that we will be walking hand and hand to get to the closing table and as long as everything you've told us about the home Is true then we are confident that we can close on this property. Let them answer and if they're still concerned about the reviews and t h a t w e a r e s c a m We do not have the time nor energy to scam you of your property. We have 5 Acquisition Managers In our office making multiple offers a day, If we don't buy your home Mr./Mrs. Seller we will certainly buy other homes we are looking at. If we were a scam then we would not have an accreditation with the Better Business Bureau, It's just not possible.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "c39e8b1b-1c51-491d-87bb-8ae4b8dbf810",
    "text": "I have no place to go once I sell.",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "07fa0725-28c5-4ae3-8901-70236cdb00c1",
        "text": "I can understand. The good thing about our company is that we can move at YOUR pace. We often deal with homeowners in your exact scenario... where they need to find a new place before they move. As long as we can agree on a price, we can work with you on time and have a longer closing up to 90 days. And If you find a home sooner then we can work on closing sooner as well to accommodate your needs. Eric Cline's Common Seller & Rebuttals © 2 0 2 3 theericcline.com COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 9",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "42d038eb-12bb-4e3f-a45c-f1791a7e83ee",
    "text": "What if my tenants don",
    "category": "General",
    "difficulty": "beginner",
    "defaultResponses": [
      {
        "id": "d634dc6e-2b1a-432d-95fa-0abcf5a8fdbc",
        "text": "Do you anticipate them being a problem when you give notice? We do understand they may need more time to find a place and we can be flexible. A 30-business day close Is about 45 calendar days to give them some extra time but If we need to adjust to a longer closing that Is absolutely do able. And If this becomes worst case scenario with filing eviction, we can also help with that. We deal with tenants all the time, so we will do everything we can to make this process as smooth as possible.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "0574f7bd-44d7-450c-8689-a366cd97d06b",
    "text": "I want to talk to my tenant before signing anything",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "ba3a08c2-4fef-4e07-a23f-e98977a03b58",
        "text": "Is there something your tenant could say to sway your decision to sell? Or has your tenant expressed Interest In buying? If they mention timing or concern of where the tenant will go refer to r e b u t t a l a b o v e t h i s o n e Eric C l i n e ' s C o m m o n S e l l e r & R e b u t t a l s © 2 0 2 3 t h e e r i c c l i n e . c o m COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 10",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "e657bd90-f954-47a2-a177-df0ace245346",
    "text": "Why is there an inspection period listed...",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "51ea0819-2bd1-4a30-8d11-5ee63f4899c4",
        "text": "Great question... We need to come out and get pics and do a quick walk through, just to make sure the condition is what you said it was. Don't worry we aren't coming out there to look for stuff to lower the price, I'm sure that is a concern of yours. Does the price change once you visit the property? Another great question... No, as long as it's what you said it was. We always think a little worse than described. If they give pushback, you always want to do a \"takeaway\". You can say something like: You don't have to worry Mr./Mrs. Seller, we buy 20-30 homes each month and know exactly what we are getting Into. We have every Intention of purchasing this home, but our inspection period Is to protect us so that we can come out to the property and make sure It's everything we have discussed. • Eric Cline's Common Seller & Rebuttals © 2 0 2 3 theericcline.com COMMON SELLER O B J E C T I O N S & REBUTTALS pg. 12",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "b6b06451-a7ef-4e7d-8183-06fe2de02e7d",
    "text": "Why would you need to list my house on the MLS, I thought you were buying It?",
    "category": "Property",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "9cd3190e-2f11-4e99-b3ac-603e4e58f02a",
        "text": "We are buying the home Mr./Mrs. Seller but we utilize the MLS to premarket the home for our end buyer once we have completed the renovation. The best way to get a hold of agents Is on the MLS who may have a client looking for a specific home In a certain area.",
        "isCustom": false
      }
    ],
    "customResponses": []
  },
  {
    "id": "13a56a4b-41ab-4c49-a536-e0c1669cd650",
    "text": "I just want to have my attorney look It over before signing.",
    "category": "General",
    "difficulty": "intermediate",
    "defaultResponses": [
      {
        "id": "9e9d61c2-1fc3-4a9d-81dc-16b008448482",
        "text": "Okay, I can understand that. But Is there anything you aren about since reviewing It together? Let them answer and If they still want to have their attorney look It over... No problem, I can make It even easier for you and send It to them, what Is their email? Always try to get the attorney's contact Info to CC the agreement to In Docusign and get a time as to when we can have It reviewed with an answer on If we are moving forward or not.",
        "isCustom": false
      }
    ],
    "customResponses": []
  }
];
