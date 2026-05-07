import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-stone-900 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="font-bold text-lg">HustleDesk</div>
        <div className="flex gap-4">
          <NavLink to="/" className="hover:text-amber-400">
            Dashboard
          </NavLink>
          <NavLink to="/subscriptions" className="hover:text-amber-400">
            Subscriptions
          </NavLink>
          <NavLink to="/trends" className="hover:text-amber-400">
            Trends
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
