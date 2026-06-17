
import { useNavigate } from "react-router-dom";
import { Search, User, Lock } from "lucide-react";

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

    return (
        <header className="flex items-center justify-between py-4 px-6 border-b border-white/10 bg-[#0B0F1A]/50 backdrop-blur-xl">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search vulnerabilities..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white"
                />
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