"use client";

import { useState } from "react";
import { Database, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm("Are you sure? This will generate 15 realistic Sri Lankan test profiles in your live database.")) return;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(`Success! ${data.message}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setResult("Failed to trigger seeder. Check network or server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">System Settings</h2>
        <p className="text-gray-500 text-sm mt-2 font-medium">Manage developer tools and system configurations.</p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 max-w-2xl">
        
        <div className="flex items-start gap-5">
          <div className="p-3 bg-amber-100/50 rounded-2xl border border-amber-200/50">
            <Database className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">Database Seeder</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6 leading-relaxed">
              Use this tool to instantly populate your database with 15 highly realistic, AI-generated Sri Lankan profiles (mixed boys and girls). 
              This is incredibly useful for testing the matching engine without needing real clients.
            </p>
            
            <button
              onClick={handleSeed}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {loading ? "Seeding Database..." : "Seed 15 Test Profiles"}
            </button>

            {result && (
              <div className="mt-6 p-4 rounded-xl bg-gray-50/80 border border-gray-200/50 text-sm font-medium text-gray-700 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{result}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
