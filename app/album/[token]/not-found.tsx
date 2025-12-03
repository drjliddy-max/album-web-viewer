export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Album Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          This album doesn't exist or is no longer available.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-sm text-gray-500 mb-2">
            Possible reasons:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• The album link may be incorrect</li>
            <li>• The album may have been deleted</li>
            <li>• The album may have expired</li>
          </ul>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Contact the person who shared this album for a new link
        </p>
      </div>
    </div>
  );
}
