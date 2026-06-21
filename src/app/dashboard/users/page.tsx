"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Sparkles, Heart, Camera, Image as ImageIcon, X, ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filters
  const [genderFilter, setGenderFilter] = useState<"All" | "boy" | "girl">("All");
  const [ageFilter, setAgeFilter] = useState<string>("All");
  const [districtFilter, setDistrictFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Photo Modal
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);

  // Details Modal
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const fetchedUsers: any[] = [];
      snap.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch users", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const cleanPhoneNumber = (rawId: string) => {
    if (!rawId) return "";
    return "+" + rawId.split("@")[0];
  };

  const handleAskPartner = async (userId: string, partnerId: string) => {
    const partner = users.find(u => u.id === partnerId);
    if (partner && partner.pendingPitch && partner.pendingPitch.status === 'PENDING') {
      alert("This user is currently reviewing another proposal. Please wait for them to reply first.");
      return;
    }

    try {
      const res = await fetch('/api/ask-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, partnerId })
      });
      if (res.ok) {
        alert("Pitch sent to partner successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send pitch.");
      }
    } catch (e) {
      alert("Error sending pitch.");
    }
  };

  const filteredUsers = users.filter(user => {
    const p = user.profileData || {};
    
    // Search Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const phoneStr = cleanPhoneNumber(user.id).toLowerCase();
      const nameStr = (p.name || "").toLowerCase();
      if (!phoneStr.includes(query) && !nameStr.includes(query)) {
        return false;
      }
    }
    
    // Gender Filter
    if (genderFilter !== "All" && p.gender?.toLowerCase() !== genderFilter) return false;
    
    // Age Filter
    if (ageFilter !== "All" && p.age) {
      if (ageFilter === "Under 20" && p.age >= 20) return false;
      if (ageFilter === "20 - 25" && (p.age < 20 || p.age > 25)) return false;
      if (ageFilter === "25 - 30" && (p.age <= 25 || p.age > 30)) return false;
      if (ageFilter === "30 - 35" && (p.age <= 30 || p.age > 35)) return false;
      if (ageFilter === "40 - 45" && (p.age <= 40 || p.age > 45)) return false;
    }
    
    // District Filter
    if (districtFilter !== "All" && p.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
    
    return true;
  });

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Registered Users</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Manage and view details of all your clients.</p>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm dark:shadow-[0_0_10px_rgba(236,72,153,0.1)] flex items-center gap-2 transition-colors w-fit">
           <Sparkles className="w-4 h-4 text-rose-500 dark:text-pink-400" />
           <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{filteredUsers.length} Users</span>
        </div>
      </div>

      {/* Filters UI */}
      <div className="mb-6 space-y-4">
        {/* Top Row: Gender Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Gender Tabs */}
          <div className="flex gap-2">
            {["All", "boy", "girl"].map(gender => (
              <button
                key={gender}
                onClick={() => { setGenderFilter(gender as any); setAgeFilter("All"); }}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                  genderFilter === gender
                    ? "bg-rose-500 text-white shadow-rose-500/30"
                    : "bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:bg-white/90 border border-white/50 dark:border-slate-700/50"
                }`}
              >
                {gender === "boy" ? "Male" : gender === "girl" ? "Female" : "All Users"}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-full pl-10 pr-4 py-2 hover:bg-white/80 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm outline-none placeholder:text-gray-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Age Group Filters (Only show if a specific gender is selected to keep UI clean, or show always) */}
        {genderFilter !== "All" && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-2">
              {["All", "Under 20", "20 - 25", "25 - 30", "30 - 35", "40 - 45"].map(age => (
                <button
                  key={age}
                  onClick={() => setAgeFilter(age)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                    ageFilter === age
                      ? "bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md"
                      : "bg-white/40 dark:bg-slate-800/40 text-gray-600 dark:text-gray-300 hover:bg-white/80 border border-white/50 dark:border-slate-700/50"
                  }`}
                >
                  {age === "All" ? "All Ages" : age}
                </button>
              ))}
            </div>

            {/* District Dropdown */}
            <div className="relative group">
              <select 
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="appearance-none bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full px-4 py-1.5 pr-8 hover:bg-white/80 transition-all shadow-sm outline-none cursor-pointer"
              >
                <option value="All">All Districts</option>
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kandy">Kandy</option>
                <option value="Kurunegala">Kurunegala</option>
                <option value="Galle">Galle</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white dark:border-slate-700 transition-colors">
              <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 transition-colors">No users found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 transition-colors">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto md:overflow-visible rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left border-collapse block md:table">
              <thead className="text-white text-base font-bold uppercase tracking-wider bg-slate-900 transition-colors hidden md:table-header-group">
                <tr>
                  <th className="px-8 py-5">Client</th>
                  <th className="px-8 py-5">Gender & Age</th>
                  <th className="px-8 py-5">District</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                  <th className="px-8 py-5 text-center">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-slate-800/50 block md:table-row-group">
                {filteredUsers.map((user) => {
                  const photos = user.profileData?.photos || user.uploadedPhotos || [];
                  const hasTwoPhotos = photos.length >= 2;
                  
                  const isComplete = hasTwoPhotos && (
                    ['COMPLETE', 'MATCHES_SENT', 'AWAITING_PARTNER_APPROVAL', 'PAYMENT_PENDING', 'AWAITING_PAYMENT_RECEIPT', 'PAYMENT_PENDING_APPROVAL', 'PAYMENT_APPROVED_WAITING_FOR_PARTNER', 'MATCH_APPROVED', 'MATCH_COMPLETED', 'PARTNER_REJECTED'].includes(user.status) || 
                    user.profileData?.isComplete === true ||
                    user.status === 'WAITING_FOR_ADMIN'
                  );

                  return (
                  <tr key={user.id} className={`transition-colors duration-200 ${isComplete ? 'bg-emerald-500/5' : ''} hover:bg-slate-800/30 block md:table-row mb-4 md:mb-0 bg-white/40 dark:bg-slate-800/20 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none`}>
                    <td className="px-4 md:px-8 py-3 md:py-5 relative block md:table-cell border-b border-gray-100/50 dark:border-slate-800/50 md:border-none">
                      {isComplete && <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] rounded-l-2xl md:rounded-none"></div>}
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold text-lg md:text-base">{user.profileData?.name || "N/A"}</span>
                        <span className="text-gray-500 dark:text-slate-500 text-xs mt-0.5">{cleanPhoneNumber(user.id)}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-2 md:py-5 font-medium text-gray-600 dark:text-gray-400 capitalize block md:table-cell border-b border-gray-100/50 dark:border-slate-800/50 md:border-none flex justify-between md:table-cell">
                      <span className="md:hidden font-bold text-xs uppercase text-gray-400">Gender & Age</span>
                      <span>
                        {user.profileData?.gender?.toLowerCase() === 'boy' ? 'Male' : 
                         user.profileData?.gender?.toLowerCase() === 'girl' ? 'Female' : 
                         user.profileData?.gender || "N/A"} 
                        {user.profileData?.age ? ` (${user.profileData.age})` : ""}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-2 md:py-5 font-medium text-gray-600 dark:text-gray-400 block md:table-cell border-b border-gray-100/50 dark:border-slate-800/50 md:border-none flex justify-between md:table-cell">
                      <span className="md:hidden font-bold text-xs uppercase text-gray-400">District</span>
                      <span>{user.profileData?.district || "N/A"}</span>
                    </td>
                    <td className="px-4 md:px-8 py-3 md:py-5 block md:table-cell border-b border-gray-100/50 dark:border-slate-800/50 md:border-none flex justify-between items-center md:table-cell">
                      <span className="md:hidden font-bold text-xs uppercase text-gray-400">Status</span>
                      {user.status === 'MATCHES_SENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4] animate-pulse"></div>
                          Pending Reply
                        </span>
                      ) : user.status === 'AWAITING_PARTNER_APPROVAL' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          Wait Partner
                        </span>
                      ) : ['PAYMENT_PENDING', 'AWAITING_PAYMENT_RECEIPT', 'PAYMENT_PENDING_APPROVAL'].includes(user.status) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7] animate-pulse"></div>
                          {user.status === 'PAYMENT_PENDING_APPROVAL' ? 'Verifying Payment' : 'Payment Pending'}
                        </span>
                      ) : user.status === 'PAYMENT_APPROVED_WAITING_FOR_PARTNER' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_#f97316] animate-pulse"></div>
                          Wait Partner Pay
                        </span>
                      ) : ['MATCH_APPROVED', 'MATCH_COMPLETED'].includes(user.status) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse"></div>
                          Match Complete
                        </span>
                      ) : user.status === 'PARTNER_REJECTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_#f43f5e]"></div>
                          Partner Rejected
                        </span>
                      ) : ['COMPLETE', 'WAITING_FOR_ADMIN'].includes(user.status) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          Ready
                        </span>
                      ) : user.status === 'INACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          Inactive
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 font-bold">-</span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-3 md:py-5 text-center block md:table-cell border-b border-gray-100/50 dark:border-slate-800/50 md:border-none">
                      <div className="flex items-center justify-start md:justify-center gap-2">
                        {(() => {
                          const photos = user.profileData?.photos || user.uploadedPhotos || [];
                          const hasPhotos = photos.length > 0;
                          return (
                            <button
                              onClick={() => hasPhotos && setSelectedPhotos(photos)}
                              disabled={!hasPhotos}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl border transition-all shadow-sm ${
                                hasPhotos 
                                  ? "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 cursor-pointer" 
                                  : "bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-gray-600 border-gray-200/50 dark:border-slate-700/50 cursor-not-allowed opacity-60"
                              }`}
                              title={hasPhotos ? "View Photos" : "No photos uploaded yet"}
                            >
                              <Camera className={`w-4 h-4 ${hasPhotos ? "text-blue-500" : "text-gray-400 dark:text-gray-600"}`} />
                              Photos
                            </button>
                          );
                        })()}

                        <button
                           onClick={() => setSelectedUserDetails(user)}
                           className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl border transition-all shadow-sm bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 cursor-pointer"
                           title="View Full Profile Details"
                         >
                           <User className="w-4 h-4 text-emerald-500" />
                           Details
                         </button>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-3 md:py-5 text-center w-full md:w-32 block md:table-cell">
                      <div className="flex items-center justify-end md:justify-center w-full gap-2">
                        {user.status === 'AWAITING_PARTNER_APPROVAL' && user.selectedMatchId && (
                          <button
                            onClick={() => handleAskPartner(user.id, user.selectedMatchId)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
                          >
                            Ask Partner
                          </button>
                        )}
                        {(user.status === 'MATCHES_SENT' || user.status === 'PARTNER_REJECTED' || user.status === 'AWAITING_PARTNER_APPROVAL') && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/send-rejection-options', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: user.id })
                                });
                                if (res.ok) alert("Options sent to user successfully!");
                                else alert("Failed to send options.");
                              } catch (e) {
                                alert("Error sending options.");
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                            title="Resend Match Options (Match #2, #3, or New Batch)"
                          >
                            Send Options
                          </button>
                        )}
                        {(['COMPLETE', 'MATCHES_SENT', 'WAITING_FOR_ADMIN', 'PARTNER_REJECTED'].includes(user.status)) && (
                          <button
                            onClick={() => router.push(`/dashboard/matches?userId=${user.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] hover:scale-105 active:scale-95 whitespace-nowrap"
                          >
                            <Heart className="w-4 h-4 fill-white/20" />
                            Match
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photos Modal */}
      {selectedPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-white/20">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-500" /> Verified Photos
              </h3>
              <button 
                onClick={() => setSelectedPhotos(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-100/50 dark:bg-slate-900/80 min-h-[300px]">
              {selectedPhotos.map((url, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden shadow-sm border border-white/50 dark:border-slate-700 bg-gray-200 dark:bg-slate-800 flex items-center justify-center aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`User Photo ${i + 1}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-white/20 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" /> Full Profile Details
              </h3>
              <button 
                onClick={() => setSelectedUserDetails(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
              {(() => {
                 const p = selectedUserDetails.profileData || {};
                 const details = [
                   { label: "Name", value: p.name },
                   { label: "Phone", value: cleanPhoneNumber(selectedUserDetails.id) },
                   { label: "Gender", value: p.gender },
                   { label: "Looking For", value: p.lookingForGender },
                   { label: "Age", value: p.age },
                   { label: "Birth Date", value: p.birthYear ? `${p.birthYear}-${p.birthMonth}-${p.birthDay}` : "" },
                   { label: "Height", value: p.height },
                   { label: "Weight", value: p.weight },
                   { label: "Skin Color", value: p.skinColor },
                   { label: "Village", value: p.village },
                   { label: "District", value: p.district },
                   { label: "Education", value: p.education },
                   { label: "Job", value: p.job },
                   { label: "Marital Status", value: p.maritalStatus },
                   { label: "Partner Age Gap", value: p.partnerAgeGap },
                   { label: "Partner Preferences", value: p.partnerPreferences },
                   { label: "Additional Details", value: p.additionalDetails },
                 ];
                 return (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {details.map((item, idx) => (
                       <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                         <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
                         <div className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{item.value || <span className="text-gray-300 dark:text-gray-600 italic">Not provided</span>}</div>
                       </div>
                     ))}
                   </div>
                 );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
