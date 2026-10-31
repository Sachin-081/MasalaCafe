import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChefHat, CircleDot, Clock3, LogOut, RefreshCw, UtensilsCrossed } from "lucide-react";
import OrderCard from "../../components/OrderCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const kitchenStatuses = [
  { key: "pending", label: "New orders", icon: CircleDot },
  { key: "preparing", label: "On the stove", icon: ChefHat },
  { key: "ready", label: "Ready to collect", icon: Check },
];

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const updatingRef = useRef(null);
  const { logout } = useAuth();

  const loadOrders = useCallback(async (initial = false) => {
    try {
      const data = await api.get("/api/orders/kitchen");
      setOrders((current) => data.map((order) => (
        order.id === updatingRef.current
          ? current.find((item) => item.id === order.id) || order
          : order
      )));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load kitchen orders.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(() => loadOrders(true), 0);
    const refresh = window.setInterval(() => loadOrders(), 15000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(refresh);
    };
  }, [loadOrders]);

  async function advanceOrder(orderId, status) {
    updatingRef.current = orderId;
    setUpdatingOrderId(orderId);
    setError("");
    try {
      const updated = await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
    } catch (err) {
      setError(err.message || "Unable to update this order.");
    } finally {
      updatingRef.current = null;
      setUpdatingOrderId(null);
    }
  }

  const completedOrders = orders.filter((order) => order.status === "completed");

  return (
    <main className="kitchen-page">
      <header className="kitchen-header">
        <div className="kitchen-header__brand">
          <span className="kitchen-header__mark"><UtensilsCrossed size={22} /></span>
          <div><h1>Kitchen display</h1><p>MasalaCafe · Live order board</p></div>
        </div>
        <div className="kitchen-header__actions">
          <span className="order-card__meta"><Clock3 size={14} /> Refreshes every 15 seconds</span>
          <button className="button button--soft" onClick={() => loadOrders()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button className="icon-button" onClick={logout} aria-label="Log out"><LogOut size={17} /></button>
        </div>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}
      {loading ? (
        <div className="loading-state"><Clock3 size={22} /> Checking for orders...</div>
      ) : (
        <>
          <section className="kitchen-columns" aria-label="Active orders">
            {kitchenStatuses.map(({ key, label, icon: Icon }) => {
              const statusOrders = orders.filter((order) => order.status === key);
              return (
                <section className="kitchen-column" key={key}>
                  <div className="kitchen-column__heading">
                    <h2><Icon size={17} /> {label}</h2>
                    <span className="kitchen-column__count">{statusOrders.length}</span>
                  </div>
                  {statusOrders.length ? statusOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={advanceOrder}
                      updating={updatingOrderId === order.id}
                    />
                  )) : <p className="kitchen-column__empty">No orders here right now.</p>}
                </section>
              );
            })}
          </section>

          {completedOrders.length > 0 && (
            <section className="history-list">
              <h2>Recently completed</h2>
              <div className="orders-grid">
                {completedOrders.slice(0, 6).map((order) => <OrderCard key={order.id} order={order} />)}
              </div>
            </section>
          )}
          {orders.length === 0 && (
            <div className="empty-state kitchen-empty">
              <ChefHat size={27} />
              <h2>All caught up</h2>
              <p>New student orders will appear on this board automatically.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
