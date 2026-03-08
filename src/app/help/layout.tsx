import HelpNav from "./_components/HelpNav";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:flex md:gap-8">
        <aside className="shrink-0 md:mb-0 md:w-48">
          <div className="sticky top-0 z-10 bg-gray-50 pb-4 pt-2 md:top-8 md:pb-0 md:pt-0">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-blue-600">
              TeamBoard ヘルプ
            </p>
            <HelpNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
