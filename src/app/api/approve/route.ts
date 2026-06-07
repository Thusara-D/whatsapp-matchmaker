import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();

    if (userData.status !== 'PAYMENT_PENDING_APPROVAL') {
      return NextResponse.json({ error: 'User is not pending approval' }, { status: 400 });
    }

    // Fetch the matched user's details
    const matchedUserId = userData.selectedMatchId;
    if (!matchedUserId) {
      return NextResponse.json({ error: 'No selected match found for this user' }, { status: 400 });
    }

    const matchRef = doc(db, 'users', matchedUserId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      return NextResponse.json({ error: 'Matched user profile no longer exists' }, { status: 404 });
    }

    const matchData = matchSnap.data();
    
    // Send the contact info via WhatsApp
    const contactMessage = `✅ Payment Approved!\n\nHere are the contact details for your match:\n\nName: ${matchData.profileData?.name || 'Not provided'}\nPhone Number: +${matchedUserId}\n\nWe wish you the best of luck! (ඔබට සුභ පතනවා!)`;
    
    userData.status = 'MATCH_APPROVED';
    userData.paymentApprovedAt = new Date().toISOString();
    userData.chatHistory += `\nBot: ${contactMessage}`;
    await setDoc(userRef, userData, { merge: true });

    await sendWhatsAppMessage(userId, contactMessage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
