"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Heart, SearchX } from "lucide-react";

function MatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [shownMatchIds, setShownMatchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (userId) {
      findMatches(userId);
    }
  }, [userId]);

  async function findMatches(id: string, excludeIds: string[] = []) {
    setLoading(true);
    setError(null);
    try {
      const excludeParam = excludeIds.length > 0 ? `&exclude=${excludeIds.join(',')}` : '';
      const res = await fetch(`/api/match?userId=${id}${excludeParam}`);
      const data = await res.json();
      if (res.ok) {
        setTargetUser(data.targetUser);
        setMatches(data.matches);
        setShownMatchIds(prev => [...prev, ...data.matches.map((m: any) => m.id)]);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch matches from AI.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMatches() {
    if (!userId || matches.length === 0) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/send-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, matches }),
      });
      if (res.ok) {
        alert("Matches successfully sent to client via WhatsApp!");
      } else {
        alert("Failed to send matches.");
      }
    } catch (e) {
      alert("Error sending matches.");
    } finally {
      setIsSending(false);
    }
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Heart className="w-16 h-16 text-rose-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">No User Selected</h2>
        <p className="text-gray-500 mt-2">Go back to the Users tab and click "Find Match" to see the AI magic.</p>
        <button 
          onClick={() => router.push("/dashboard/users")}
          className="mt-6 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          Go to Users
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2 max-w-5xl mx-auto">
      <button 
        onClick={() => router.push("/dashboard/users")}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">AI Match Results</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Gemini AI has analyzed thousands of data points to find the perfect fit.</p>
        </div>
        {targetUser && (
          <div className="flex flex-col items-end gap-3">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 dark:border-slate-800/50 shadow-sm transition-colors">
               <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase transition-colors">Finding matches for</p>
               <p className="text-lg font-bold text-rose-600 dark:text-pink-400 transition-colors">{targetUser.name}</p>
            </div>
            {matches.length > 0 && !loading && (
              <div className="flex gap-2">
                <button 
                  onClick={() => findMatches(userId, shownMatchIds)} 
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-700 transition-all active:scale-95"
                >
                  MATCH MORE
                </button>
                <button 
                  onClick={handleSendMatches} 
                  disabled={isSending} 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
                >
                  {isSending ? "Sending..." : "Send to Client"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800/50 shadow-sm transition-colors">
          <Sparkles className="w-12 h-12 text-rose-500 dark:text-pink-500 animate-pulse mb-4" />
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 animate-pulse transition-colors">Gemini is analyzing profiles...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors">Calculating compatibility algorithms</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-800/50 font-medium transition-colors">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800/50 shadow-sm text-center transition-colors">
          <SearchX className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 transition-colors">No Candidates Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 transition-colors">There are no completed profiles that match the requested criteria right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matches.map((match, idx) => (
            <div key={match.id} className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 flex flex-col relative overflow-hidden group hover:scale-105 transition-all duration-300 ${idx === 0 ? 'dark:shadow-[0_0_20px_rgba(236,72,153,0.3)] dark:border-pink-500/30' : ''}`}>
              {idx === 0 && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500"></div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 transition-colors">{match.name}</h3>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1 transition-colors">{match.age} • {match.district}</p>
                </div>
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-50 dark:from-slate-800 dark:to-slate-800 rounded-full border-2 border-white dark:border-slate-700 shadow-sm shrink-0 transition-colors">
                  <span className="text-lg font-black text-rose-600 dark:text-pink-400 transition-colors">{match.matchPercentage}%</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Job</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold transition-colors">{match.job}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Height</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold transition-colors">{match.height}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Education</span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold transition-colors">{match.education}</span>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-rose-50/50 to-orange-50/50 dark:from-slate-800/50 dark:to-slate-800/30 p-4 rounded-2xl border border-rose-100/50 dark:border-slate-700/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-rose-500 dark:text-pink-400 transition-colors" />
                  <span className="text-xs font-bold text-rose-600 dark:text-pink-400 uppercase tracking-wider transition-colors">AI Reasoning</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium transition-colors">
                  "{match.matchReason}"
                </p>
              </div>

              {idx === 0 && (
                <div className="mt-6 flex justify-center">
                  <span className="text-xs font-bold text-pink-500 bg-pink-100/50 dark:bg-pink-900/30 px-3 py-1 rounded-full border border-pink-200 dark:border-pink-800/50 transition-colors">
                    🏆 Top Recommended Match
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse text-gray-500">Loading Dashboard...</div>}>
      <MatchContent />
    </Suspense>
  );
}
