import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import api from "../utils/axiosHelp"
import { Card, Badge } from "../components/cards"
import Sidebar from "../components/sidebar"
import TopHeader from '../components/header';
import {
  LayoutDashboard, Search, Shield, User, ChevronDown,
  ArrowUpRight, ArrowDownRight, Plus, MoreVertical, Activity,
  Globe, Settings, Zap, Box
} from 'lucide-react';

import RepoFindingsModal from '../components/modal';
import AiReport from '../components/AiReport';

const Home = () => {
  const [stats, setStats] = useState([]);
  const [exposures, setExposures] = useState([]);
  const [findings, setFindings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [name, setName] = useState([]);
  const [clean, setClean] = useState([]);
  const [repoData, setRepoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiReview = async (scanId) => {
    try {
      setLoadingAi(true);
      setShowAiModal(true);

      const res = await api.get(
        `/scan/${scanId}/ai-review`,
        {
          withCredentials: true,
        }
      );
      console.log(res.data.aiReview)
      setAiReview(res.data.aiReview);
    } catch (err) {
      console.error("Failed to fetch AI review:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, e, f, a, n, c] = await Promise.all([
          api.get("/dashboard/summary", { withCredentials: true }),
          api.get("/dashboard/exposures", { withCredentials: true }),
          api.get("/dashboard/findings", { withCredentials: true }),
          api.get("/dashboard/activity", { withCredentials: true }),
          api.get("/auth/me", { withCredentials: true }),
          api.get("/clean-records", { withCredentials: true })

        ]);

        setStats(s.data.data);
        setExposures(e.data.data);
        setFindings(f.data.data);
        setActivity(a.data.data);
        setName(n.data.name);
        setClean(c.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const openRepo = async (repo) => {
    try {
      setSelectedRepo(repo);
      setLoading(true);

      const res = await api.get(
        `/findings/repo/${encodeURIComponent(repo)}`, { withCredentials: true }

      );

      const data = await res.data;
      setRepoData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-slate-300 overflow-hidden custom-scrollbar">
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-black rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">AI Security Review</h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              {loadingAi ? (
                <div>Loading AI Review...</div>
              ) : aiReview ? (
                <AiReport
                  data={aiReview}
                  sevr={""}
                />
              ) : (
                <div>No data available.</div>
              )}
            </div>

          </div>
        </div>
      )}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopHeader name={name} />

        <main className="p-6 space-y-6 overflow-y-auto">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400 text-sm">{stat.title}</span>
                  <span className="text-xs flex items-center gap-1">
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                </div>
                <h2 className={`text-3xl font-bold ${stat.color}`}>{stat.count}</h2>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <Card>
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Activity size={16} /> Threat Activity
              </h3>
              <div className="grid grid-cols-12 gap-1">
                {activity.map(cell => (
                  <div key={cell.id}
                    className={`aspect-square rounded-sm ${cell.intensity > 0.7 ? 'bg-purple-400' : 'bg-white/5'}`}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-white mb-4">External Exposures</h3>
              <div className="space-y-2">
                {exposures.map(item => (
                  <div key={item.id} className="flex justify-between p-2 bg-white/5 rounded">
                    <div>
                      <div className="text-sm">{item.title}</div>
                      <div className="text-xs text-gray-400">{item.subtitle}</div>
                    </div>
                    <Badge type={item.risk}>{item.risk}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card >
              <h3 className="text-white mb-4">Clean Records</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {clean.map(item => (
                  <div key={item.id} className="flex justify-between p-2 bg-white/5 rounded">
                    <div>
                      <div className="text-sm">{item.repo}</div>
                      <div className="text-xs text-gray-400">{item.createdAt}</div>
                    </div>
                    <Badge type={item.risk}>{item.risk}</Badge>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Table */}
          <Card>
            <h3 className="text-white mb-4">Active Findings</h3>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-gray-400 text-xs text-left">
                    <th className="py-2">Asset</th>
                    <th className="py-2">AI Review</th>
                    <th className="py-2">Account</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {findings.map(row => (
                    <tr key={row.id} className="border-t border-white/5">

                      <td className="py-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => openRepo(row.asset)}
                        >
                          <Box size={10} />
                          {row.asset}
                        </div>
                      </td>

                      <td className='py-2'> <button
                        onClick={() => handleAiReview(row.scanId)}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        AI Report
                      </button></td>
                      <td className="py-2">{row.account}</td>
                      <td className="py-2">{row.score}</td>
                      <td className="py-2">
                        <Badge type={row.status}>{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </main>
      </div>
      <RepoFindingsModal
        repoData={repoData}
        loading={loading}
        repoName={selectedRepo}
        onClose={() => setRepoData(null)}
      />
    </div>)
};

export default Home;