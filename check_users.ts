import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`User: ${doc.id}`);
    console.log(` - status: ${data.status}`);
    console.log(` - isComplete (gemini): ${data.profileData?.isComplete}`);
    console.log(` - hasUploadedTwoPhotos: ${data.profileData?.hasUploadedTwoPhotos}`);
    console.log(` - num uploaded photos: ${data.uploadedPhotos?.length}`);
  });
}

check().catch(console.error);
