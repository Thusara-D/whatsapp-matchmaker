import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { generateCancellationMessage } from '@/lib/gemini';

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

    if (userData.status !== 'PAYMENT_APPROVED_WAITING_FOR_PARTNER') {
      return NextResponse.json({ error: 'User is not in WAITING_FOR_PARTNER status' }, { status: 400 });
    }

    const partnerId = userData.selectedMatchId;
    if (!partnerId) {
      return NextResponse.json({ error: 'No partner found for this user' }, { status: 400 });
    }

    const partnerRef = doc(db, 'users', partnerId);
    const partnerSnap = await getDoc(partnerRef);

    if (!partnerSnap.exists()) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partnerData = partnerSnap.data();

    // 1. Generate Messages
    const userAMessage = await generateCancellationMessage(userData.chatHistory || '', true);
    const userBMessage = await generateCancellationMessage(partnerData.chatHistory || '', false);

    // 2. Update User A (The Paid User)
    userData.status = 'WAITING_FOR_ADMIN';
    userData.hasPaymentCredit = true;
    userData.selectedMatchId = null;
    userData.chatHistory = (userData.chatHistory || '') + `\nBot: ${userAMessage}`;

    // 3. Update User B (The Ghosting Partner)
    partnerData.status = 'WAITING_FOR_ADMIN';
    partnerData.selectedMatchId = null;
    partnerData.paymentReceiptUrl = null; // Clear any old receipts
    partnerData.chatHistory = (partnerData.chatHistory || '') + `\nBot: ${userBMessage}`;

    // 4. Save to DB
    await setDoc(userRef, userData, { merge: true });
    await setDoc(partnerRef, partnerData, { merge: true });

    // 5. Send WhatsApp Messages
    await sendWhatsAppMessage(userId, userAMessage);
    await sendWhatsAppMessage(partnerId, userBMessage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
