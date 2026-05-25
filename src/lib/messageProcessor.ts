import { processMessageWithGemini } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
          // SILENT: No reply sent
          return;
       } else if (userData.state === "ONBOARDING" || !userData.profileData.hasUploadedTwoPhotos) {
          const { verifySinglePhotoWithGemini, compareTwoPhotosWithGemini } = await import('@/lib/gemini');
          const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
          const { storage } = await import('@/lib/firebase');

          const isHumanFace = await verifySinglePhotoWithGemini(base64Image);
          if (!isHumanFace) {
             // SILENT REJECTION
             return;
          }

          // Upload to Firebase Storage
          const storageRef = ref(storage, `profiles/${from}/${Date.now()}.jpg`);
          await uploadString(storageRef, base64Image, 'base64');
          const photoUrl = await getDownloadURL(storageRef);

          if (!userData.uploadedPhotos) userData.uploadedPhotos = [];
          userData.uploadedPhotos.push(photoUrl);

          if (userData.uploadedPhotos.length === 1) {
             await setDoc(userRef, userData, { merge: true });
             return;
          } else if (userData.uploadedPhotos.length >= 2) {
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
                     // SILENT REJECTION - Reset photos
                     userData.uploadedPhotos = [];
                     await setDoc(userRef, userData, { merge: true });
                     return;
                 }
             }
             
             userData.profileData.hasUploadedTwoPhotos = true;
             userData.profileData.photos = userData.uploadedPhotos;
             
             if (userData.profileData.isComplete) {
                userData.state = "WAITING_FOR_ADMIN";
             }
             await setDoc(userRef, userData, { merge: true });
             return;
          }
       }
    }

    // Handle Smart Match Selection 
    if (userData.state === "MATCHES_SENT" && !base64Image && msgBody) {
      const { processMatchSelectionWithGemini } = await import('@/lib/gemini');
      const selectionResult = await processMatchSelectionWithGemini(msgBody, userData.chatHistory, userData.currentMatches);
      
      if (selectionResult && selectionResult.intent === "SELECT_MATCH" && selectionResult.selectedMatchId) {
        userData.state = "AWAITING_PAYMENT_RECEIPT";
        userData.selectedMatchId = selectionResult.selectedMatchId;
        
        const bankMsg = `ඔයා තෝරාගත් සහකරුගේ විස්තර ලබාගැනීමට, කරුණාකර රුපියල් 5,000ක මුදල පහත බැංකු ගණුදෙනු ගිණුමට තැන්පත් කර, එහි රිසිට් පතේ (Receipt) ඡායාරූපයක් මෙහි එවන්න.\n\nBank: BOC\nAcc Name: LoveRoad Matchmaker\nAcc No: 123456789`;
        userData.chatHistory += `\nBot: ${bankMsg}`;
        
        await setDoc(userRef, userData, { merge: true });
        
        // Allowed ONE automated message for bank details
        await sendReply(from, bankMsg);
        return;
      }
      
      // If we don't understand the selection or it's not a selection intent, we just remain silent and let the admin handle it.
      await setDoc(userRef, userData, { merge: true });
      return;
    }

    // Process general onboarding data silently
    if ((userData.state === "ONBOARDING" || userData.state === "WAITING_FOR_ADMIN") && !base64Image && msgBody) {
      const geminiResult = await processMessageWithGemini(msgBody, userData.chatHistory, userData.profileData);
      
      if (geminiResult) {
        userData.profileData = { ...userData.profileData, ...geminiResult.profileData };
        
        if (geminiResult.isComplete && userData.profileData.hasUploadedTwoPhotos) {
          userData.state = "WAITING_FOR_ADMIN";
        }
        
        await setDoc(userRef, userData, { merge: true });
      }
      // SILENT: No replies
    }

  } catch (error) {
    console.error("Error processing message silently:", error);
    // Remove the fallback busy message so the bot is entirely silent and doesn't interrupt manual flow
  }
}
