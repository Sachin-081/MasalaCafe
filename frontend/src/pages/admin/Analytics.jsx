import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Clock3, IndianRupee, ShoppingBag, TrendingUp } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

function dateInputValue(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function SummaryCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="stat-card">
      <div><span className="stat-card__label">{label}</span><div className="stat-card__value">{value}</div><span className="stat-card__label">{detail}</span></div>
      <span className="stat-card__icon"><Icon size={19} /></span>
    </article>
  );
}

export default function Analytics() {
  const [initialRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return {
      startDate: dateInputValue(thirtyDaysAgo),
      endDate: dateInputValue(today),
    };
  });
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (range) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        start_date: range.startDate,
        end_date: range.endDate,
      });
      const response = await api.get(`/api/analytics/?${params.toString()}`);
      setAnalytics(response);
      setAppliedRange(range);
    } catch (loadError) {
      setError(loadError.message || "Unable to load sales analytics.");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadAnalytics(initialRange), 0);
    return () => window.clearTimeout(timer);
  }, [initialRange, loadAnalytics]);

  function applyDateRange(event) {
    event.preventDefault();
    if (!startDate || !endDate) {
      setError("Choose both a start date and an end date.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    loadAnalytics({ startDate, endDate });
  }

  const summary = analytics?.summary;
  const noSales = summary?.completed_order_count === 0;

  return (
    <Sidebar
      title="Analytics"
      subtitle="Sales reports based on completed orders and the prices recorded when each order was placed."
    >
      <form className="analytics-date-filter panel" onSubmit={applyDateRange}>
        <div className="form-field"><label htmlFor="analytics-start">From</label><input id="analytics-start" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} required /></div>
        <div className="form-field"><label htmlFor="analytics-end">To</label><input id="analytics-end" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} required /></div>
        <button className="button" type="submit" disabled={loading}>{loading ? "Updating..." : "Apply date range"}</button>
      </form>

      {error && <p className="alert" role="alert">{error}</p>}
      {loading ? (
        <div className="loading-state"><Clock3 size={22} /> Loading sales reports...</div>
      ) : analytics && (
        <>
          <p className="analytics-range-note">
            {appliedRange.startDate} through {appliedRange.endDate}. {summary.revenue_status_definition}
          </p>
          <section className="stat-grid analytics-stat-grid" aria-label="Sales summary">
            <SummaryCard label="Total revenue" value={currency(summary.total_revenue)} detail="Completed orders only" icon={IndianRupee} />
            <SummaryCard label="Completed orders" value={summary.completed_order_count} detail="Cancelled and unfinished orders excluded" icon={ShoppingBag} />
            <SummaryCard label="Average order value" value={currency(summary.average_order_value)} detail="Revenue ÷ completed orders" icon={TrendingUp} />
          </section>

          {noSales && <div className="empty-state analytics-empty"><BarChart3 size={24} /><h2>No completed sales in this date range</h2><p>Try a wider date range. Only completed orders count toward reported revenue.</p></div>}

          <section className="analytics-chart-grid">
            <article className="panel analytics-chart-panel">
              <div className="panel__header"><div><h2>Revenue over time</h2><p className="panel__subtitle">Daily revenue from stored order-item prices</p></div></div>
              {analytics.revenue_over_time.length ? (
                <div className="analytics-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenue_over_time} margin={{ top: 12, right: 18, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#e9ece5" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip formatter={(value) => currency(value)} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#173c2e" strokeWidth={3} dot={{ r: 4, fill: "#c85e3c" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="chart-empty">No revenue data for these dates.</div>}
            </article>

            <article className="panel analytics-chart-panel">
              <div className="panel__header"><div><h2>Best-selling menu items</h2><p className="panel__subtitle">Ranked by units sold</p></div></div>
              {analytics.best_selling_items.length ? (
                <div className="analytics-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.best_selling_items.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 4 }}>
                      <CartesianGrid stroke="#e9ece5" strokeDasharray="4 4" />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={94} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="quantity" name="Units sold" fill="#c85e3c" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="chart-empty">No item sales for these dates.</div>}
            </article>
          </section>

          <section className="panel analytics-category-panel">
            <div className="panel__header"><div><h2>Sales by category</h2><p className="panel__subtitle">Revenue is calculated from each order item’s stored unit price × quantity.</p></div></div>
            {analytics.sales_by_category.length ? (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Units sold</th><th>Revenue</th></tr></thead>
                  <tbody>{analytics.sales_by_category.map((category) => <tr key={category.category_id}><td><strong>{category.name}</strong></td><td>{category.quantity}</td><td>{currency(category.revenue)}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <div className="table-empty">No category sales for these dates.</div>}
          </section>
        </>
      )}
    </Sidebar>
  );
}
