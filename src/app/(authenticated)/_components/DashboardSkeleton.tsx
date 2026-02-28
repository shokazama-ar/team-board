export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Team Info Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-2 h-5 w-24 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-100" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
