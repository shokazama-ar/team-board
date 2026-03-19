export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Page title */}
      <div className="mb-6 h-8 w-24 rounded bg-gray-200" />

      {/* Filter bar */}
      <div className="mb-6 flex gap-2">
        <div className="h-9 w-28 rounded bg-gray-200" />
        <div className="h-9 w-28 rounded bg-gray-200" />
        <div className="h-9 w-28 rounded bg-gray-200" />
      </div>

      {/* List rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
