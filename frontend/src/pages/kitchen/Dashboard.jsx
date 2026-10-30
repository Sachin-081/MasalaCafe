
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  async function loadOrders() {
    try {
      const data = await api.get("/api/orders/kitchen");
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 10000);
    return () => clearInterval(timer);
  }, []);

  async function updateStatus(orderId, status) {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  const nextStatus = {
    pending: "preparing",
    preparing: "ready",
    ready: "completed",
  };

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Kitchen Dashboard</h1>
      <p>Manage incoming canteen orders.</p>

      <button onClick={logout}>Logout</button>
      <button onClick={loadOrders} style={{ marginLeft: "10px" }}>
        Refresh
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <p>No orders available.</p>
      )}

      <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
        {orders.map((order) => (
          <article
            key={order.id}
            style={{ border: "1px solid #ddd", padding: "18px", borderRadius: "10px" }}
          >
            <h2>Token: {order.token_number}</h2>
            <p>Order #{order.id}</p>
            <p>Status: <strong>{order.status.toUpperCase()}</strong></p>
            <p>Total: ₹{Number(order.total_amount).toFixed(2)}</p>

            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  Menu item #{item.menu_item_id} × {item.quantity}
                </li>
              ))}
            </ul>

            {nextStatus[order.status] && (
              <button
                onClick={() => updateStatus(order.id, nextStatus[order.status])}
              >
                Mark as {nextStatus[order.status]}
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
