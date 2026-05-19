import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `transition-colors ${isActive ? "text-amber-400 font-semibold" : "text-stone-300 hover:text-white"}`;

  const mobileLinkClass = ({ isActive }) =>
    `block py-2 ${isActive ? "text-amber-400 font-semibold" : "text-stone-300"}`;

  return (
    <nav className="bg-stone-900 px-4 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="font-bold text-xl text-white">
          HustleDesk
        </NavLink>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/subscriptions" className={linkClass}>
            Subscriptions
          </NavLink>
          <NavLink to="/trends" className={linkClass}>
            Trends
          </NavLink>

          {/* Auth section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-stone-700">
              <NotificationBell />
              <span className="text-stone-400 text-xs truncate max-w-[150px]">
                {user?.name || user?.email?.split("@")[0]}
              </span>
              <button
                onClick={logout}
                className="text-stone-400 hover:text-white transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-stone-300 hover:text-white transition-colors ml-4"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-4 pb-2 border-t border-stone-700 pt-4">
          <NavLink
            to="/"
            className={mobileLinkClass}
            end
            onClick={() => setOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/subscriptions"
            className={mobileLinkClass}
            onClick={() => setOpen(false)}
          >
            Subscriptions
          </NavLink>
          <NavLink
            to="/trends"
            className={mobileLinkClass}
            onClick={() => setOpen(false)}
          >
            Trends
          </NavLink>

          {/* Auth section mobile */}
          {isAuthenticated ? (
            <div className="mt-4 pt-4 border-t border-stone-700">
              <p className="text-stone-400 text-xs truncate mb-2">
                {user?.email}
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="text-stone-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block py-2 text-stone-300 mt-4 pt-4 border-t border-stone-700"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
