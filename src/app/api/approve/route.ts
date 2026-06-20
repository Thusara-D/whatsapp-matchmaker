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
    
    // Check Partner's Approval Status
    const isPartnerApproved = matchData.status === 'PAYMENT_APPROVED_WAITING_FOR_PARTNER' || matchData.status === 'MATCH_COMPLETED';

    if (isPartnerApproved) {
      // BOTH have paid! Release details to BOTH
      const contactMessageToUser = `✅ Payment Approved!\n\nHere are the contact details for your match:\n\nName: ${matchData.profileData?.name || 'Not provided'}\nPhone Number: +${matchedUserId}\n\nWe wish you the best of luck! (ඔබට සුභ පතනවා!)`;
      const contactMessageToPartner = `✅ Your partner has completed their payment!\n\nHere are the contact details for your match:\n\nName: ${userData.profileData?.name || 'Not provided'}\nPhone Number: +${userId}\n\nWe wish you the best of luck! (ඔබට සුභ පතනවා!)`;
      
      // Update User A
      userData.status = 'MATCH_COMPLETED';
      userData.paymentApprovedAt = new Date().toISOString();
      userData.chatHistory += `\nBot: ${contactMessageToUser}`;
      await setDoc(userRef, userData, { merge: true });
      await sendWhatsAppMessage(userId, contactMessageToUser);

      // Update User B
      matchData.status = 'MATCH_COMPLETED';
      matchData.chatHistory += `\nBot: ${contactMessageToPartner}`;
      await setDoc(matchRef, matchData, { merge: true });
      await sendWhatsAppMessage(matchedUserId, contactMessageToPartner);

    } else if (matchData.status === 'PAYMENT_PENDING_APPROVAL') {
      // User B has paid but is waiting for admin verification
      const waitingMessageToUser = `✅ Payment Approved!\n\nYour partner has also submitted their payment and we are currently verifying their receipt. We will automatically send you their contact details as soon as it is verified. (ඔබගේ සහකරුද ගෙවීම් කර ඇති අතර අප එය තහවුරු කරමින් සිටිමු)`;
      
      // We DO NOT nudge the partner because they already paid!
      
      userData.status = 'PAYMENT_APPROVED_WAITING_FOR_PARTNER';
      userData.paymentApprovedAt = new Date().toISOString();
      userData.chatHistory += `\nBot: ${waitingMessageToUser}`;
      await setDoc(userRef, userData, { merge: true });
      await sendWhatsAppMessage(userId, waitingMessageToUser);
    } else {
      // ONLY User A has paid. Waiting for User B to pay.
      const waitingMessageToUser = `✅ Payment Approved!\n\nWe are currently waiting for your partner to complete their payment. As soon as they do, we will automatically send you their contact details. (අපි සහකරුගේ ගෙවීම තහවුරු වනතුරු රැඳී සිටිමු. ඉන්පසු වහාම විස්තර එවන්නෙමු)`;
      
      const nudgeMessageToPartner = `ඔබගේ සහකරු ඔවුන්ගේ මුදල් ගෙවීම සම්පූර්ණ කර ඇත! 🎉\n\nකරුණාකර ඔබගේ ගෙවීමද සම්පූර්ණ කර රිසිට් පත එවන්න. එවිට ඔබට ඔවුන්ගේ දුරකථන අංකය ලබාගත හැක.`;
      
      userData.status = 'PAYMENT_APPROVED_WAITING_FOR_PARTNER';
      userData.paymentApprovedAt = new Date().toISOString();
      userData.chatHistory += `\nBot: ${waitingMessageToUser}`;
      await setDoc(userRef, userData, { merge: true });
      await sendWhatsAppMessage(userId, waitingMessageToUser);

      // Nudge the partner
      matchData.chatHistory += `\nBot: ${nudgeMessageToPartner}`;
      await setDoc(matchRef, matchData, { merge: true });
      await sendWhatsAppMessage(matchedUserId, nudgeMessageToPartner);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
