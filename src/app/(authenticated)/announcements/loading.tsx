export default function AnnouncementsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Page title */}
      <div className="mb-6 h-8 w-36 rounded bg-gray-200" />

      {/* Card rows */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-white p-5">
            <div className="mb-2 h-5 w-52 rounded bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-4/5 rounded bg-gray-200" />
            </div>
            <div className="mt-3 h-3 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
