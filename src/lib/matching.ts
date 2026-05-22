import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function findMatches(userProfile: any) {
  const usersRef = collection(db, 'users');
  
  // Basic query: opposite gender
  let targetGender = userProfile.lookingForGender;
  if (!targetGender) {
    // fallback if not explicitly stated
    targetGender = userProfile.gender === 'boy' ? 'girl' : 'boy';
  }

  const q = query(usersRef, where("profileData.gender", "==", targetGender));
  const querySnapshot = await getDocs(q);
  
  const matches: any[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Only return complete profiles
    if (data.profileData && data.profileData.isComplete !== false) {
      matches.push({ id: doc.id, ...data.profileData });
    }
  });

  // Basic sorting/filtering logic based on age or district could go here
  // For now, return up to 3 matches
  return matches.slice(0, 3);
}

export function formatMatchMessage(match: any, matchIndex: number) {
  return `Match #${matchIndex + 1}
වයස (Age): ${match.age}
දිස්ත්රික්කය (District): ${match.district}
රැකියාව (Job): ${match.job}
අධ්යාපන සුදුසුකම් (Education): ${match.education}
උස (Height): ${match.height}

If you are interested in this match, please reply with "SELECT ${matchIndex + 1}" and you will receive instructions on how to pay to unlock their name and phone number.`;
}
