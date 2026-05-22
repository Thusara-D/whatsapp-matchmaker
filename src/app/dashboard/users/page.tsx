"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Sparkles } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        
        const fetchedUsers: any[] = [];
        snap.forEach((doc) => {
          fetchedUsers.push({ id: doc.id, ...doc.data() });
        });

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Registered Users</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">Manage and view details of all your clients.</p>
        </div>
        <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-rose-500" />
           <span className="text-sm font-bold text-gray-700">{users.length} Total</span>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">No users yet</h3>
            <p className="text-gray-500 text-sm mt-2">When someone messages your WhatsApp bot, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-white/40 border-b border-white/50">
                <tr>
                  <th className="px-8 py-5 font-bold">Phone Number</th>
                  <th className="px-8 py-5 font-bold">Name</th>
                  <th className="px-8 py-5 font-bold">Gender</th>
                  <th className="px-8 py-5 font-bold">Age</th>
                  <th className="px-8 py-5 font-bold">District</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 transition-colors duration-200">
                    <td className="px-8 py-5 font-bold text-gray-800">+{user.id}</td>
                    <td className="px-8 py-5 font-medium text-gray-600">{user.profileData?.name || "N/A"}</td>
                    <td className="px-8 py-5 font-medium text-gray-600 capitalize">{user.profileData?.gender || "N/A"}</td>
                    <td className="px-8 py-5 font-medium text-gray-600">{user.profileData?.age || "N/A"}</td>
                    <td className="px-8 py-5 font-medium text-gray-600">{user.profileData?.district || "N/A"}</td>
                    <td className="px-8 py-5">
                      {user.profileData?.isComplete ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-700 border border-amber-200/50 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                          Onboarding
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
