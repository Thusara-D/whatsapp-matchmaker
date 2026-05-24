import { processMessageWithGemini } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { findMatches, formatMatchMessage } from '@/lib/matching';

export async function processIncomingMessage(
  from: string,
  msgBody: string,
  base64Image: string | null,
  sendReply: (to: string, text: string) => Promise<any>
) {
  try {
    const userRef = doc(db, 'users', from);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.exists() ? userSnap.data() : { profileData: {}, chatHistory: "", state: "ONBOARDING", currentMatches: [], uploadedPhotos: [] };
    
    if (msgBody) userData.chatHistory += `\nUser: ${msgBody}`;

    if (base64Image) {
       if (userData.state === "AWAITING_PAYMENT_RECEIPT") {
          userData.state = "PAYMENT_PENDING_APPROVAL";
          await setDoc(userRef, userData, { merge: true });
          await sendReply(from, "Thanks for the receipt! We will verify it and send you the contact details shortly. (ඔබේ රිසිට්පත ලැබුණා! අපි එය පරීක්ෂා කර ඉක්මනින් විස්තර එවන්නම්.)");
          return;
       } else if (userData.state === "ONBOARDING") {
          const { verifySinglePhotoWithGemini, compareTwoPhotosWithGemini } = await import('@/lib/gemini');
          const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('@/lib/firebase');

          await sendReply(from, "Analyzing your photo... please wait. (ඡායාරූපය පරීක්ෂා කරමින් පවතී...)");
          
          const isHumanFace = await verifySinglePhotoWithGemini(base64Image);
          
          if (!isHumanFace) {
             const rejectMsg = "This photo is invalid (no clear human face detected). Please send a valid, clear photo of yourself.";
             userData.chatHistory += `\nBot: ${rejectMsg}`;
             await sendReply(from, rejectMsg);
             return;
          }

          // Upload to Firebase Storage
          const storageRef = ref(storage, `profiles/${from}/${Date.now()}.jpg`);
          await uploadString(storageRef, base64Image, 'base64');
          const photoUrl = await getDownloadURL(storageRef);

          if (!userData.uploadedPhotos) userData.uploadedPhotos = [];
          userData.uploadedPhotos.push(photoUrl);

          if (userData.uploadedPhotos.length === 1) {
             const onePhotoMsg = "Thanks! 1 photo verified. Please send your second clear photo.";
             userData.chatHistory += `\nBot: ${onePhotoMsg}`;
             await setDoc(userRef, userData, { merge: true });
             await sendReply(from, onePhotoMsg);
             return;
          } else if (userData.uploadedPhotos.length >= 2) {
             await sendReply(from, "Comparing photos to verify identity... (අනන්‍යතාවය තහවුරු කරමින් පවතී...)");
             
             const firstPhotoUrl = userData.uploadedPhotos[0];
             let firstBase64 = "";
             try {
                 const res = await fetch(firstPhotoUrl);
                 const arrayBuffer = await res.arrayBuffer();
                 firstBase64 = Buffer.from(arrayBuffer).toString('base64');
             } catch (e) {
                 console.error("Failed to fetch first photo", e);
             }

             if (firstBase64) {
                 const isSamePerson = await compareTwoPhotosWithGemini(firstBase64, base64Image);
                 if (!isSamePerson) {
                     userData.uploadedPhotos = [];
                     const mismatchMsg = "These two photos do not seem to belong to the same person. For security, we have cleared your photos. Please upload 2 valid photos of yourself again.";
                     userData.chatHistory += `\nBot: ${mismatchMsg}`;
                     await setDoc(userRef, userData, { merge: true });
                     await sendReply(from, mismatchMsg);
                     return;
                 }
             }
             
             userData.profileData.hasUploadedTwoPhotos = true;
             userData.profileData.photos = userData.uploadedPhotos;
             const successMsg = "Photos verified successfully! (ඡායාරූප තහවුරු විය!)";
             userData.chatHistory += `\nBot: ${successMsg}`;
             await sendReply(from, successMsg);
             
             // Mock a message to let Gemini automatically ask for the next missing profile detail
             msgBody = "I have uploaded my photos."; 
          }
       }
    }

    // Handle Payment Selection State or changing mind during Payment state
    if ((userData.state === "MATCHES_SENT" || userData.state === "AWAITING_PAYMENT_RECEIPT") && !base64Image) {
      const { processMatchSelectionWithGemini } = await import('@/lib/gemini');
      const selectionResult = await processMatchSelectionWithGemini(msgBody, userData.chatHistory, userData.currentMatches);
      
      if (selectionResult) {
        if (selectionResult.intent === "SELECT_MATCH" && selectionResult.selectedMatchId) {
          userData.state = "AWAITING_PAYMENT_RECEIPT";
          userData.selectedMatchId = selectionResult.selectedMatchId;
          const reply = "Great! To get their Name and Phone Number, please deposit Rs.XXXX to Bank Account No: 12345678 (BOC) and send a photo of the bank receipt here to unlock their contact details.";
          userData.chatHistory += `\nBot: ${reply}`;
          await setDoc(userRef, userData, { merge: true });
          await sendReply(from, reply);
          return;
        } else if (selectionResult.intent === "SEND_MORE") {
          // Revert state in case they were in AWAITING_PAYMENT_RECEIPT
          userData.state = "MATCHES_SENT";
          userData.selectedMatchId = null;

          // Initialize shownMatchIds if not exists
          if (!userData.shownMatchIds) {
            userData.shownMatchIds = userData.currentMatches.map((m: any) => m.id);
          } else {
            // Append current matches to shownMatchIds
            userData.shownMatchIds.push(...userData.currentMatches.map((m: any) => m.id));
          }
          
          const waitReply = "Let me find some more matches for you... (තව ගැලපෙන අය හොයනවා...)";
          userData.chatHistory += `\nBot: ${waitReply}`;
          await sendReply(from, waitReply);
          
          const newMatches = await findMatches(userData.profileData, userData.shownMatchIds);
          
          if (newMatches.length > 0) {
            userData.currentMatches = newMatches;
            
            const foundReply = "Here are some new matches we found for you! (තවත් ගැලපෙන අය මෙන්න!)";
            userData.chatHistory += `\nBot: ${foundReply}`;
            await sendReply(from, foundReply);
            
            for (let i = 0; i < newMatches.length; i++) {
              const matchMsg = formatMatchMessage(newMatches[i], i);
              userData.chatHistory += `\nBot: ${matchMsg}`;
              await sendReply(from, matchMsg);
            }
          } else {
            userData.state = "WAITING_FOR_MATCHES";
            const noMatchReply = "We couldn't find any more matches right now. We will notify you when someone new joins! (මේ මොහොතේ තවත් ගැලපෙන අය නැත. අලුත් කෙනෙක් ආපු ගමන් අපි ඔබට දැනුම් දෙන්නම්!)";
            userData.chatHistory += `\nBot: ${noMatchReply}`;
            await sendReply(from, noMatchReply);
          }
          
          await setDoc(userRef, userData, { merge: true });
          return;
        } else {
          // UNKNOWN intent
          if (selectionResult.friendlyReply) {
             userData.chatHistory += `\nBot: ${selectionResult.friendlyReply}`;
             await setDoc(userRef, userData, { merge: true });
             await sendReply(from, selectionResult.friendlyReply);
             return;
          }
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

    // Handle Post-Approval / Completed State
    if (userData.state === "MATCH_APPROVED" && !base64Image) {
      if (msgBody.trim().toUpperCase() === "RESET") {
        // Reset the user's profile completely
        userData = { profileData: {}, chatHistory: "", state: "ONBOARDING", currentMatches: [], uploadedPhotos: [] };
        const resetMsg = "Your profile has been completely reset. Welcome! Please send your 2 clear photos and let us know your details. (ඔබගේ පැතිකඩ අලුත් කර ඇත. කරුණාකර ඔබගේ ඡායාරූප 2ක් සහ විස්තර අප වෙත එවන්න.)";
        userData.chatHistory += `\nBot: ${resetMsg}`;
        await setDoc(userRef, userData); // Overwrite completely
        await sendReply(from, resetMsg);
        return;
      } else {
        const { processPostApprovalWithGemini } = await import('@/lib/gemini');
        const assistantResult = await processPostApprovalWithGemini(msgBody, userData.chatHistory);
        
        if (assistantResult && assistantResult.friendlyReply) {
          userData.chatHistory += `\nBot: ${assistantResult.friendlyReply}`;
          await setDoc(userRef, userData, { merge: true });
          await sendReply(from, assistantResult.friendlyReply);
          return;
        }
      }
    }

  } catch (error) {
    console.error("Error processing message:", error);
    try {
      await sendReply(from, "Our system is a bit busy at the moment. Please reply again in a minute! (අපගේ පද්ධතිය මේ මොහොතේ කාර්යබහුලයි. කරුණාකර විනාඩියකින් පමණ නැවත පණිවිඩයක් එවන්න!)");
    } catch (sendError) {
      console.error("Failed to send error reply:", sendError);
    }
  }
}
