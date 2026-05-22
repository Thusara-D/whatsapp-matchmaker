"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreditCard, CheckCircle2 } from "lucide-react";

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
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Payment Approvals</h2>
        <p className="text-slate-500 text-sm mt-1">Verify bank receipts and unlock matches for your customers.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading pending payments...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
            <p className="text-slate-500 text-sm mt-1">There are no pending payments to approve right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer Number</th>
                  <th className="px-6 py-4 font-semibold">Customer Name</th>
                  <th className="px-6 py-4 font-semibold">Requested Match ID</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">+{user.id}</td>
                    <td className="px-6 py-4 text-slate-600">{user.profileData?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.selectedMatchId}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={approvingId === user.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {approvingId === user.id ? "Approving..." : "Approve & Send Contact"}
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
