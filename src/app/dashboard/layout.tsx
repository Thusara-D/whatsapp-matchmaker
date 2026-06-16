import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-teal-50 to-rose-50 dark:from-slate-900 dark:via-slate-950 dark:to-black transition-colors duration-500">
      
      {/* Global Animated Background Blobs for Dashboard */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-200/50 dark:bg-pink-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob pointer-events-none transition-colors duration-500"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-teal-200/50 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000 pointer-events-none transition-colors duration-500"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200/50 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000 pointer-events-none transition-colors duration-500"></div>

      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
