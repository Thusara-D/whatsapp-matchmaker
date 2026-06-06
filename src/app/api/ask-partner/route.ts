import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage, sendWhatsAppImage } from '@/lib/whatsapp';

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

    const p = userData.profileData || {};
    
    // 1. Send photos first (up to 2)
    const photos = p.photos || userData.uploadedPhotos || [];
    if (Array.isArray(photos)) {
      const photosToSend = photos.slice(0, 2);
      for (const photoUrl of photosToSend) {
        await sendWhatsAppImage(partnerId, photoUrl);
      }
    }

    // 2. Construct the detailed pitch message
    const pitchMessage = `සුබ දවසක්! 😊

ඔබගේ විස්තර වලට ගැළපෙන කෙනෙක් ඔබගේ profile එකට කැමැත්ත පළකර ඇත. 

මේ තියෙන්නේ එයාගේ විස්තර:
- වයස (Age): ${p.age || 'N/A'}
- ගම / ප්‍රදේශය (Village/District): ${[p.village, p.district].filter(Boolean).join(', ') || 'N/A'}
- රැකියාව (Job): ${p.job || 'N/A'}
- අධ්‍යාපන සුදුසුකම් (Education): ${p.education || 'N/A'}
- උස (Height): ${p.height || 'N/A'}
- බර (Weight): ${p.weight || 'N/A'}
- සමේ වර්ණය (Skin Color): ${p.skinColor || 'N/A'}
- විවාහක/අවිවාහක (Marital Status): ${p.maritalStatus || 'N/A'}
- සහකරුවෙකුගෙන් බලාපොරොත්තු (Preferences): ${p.partnerPreferences || 'N/A'}
- අමතර විස්තර (Other): ${p.additionalDetails || 'N/A'}

Oya mee meyata kamathi nam YES kiyala, akamathi nam NO kiyala reply karanna.`;

    // Send WhatsApp Text Message to Sanduni
    await sendWhatsAppMessage(partnerId, pitchMessage);
    
    // Add to Sanduni's chat history
    partnerData.chatHistory += `\nBot: [Sent Photos]\nBot: ${pitchMessage}`;
    
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
