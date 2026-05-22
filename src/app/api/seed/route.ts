import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const sampleProfiles = [
  { phone: "94771111111", name: "Kasun Perera", gender: "boy", lookingFor: "girl", age: 26, district: "Colombo", job: "Software Engineer", height: "5'8" },
  { phone: "94772222222", name: "Nimali Silva", gender: "girl", lookingFor: "boy", age: 24, district: "Colombo", job: "Teacher", height: "5'3" },
  { phone: "94773333333", name: "Supun Fernando", gender: "boy", lookingFor: "girl", age: 29, district: "Gampaha", job: "Bank Manager", height: "5'10" },
  { phone: "94774444444", name: "Kavindi Rathnayake", gender: "girl", lookingFor: "boy", age: 27, district: "Kandy", job: "Doctor", height: "5'5" },
  { phone: "94775555555", name: "Ruwan Gunasekara", gender: "boy", lookingFor: "girl", age: 31, district: "Kurunegala", job: "Businessman", height: "5'9" },
  { phone: "94776666666", name: "Thilini Jayasuriya", gender: "girl", lookingFor: "boy", age: 25, district: "Colombo", job: "Graphic Designer", height: "5'4" },
  { phone: "94777777777", name: "Amila Dissanayake", gender: "boy", lookingFor: "girl", age: 28, district: "Galle", job: "Civil Engineer", height: "5'7" },
  { phone: "94778888888", name: "Nethmi Bandara", gender: "girl", lookingFor: "boy", age: 23, district: "Kandy", job: "Undergraduate", height: "5'2" },
  { phone: "94779999999", name: "Dinesh Rajapaksha", gender: "boy", lookingFor: "girl", age: 33, district: "Matara", job: "Accountant", height: "5'11" },
  { phone: "94771010101", name: "Sanduni Peiris", gender: "girl", lookingFor: "boy", age: 26, district: "Gampaha", job: "Nurse", height: "5'6" },
  { phone: "94771212121", name: "Chamara Weerasinghe", gender: "boy", lookingFor: "girl", age: 27, district: "Colombo", job: "Marketing Executive", height: "5'8" },
  { phone: "94771313131", name: "Hiruni Senanayake", gender: "girl", lookingFor: "boy", age: 28, district: "Kurunegala", job: "HR Manager", height: "5'4" },
  { phone: "94771414141", name: "Lahiru Gamage", gender: "boy", lookingFor: "girl", age: 25, district: "Galle", job: "IT Analyst", height: "5'9" },
  { phone: "94771515151", name: "Ayesha Kumari", gender: "girl", lookingFor: "boy", age: 30, district: "Anuradhapura", job: "Pharmacist", height: "5'3" },
  { phone: "94771616161", name: "Nuwan Kumara", gender: "boy", lookingFor: "girl", age: 32, district: "Kandy", job: "Architect", height: "5'10" }
];

export async function POST(request: Request) {
  try {
    const promises = sampleProfiles.map(async (profile) => {
      const userRef = doc(db, 'users', profile.phone);
      
      const userData = {
        state: "ONBOARDING", // So we can simulate completing them or just leave as completed
        chatHistory: "Bot: Welcome to Matchmaker!\nUser: Hi\nBot: (Seeded by Admin)",
        profileData: {
          name: profile.name,
          gender: profile.gender,
          lookingForGender: profile.lookingFor,
          age: profile.age,
          district: profile.district,
          job: profile.job,
          height: profile.height,
          village: "City Center",
          birthYear: 2024 - profile.age,
          birthMonth: 1,
          birthDay: 1,
          weight: "60kg",
          skinColor: "Fair",
          education: "BSc",
          maritalStatus: "Single",
          partnerAgeGap: "2-5 years",
          partnerPreferences: `Looking for a kind and educated ${profile.lookingFor}.`,
          hasUploadedTwoPhotos: true,
          isComplete: true // Marked as complete so they show up in searches
        }
      };

      await setDoc(userRef, userData);
    });

    await Promise.all(promises);

    return NextResponse.json({ message: '15 Sri Lankan profiles seeded successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
