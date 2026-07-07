import React, { useState, useEffect } from "react";
import { Box, User, LogOut, Shield, ShoppingBag, Grid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
      onNavigate("marketplace");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const isAdmin = user && user.email === "bitcoinoussama3@gmail.com";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "py-3 bg-[#09090b]/80 backdrop-blur-md border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          : "py-5 bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("marketplace")}
          className="flex items-center gap-2.5 text-white focus:outline-none cursor-pointer group"
          id="nav-logo"
        >
          <div className="relative p-2 rounded-lg bg-zinc-950/40 border border-white/10 group-hover:border-violet-500/50 group-hover:bg-violet-950/20 transition-all duration-300">
            <Box className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <div className="absolute inset-0 rounded-lg blur-md bg-violet-500/10 group-hover:bg-violet-500/20 transition-all" />
          </div>
          <span className="font-display font-bold tracking-tight text-lg text-zinc-100 group-hover:text-white transition-colors">
            VERTEX<span className="text-violet-500">.3D</span>
          </span>
        </button>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("marketplace")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium font-mono tracking-wider uppercase transition-colors cursor-pointer ${
              currentView === "marketplace" || currentView.startsWith("product:")
                ? "text-violet-400 bg-violet-950/20 border border-violet-500/20"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
            id="nav-marketplace"
          >
            <Grid className="w-4 h-4" />
            Market
          </button>

          {user && (
            <button
              onClick={() => onNavigate("purchases")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                currentView === "purchases"
                  ? "text-violet-400 bg-violet-950/20 border border-violet-500/20"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
              id="nav-purchases"
            >
              <ShoppingBag className="w-4 h-4" />
              Purchases
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                currentView === "admin"
                  ? "text-violet-400 bg-violet-950/20 border border-violet-500/20"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
              id="nav-admin"
            >
              <Shield className="w-4 h-4 text-violet-400 animate-pulse" />
              Studio Admin
            </button>
          )}

          {/* User Section / Dropdown */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/40 border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer text-zinc-300 hover:text-white"
                  id="nav-user-menu"
                >
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-300 font-mono">
                    {user.email?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-mono font-medium max-w-[120px] truncate hidden sm:inline">
                    {user.email === "bitcoinoussama3@gmail.com" ? "Seller" : user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      {/* Overlay to close */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl p-2 z-20"
                      >
                        <div className="px-3 py-2 border-b border-white/5">
                          <p className="text-[10px] font-mono uppercase text-zinc-500">Logged in as</p>
                          <p className="text-xs font-mono font-medium text-zinc-300 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate("purchases");
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                          My Downloads
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onNavigate("admin");
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-violet-400" />
                            Admin Console
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/10 rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-medium tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] cursor-pointer"
                id="nav-login-btn"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
