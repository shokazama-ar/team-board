export default function InquiryDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Back link */}
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />

      {/* Detail card */}
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-6">
        <div className="mb-4 space-y-2">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-200" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </div>

      {/* Reply thread */}
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="h-16 w-64 rounded-lg bg-gray-200" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-52 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
