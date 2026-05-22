"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function PaymentsPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  async function fetchPendingPayments() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("state", "==", "PAYMENT_PENDING_APPROVAL"));
      const snap = await getDocs(q);
      
      const fetched: any[] = [];
      snap.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });

      setPendingUsers(fetched);
    } catch (error) {
      console.error("Failed to fetch pending payments", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    if (!confirm("Are you sure you want to approve this payment? This will send the contact details to the user via WhatsApp immediately.")) return;
    
    setApprovingId(userId);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert("Payment approved successfully! Contact details have been sent.");
        fetchPendingPayments(); // Refresh the list
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to approve payment. Please try again.");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Payment Approvals</h2>
        <p className="text-gray-500 text-sm mt-2 font-medium">Verify bank receipts and securely unlock matches.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium animate-pulse">Loading pending payments...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">All caught up!</h3>
            <p className="text-gray-500 text-sm mt-2">There are no pending payments to approve right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-white/40 border-b border-white/50">
                <tr>
                  <th className="px-8 py-5 font-bold">Customer Number</th>
                  <th className="px-8 py-5 font-bold">Customer Name</th>
                  <th className="px-8 py-5 font-bold">Requested Match ID</th>
                  <th className="px-8 py-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 transition-colors duration-200">
                    <td className="px-8 py-6 font-bold text-gray-800">+{user.id}</td>
                    <td className="px-8 py-6 font-medium text-gray-600">{user.profileData?.name || "Unknown"}</td>
                    <td className="px-8 py-6 font-mono text-xs text-gray-500">{user.selectedMatchId}</td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={approvingId === user.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {approvingId === user.id ? "Approving..." : "Approve & Send"}
                      </button>
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
