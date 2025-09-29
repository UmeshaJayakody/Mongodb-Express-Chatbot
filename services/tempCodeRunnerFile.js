import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMongoSchema, isCollectionAllowed } from './schemaService.js';
import { db } from './mongoService.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let memory = [];

function summarizeConversation(userMessage, botReply) {
  return `User: ${userMessage} | Bot: ${botReply}`.slice(0, 100);
}

async function executeMongoQuery(collection, query) {
  try {
    if (!isCollectionAllowed(collection)) {
      return { error: `Invalid collection: ${collection}` };
    }
    const parsed = JSON.parse(query); 
    if (!Array.isArray(parsed)) {
      return { error: 'Query must be an aggregation pipeline (array)' };
    }
    const results = await db.collection(collection).aggregate(parsed).toArray();
    return { [collection]: results };
  } catch (err) {
    return { error: err.message };
  }
}

export async function handleChat(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
    const chat = await model.startChat();

    const schema = await getMongoSchema();
    const history = memory.map(m => `${m.role}: ${m.content}`).join('\n');

  const queryPrompt = `
Based on this MongoDB schema for SimplyTix event management system:
${JSON.stringify(schema)}

Collection details:
- events: Contains event information (title, description, date, location, tickets with pricing, attendees)
- users: User accounts with subscription status and points
- tickets: Individual tickets purchased by users for events
- payments: Payment transactions for ticket purchases and top-ups
- enrollments: User enrollments in events
- notifications: System notifications to users
- earnings: Revenue and earnings data

Previous conversation:
${history}

Generate only a valid MongoDB aggregation pipeline query to answer:
${userMessage}

Output format:
- First line: collection name
- Then: the aggregation pipeline as a valid JSON array (no markdown, no explanation).
`;

  const queryResponse = await chat.sendMessage(queryPrompt);
  const output = queryResponse.response.text().trim();
  const [collection, ...lines] = output.split('\n');
  const pipeline = lines.join('\n');

  // Log the MongoDB query
  console.log('\n🎫 SimplyTix Chatbot generated MongoDB query:');
  console.log('Collection:', collection.trim());
  console.log('Aggregation Pipeline:\n', pipeline);

  // Validate and execute the query
  const results = await executeMongoQuery(collection.trim(), pipeline);

  let finalPrompt;
  if (!results.error && results[collection]?.length > 0) {
    finalPrompt = `
You are TixBot, an intelligent and friendly chatbot for the SimplyTix event management platform.

SimplyTix is an event ticketing and management system where users can:
- Browse and discover events (workshops, seminars, conferences, meetups, volunteer activities)
- Purchase tickets for events with different pricing tiers
- Manage their event enrollments and tickets
- View their payment history and account points
- Receive notifications about events

The MongoDB database contains these collections:
- events: Event listings with ticket information and availability
- users: User accounts with subscription status and reward points
- tickets: Purchased tickets with check-in status
- payments: Payment transactions and history
- enrollments: User event registrations
- notifications: System alerts and updates
- earnings: Platform revenue data

Schema details: ${JSON.stringify(schema)}

Based on MongoDB results:
${JSON.stringify(results)}

User asked:
${userMessage}

Guidelines:
- Be friendly, helpful, and knowledgeable about events and ticketing
- Focus on helping users find events, understand pricing, and manage bookings
- Protect private information (passwords, payment details, personal data)
- Use currency format (₹ for Indian Rupees) when discussing prices
- Suggest related events or features when relevant
- If no data is found, offer to help with alternative searches
    `;
  } else {
    finalPrompt = `
You are TixBot, a friendly chatbot for the SimplyTix event management platform.

SimplyTix helps users discover events, purchase tickets, and manage their bookings.

Even though there is no specific data for this question: "${userMessage}", I'm still here to help!

I can assist you with:
- Finding upcoming events by type, location, or date
- Checking ticket availability and pricing
- Understanding your booking history
- Getting information about event details
- Managing your account and notifications

Say "I don't have enough information" if needed, but always offer helpful suggestions.
Error details (if any): ${results.error || 'None'}

Try asking about:
- "What events are happening this weekend?"
- "Show me workshops in [your city]"
- "What are the ticket prices for [event name]?"
- "What events have I enrolled in?"
    `;
  }

    const finalResponse = await chat.sendMessage(finalPrompt);
    const reply = finalResponse.response.text();
    const summary = summarizeConversation(userMessage, reply);

    memory.push({ role: 'user', content: `${userMessage} | Summary: ${summary}` });
    memory.push({ role: 'bot', content: `${reply} | Summary: ${summary}` });

    return reply;
  } catch (error) {
    console.error('Chat error:', error);
    
    // For now, provide a helpful response with common answers
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('event') || lowerMessage.includes('show')) {
      return `🎪 **Events & Shows**\n\nI can help you find events! Here are some popular categories:\n\n• **Workshops** - Educational and skill-building sessions\n• **Seminars** - Professional development talks\n• **Conferences** - Industry networking events\n• **Meetups** - Community gatherings\n• **Volunteer Activities** - Give back to the community\n\nVisit the dashboard to browse all available events by date, location, and category! 🎫`;
    }
    
    if (lowerMessage.includes('ticket') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return `🎟️ **Ticket Information**\n\nTicket pricing varies by event:\n\n• **Free Events** - No cost, just register\n• **General Admission** - Standard pricing\n• **VIP Tickets** - Premium experience with perks\n• **Early Bird** - Discounted rates for early bookings\n\nCheck individual event pages for specific pricing. You can pay using:\n💳 Credit/Debit Cards\n📱 Mobile Payment\n💰 PayPal\n🪙 Account Points`;
    }
    
    if (lowerMessage.includes('book') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      return `📅 **Booking Tickets**\n\nTo book tickets:\n\n1. Browse events on the dashboard\n2. Click on an event you're interested in\n3. Select ticket type and quantity\n4. Choose payment method\n5. Complete your purchase\n6. Receive confirmation email\n\nYour tickets will appear in "My Tickets" section. Don't forget to check in at the event! ✅`;
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('points')) {
      return `👤 **Account & Points**\n\nYour SimplyTix account includes:\n\n• **Points System** - Earn points with purchases\n• **Subscription Status** - Premium benefits\n• **Booking History** - Track your events\n• **Notifications** - Stay updated\n\nUse points for discounts on future bookings! Check your account page for current balance and subscription details. 🪙`;
    }
    
    // Default response
    return `🤖 **Hi! I'm TixBot, your SimplyTix assistant!**\n\nI'm here to help with:\n• 🎪 Finding events and shows\n• 🎟️ Ticket pricing and availability\n• 📅 Booking and reservations\n• 👤 Account management\n• 💳 Payment information\n\n**Popular questions:**\n• "What events are happening this weekend?"\n• "Show me workshops in my area"\n• "How do I book tickets?"\n• "What are my account points?"\n\nWhat would you like to know? 🎫`;
  }
}