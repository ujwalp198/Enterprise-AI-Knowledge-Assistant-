import { useEffect, useState } from 'react';
import { getOrgUsers, getOrgDocuments } from '../services/admin.service';
import { useAuth } from '../context/AuthContext';

interface OrgUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface OrgDocument {
  id: string;
  originalName: string;
  status: string;
  createdAt: string;
  uploadedBy: { email: string };
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [usersData, docsData] = await Promise.all([
          getOrgUsers(),
          getOrgDocuments(),
        ]);
        setUsers(usersData);
        setDocuments(docsData);
      } catch (error) {
        const err = error as any;
        setError(err.response?.data?.error || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <p className="text-red-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Organization Members ({users.length})
        </h2>
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-2 text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Documents ({documents.length})
        </h2>
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Uploaded By</th>
              <th className="p-2">Status</th>
              <th className="p-2">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2 truncate max-w-xs">{d.originalName}</td>
                <td className="p-2 text-gray-500">{d.uploadedBy?.email}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      d.status === 'ready'
                        ? 'bg-green-100 text-green-700'
                        : d.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="p-2 text-gray-500">
                  {new Date(d.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
