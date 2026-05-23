import { processMessageWithGemini } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { findMatches, formatMatchMessage } from '@/lib/matching';

export async function processIncomingMessage(
  from: string,
  msgBody: string,
  hasImage: boolean,
  sendReply: (to: string, text: string) => Promise<any>
) {
  try {
    const userRef = doc(db, 'users', from);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.exists() ? userSnap.data() : { profileData: {}, chatHistory: "", state: "ONBOARDING", currentMatches: [] };
    
    userData.chatHistory += `\nUser: ${msgBody}`;

    if (hasImage) {
       userData.profileData.hasUploadedTwoPhotos = true; 
       if (userData.state === "AWAITING_PAYMENT_RECEIPT") {
          userData.state = "PAYMENT_PENDING_APPROVAL";
          await setDoc(userRef, userData, { merge: true });
          await sendReply(from, "Thanks for the receipt! We will verify it and send you the contact details shortly. (ඔබේ රිසිට්පත ලැබුණා! අපි එය පරීක්ෂා කර ඉක්මනින් විස්තර එවන්නම්.)");
          return;
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
          const reply = `You have selected Match #${matchIndex + 1}. Please deposit Rs.XXXX to Bank Account No: 12345678 (BOC) and send a photo of the bank receipt here to unlock their contact details.`;
          userData.chatHistory += `\nBot: ${reply}`;
          await setDoc(userRef, userData, { merge: true });
          await sendReply(from, reply);
          return;
        }
      }
    }

    // If not in a special state, process with Gemini for onboarding
    if (userData.state === "ONBOARDING") {
      const geminiResult = await processMessageWithGemini(msgBody, userData.chatHistory, userData.profileData);
      
      if (geminiResult) {
        userData.profileData = { ...userData.profileData, ...geminiResult.profileData };
        
        if (geminiResult.isComplete) {
          userData.state = "MATCHING";
          const waitReply = geminiResult.friendlyReply + " Please wait a moment while I find matches for you! (ඔබට ගැලපෙන අය හොයනකම් සුළු මොහොතක් රැඳී සිටින්න!)";
          userData.chatHistory += `\nBot: ${waitReply}`;
          await sendReply(from, waitReply);
          
          const matches = await findMatches(userData.profileData);
          if (matches.length > 0) {
            userData.state = "MATCHES_SENT";
            userData.currentMatches = matches;
            
            const foundReply = "Here are some matches we found for you! (ඔබට ගැලපෙන අය මෙන්න!)";
            userData.chatHistory += `\nBot: ${foundReply}`;
            await sendReply(from, foundReply);
            
            for (let i = 0; i < matches.length; i++) {
              const matchMsg = formatMatchMessage(matches[i], i);
              userData.chatHistory += `\nBot: ${matchMsg}`;
              await sendReply(from, matchMsg);
            }
            const selectReply = "Reply with SELECT 1, SELECT 2, or SELECT 3 to choose your partner!";
            userData.chatHistory += `\nBot: ${selectReply}`;
            await sendReply(from, selectReply);
          } else {
            userData.state = "WAITING_FOR_MATCHES";
            const noMatchReply = "We couldn't find exact matches right now. We will notify you when someone matches your profile! (මේ මොහොතේ ගැලපෙන අය නැත. අලුත් කෙනෙක් ආපු ගමන් අපි ඔබට දැනුම් දෙන්නම්!)";
            userData.chatHistory += `\nBot: ${noMatchReply}`;
            await sendReply(from, noMatchReply);
          }
        } else {
          userData.chatHistory += `\nBot: ${geminiResult.friendlyReply}`;
          await sendReply(from, geminiResult.friendlyReply);
        }
        
        await setDoc(userRef, userData, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}
