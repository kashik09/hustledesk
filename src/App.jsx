import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Trends from "./pages/Trends";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-stone-800">404</h1>
      <p className="text-stone-500 mt-2">Page not found</p>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <AppLayout>
                <Subscriptions />
              </AppLayout>
            }
          />
          <Route
            path="/trends"
            element={
              <AppLayout>
                <Trends />
              </AppLayout>
            }
          />
          <Route
            path="*"
            element={
              <AppLayout>
                <NotFound />
              </AppLayout>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
