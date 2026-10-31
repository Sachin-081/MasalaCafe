import { ArrowRight, Check, Clock3 } from "lucide-react";

const nextStatus = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

const statusLabels = {
  pending: "New order",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
};

export default function OrderCard({ order, onAdvance, updating = false, itemNames = {} }) {
  const next = nextStatus[order.status];
  const date = new Date(order.created_at);
  const createdAt = Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className="order-card">
      <div className="order-card__top">
        <div>
          <h2 className="order-card__token">Token {order.token_number}</h2>
          <span className="order-card__meta">Order #{order.id}{createdAt ? ` · ${createdAt}` : ""}</span>
        </div>
        <span className={`status-badge status-badge--${order.status}`}>{statusLabels[order.status] || order.status}</span>
      </div>
      <ul className="order-card__items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>{itemNames[item.menu_item_id] || `Menu item #${item.menu_item_id}`} <strong>× {item.quantity}</strong></span>
            <span>₹{Number(item.subtotal).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="order-card__bottom">
        <span className="order-card__total">₹{Number(order.total_amount).toFixed(2)}</span>
        {next && onAdvance && (
          <button className="button button--soft" onClick={() => onAdvance(order.id, next)} disabled={updating}>
            {updating ? <Clock3 size={15} /> : order.status === "ready" ? <Check size={15} /> : <ArrowRight size={15} />}
            {updating ? "Updating..." : `Mark ${next}`}
          </button>
        )}
      </div>
    </article>
  );
}
