import './src/env';
import { db, storage } from './src/lib/firebase';
import { ref, uploadString } from 'firebase/storage';

async function run() {
  try {
    const storageRef = ref(storage, 'test_upload.txt');
    await uploadString(storageRef, 'Hello World!', 'raw', { contentType: 'text/plain' });
    console.log("Upload successful!");
  } catch (error) {
    console.error("Upload failed:");
    console.error(error);
  }
}
run();
