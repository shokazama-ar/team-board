export default function InquiriesLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Page title */}
      <div className="mb-6 h-8 w-40 rounded bg-gray-200" />

      {/* Tab bar */}
      <div className="mb-6 flex gap-2">
        <div className="h-9 w-20 rounded bg-gray-200" />
        <div className="h-9 w-20 rounded bg-gray-200" />
        <div className="h-9 w-20 rounded bg-gray-200" />
      </div>

      {/* Card rows */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-48 rounded bg-gray-200" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
