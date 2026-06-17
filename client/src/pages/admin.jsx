import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../utils/axiosHelp";
import {
  Shield, LayoutDashboard, Search, User,
  Trash2
} from "lucide-react";
import {Card, Badge} from "../components/cards"
import Sidebar from "../components/sidebar";

const Admin = () => {
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [s, st, u] = await Promise.all([
        api.get("/admin/dashboard", { withCredentials: true }), // ✅ FIXED
        api.get("/admin/status", { withCredentials: true }),
        api.get("/admin/users", { withCredentials: true }),
      ]);

      setStats(s.data);
      setStatus(st.data);
      setUsers(u.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user permanently?")) return;

    try {
      await api.delete(`/admin/user/${id}`, { withCredentials: true });
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- RISK MAX FOR SCALING ---------- */
  const maxRisk = Math.max(
    stats?.risks?.critical || 0,
    stats?.risks?.high || 0,
    stats?.risks?.medium || 0,
    stats?.risks?.low || 0,
    1
  );

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-white">

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h1 className="text-2xl font-bold">Hello, Admin 👋</h1>

          <div className="flex gap-4 text-sm">
            <span className={status.backend ? "text-green-400" : "text-red-400"}>
              ● Backend
            </span>
            <span className={status.db ? "text-green-400" : "text-red-400"}>
              ● Database
            </span>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Loading admin data...</p>
          </div>
        ) : (

        /* CONTENT */
        <main className="p-6 space-y-6 overflow-y-auto">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20">
              <p className="text-gray-400 text-sm">Total Users</p>
              <h2 className="text-4xl font-bold">{stats.users || 0}</h2>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20">
              <p className="text-gray-400 text-sm">Total Scans</p>
              <h2 className="text-4xl font-bold">{stats.scans || 0}</h2>
            </Card>

            <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20">
              <p className="text-gray-400 text-sm">Critical</p>
              <h2 className="text-4xl font-bold">{stats?.risks?.critical || 0}</h2>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20">
              <p className="text-gray-400 text-sm">Most Leaked</p>
              <h2 className="text-lg font-semibold">{stats.topSecret || "N/A"}</h2>
            </Card>

          </div>

          {/* ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* RISK DISTRIBUTION */}
            <Card>
              <h3 className="mb-4">Risk Distribution</h3>

              {["critical","high","medium","low"].map((r) => (
                <div key={r} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{r}</span>
                    <span>{stats?.risks?.[r] || 0}</span>
                  </div>

                  <div className="h-2 bg-white/10 rounded">
                    <div
                      className="h-2 rounded bg-purple-500"
                      style={{
                        width: `${((stats?.risks?.[r] || 0) / maxRisk) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </Card>

            {/* TOP SECRETS */}
            <Card>
              <h3 className="mb-4">Top Leaked Secrets</h3>

              {(stats.topSecrets || []).length === 0 ? (
                <p className="text-gray-400 text-sm">No data</p>
              ) : (
                stats.topSecrets.map((s, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/10">
                    <span>{s.name}</span>
                    <span className="text-red-400">{s.count}</span>
                  </div>
                ))
              )}
            </Card>

          </div>

          {/* USERS */}
          <Card className="max-h-[300px] overflow-y-auto">
            <h3 className="mb-4 text-lg">User Control</h3>

            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left">
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-t border-white/10">
                      <td className="py-2">{u.email}</td>
                      <td>{u.name}</td>
                      <td>
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 size={14}/> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

        </main>
        )}

      </div>
    </div>
  );
};

export default Admin;