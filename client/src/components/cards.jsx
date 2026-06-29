const Card = ({ children, className = "", noPadding = false }) => (
  <div
    className={`relative group rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04] hover:-translate-y-0.5 ${className}`}
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div className={`relative z-10 h-full ${noPadding ? "" : "p-5 lg:p-6"}`}>
      {children}
    </div>
  </div>
);

const Badge = ({ children, type }) => {
  const colors = {
    Critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Clean: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[type]}`}
    >
      {children}
    </span>
  );
};

export { Card, Badge };
