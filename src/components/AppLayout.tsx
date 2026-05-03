import { TopNav } from "@/components/TopNav";
import { CalibracaoAlertBanner } from "@/components/CalibracaoAlertBanner";
import techBg from "@/assets/tech-bg.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full relative">
      {/* Tech background overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-[0.07] z-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: `url(${techBg})` }}
      />
      <TopNav />
      <CalibracaoAlertBanner />
      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
