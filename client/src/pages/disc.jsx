import React, { useState, useEffect, useRef } from "react";
import api from "../utils/axiosHelp";
import { NavLink } from "react-router-dom";
import { Card, Badge } from "../components/cards";
import Sidebar from "../components/sidebar";
import TopHeader from "../components/header";
import { LayoutDashboard, Search, Shield, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AiReport from "../components/AiReport";

const normalizeScanResponse = (data) => {
  if (data?.type === "findings") {
    return {
      id: data.id, // new addition
      type: "findings",
      data: Array.isArray(data.data) ? data.data : [],
    };
  } else if (data?.type === "none") {
    return { id: data.id, type: "clean", data: [] };
  }
  return { id: null, type: "none", data: [] };
};

const Discovery = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [name, setName] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const pollingRef = useRef(null);

  const fetchAiReview = async (scanId) => {
    if (!scanId) return;
    try {
      setLoadingAi(true);

      const res = await api.get(`/scan/${scanId}/ai-review`, {
        withCredentials: true,
      });

      setAiReview(res.data.aiReview);
    } catch (err) {
      console.error("AI Review Error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // FIX: fetch user profile so `name` actually populates
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("auth/me", {
          withCredentials: true,
        });
        setName(res.data?.name || res.data?.username || "");
      } catch {
        // silently ignore — name falls back to "User"
      }
    };
    fetchProfile();
    fetchLastScan();
    fetchAiReview();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchLastScan = async () => {
    try {
      const res = await api.get("/last-scan", {
        withCredentials: true,
      });

      const normalized = normalizeScanResponse(res.data);
      setScanData(normalized);

      if (normalized.id) {
        fetchAiReview(normalized.id);
      }
    } catch (err) {
      console.error("Last scan error:", err);
      setScanData({ type: "none", data: [] });
    }
  };

  const startPolling = () => {
    stopPolling(); // clear any existing interval first

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/last-scan", {
          withCredentials: true,
        });

        const normalized = normalizeScanResponse(res.data);
        setScanData(normalized);

        // Stop polling when we have a real result
        if (
          normalized.type === "clean" ||
          (normalized.type === "findings" && normalized.data.length > 0)
        ) {
          stopPolling();
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
        stopPolling();
        setLoading(false);
      }
    }, 2000);
  };

  const handleScan = async () => {
    const result = normalizeGithubRepoUrl(repoUrl);

    if (!result.valid) {
      // toast.error(result.error);
      return;
    }

    // Update input with cleaned URL
    setRepoUrl(result.url);
    if (!repoUrl) return;

    try {
      setLoading(true);
      setScanData(null);
      stopPolling(); // stop any previous poll

      const res = await api.post(
        "/scan",
        { repoUrl: result.url },
        { withCredentials: true },
      );

      const normalized = normalizeScanResponse(res.data);
      setScanData(normalized);

      // FIX: only start polling if the scan didn't return immediate results
      if (normalized.type === "none") {
        startPolling();
      } else {
        setLoading(false);
      }
    } catch (err) {
      const status = err.response?.status;
      console.log(status);

      if (status === 404) {
        alert("Repository not found. Please check the repository URL.");
        return;
      }

      if (status === 401 || status === 403) {
        alert(
          "GitHub PAT token is invalid, expired, lacks permissions, or API rate limit has been reached.",
        );
        return;
      } else {
        alert(err);
        return;
      }
      console.error(err);
      setLoading(false);
      stopPolling();
      // FIX: fall back to polling in case the POST kicked off an async job
      startPolling();
    }
  };

  const getAnalytics = () => {
    if (!scanData || scanData.type !== "findings") return null;

    // FIX: use the local `items` variable consistently — no more raw scanData.data in forEach
    const items = Array.isArray(scanData.data) ? scanData.data : [];
    const total = items.length;

    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    items.forEach((item) => {
      if (counts[item.risk] !== undefined) counts[item.risk]++;
    });

    let overall = "Low";
    if (counts.Critical > 0) overall = "Critical";
    else if (counts.High > 0) overall = "High";
    else if (counts.Medium > 0) overall = "Medium";

    return { total, counts, overall };
  };

  const analytics = getAnalytics();

  const normalizeGithubRepoUrl = (input) => {
    let url = input.trim();

    if (!url) {
      alert("Please Enter Repository URL!");
      return { valid: false, error: "Repository URL is required" };
    }

    // Remove trailing slash
    url = url.replace(/\/+$/, "");

    // Auto-append github.com if user enters owner/repo
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(url)) {
        url = `https://github.com/${url}`;
      } else if (/^[a-zA-Z0-9_.-]+$/.test(url)) {
        alert(
          "Invalid repository URL! Please Enter in format: username/repo and Try Again!",
        );
        return { valid: false, error: "Repository name incomplete" };
      } else {
        url = `https://${url}`;
      }
    }

    try {
      const parsed = new URL(url);

      // Only github.com
      if (
        parsed.hostname !== "github.com" &&
        parsed.hostname !== "www.github.com"
      ) {
        alert("Only GitHub repositories are supported!");
        return {
          valid: false,
          error: "Only GitHub repositories are supported",
        };
      }

      // Must be github.com/owner/repo
      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts.length < 2) {
        alert(
          "Invalid repository URL! Please Enter in format: https://github.com/username/repo and Try Again!",
        );
        return { valid: false, error: "Invalid repository URL" };
      }

      const [owner, repo] = parts;

      if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) {
        alert(
          "Invalid repository URL! Please Enter in format: https://github.com/username/repo and Try Again!",
        );
        return { valid: false, error: "Invalid repository format" };
      }

      return {
        valid: true,
        url: `https://github.com/${owner}/${repo}`,
      };
    } catch {
      alert(
        "Invalid repository URL! Please Enter in format: https://github.com/username/repo and Try Again!",
      );
      return { valid: false, error: "Invalid URL" };
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-slate-300 overflow-hidden custom-scrollbar">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopHeader name={name} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* SCAN CARD */}
          <Card>
            <h3 className="text-white mb-4 flex items-center gap-2">
              <Search size={16} /> Scan Repository
            </h3>

            <div className="flex gap-3">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleScan();
                  }
                }}
                placeholder="https://github.com/user/repo"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
              />

              <button
                onClick={handleScan}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Scan"}
              </button>
            </div>

            {loading && (
              <div className="mt-4">
                <div className="h-1 w-full bg-white/10 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-[slide_1.2s_linear_infinite]"></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Scanning repository...
                </p>
              </div>
            )}
          </Card>

          {!loading && scanData && (
            <Card>
              <h3 className="text-white mb-4 flex justify-between">
                <span>Scan Results</span>

                {scanData.type === "findings" && (
                  <span className="text-xs text-gray-400">
                    {scanData.data.length} issues found
                  </span>
                )}
              </h3>

              {scanData.type === "clean" && (
                <div className="text-green-400 text-sm">
                  No secrets found — Clean scan
                </div>
              )}

              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Card>
                    <div className="text-xs text-gray-400">Total Leaks</div>
                    <div className="text-2xl font-bold text-white">
                      {analytics.total}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-400">Critical</div>
                    <div className="text-xl text-rose-400">
                      {analytics.counts.Critical}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-400">High</div>
                    <div className="text-xl text-orange-400">
                      {analytics.counts.High}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-400">Medium / Low</div>
                    <div className="text-xl text-blue-400">
                      {analytics.counts.Medium + analytics.counts.Low}
                    </div>
                  </Card>
                </div>
              )}

              {analytics && (
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">
                      Overall Risk Level
                    </span>
                    <span className="text-sm font-medium text-white">
                      {analytics.overall}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden">
                    <div
                      className={`h-full ${
                        analytics.overall === "Critical"
                          ? "bg-rose-500 w-full"
                          : analytics.overall === "High"
                            ? "bg-orange-500 w-3/4"
                            : analytics.overall === "Medium"
                              ? "bg-amber-500 w-1/2"
                              : "bg-blue-500 w-1/4"
                      }`}
                    />
                  </div>
                </Card>
              )}

              <div className="mb-4"></div>

              {scanData.type === "findings" && (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                  {scanData.data.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition flex justify-between items-center"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-white font-medium">
                          {item.secretType}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          📁 {item.file} :{" "}
                          <span className="text-white">
                            Line {Number(item.line)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 hidden md:block">
                          {item.repo?.split("/").pop()}
                        </span>
                        <Badge type={item.risk}>{item.risk}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-4"></div>
              <div className="mb-4"></div>

              {loadingAi && (
                <Card>
                  <div className="flex justify-center items-center py-10">
                    <div className="text-slate-400">
                      Generating AI Security Analysis...
                    </div>
                  </div>
                </Card>
              )}

              {scanData.type === "findings" && aiReview && (
                <Card className="border-l-4 border-l-purple-500">
                  <AiReport data={aiReview} sevr={analytics.overall} />
                </Card>
              )}

              {scanData.type === "none" && (
                <div className="text-gray-400 text-sm">No scans yet.</div>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Discovery;
