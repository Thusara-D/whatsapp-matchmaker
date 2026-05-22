import Link from "next/link";
import { Users, Heart, CreditCard, Settings, Home } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Matchmaker</h2>
        <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
          <Home className="w-5 h-5" />
          <span>Overview</span>
        </Link>
        <Link href="/dashboard/users" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
          <Users className="w-5 h-5" />
          <span>Users</span>
        </Link>
        <Link href="/dashboard/matches" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
          <Heart className="w-5 h-5" />
          <span>Matches</span>
        </Link>
        <Link href="/dashboard/payments" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
          <CreditCard className="w-5 h-5" />
          <span>Payments</span>
        </Link>
        <Link href="/dashboard/settings" className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
