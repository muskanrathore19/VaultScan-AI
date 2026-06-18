import {
    LayoutDashboard, Search, Shield, User
} from 'lucide-react';
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/axiosHelp";
import SidebarOverview from './sideBoard';

const Sidebar = () => {
    const [role, setRole] = useState(null);

    const [analytics, setAnalytics] = useState({
        scans: 0,
        findings: 0,
        risk: 0,
        lastScan: null,
        version: "v1.0.0",
        trend: [],
    });


    useEffect(() => {
        const getUser = async () => {
            try {
                // const res = await api.get("/auth/me", { withCredentials: true });
                const [res, analyticsRes] = await Promise.all([
                    api.get("/auth/me", { withCredentials: true }),
                    api.get("/dashboard/analytics", { withCredentials: true }),
                ]);

                setRole(res.data?.role || "user");
                setAnalytics({
                    scans: analyticsRes.data.scans || 0,
                    findings: analyticsRes.data.findings || 0,
                    risk: analyticsRes.data.risk || 0,
                    lastScan: analyticsRes.data.lastScan,
                    version: analyticsRes.data.version || "v1.0.0",
                    trend: analyticsRes.data.trend || [],
                });
            } catch (err) {
                console.error(err);
            }
        };

        getUser();
    }, []);

    return (
        <aside className="w-64 hidden md:flex flex-col h-full border-r border-white/10 bg-[#0B0F1A]/80 backdrop-blur-2xl">

            {/* LOGO */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">VaultScan</span>
            </div>

            {/* NAV */}
            <nav className="flex-1 px-4 py-2 space-y-2">

                {/* DASHBOARD */}
                <NavLink
                    to="/home"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl w-full ${isActive
                            ? "text-white bg-white/10"
                            : "text-gray-400 hover:bg-white/5"
                        }`
                    }
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </NavLink>

                {/* DISCOVERY */}
                <NavLink
                    to="/discovery"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl w-full ${isActive
                            ? "text-white bg-white/10"
                            : "text-gray-400 hover:bg-white/5"
                        }`
                    }
                >
                    <Search className="w-5 h-5" />
                    Discovery
                </NavLink>

                {/* 🔥 ADMIN (CONDITIONAL) */}
                {role === "admin" && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-xl w-full ${isActive
                                ? "text-white bg-white/10"
                                : "text-gray-400 hover:bg-white/5"
                            }`
                        }
                    >
                        <User className="w-5 h-5" />
                        Admin
                    </NavLink>
                )}
                {/* <div className='mb-16'></div> */}
                <div className="my-8 border-t border-white/5" />
                <SidebarOverview
                    scans={analytics.scans}
                    findings={analytics.findings}
                    risk={analytics.risk}
                    lastScan={analytics.lastScan}
                    version={analytics.version}
                    trend={analytics.trend}
                />
            </nav>
        </aside>
    );
};

export default Sidebar;