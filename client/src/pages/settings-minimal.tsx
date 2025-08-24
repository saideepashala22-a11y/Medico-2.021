import { Link } from 'wouter';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Settings Page Working!</h1>
        <p className="mb-4">This is a minimal settings page to test routing.</p>
        <Link href="/dashboard">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}