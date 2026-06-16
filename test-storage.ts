import './src/env';
import { initializeApp } from 'firebase/app';
import { getStorage, ref } from 'firebase/storage';

console.log("Bucket from env:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

const app = initializeApp({
  projectId: "loveroad-c17be",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
});

const storage = getStorage(app);
try {
  const storageRef = ref(storage, 'test/123.jpg');
  console.log("Success! Ref created.");
} catch(e) {
  console.error(e);
}
