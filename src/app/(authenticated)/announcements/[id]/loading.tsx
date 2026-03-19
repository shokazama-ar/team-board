export default function AnnouncementDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Back link */}
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />

      <div className="rounded-lg border border-gray-100 bg-white p-6">
        {/* Title block */}
        <div className="mb-4 h-7 w-64 rounded bg-gray-200" />

        {/* Body block */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/5 rounded bg-gray-200" />
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-3 w-28 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
