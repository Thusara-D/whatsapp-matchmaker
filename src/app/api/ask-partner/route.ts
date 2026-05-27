import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const { userId, partnerId } = await request.json();

    if (!userId || !partnerId) {
      return NextResponse.json({ error: 'User ID and Partner ID are required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId); // Nimal
    const partnerRef = doc(db, 'users', partnerId); // Sanduni

    const userSnap = await getDoc(userRef);
    const partnerSnap = await getDoc(partnerRef);

    if (!userSnap.exists() || !partnerSnap.exists()) {
      return NextResponse.json({ error: 'User or Partner not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const partnerData = partnerSnap.data();

    // Ensure User A is actually waiting for a partner approval
    if (userData.status !== 'AWAITING_PARTNER_APPROVAL' || userData.selectedMatchId !== partnerId) {
      return NextResponse.json({ error: 'User is not awaiting approval for this partner' }, { status: 400 });
    }

    const p = userData.profileData;
    const age = p.age || 'Unknown';
    const job = p.job || 'Unknown';
    const district = p.district || 'Unknown';
    
    // Construct the pitch message
    const pitchMessage = `සුබ දවසක්! 😊\n\nඔබගේ විස්තර වලට ගැළපෙන ${age} හැවිරිදි, ${district} ප්‍රදේශයේ පදිංචි ${job} ක් වන අයෙක් ඔබගේ profile එකට කැමැත්ත පළකර ඇත.\n\nඔබත් මෙම යෝජනාවට කැමති නම් "YES" ලෙසත්, අකමැති නම් "NO" ලෙසත් reply කරන්න.`;

    // Send WhatsApp Message to Sanduni
    await sendWhatsAppMessage(partnerId, pitchMessage);
    
    // Add to Sanduni's chat history
    partnerData.chatHistory += `\nBot: ${pitchMessage}`;
    
    // Set pendingPitch on Sanduni
    partnerData.pendingPitch = {
      fromId: userId,
      status: 'PENDING'
    };

    await setDoc(partnerRef, partnerData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in ask-partner route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
