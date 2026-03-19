export default function MembersLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Page title */}
      <div className="mb-6 h-8 w-28 rounded bg-gray-200" />

      {/* Member rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
