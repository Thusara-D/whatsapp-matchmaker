import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';

const app = initializeApp({
  projectId: "loveroad-c17be",
  storageBucket: "loveroad-c17be.firebasestorage.app"
});

const storage = getStorage(app);
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
