"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, CheckCircle, Clock, CreditCard } from "lucide-react";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    completeProfiles: 0,
    pendingPayments: 0,
    approvedMatches: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        
        let total = 0;
        let complete = 0;
        let pending = 0;
        let approved = 0;

        snap.forEach((doc) => {
          total++;
          const data = doc.data();
          if (data.profileData?.isComplete) complete++;
          if (data.state === "PAYMENT_PENDING_APPROVAL") pending++;
          if (data.state === "MATCH_APPROVED") approved++;
        });

        setStats({
          totalUsers: total,
          completeProfiles: complete,
          pendingPayments: pending,
          approvedMatches: approved
        });
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    }
    
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Complete Profiles", value: stats.completeProfiles, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Approved Matches", value: stats.approvedMatches, icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Here is what is happening with your matchmaking business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
