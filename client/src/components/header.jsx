import { useNavigate } from "react-router-dom";
import { Search, User, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";

const SECURITY_TIPS = [
  "Never commit API keys to Git repositories.",
  "Enable MFA on all privileged accounts.",
  "Rotate secrets regularly and revoke unused credentials.",
  "Keep updated to reduce known vulnerabilities.",
  "Apply the principle of least privilege.",
  "Scan container images before deployment.",
  "Store passwords using strong hashing algorithms.",
  "Validate and sanitize all user input.",
  "Use HTTPS everywhere.",
  "Monitor exposed secrets continuously.",
  "Review IAM permissions quarterly.",
  "Never trust user supplied file names.",
  "Implement rate limiting on public APIs.",
  "Patch critical CVEs immediately.",
  "Use short-lived ATs whenever possible.",
];

const TopHeader = ({ name }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove JWT token
    localStorage.removeItem("token");

    // Optional: remove user data if stored
    localStorage.removeItem("user");

    // Redirect to login page
    navigate("/login");
  };

  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % SECURITY_TIPS.length);
        setVisible(true);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between py-4 px-6 border-b border-white/10 bg-[#0B0F1A]/50 backdrop-blur-xl">
      <div className="relative w-full max-w-md">
        {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search vulnerabilities..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white"
                /> */}
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">💡Tip: </span>

              <div>
                <p
                  className={`text-sm text-purple-400 transition-all duration-300 ease-in-out ${
                    visible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-2"
                  }`}
                >
                  {SECURITY_TIPS[tipIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-white" />
          <span>{name}</span>

          <Lock className="w-5 h-5 text-white ml-4" />
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
