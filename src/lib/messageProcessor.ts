import { processMessageWithGemini } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

    // Handle Pending Pitch Replies (Mutual Consent Workflow)
    if (userData.pendingPitch && userData.pendingPitch.status === 'PENDING' && msgBody) {
      const { processPitchReplyWithGemini } = await import('@/lib/gemini');
      const isYes = await processPitchReplyWithGemini(msgBody);
      
      const sourceUserId = userData.pendingPitch.fromId;
      const sourceUserRef = doc(db, 'users', sourceUserId);
      const sourceUserSnap = await getDoc(sourceUserRef);
      
      if (sourceUserSnap.exists()) {
        const sourceUserData = sourceUserSnap.data();
        
        if (isYes) {
          // Partner approved! Update Nimal to AWAITING_PAYMENT_RECEIPT
          sourceUserData.state = 'AWAITING_PAYMENT_RECEIPT';
          await setDoc(sourceUserRef, sourceUserData, { merge: true });
          
          // Send Nimal the bank details message
          const bankMsg = `ශුභ ආරංචියක්! ඔබ තෝරාගත් සහකරු ඔබගේ විස්තර වලට කැමැත්ත පළකර ඇත! 🎉\n\nවිස්තර ලබාගැනීමට, කරුණාකර රුපියල් 5,000ක මුදල පහත බැංකු ගණුදෙනු ගිණුමට තැන්පත් කර, එහි රිසිට් පතේ (Receipt) ඡායාරූපයක් මෙහි එවන්න.\n\nBank: BOC\nAcc Name: LoveRoad Matchmaker\nAcc No: 123456789`;
          sourceUserData.chatHistory += `\nBot: ${bankMsg}`;
          await setDoc(sourceUserRef, sourceUserData, { merge: true });
          
          await sendWhatsAppMessage(sourceUserId, bankMsg);
          
          // Send Sanduni confirmation
          await sendReply(from, "Thank you! We have notified the partner. They will complete the payment to receive your contact details.");
        } else {
          // Partner rejected
          sourceUserData.state = 'PARTNER_REJECTED';
          await setDoc(sourceUserRef, sourceUserData, { merge: true });
          
          await sendReply(from, "Understood. We will let them know this is not a match and keep looking for your perfect partner.");
        }
      }
      
      // Clear Sanduni's pending pitch
      userData.pendingPitch.status = isYes ? 'ACCEPTED' : 'REJECTED';
      await setDoc(userRef, userData, { merge: true });
      return;
    }

    if (base64Image) {
       if (userData.state === "AWAITING_PAYMENT_RECEIPT") {
          userData.state = "PAYMENT_PENDING_APPROVAL";
          await setDoc(userRef, userData, { merge: true });
          // SILENT: No reply sent
          return;
       } else if (userData.state === "ONBOARDING" || !userData.profileData.hasUploadedTwoPhotos) {
          const { verifySinglePhotoWithGemini, compareTwoPhotosWithGemini } = await import('@/lib/gemini');
          const fs = await import('fs');
          const path = await import('path');

          const isHumanFace = await verifySinglePhotoWithGemini(base64Image);
          if (!isHumanFace) {
             // SILENT REJECTION
             return;
          }

          // Save locally for testing
          const filename = `${from}_${Date.now()}.jpg`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
             fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, filename);
          
          // Strip data URI prefix if it exists
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
          
          const photoUrl = `/uploads/${filename}`;


          await setDoc(userRef, {
             uploadedPhotos: arrayUnion(photoUrl)
          }, { merge: true });

          const updatedSnap = await getDoc(userRef);
          const updatedDoc = updatedSnap.data() as any;
          const length = updatedDoc?.uploadedPhotos?.length || 0;
          console.log("Verified Array Length in DB:", length);

          if (length === 1) {
             return;
          } else if (length >= 2) {
             console.log("Triggering Gemini Face Verification now...");
             const firstPhotoUrl = updatedDoc.uploadedPhotos[0];
             let firstBase64 = "";
             try {
                 if (firstPhotoUrl.startsWith('/uploads/')) {
                     const fs = await import('fs');
                     const path = await import('path');
                     const localPath = path.join(process.cwd(), 'public', firstPhotoUrl);
                     const fileBuffer = fs.readFileSync(localPath);
                     firstBase64 = fileBuffer.toString('base64');
                 } else {
                     const res = await fetch(firstPhotoUrl);
                     const arrayBuffer = await res.arrayBuffer();
                     firstBase64 = Buffer.from(arrayBuffer).toString('base64');
                 }
             } catch (e) {
                 console.error("Failed to fetch first photo", e);
             }

             if (firstBase64) {
                 try {
                     const isSamePerson = await compareTwoPhotosWithGemini(firstBase64, base64Image);
                     if (!isSamePerson) {
                         // SILENT REJECTION - Reset photos
                         updatedDoc.uploadedPhotos = [];
                         await setDoc(userRef, updatedDoc, { merge: true });
                         return;
                     }
                 } catch (error) {
                     console.error("Gemini Face Verification Failed with error:", error);
                     return;
                 }
             }
             
             updatedDoc.profileData.hasUploadedTwoPhotos = true;
             updatedDoc.profileData.photos = updatedDoc.uploadedPhotos;
             updatedDoc.state = "COMPLETE";
             
             await setDoc(userRef, updatedDoc, { merge: true });
             console.log("Successfully updated state to COMPLETE in DB!");
             return;
          }
       }
    }

    // Handle Smart Match Selection 
    if (userData.state === "MATCHES_SENT" && !base64Image && msgBody) {
      const { processMatchSelectionWithGemini } = await import('@/lib/gemini');
      const selectionResult = await processMatchSelectionWithGemini(msgBody, userData.chatHistory, userData.currentMatches);
      
      if (selectionResult && selectionResult.intent === "SELECT_MATCH" && selectionResult.selectedMatchId) {
        userData.state = "AWAITING_PARTNER_APPROVAL"; // Used to be AWAITING_PAYMENT_RECEIPT
        userData.selectedMatchId = selectionResult.selectedMatchId;
        
        await setDoc(userRef, userData, { merge: true });
        
        // NO automated reply to Nimal! We wait for admin to Ask Partner.
        return;
      }
      
      // If we don't understand the selection or it's not a selection intent, we just remain silent and let the admin handle it.
      await setDoc(userRef, userData, { merge: true });
      return;
    }

    // Process general onboarding data silently
    if ((userData.state === "ONBOARDING" || userData.state === "WAITING_FOR_ADMIN" || userData.state === "COMPLETE") && !base64Image && msgBody) {
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
  }
}
