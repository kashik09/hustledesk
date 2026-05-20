import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"];

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [homeCurrency, setHomeCurrency] = useState(user?.home_currency || "KES");
  const [budgetKes, setBudgetKes] = useState(user?.budget_kes || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const data = await api.put("/auth/me", {
        name: name.trim() || null,
        username: username.trim() || null,
        home_currency: homeCurrency,
        budget_kes: budgetKes ? parseFloat(budgetKes) : null,
      });
      updateUser(data.user);
      setProfileSuccess("Profile updated");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put("/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Settings</h1>
        <p className="text-stone-500 mt-1">Manage your account</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">Profile</h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              {profileSuccess}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-stone-50 text-stone-500"
            />
            <p className="text-xs text-stone-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-stone-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              placeholder="your_username"
            />
            <p className="text-xs text-stone-400 mt-1">Lowercase letters, numbers, and underscores only</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-stone-700 mb-1.5">
                Home Currency
              </label>
              <select
                id="currency"
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-stone-700 mb-1.5">
                Monthly Budget (KES)
              </label>
              <input
                id="budget"
                type="number"
                value={budgetKes}
                onChange={(e) => setBudgetKes(e.target.value)}
                min="0"
                step="100"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                placeholder="e.g. 10000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">Change Password</h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              {passwordSuccess}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-stone-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
              >
                <EyeIcon open={showCurrentPassword} />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
              >
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Min 8 characters, include uppercase, lowercase, and a digit
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-stone-800 hover:bg-stone-900 text-white font-medium py-2.5 px-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
