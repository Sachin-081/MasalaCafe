import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Clock3, RefreshCw } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import OrderCard from "../../components/OrderCard";
import api from "../../services/api";

const filters = ["all", "pending", "preparing", "ready", "completed"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async (initial = false) => {
    try {
      const data = await api.get("/api/orders/kitchen");
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadOrders(true), 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  async function advanceOrder(orderId, status) {
    setUpdatingOrderId(orderId);
    try {
      const updated = await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const visibleOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter);
  const counts = Object.fromEntries(filters.map((status) => [status, status === "all" ? orders.length : orders.filter((order) => order.status === status).length]));

  return (
    <Sidebar
      title="Order management"
      subtitle="Track and update student orders as they move through the canteen."
      actions={<button className="button button--soft" onClick={() => loadOrders()} disabled={loading}><RefreshCw size={15} /> Refresh</button>}
    >
      {error && <p className="alert" role="alert">{error}</p>}
      {loading ? <div className="loading-state"><Clock3 size={22} /> Loading orders...</div> : (
        <>
          <nav className="status-tabs" aria-label="Filter orders">
            {filters.map((status) => (
              <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
                {status === "all" ? "All orders" : status} <span>{counts[status]}</span>
              </button>
            ))}
          </nav>
          {visibleOrders.length ? (
            <div className="orders-grid">
              {visibleOrders.map((order) => <OrderCard key={order.id} order={order} onAdvance={advanceOrder} updating={updatingOrderId === order.id} />)}
            </div>
          ) : (
            <div className="empty-state"><ClipboardList size={25} /><h2>{filter === "all" ? "No orders just yet" : `No ${filter} orders`}</h2><p>Student orders appear here as soon as they're placed.</p></div>
          )}
        </>
      )}
    </Sidebar>
  );
}
