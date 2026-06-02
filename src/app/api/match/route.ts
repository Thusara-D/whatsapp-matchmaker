import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const excludeParam = searchParams.get('exclude'); // comma separated list of IDs to exclude
    const excludeIds = excludeParam ? excludeParam.split(',') : [];

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch the Target User
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const userProfile = userData.profileData;

    if (!userProfile || userData.status !== 'COMPLETE') {
      return NextResponse.json({ error: 'User profile is incomplete' }, { status: 400 });
    }

    // 2. Fetch Candidates
    const targetGender = userProfile.lookingForGender || (userProfile.gender === 'boy' ? 'girl' : 'boy');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("profileData.gender", "==", targetGender), where("status", "==", "COMPLETE"));
    const querySnapshot = await getDocs(q);
    
    const candidates: any[] = [];
    querySnapshot.forEach((doc) => {
      // Don't match with themselves and don't match with already shown candidates
      if (doc.id !== userId && !excludeIds.includes(doc.id)) {
        candidates.push({ id: doc.id, ...doc.data().profileData });
      }
    });

    if (candidates.length === 0) {
      return NextResponse.json({ matches: [] }, { status: 200 });
    }

    // 3. Use Gemini to Score and Rank Candidates
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    You are an expert Sri Lankan matchmaker AI.
    
    Target User (Looking for a match):
    ${JSON.stringify({ ...userProfile, phoneId: userId })}

    Available Candidates:
    ${JSON.stringify(candidates)}

    Task:
    Analyze the available candidates against the target user's preferences, age gap requirements, and location.
    Pick the Top 3 best matches.
    Calculate a realistic matching percentage (0-100) based on how well they fit.
    Write a short 1-2 sentence reason explaining why they are a good match for the target user.

    Return the result strictly as a JSON array of objects with this schema:
    [
      {
        "id": "string (the candidate's phoneId)",
        "percentage": 85,
        "reason": "string (explanation of the match)"
      }
    ]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let aiMatches = [];
    try {
      aiMatches = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini response", responseText);
      return NextResponse.json({ error: 'Failed to generate matches' }, { status: 500 });
    }

    // 4. Combine AI results with candidate data to return to the UI
    const finalMatches = aiMatches.map((aiMatch: any) => {
      const candidateData = candidates.find(c => c.id === aiMatch.id);
      return {
        ...candidateData,
        matchPercentage: aiMatch.percentage,
        matchReason: aiMatch.reason
      };
    }).filter((m: any) => m.name); // Filter out any empty ones if AI hallucinated an ID

    return NextResponse.json({ matches: finalMatches, targetUser: userProfile }, { status: 200 });
  } catch (error) {
    console.error('Error in manual matchmaking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
