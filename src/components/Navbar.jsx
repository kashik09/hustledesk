import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `transition-colors ${isActive ? "text-amber-400 font-semibold" : "text-stone-300 hover:text-white"}`;

  return (
    <nav className="bg-stone-900 px-4 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="font-bold text-xl text-white">
          HustleDesk
        </NavLink>
        <div className="flex gap-6 text-sm">
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
      </div>
    </nav>
  );
}
