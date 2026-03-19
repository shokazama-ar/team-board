export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Section title */}
      <div className="mb-6 h-8 w-24 rounded bg-gray-200" />

      <div className="rounded-lg border border-gray-100 bg-white p-6 space-y-5">
        {/* Input field blocks */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-9 w-full rounded bg-gray-200" />
          </div>
        ))}

        {/* Button placeholder */}
        <div className="h-9 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}
