import { processMessageWithGemini } from '@/lib/gemini';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteField, runTransaction } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function processIncomingMessage(
  from: string,
  msgBody: string,
  base64Image: string | null,
  sendReply: (to: string, text: string) => Promise<any>
) {
  try {
    // Extract strictly the raw phone number digits to use as the database Document ID
    const rawPhoneNumber = from.split('@')[0];
    const userRef = doc(db, 'users', rawPhoneNumber);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.exists() ? userSnap.data() : { profileData: {}, chatHistory: "", status: "ONBOARDING", currentMatches: [], uploadedPhotos: [] };
    
    if (msgBody) userData.chatHistory += `\nUser: ${msgBody}`;

    const hasPendingPitch = userData.pendingPitch && userData.pendingPitch.status === 'PENDING';
    const isSelectingMatches = userData.status === "MATCHES_SENT";

    // 1. Global Opt-Out Check
    if (msgBody) {
      const { checkIfUserIsOptingOut } = await import('@/lib/gemini');
      const optOutResult = await checkIfUserIsOptingOut(msgBody, userData.chatHistory || "");
      
      if (optOutResult.isOptOut) {
        userData.status = 'INACTIVE';
        if (optOutResult.confirmationMessage) {
          userData.chatHistory += `\nBot: ${optOutResult.confirmationMessage}`;
          await sendReply(from, optOutResult.confirmationMessage);
        }
        await setDoc(userRef, userData, { merge: true });
        return; // Halt all further processing
      }
    }

    let intent = "UNKNOWN";

    if (hasPendingPitch && isSelectingMatches && msgBody) {
       const { routeUserIntentWithGemini } = await import('@/lib/gemini');
       intent = await routeUserIntentWithGemini(msgBody, userData.chatHistory, userData.currentMatches);
    } else if (hasPendingPitch) {
       intent = "PITCH_REPLY";
    } else if (isSelectingMatches) {
       intent = "MATCH_SELECTION";
    }

    // Handle Pending Pitch Replies (Mutual Consent Workflow)
    if (intent === "PITCH_REPLY" && msgBody) {
      const { processPitchReplyWithGemini } = await import('@/lib/gemini');
      const result = await processPitchReplyWithGemini(msgBody, userData.chatHistory);
      const isYes = result?.isYes || false;
      const friendlyReply = result?.friendlyReply || "Thank you for your response.";
      
      const sourceUserId = userData.pendingPitch.fromId;
      const sourceUserRef = doc(db, 'users', sourceUserId);
      const sourceUserSnap = await getDoc(sourceUserRef);
      
      if (sourceUserSnap.exists()) {
        const sourceUserData = sourceUserSnap.data();
        
        if (isYes) {
          // Partner approved! Both users need to complete payment
          const bankMsgPrimary = `ශුභ ආරංචියක්! ඔබ තෝරාගත් සහකරු ඔබගේ විස්තර වලට කැමැත්ත පළකර ඇත! 🎉\n\nසහකරුගේ දුරකථන අංකය ලබාගැනීමට, කරුණාකර රුපියල් 2,000ක මුදල පහත ගිණුමට තැන්පත් කර, රිසිට් පතෙහි ඡායාරූපයක් මෙහි එවන්න.\n\nBank: Commercial\nAcc no: 800 98 99 601\nName: M.A.T DENUWAN\nBranch: Malabe`;
          
          // Update Primary Customer (Nimal)
          sourceUserData.status = 'AWAITING_PAYMENT_RECEIPT';
          sourceUserData.chatHistory += `\nBot: ${bankMsgPrimary}`;
          await setDoc(sourceUserRef, sourceUserData, { merge: true });
          await sendWhatsAppMessage(sourceUserId, bankMsgPrimary);
          
          // Update Partner (Sanduni)
          userData.status = 'AWAITING_PAYMENT_RECEIPT';
          userData.selectedMatchId = sourceUserId; // Link back to the primary user
          userData.chatHistory += `\nBot: ${friendlyReply}`;
          await sendReply(from, friendlyReply);
        } else {
          // Partner rejected
          // We need to automatically transition Nimal (User A) back to selecting matches
          const { generateRejectionTransitionMessage } = await import('@/lib/gemini');
          const rejectionMsg = await generateRejectionTransitionMessage(sourceUserData.chatHistory || "", sourceUserData.currentMatches || []);
          
          sourceUserData.status = 'MATCHES_SENT';
          sourceUserData.selectedMatchId = null; // Clear their pending selection
          sourceUserData.chatHistory += `\nBot: ${rejectionMsg}`;
          
          await setDoc(sourceUserRef, sourceUserData, { merge: true });
          await sendWhatsAppMessage(sourceUserId, rejectionMsg);
          
          userData.chatHistory += `\nBot: ${friendlyReply}`;
          await sendReply(from, friendlyReply);
        }
      }
      
      // Clear Sanduni's pending pitch
      userData.pendingPitch.status = isYes ? 'ACCEPTED' : 'REJECTED';
      await setDoc(userRef, userData, { merge: true });
      return;
    }

    if (base64Image) {
       if (userData.status === "AWAITING_PAYMENT_RECEIPT") {
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          const storageRef = ref(storage, `receipts/receipt_${from}_${Date.now()}.jpg`);
          await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
          const photoUrl = await getDownloadURL(storageRef);

          userData.status = "PAYMENT_PENDING_APPROVAL";
          userData.paymentReceiptUrl = photoUrl;
          await setDoc(userRef, userData, { merge: true });
          // SILENT: No reply sent
          return;
       } else if (userData.status === "WAITING_FOR_ADMIN" && userData.profileData?.hasUploadedTwoPhotos) {
          console.log("Late receipt/image detected from WAITING_FOR_ADMIN user.");
          userData.hasLateMessage = true;
          await setDoc(userRef, userData, { merge: true });
          
          if (process.env.ADMIN_PHONE_NUMBER) {
            const adminJid = process.env.ADMIN_PHONE_NUMBER.includes('@') ? process.env.ADMIN_PHONE_NUMBER : `${process.env.ADMIN_PHONE_NUMBER}@s.whatsapp.net`;
            const alertMsg = `🚨 *Alert*: ${userData.profileData?.name || "User"} (+${rawPhoneNumber}) just sent an image. This might be a late payment receipt. Please review their chat.`;
            await sendReply(adminJid, alertMsg);
          }
          return;
       } else if (userData.status === "ONBOARDING" || !userData.profileData?.hasUploadedTwoPhotos) {
          const { verifySinglePhotoWithGemini, compareTwoPhotosWithGemini } = await import('@/lib/gemini');
          const fs = await import('fs');
          const path = await import('path');

          const isHumanFace = await verifySinglePhotoWithGemini(base64Image);
          if (!isHumanFace) {
             // SILENT REJECTION
             return;
          }

          // Upload directly to Firebase Storage with Hash Deduplication
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          const crypto = await import('crypto');
          const imageHash = crypto.createHash('sha256').update(base64Data).digest('hex');

          if (userData.uploadedPhotoHashes?.includes(imageHash)) {
             console.log("Duplicate image detected (pre-upload), skipping...");
             return;
          }

          const storageRef = ref(storage, `profiles/${from}_${imageHash}.jpg`);
          await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
          const photoUrl = await getDownloadURL(storageRef);

          let updatedDoc: any = null;
          let isDuplicate = false;

          await runTransaction(db, async (transaction) => {
             const docSnap = await transaction.get(userRef);
             const data = docSnap.exists() ? docSnap.data() : { profileData: {}, chatHistory: "", status: "ONBOARDING", currentMatches: [], uploadedPhotos: [], uploadedPhotoHashes: [] };
             
             const hashes = data.uploadedPhotoHashes || [];
             
             if (hashes.includes(imageHash)) {
                 isDuplicate = true;
                 return;
             }
             
             const photos = data.uploadedPhotos || [];
             const newPhotos = [...photos, photoUrl];
             const newHashes = [...hashes, imageHash];
             
             transaction.set(userRef, {
                 ...data,
                 uploadedPhotos: newPhotos,
                 uploadedPhotoHashes: newHashes
             }, { merge: true });
             
             updatedDoc = { ...data, uploadedPhotos: newPhotos, uploadedPhotoHashes: newHashes };
          });

          if (isDuplicate || !updatedDoc) {
             console.log("Duplicate image detected during transaction, skipping...");
             return;
          }

          const length = updatedDoc.uploadedPhotos.length;
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
                         await setDoc(userRef, { uploadedPhotos: [], uploadedPhotoHashes: [] }, { merge: true });
                         return;
                     }
                 } catch (error) {
                     console.error("Gemini Face Verification Failed with error:", error);
                     return;
                 }
             }
             
             await updateDoc(userRef, {
                 "profileData.hasUploadedTwoPhotos": true,
                 "profileData.photos": updatedDoc.uploadedPhotos,
                 status: "COMPLETE",
                 state: deleteField()
             });
             console.log("Successfully updated status to COMPLETE in DB!");
             return;
          }
       }
    }

    // Handle Smart Match Selection 
    if (intent === "MATCH_SELECTION" && !base64Image && msgBody) {
      const { processMatchSelectionWithGemini } = await import('@/lib/gemini');
      const selectionResult = await processMatchSelectionWithGemini(msgBody, userData.chatHistory, userData.currentMatches);
      
      if (selectionResult && selectionResult.intent === "SELECT_MATCH" && selectionResult.selectedMatchId) {
        userData.status = "AWAITING_PARTNER_APPROVAL"; // Used to be AWAITING_PAYMENT_RECEIPT
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
    if ((userData.status === "ONBOARDING" || userData.status === "WAITING_FOR_ADMIN" || userData.status === "COMPLETE") && !base64Image && msgBody) {
      const geminiResult = await processMessageWithGemini(msgBody, userData.chatHistory, userData.profileData);
      
      if (geminiResult) {
        // FIX: Re-fetch the document to avoid overwriting concurrent photo uploads!
        const latestSnap = await getDoc(userRef);
        if (latestSnap.exists()) {
          const latestData = latestSnap.data();
          latestData.profileData = { ...latestData.profileData, ...geminiResult.profileData };
          latestData.chatHistory = latestData.chatHistory ? latestData.chatHistory + `\nUser: ${msgBody}` : userData.chatHistory;
          
          if (geminiResult.isComplete && latestData.profileData.hasUploadedTwoPhotos) {
            latestData.status = "WAITING_FOR_ADMIN";
          }
          
          await setDoc(userRef, latestData, { merge: true });
        } else {
          // Fallback if doc doesn't exist for some reason
          userData.profileData = { ...userData.profileData, ...geminiResult.profileData };
          if (geminiResult.isComplete && userData.profileData.hasUploadedTwoPhotos) {
            userData.status = "WAITING_FOR_ADMIN";
          }
          await setDoc(userRef, userData, { merge: true });
        }
      }
      // SILENT: No replies
    }

  } catch (error) {
    console.error("Error processing message silently:", error);
  }
}
