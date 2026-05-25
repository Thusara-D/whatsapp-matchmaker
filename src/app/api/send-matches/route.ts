import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
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
    
    // Send each match details (without name and phone number)
    for (let i = 0; i < matches.length; i++) {
      // Create a copy without name/phone if they exist
      const secureMatch = { ...matches[i], name: undefined, phoneId: undefined };
      const matchMsg = formatMatchMessage(secureMatch, i);
      userData.chatHistory += `\nBot: ${matchMsg}`;
      await sendWhatsAppMessage(userId, matchMsg);
    }
    
    const selectReply = "Reply with SELECT 1, SELECT 2, or SELECT 3 to choose your partner and unlock their contact details! (කරුණාකර ඔබගේ තේරීම SELECT 1, SELECT 2 හෝ SELECT 3 ලෙස අප වෙත එවන්න!)";
    userData.chatHistory += `\nBot: ${selectReply}`;
    await sendWhatsAppMessage(userId, selectReply);
    
    // Update user state and store these as current matches
    userData.state = 'MATCHES_SENT';
    userData.currentMatches = matches; // Store them so messageProcessor can validate selection
    
    await setDoc(userRef, userData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending matches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
