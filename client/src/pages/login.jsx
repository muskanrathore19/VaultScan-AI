import React, {useState , useEffect} from 'react';
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import {StyleDefinitions, BackgroundScanner, GlassCard, InputField, AnimatedGrid} from './utils.jsx';
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosHelp.js";

const LoginCore = () => {
  const fullText = "VaultScan";
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  // Typing animation
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password
      });

      // store token (important)
      localStorage.setItem("token", res.data.accessToken);
    //   alert("Login Successful");
      navigate("/home")
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-[#00f5d4]/10 rounded-2xl mb-4 border border-[#00f5d4]/20 shadow-[0_0_15px_rgba(0,245,212,0.15)]">
          <ShieldCheck size={32} className="text-[#00f5d4]" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {text}
          <span className="animate-pulse">|</span>
        </h1>

        <p className="text-sm text-slate-400">
          Secure Authentication Portal
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <InputField 
          icon={Mail}
          type="email"
          placeholder="Encrypted Email Address"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />

        <InputField 
          icon={Lock}
          type="password"
          placeholder="Master Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />

        {/* Button */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[#00f5d4] hover:bg-[#14fce0] text-[#020617] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] glow-effect disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Authenticate Access"}
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400">
          New operative?{" "}
          <a href="/register" className="text-[#00f5d4] hover:text-white font-semibold">
            Initialize access
          </a>
        </p>
      </div>
    </GlassCard>
  );
};

const Login = () => {
  return (
    <>
      <StyleDefinitions />
      <BackgroundScanner>
        <LoginCore/>
      </BackgroundScanner>
    </>
  );
}

export default Login;