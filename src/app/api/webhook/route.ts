import { NextResponse } from 'next/server';
import { processMessageWithGemini } from '@/lib/gemini';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { findMatches, formatMatchMessage } from '@/lib/matching';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const from = message.from; 
        const msgBody = message.text?.body || "";
        const msgType = message.type;

        // Handle image uploads
        let hasImage = false;
        if (msgType === 'image') {
          hasImage = true;
        }

        const userRef = doc(db, 'users', from);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.exists() ? userSnap.data() : { profileData: {}, chatHistory: "", state: "ONBOARDING", currentMatches: [] };
        
        userData.chatHistory += `\nUser: ${msgBody}`;

        if (hasImage) {
           userData.profileData.hasUploadedTwoPhotos = true; 
           if (userData.state === "AWAITING_PAYMENT_RECEIPT") {
              userData.state = "PAYMENT_PENDING_APPROVAL";
              await setDoc(userRef, userData, { merge: true });
              await sendWhatsAppMessage(from, "Thanks for the receipt! We will verify it and send you the contact details shortly. (ඔබේ රිසිට්පත ලැබුණා! අපි එය පරීක්ෂා කර ඉක්මනින් විස්තර එවන්නම්.)");
              return new NextResponse('EVENT_RECEIVED', { status: 200 });
           }
        }

        // Handle Payment Selection State
        if (userData.state === "MATCHES_SENT") {
          const selectionMatch = msgBody.match(/SELECT\s+(\d+)/i);
          if (selectionMatch) {
            const matchIndex = parseInt(selectionMatch[1]) - 1;
            const selectedMatch = userData.currentMatches[matchIndex];
            if (selectedMatch) {
              userData.state = "AWAITING_PAYMENT_RECEIPT";
              userData.selectedMatchId = selectedMatch.id;
              await setDoc(userRef, userData, { merge: true });
              
              await sendWhatsAppMessage(from, `You have selected Match #${matchIndex + 1}. Please deposit Rs.XXXX to Bank Account No: 12345678 (BOC) and send a photo of the bank receipt here to unlock their contact details.`);
              return new NextResponse('EVENT_RECEIVED', { status: 200 });
            }
          }
        }

        // If not in a special state, process with Gemini for onboarding
        if (userData.state === "ONBOARDING") {
          const geminiResult = await processMessageWithGemini(msgBody, userData.chatHistory, userData.profileData);
          
          if (geminiResult) {
            userData.profileData = { ...userData.profileData, ...geminiResult.profileData };
            userData.chatHistory += `\nBot: ${geminiResult.friendlyReply}`;
            
            if (geminiResult.isComplete) {
              userData.state = "MATCHING";
              await sendWhatsAppMessage(from, geminiResult.friendlyReply + " Please wait a moment while I find matches for you! (ඔබට ගැලපෙන අය හොයනකම් සුළු මොහොතක් රැඳී සිටින්න!)");
              
              const matches = await findMatches(userData.profileData);
              if (matches.length > 0) {
                userData.state = "MATCHES_SENT";
                userData.currentMatches = matches;
                
                await sendWhatsAppMessage(from, "Here are some matches we found for you! (ඔබට ගැලපෙන අය මෙන්න!)");
                for (let i = 0; i < matches.length; i++) {
                  // In a real app, send the stored photo URL using sendWhatsAppImage
                  await sendWhatsAppMessage(from, formatMatchMessage(matches[i], i));
                }
              } else {
                userData.state = "WAITING_FOR_MATCHES";
                await sendWhatsAppMessage(from, "We couldn't find exact matches right now. We will notify you when someone matches your profile! (මේ මොහොතේ ගැලපෙන අය නැත. අලුත් කෙනෙක් ආපු ගමන් අපි ඔබට දැනුම් දෙන්නම්!)");
              }
            } else {
              await sendWhatsAppMessage(from, geminiResult.friendlyReply);
            }
            
            await setDoc(userRef, userData, { merge: true });
          }
        }
    }
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('Error handling webhook POST:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
