"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, ShieldCheck, FileText, X, XCircle } from "lucide-react";

export default function PaymentsPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  async function fetchPendingPayments() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("status", "==", "PAYMENT_PENDING_APPROVAL"));
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

  async function handleReject(userId: string) {
    if (!confirm("Are you sure you want to reject this payment? The user will be moved back to AWAITING_PAYMENT_RECEIPT.")) return;
    
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { status: "AWAITING_PAYMENT_RECEIPT" }, { merge: true });
      alert("Payment rejected.");
      fetchPendingPayments();
    } catch (error) {
      alert("Failed to reject payment.");
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Payment Approvals</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Verify bank receipts and securely unlock matches.</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading pending payments...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white dark:border-slate-700 transition-colors">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 dark:text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 transition-colors">All caught up!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 transition-colors">There are no pending payments to approve right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white/40 dark:bg-slate-800/40 border-b border-white/50 dark:border-slate-700/50 transition-colors">
                <tr>
                  <th className="px-8 py-5 font-bold">Customer Number</th>
                  <th className="px-8 py-5 font-bold">Customer Name</th>
                  <th className="px-8 py-5 font-bold">Requested Match ID</th>
                  <th className="px-8 py-5 font-bold">Receipt</th>
                  <th className="px-8 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-slate-800/50">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors duration-200">
                    <td className="px-8 py-6 font-bold text-gray-800 dark:text-gray-200">+{user.id}</td>
                    <td className="px-8 py-6 font-medium text-gray-600 dark:text-gray-400">{user.profileData?.name || "Unknown"}</td>
                    <td className="px-8 py-6 font-mono text-xs text-gray-500 dark:text-gray-500">{user.selectedMatchId}</td>
                    <td className="px-8 py-6">
                      {user.paymentReceiptUrl ? (
                        <button
                          onClick={() => setSelectedReceiptUrl(user.paymentReceiptUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No image saved</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(user.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={approvingId === user.id}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {approvingId === user.id ? "Approving..." : "Approve & Send"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Receipt */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-white/20">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Bank Receipt
              </h3>
              <button 
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-100/50 dark:bg-slate-900/80 flex justify-center items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-sm border border-white/50 dark:border-slate-700 w-full max-h-[70vh] flex items-center justify-center bg-gray-200 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedReceiptUrl} alt="Bank Receipt" className="object-contain max-h-[70vh]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
