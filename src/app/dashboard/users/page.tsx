"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Sparkles, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Registered Users</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Manage and view details of all your clients.</p>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm dark:shadow-[0_0_10px_rgba(236,72,153,0.1)] flex items-center gap-2 transition-colors">
           <Sparkles className="w-4 h-4 text-rose-500 dark:text-pink-400" />
           <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{(users || []).length} Total</span>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white dark:border-slate-700 transition-colors">
              <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 transition-colors">No users yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 transition-colors">When someone messages your WhatsApp bot, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/40 dark:bg-slate-800/40 border-b border-white/50 dark:border-slate-700/50 transition-colors">
                <tr>
                  <th className="px-8 py-5 font-bold">Phone Number</th>
                  <th className="px-8 py-5 font-bold">Name</th>
                  <th className="px-8 py-5 font-bold">Gender</th>
                  <th className="px-8 py-5 font-bold">District</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                  <th className="px-8 py-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-slate-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors duration-200">
                    <td className="px-8 py-5 font-bold text-gray-800 dark:text-gray-200">+{user.id}</td>
                    <td className="px-8 py-5 font-medium text-gray-600 dark:text-gray-400">{user.profileData?.name || "N/A"}</td>
                    <td className="px-8 py-5 font-medium text-gray-600 dark:text-gray-400 capitalize">{user.profileData?.gender || "N/A"}</td>
                    <td className="px-8 py-5 font-medium text-gray-600 dark:text-gray-400">{user.profileData?.district || "N/A"}</td>
                    <td className="px-8 py-5">
                      {user.profileData?.isComplete ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 shadow-sm transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"></div>
                          Onboarding
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {user.profileData?.isComplete && (
                        <button
                          onClick={() => router.push(`/dashboard/matches?userId=${user.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-500/30 dark:shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          Find Match
                        </button>
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
