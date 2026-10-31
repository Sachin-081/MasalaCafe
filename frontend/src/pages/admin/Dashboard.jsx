import { useEffect, useState } from "react";
import { ArrowRight, Boxes, ChartNoAxesCombined, ClipboardList, Clock3, CookingPot, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import OrderCard from "../../components/OrderCard";
import api from "../../services/api";

const quickLinks = [
  { to: "/admin/menu", title: "Menu management", description: "Update dishes, prices and availability.", icon: UtensilsCrossed },
  { to: "/admin/orders", title: "Order management", description: "Review incoming student orders.", icon: ClipboardList },
  { to: "/admin/inventory", title: "Inventory", description: "Track stock, restocks and low-stock alerts.", icon: Boxes },
  { to: "/admin/analytics", title: "Analytics", description: "Review completed sales and best-selling items.", icon: ChartNoAxesCombined },
];

function StatCard({ label, value, icon: Icon, detail }) {
  return (
    <article className="stat-card">
      <div><span className="stat-card__label">{label}</span><div className="stat-card__value">{value}</div><span className="stat-card__label">{detail}</span></div>
      <span className="stat-card__icon"><Icon size={19} /></span>
    </article>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ menu: 0, categories: 0, orders: [], revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [menu, categories, orders] = await Promise.all([
          api.get("/api/menu/"),
          api.get("/api/categories/"),
          api.get("/api/orders/kitchen"),
        ]);
        const today = new Date().toDateString();
        const todaysOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today);
        setStats({
          menu: menu.length,
          categories: categories.length,
          orders,
          revenue: todaysOrders.reduce((total, order) => total + Number(order.total_amount), 0),
        });
      } catch (err) {
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <Sidebar title="Overview" subtitle="A clear picture of today's canteen activity.">
      {error && <p className="alert" role="alert">{error}</p>}
      {loading ? <div className="loading-state"><Clock3 size={22} /> Loading overview...</div> : (
        <>
          <section className="stat-grid" aria-label="Canteen statistics">
            <StatCard label="Today's orders" value={stats.orders.filter((order) => new Date(order.created_at).toDateString() === new Date().toDateString()).length} icon={ClipboardList} detail="Orders placed today" />
            <StatCard label="Menu items" value={stats.menu} icon={UtensilsCrossed} detail={`${stats.categories} categories`} />
            <StatCard label="Active orders" value={stats.orders.filter((order) => order.status !== "completed").length} icon={CookingPot} detail="Awaiting pickup or prep" />
            <StatCard label="Today's sales" value={`₹${stats.revenue.toFixed(2)}`} icon={ChartNoAxesCombined} detail="Based on today's orders" />
          </section>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel__header"><h2>Latest orders</h2><Link to="/admin/orders" className="text-link">All orders <ArrowRight size={14} /></Link></div>
              <div className="panel__body">
                {stats.orders.length ? (
                  <div className="orders-grid">
                    {stats.orders.slice(0, 4).map((order) => <OrderCard key={order.id} order={order} />)}
                  </div>
                ) : <div className="table-empty">Orders will appear here when students place them.</div>}
              </div>
            </section>
            <section className="panel">
              <div className="panel__header"><h2>Quick access</h2></div>
              <div className="panel__body quick-link-list">
                {quickLinks.map(({ to, title, description, icon: Icon }) => (
                  <Link key={to} to={to} className="quick-link">
                    <span className="quick-link__icon"><Icon size={17} /></span>
                    <span><strong>{title}</strong><small>{description}</small></span>
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </Sidebar>
  );
}
