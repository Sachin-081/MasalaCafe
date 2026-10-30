
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      const data = await api.get("/api/orders/kitchen");
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Order Management</h1>
      <button onClick={loadOrders}>Refresh Orders</button>

      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>No orders found.</p>
      )}

      {orders.map((order) => (
        <article
          key={order.id}
          style={{ borderBottom: "1px solid #ddd", padding: "16px" }}
        >
          <h2>Token: {order.token_number}</h2>
          <p>Order ID: {order.id}</p>
          <p>Status: <strong>{order.status.toUpperCase()}</strong></p>
          <p>Total: ₹{Number(order.total_amount).toFixed(2)}</p>

          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                Menu item #{item.menu_item_id} × {item.quantity}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
