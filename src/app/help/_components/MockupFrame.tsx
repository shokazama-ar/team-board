export default function MockupFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-yellow-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="ml-2 truncate text-xs text-gray-400">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </figure>
  );
}
