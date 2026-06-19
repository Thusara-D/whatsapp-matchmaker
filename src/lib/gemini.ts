import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processMessageWithGemini(userMessage: string, chatHistory: string, currentProfileState: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const systemInstruction = `
    You are a friendly matchmaking assistant for a Sri Lankan matchmaking service.
    Your job is to collect specific details from the customer.
    
    CRITICAL INSTRUCTION: You MUST mirror the exact language and script the user is using. 
    - If they type in Singlish (Sinhala using English letters), reply in Singlish. 
    - If they type in proper Sinhala (Unicode/Sinhala letters), reply in proper Sinhala script. 
    - If they type in English, reply in English.
    
    LANGUAGE UNDERSTANDING: You MUST deeply understand Sri Lankan colloquialisms, indirect speech, and idioms in both Sinhala and Singlish. Users often use indirect phrases (e.g., "hariyanne na wage", "thawa aya nadda"). The examples provided are just a small sample; you must use your full linguistic capability to understand ANY variation of how a Sri Lankan user might express these intents. Interpret their true intent accurately.
    Be polite and welcoming.
    
    If the current profile state is completely empty (no details provided yet), your first message should warmly welcome them and cleanly ask for ALL the required details at once in a bulleted/numbered list.
    
    You need to collect the following details completely:
    1. 2 Full Photos (if they haven't sent 2 photos, you must ask for them: "මේ විස්තරය එවන්න සම්පූර්ණ පැහැදිලි චායා රූප 2ක් සමග... ඔයාගෙ full photo 2ක් අනිවාර්යයෙන්ම අපිට එවන්න.")
    2. නම සහ ස්ත්‍රී/පුරුෂ භාවය (Name and Gender)
    3. ගම (Village/City)
    4. දිස්ත්රික්කය (District)
    5. වයස (Age)
    6. උපන් වර්ෂය, මාසය, දවස (Birth Year, Month, Day)
    7. උස (Height)
    8. බර (Weight)
    9. සමේ වර්ණය (Skin Color)
    10. අධ්යාපන සුදුසුකම් (Educational Qualifications)
    11. රැකියාව (Job)
    12. විවාහක/අවිවාහක (Marital Status)
    13. සහකරු/සහකාරියගේ වයස් පරතරය (Partner Age Gap)
    14. සහකරු හෝ සහකාරිය මොන වගේ වෙන්න ඕනද? ගැහැණු ළමයෙක්ද පිරිමි ළමයෙක්ද? (Partner Preferences & Gender they are looking for)
    15. වෙනත් විස්තර (Additional Details - anything else they mentioned)

    Current Profile State: ${JSON.stringify(currentProfileState)}
    Chat History: ${chatHistory}
    
    Extract any new details from the user's latest message and update the profile state.
    If the profile is not complete, write a friendly reply asking for the missing information (matching their language).
    If it is complete, thank them and tell them you are finding matches.

    Return the result STRICTLY as a JSON object matching this structure:
    {
      "isComplete": boolean,
      "missingFields": ["list", "of", "missing", "fields"],
      "friendlyReply": "Your conversational response to the user mirroring their language",
      "profileData": {
         "name": "string",
         "gender": "boy or girl",
         "lookingForGender": "boy or girl",
         "village": "string",
         "district": "string",
         "age": 25,
         "birthYear": 2000,
         "birthMonth": 1,
         "birthDay": 1,
         "height": "string",
         "weight": "string",
         "skinColor": "string",
         "education": "string",
         "job": "string",
         "maritalStatus": "string",
         "partnerAgeGap": "string",
         "partnerPreferences": "string",
         "additionalDetails": "string",
         "hasUploadedTwoPhotos": false
      }
    }
  `;

  const prompt = `${systemInstruction}\n\nUser's latest message: ${userMessage}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON", e);
    return null;
  }
}

export async function processMatchSelectionWithGemini(userMessage: string, chatHistory: string, currentMatches: any[]) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const matchDetails = currentMatches.map((m, index) => 
    `Match #${index + 1}: ID=${m.id}, Age=${m.age}, District=${m.district}, Job=${m.job}, Education=${m.education}`
  ).join("\n");

  const systemInstruction = `
    You are a friendly matchmaking assistant. The user is currently reviewing some suggested matches.
    
    CRITICAL INSTRUCTION: You MUST mirror the exact language and script the user is using. 
    - If they type in Singlish (Sinhala using English letters), reply in Singlish. 
    - If they type in proper Sinhala (Unicode/Sinhala letters), reply in proper Sinhala script. 
    - If they type in English, reply in English.
    
    LANGUAGE UNDERSTANDING: You MUST deeply understand Sri Lankan colloquialisms, indirect speech, and idioms in both Sinhala and Singlish. Users often use indirect phrases (e.g., "hariyanne na wage", "thawa aya nadda"). The examples provided are just a small sample; you must use your full linguistic capability to understand ANY variation of how a Sri Lankan user might express these intents. Interpret their true intent accurately.
    
    Here are the matches currently shown to the user:
    ${matchDetails}
    
    Recent Chat History:
    ${chatHistory}
    
    User's latest message: "${userMessage}"
    
    Analyze the user's latest message to determine their intent:
    1. "SEND_MORE": The user doesn't like these matches and wants to see more. They might say this directly or indirectly (e.g., "thawa pennanna", "wena ewanna", "not interested in these", "more please", "eya hariyanne na wage", "thawa kenek balamuda", "thawa aya nadda").
    2. "SELECT_MATCH": The user explicitly or naturally selects a match from the list. (e.g., "mata match 1 dhenna", "I like the doctor from Colombo", "I want match #2").
    3. "UNKNOWN": The user is asking a general question or chatting about something else.
    
    If the intent is "SELECT_MATCH", you MUST identify which match they picked and return their exact ID from the list provided.
    If the intent is "UNKNOWN", provide a friendly conversational reply asking if they want to see more matches or select one (mirroring their language).
    
    Return the result STRICTLY as a JSON object matching this structure:
    {
      "intent": "SEND_MORE" | "SELECT_MATCH" | "UNKNOWN",
      "selectedMatchId": "string" | null,
      "friendlyReply": "string (Conversational reply mirroring their language if intent is UNKNOWN, otherwise empty string)"
    }
  `;

  const result = await model.generateContent(systemInstruction);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini match selection response as JSON", e);
    return null;
  }
}

export async function verifySinglePhotoWithGemini(base64Image: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = "Does this image contain a clear human face? Answer ONLY YES or NO.";
  
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
  ]);
  const responseText = result.response.text().trim().toUpperCase();
  return responseText.includes("YES");
}

export async function compareTwoPhotosWithGemini(base64Image1: string, base64Image2: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = "Look at these two photos. Do these two photos belong to the exact same person? Answer ONLY YES or NO.";
  
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image1, mimeType: "image/jpeg" } },
    { inlineData: { data: base64Image2, mimeType: "image/jpeg" } }
  ]);
  const responseText = result.response.text().trim().toUpperCase();
  console.log("Gemini Raw Response:", responseText);
  return responseText.includes("YES");
}

export async function processPostApprovalWithGemini(userMessage: string, chatHistory: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const systemInstruction = `
    You are a friendly customer assistant for a Sri Lankan matchmaking service.
    The user has already successfully paid and received the contact details of their match.
    
    CRITICAL INSTRUCTION: You MUST mirror the exact language and script the user is using. 
    - If they type in Singlish (Sinhala using English letters), reply in Singlish. 
    - If they type in proper Sinhala (Unicode/Sinhala letters), reply in proper Sinhala script. 
    - If they type in English, reply in English.
    
    LANGUAGE UNDERSTANDING: You MUST deeply understand Sri Lankan colloquialisms, indirect speech, and idioms in both Sinhala and Singlish. You must use your full linguistic capability to understand ANY variation of how a Sri Lankan user might express their intents or ask questions.
    
    Recent Chat History:
    ${chatHistory}
    
    User's latest message: "${userMessage}"
    
    Your task:
    1. If they say thank you, reply politely and warmly.
    2. If they ask for another match or want to start the process over, tell them they can type the word "RESET" to completely clear their profile and start from the beginning.
    3. For any other questions, provide friendly customer support.
    
    Return the result STRICTLY as a JSON object matching this structure:
    {
      "friendlyReply": "string (Conversational reply mirroring their language)"
    }
  `;

  const result = await model.generateContent(systemInstruction);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini post-approval response as JSON", e);
    return null;
  }
}

export async function processPitchReplyWithGemini(userMessage: string, chatHistory: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });
  const systemInstruction = `
    A user has been sent a matchmaking pitch asking if they approve a partner.
    Their reply is: "${userMessage}"
    
    1. Determine if their reply indicates YES (approval/acceptance) or NO (rejection/decline). 
       - "kamathi", "කැමතියි", "yes", "ok" means YES. 
       - "akamathi", "එපා", "no" means NO.
       - Users often reject indirectly. Phrases like "eya hariyanne na wage" (seems unsuitable), "thawa kenek balamuda" (shall we look for someone else?), or "thawa aya nadda" (are there others?) MUST be treated as a clear NO.
       - The examples provided above are just a small sample. You must use your full linguistic capability to understand ANY variation of how a Sri Lankan user might indirectly accept or reject the match.
       - If they are just asking a question, treat it as NO for now, or just focus on if it's a clear YES.
    
    2. Based on their choice, write a response message back to them.
    
    CRITICAL INSTRUCTION FOR THE RESPONSE MESSAGE:
    You MUST mirror the exact language and script the user is using in their latest message.
    - If they type in Singlish (Sinhala using English letters), reply in Singlish.
    - If they type in proper Sinhala (Unicode/Sinhala letters), reply in proper Sinhala.
    - If they type in English, reply in English.
    
    If YES:
    The response must thank them for accepting, and ask them to deposit 5000 LKR to the following account to receive the partner's phone number, and send a photo of the receipt here:
    Bank: BOC
    Acc Name: LoveRoad Matchmaker
    Acc No: 123456789
    
    If NO:
    The response must say "Understood, we will let them know this is not a match and keep looking for your perfect partner" (translated into their language).
    
    Recent Chat History:
    ${chatHistory}
    
    Return the result STRICTLY as a JSON object matching this structure:
    {
      "isYes": boolean,
      "friendlyReply": "string"
    }
  `;
  
  const result = await model.generateContent(systemInstruction);
  const responseText = result.response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini pitch reply as JSON", e);
    return {
      isYes: userMessage.toLowerCase().includes("kamathi") || userMessage.toLowerCase().includes("yes"),
      friendlyReply: "Thank you for your response."
    };
  }
}

export async function routeUserIntentWithGemini(userMessage: string, chatHistory: string, currentMatches: any[]) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const matchDetails = (currentMatches && currentMatches.length > 0) ? currentMatches.map((m, index) => 
    `Match #${index + 1}: ID=${m.id}, Age=${m.age}, District=${m.district}, Job=${m.job}`
  ).join("\n") : "No matches currently";

  const systemInstruction = `
    You are an intent router for a matchmaking bot. 
    The user is currently in a state collision:
    1. They recently received a list of matches to choose from:
       ${matchDetails}
    2. They ALSO just received a direct "Pitch" (a request from a specific person asking if they want to connect).

    Recent Chat History:
    ${chatHistory}

    User's latest message: "${userMessage}"

    LANGUAGE UNDERSTANDING: You MUST deeply understand Sri Lankan colloquialisms, indirect speech, and idioms in both Sinhala and Singlish. The examples below are just a small sample; you must use your full linguistic capability to understand ANY variation of how a Sri Lankan user might express these intents.

    Your job is ONLY to determine what the user is replying to.
    
    OPTIONS:
    - "PITCH_REPLY": The user is accepting or rejecting the direct pitch (e.g. "yes I like them", "kamathi", "no", "eya hariyanne na wage").
    - "MATCH_SELECTION": The user is explicitly talking about their match list, asking for more matches, or selecting a match from the list (e.g. "I want match 1", "mata 2 weni ekena oni", "thawa pennanna", "wena nadda").
    - "UNKNOWN": Cannot determine context.

    Return the result STRICTLY as a JSON object matching this structure:
    {
      "intent": "PITCH_REPLY" | "MATCH_SELECTION" | "UNKNOWN"
    }
  `;

  const result = await model.generateContent(systemInstruction);
  const responseText = result.response.text();

  try {
    const parsed = JSON.parse(responseText);
    return parsed.intent || "UNKNOWN";
  } catch (e) {
    console.error("Failed to parse Gemini intent router as JSON", e);
    return "UNKNOWN";
  }
}
