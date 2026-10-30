
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.get("/api/orders/");
        setOrders(data);
      } catch (err) {
        setError(err.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>My Orders</h1>
      <Link to="/">← Back to Menu</Link>

      {loading && <p>Loading your orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>You haven't placed any orders yet.</p>
      )}

      {orders.map((order) => (
        <article
          key={order.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "18px",
            marginTop: "16px",
          }}
        >
          <h2>Token: {order.token_number}</h2>
          <p>Order #{order.id}</p>
          <p>Status: <strong>{order.status.toUpperCase()}</strong></p>
          <p>Total: ₹{Number(order.total_amount).toFixed(2)}</p>

          <h3>Items</h3>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                Item #{item.menu_item_id} × {item.quantity}
                — ₹{Number(item.subtotal).toFixed(2)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
