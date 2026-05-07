import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
        <div className="hidden md:flex gap-6 text-sm">
          <NavLink to="/" className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/subscriptions" className={linkClass}>
            Subscriptions
          </NavLink>
          <NavLink to="/trends" className={linkClass}>
            Trends
          </NavLink>
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
          <NavLink to="/" className={mobileLinkClass} end onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/subscriptions" className={mobileLinkClass} onClick={() => setOpen(false)}>
            Subscriptions
          </NavLink>
          <NavLink to="/trends" className={mobileLinkClass} onClick={() => setOpen(false)}>
            Trends
          </NavLink>
        </div>
      )}
    </nav>
  );
}
