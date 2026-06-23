"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, DollarSign, Users, Activity, CheckCircle2 } from "lucide-react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyEarnings: 0,
    paidClients: 0,
    conversionRate: 0,
  });
  
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We assume each match approval generates Rs. 2000.
  const PAYMENT_AMOUNT = 2000;

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        const usersRef = collection(db, "users");
        // Get all users to calculate conversion rate
        const allUsersSnap = await getDocs(usersRef);
        
        let totalUsersCount = 0;
        let paidUsersCount = 0;
        const transactions: any[] = [];

        allUsersSnap.forEach((doc) => {
          totalUsersCount++;
          const data = doc.data();
          if (data.status === "MATCH_APPROVED") {
            paidUsersCount++;
            // Create a mock transaction record based on the user data since we don't have a separate transactions collection yet
            transactions.push({
              id: doc.id,
              name: data.profileData?.name || "Unknown Customer",
              phone: `+${doc.id}`,
              amount: PAYMENT_AMOUNT,
              date: "Recently", // We would normally use a real timestamp here if it was stored in Firestore
              status: "Approved"
            });
          }
        });

        const totalRevenue = paidUsersCount * PAYMENT_AMOUNT;
        const conversionRate = totalUsersCount > 0 ? Math.round((paidUsersCount / totalUsersCount) * 100) : 0;

        setStats({
          totalRevenue,
          monthlyEarnings: totalRevenue, // Assuming all in current month for this MVP
          paidClients: paidUsersCount,
          conversionRate,
        });

        // Set recent transactions (up to 10)
        setRecentTransactions(transactions.slice(0, 10));

      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalyticsData();
  }, []);

  const statCards = [
    { title: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-100/50 dark:bg-emerald-900/20", border: "border-emerald-500/30", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]" },
    { title: "Monthly Earnings", value: `Rs. ${stats.monthlyEarnings.toLocaleString()}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100/50 dark:bg-blue-900/20", border: "border-blue-500/30", glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]" },
    { title: "Paid Clients", value: stats.paidClients, icon: Users, color: "text-rose-500", bg: "bg-rose-100/50 dark:bg-rose-900/20", border: "border-rose-500/30", glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]" },
    { title: "Conversion Rate", value: `${stats.conversionRate}%`, icon: Activity, color: "text-amber-500", bg: "bg-amber-100/50 dark:bg-amber-900/20", border: "border-amber-500/30", glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]" },
  ];

  // Dummy data for Tailwind bar chart showing last 7 days trend
  const chartData = [
    { day: "Mon", height: "h-24" },
    { day: "Tue", height: "h-32" },
    { day: "Wed", height: "h-48" },
    { day: "Thu", height: "h-40" },
    { day: "Fri", height: "h-56" },
    { day: "Sat", height: "h-72" },
    { day: "Sun", height: "h-64" },
  ];

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Revenue Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Track your sales performance and conversions.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border ${stat.border} transform transition-all hover:scale-105 ${stat.glow} duration-300 relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${stat.bg} border border-white/20 dark:border-white/10`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="relative z-10">
                {loading ? (
                  <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
                ) : (
                  <h3 className="text-4xl font-black text-gray-800 dark:text-gray-100 transition-colors">{stat.value}</h3>
                )}
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider transition-colors">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Section */}
        <div className="lg:col-span-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 p-8 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Weekly Revenue Trend</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sales performance over the last 7 days.</p>
          </div>
          
          {/* Custom Tailwind Bar Chart */}
          <div className="mt-12 flex items-end justify-between gap-2 h-72">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-3 w-full group">
                <div className={`w-full max-w-[40px] bg-gradient-to-t from-rose-500/80 to-pink-400 rounded-t-lg transition-all duration-500 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/40 group-hover:from-rose-400 group-hover:to-pink-300 ${data.height}`}></div>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{data.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 overflow-hidden transition-colors duration-300">
          <div className="p-8 border-b border-white/40 dark:border-slate-700/50">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest successful client payments.</p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading transactions...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-500 dark:text-gray-400">No transactions found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/20 dark:bg-slate-800/20 transition-colors">
                  <tr>
                    <th className="px-8 py-4 font-bold">Client</th>
                    <th className="px-8 py-4 font-bold">Date</th>
                    <th className="px-8 py-4 font-bold">Amount</th>
                    <th className="px-8 py-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40 dark:divide-slate-800/50">
                  {recentTransactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors duration-200">
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{tx.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{tx.phone}</p>
                      </td>
                      <td className="px-8 py-5 text-gray-600 dark:text-gray-400 font-medium">{tx.date}</td>
                      <td className="px-8 py-5 font-bold text-gray-800 dark:text-gray-200">Rs. {tx.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
