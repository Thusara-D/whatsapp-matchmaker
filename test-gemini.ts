import { processMessageWithGemini } from './src/lib/gemini.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  try {
    const res = await processMessageWithGemini("Hi, looking for a partner", "", {});
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
