import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import OrderCard from "../../components/OrderCard";
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
        setError(err.message || "Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <>
      <Navbar />
      <main className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR CANTEEN ACTIVITY</p>
            <h1 className="page-title">My orders</h1>
            <p className="page-subtitle">Your order tokens and updates, all in one place.</p>
          </div>
          <Link to="/" className="button button--outline"><ArrowRight size={16} /> Order again</Link>
        </div>
        {loading && <div className="loading-state"><Clock3 size={22} /> Loading your orders...</div>}
        {error && <p className="alert" role="alert">{error}</p>}
        {!loading && !error && (orders.length ? (
          <div className="orders-grid">
            {orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={25} />
            <h2>Your story starts with a first order</h2>
            <p>Once you place an order, its pickup token and status will appear here.</p>
            <Link to="/" className="button">Explore the menu <ArrowRight size={16} /></Link>
          </div>
        ))}
      </main>
    </>
  );
}
