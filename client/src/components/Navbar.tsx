import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Search, BarChart3, History, LogOut, Menu, X, Sun, Moon, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Navbar() {
    const { user, logout } = useApp();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    const navLinks = user
        ? [
              { path: "/dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
              { path: "/analyze", label: "Analyze", icon: <Search size={18} /> },
              { path: "/compare", label: "Compare", icon: <Users size={18} />, primary: true },
              { path: "/history", label: "History", icon: <History size={18} /> },
          ]
        : [];

    return (
        <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/50 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
                        <Sparkles className="text-primary size-5" />
                        <span className="text-xl tracking-tight text-foreground font-medium">SEO Pilot</span>
                    </Link>

                    {user && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                                        isActive(link.path)
                                            ? link.primary
                                                ? "bg-primary text-primary-foreground font-medium"
                                                : "bg-accent/10 text-accent font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                                    }`}
                                    style={isActive(link.path) && link.primary ? { color: "var(--background)" } : {}}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {user ? (
                            <>
                                <Link
                                    to="/analyze"
                                    className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
                                    style={{ color: "var(--background)" }}
                                >
                                    <Search size={16} />
                                    New Analysis
                                </Link>
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-border bg-card text-sm">
                                    <div
                                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold"
                                        style={{ color: "var(--background)" }}
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-foreground font-medium max-w-[100px] truncate">{user.name}</span>
                                </div>
                                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                    <LogOut size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    Log In
                                </Link>
                                <Link to="/register" className="px-5 py-2 rounded-full bg-primary text-sm font-medium hover:opacity-90" style={{ color: "var(--background)" }}>
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 text-muted-foreground hover:text-foreground">
                            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="text-muted-foreground hover:text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="md:hidden border-b border-border bg-background">
                    <div className="px-4 py-3 space-y-1">
                        {user ? (
                            <>
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                                            isActive(link.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {link.icon}
                                        {link.label}
                                    </Link>
                                ))}
                                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-danger w-full">
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="py-2 space-y-2">
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-3 text-sm text-center rounded-lg hover:bg-muted">
                                    Log In
                                </Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-3 text-sm text-center rounded-lg bg-primary" style={{ color: "var(--background)" }}>
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
