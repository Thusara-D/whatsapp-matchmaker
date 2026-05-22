import { GoogleGenerativeAI, Schema, Type } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const profileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isComplete: { type: Type.BOOLEAN, description: "True if ALL mandatory fields have been collected from the user." },
    missingFields: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of fields that are still missing (e.g., 'Age', 'Photos')." },
    friendlyReply: { type: Type.STRING, description: "Your conversational response in friendly spoken Singlish, asking for the missing fields or acknowledging completion." },
    profileData: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        gender: { type: Type.STRING, description: "boy or girl" },
        lookingForGender: { type: Type.STRING, description: "boy or girl" },
        village: { type: Type.STRING },
        district: { type: Type.STRING },
        age: { type: Type.NUMBER },
        birthYear: { type: Type.NUMBER },
        birthMonth: { type: Type.NUMBER },
        birthDay: { type: Type.NUMBER },
        height: { type: Type.STRING },
        weight: { type: Type.STRING },
        skinColor: { type: Type.STRING },
        education: { type: Type.STRING },
        job: { type: Type.STRING },
        maritalStatus: { type: Type.STRING },
        partnerAgeGap: { type: Type.STRING },
        partnerPreferences: { type: Type.STRING },
        hasUploadedTwoPhotos: { type: Type.BOOLEAN }
      }
    }
  },
  required: ["isComplete", "missingFields", "friendlyReply"]
};

export async function processMessageWithGemini(userMessage: string, chatHistory: string, currentProfileState: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: profileSchema,
    }
  });

  const systemInstruction = `
    You are a friendly matchmaking assistant for a Sri Lankan matchmaking service.
    Your job is to collect specific details from the customer.
    The customer may type in Sinhala, English, or Singlish.
    You MUST always reply in friendly, spoken Singlish. Be polite and welcoming (e.g., "Malli", "Nangi", "Aiya", "Akka", "Kohomada", "Hari").
    
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

    Current Profile State: ${JSON.stringify(currentProfileState)}
    Chat History: ${chatHistory}
    
    Extract any new details from the user's latest message and update the profile state.
    If the profile is not complete, write a friendly Singlish reply asking for the missing information.
    If it is complete, thank them and tell them you are finding matches.
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
