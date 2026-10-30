
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Welcome to MasalaCafe!</h1>
      <p>Hello, {user?.name || "Student"}.</p>
      <p>What would you like to do today?</p>

      <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <Link to="/">Explore Menu</Link>
        <Link to="/cart">My Cart</Link>
        <Link to="/my-orders">My Orders</Link>
      </nav>

      <button onClick={logout} style={{ marginTop: "25px" }}>
        Logout
      </button>
    </main>
  );
}
