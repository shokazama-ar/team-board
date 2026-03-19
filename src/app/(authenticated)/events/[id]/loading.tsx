export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Back link */}
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />

      {/* Detail card */}
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-6 space-y-3">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="h-4 w-28 rounded bg-gray-200" />
      </div>

      {/* Attendance table */}
      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <div className="mb-3 h-5 w-24 rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
