import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage, sendWhatsAppImage } from '@/lib/whatsapp';
import { formatMatchMessage } from '@/lib/matching';

export async function POST(request: Request) {
  try {
    const { userId, matches } = await request.json();

    if (!userId || !matches || !Array.isArray(matches)) {
      return NextResponse.json({ error: 'User ID and matches array are required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();

    // Ensure we don't accidentally send if state is somehow restricted, though admin overrides usually
    
    // Send introductory message
    const introMsg = "Here are some top recommended matches we hand-picked for you! (අපි ඔබට ගැලපෙන හොඳම යෝජනා කිහිපයක් පහතින් දක්වා ඇත!)";
    userData.chatHistory += `\nBot: ${introMsg}`;
    await sendWhatsAppMessage(userId, introMsg);
    
    // Send each match details
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      // 1. Send details first (without name and phone number)
      const secureMatch = { ...match, name: undefined, phoneId: undefined };
      const matchMsg = formatMatchMessage(secureMatch, i);
      userData.chatHistory += `\nBot: ${matchMsg}`;
      await sendWhatsAppMessage(userId, matchMsg);

      // 2. Send photos after details (up to 2)
      if (match.photos && Array.isArray(match.photos)) {
        const photosToSend = match.photos.slice(0, 2);
        for (const photoUrl of photosToSend) {
          await sendWhatsAppImage(userId, photoUrl);
        }
      }
    }
    
    // Dynamic Singlish footer
    let selectReply = "";
    if (matches.length === 1) {
      selectReply = "Oya me match ekata kamathi nam SELECT 1 kiyala reply karanna.";
    } else if (matches.length === 2) {
      selectReply = "Oya thora ganna partner anuva SELECT 1 ho SELECT 2 kiyala reply karanna.";
    } else {
      selectReply = "Oya thora ganna partner anuva SELECT 1 ho SELECT 2 ho SELECT 3 kiyala reply karanna.";
    }

    userData.chatHistory += `\nBot: ${selectReply}`;
    await sendWhatsAppMessage(userId, selectReply);
    
    // Update user state and store these as current matches
    userData.status = 'MATCHES_SENT';
    userData.currentMatches = matches; // Store them so messageProcessor can validate selection
    
    // Append sent candidates to sentMatches to prevent re-matching
    const matchIds = matches.map((m: any) => m.id);
    userData.sentMatches = [...(userData.sentMatches || []), ...matchIds];
    
    await setDoc(userRef, userData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending matches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
