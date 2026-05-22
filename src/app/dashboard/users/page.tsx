"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "lucide-react";

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
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Registered Users</h2>
        <p className="text-slate-500 text-sm mt-1">Manage and view details of all your clients.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No users yet</h3>
            <p className="text-slate-500 text-sm mt-1">When someone messages your WhatsApp bot, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Phone Number</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Gender</th>
                  <th className="px-6 py-4 font-semibold">Age</th>
                  <th className="px-6 py-4 font-semibold">District</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">+{user.id}</td>
                    <td className="px-6 py-4 text-slate-600">{user.profileData?.name || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{user.profileData?.gender || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600">{user.profileData?.age || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600">{user.profileData?.district || "N/A"}</td>
                    <td className="px-6 py-4">
                      {user.profileData?.isComplete ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
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
