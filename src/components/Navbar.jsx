import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      borderBottom: "1px solid #ccc"
    }}>
      <h2>HustleDesk</h2>

      <div>
        {user ? (
          <>
            <span style={{ marginRight: "10px" }}>
              {user.email}
            </span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </div>
  );
}