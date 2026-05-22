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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      findMatches(userId);
    }
  }, [userId]);

  async function findMatches(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/match?userId=${id}`);
      const data = await res.json();
      if (res.ok) {
        setTargetUser(data.targetUser);
        setMatches(data.matches);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch matches from AI.");
    } finally {
      setLoading(false);
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
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">AI Match Results</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">Gemini AI has analyzed thousands of data points to find the perfect fit.</p>
        </div>
        {targetUser && (
          <div className="bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 shadow-sm">
             <p className="text-xs text-gray-500 font-semibold uppercase">Finding matches for</p>
             <p className="text-lg font-bold text-rose-600">{targetUser.name}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm">
          <Sparkles className="w-12 h-12 text-rose-500 animate-pulse mb-4" />
          <h3 className="text-xl font-bold text-gray-700 animate-pulse">Gemini is analyzing profiles...</h3>
          <p className="text-sm text-gray-500 mt-2">Calculating compatibility algorithms</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50/80 text-red-600 rounded-3xl border border-red-100 font-medium">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm text-center">
          <SearchX className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No Candidates Found</h3>
          <p className="text-sm text-gray-500 mt-2">There are no completed profiles that match the requested criteria right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {matches.map((match, idx) => (
            <div key={match.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              {idx === 0 && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500"></div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">{match.name}</h3>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">{match.age} • {match.district}</p>
                </div>
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-50 rounded-full border-2 border-white shadow-sm shrink-0">
                  <span className="text-lg font-black text-rose-600">{match.matchPercentage}%</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Job</span>
                  <span className="text-gray-800 font-semibold">{match.job}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Height</span>
                  <span className="text-gray-800 font-semibold">{match.height}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Education</span>
                  <span className="text-gray-800 font-semibold">{match.education}</span>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-rose-50/50 to-orange-50/50 p-4 rounded-2xl border border-rose-100/50">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">AI Reasoning</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  "{match.matchReason}"
                </p>
              </div>

              {idx === 0 && (
                <div className="mt-6 flex justify-center">
                  <span className="text-xs font-bold text-pink-500 bg-pink-100/50 px-3 py-1 rounded-full border border-pink-200">
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
