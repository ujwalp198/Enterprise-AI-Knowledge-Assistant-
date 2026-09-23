import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
      <p>Welcome, {user?.email}</p>
      <p className="text-gray-600">Organization: {user?.organization?.name}</p>
      <p className="text-gray-600">Role: {user?.role}</p>
      <div className="mt-4 space-x-2">
        <Link
          to="/chat"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Chat
        </Link>
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            className="inline-block bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Admin Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
