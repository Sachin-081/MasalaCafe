import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Boxes, Clock3, PackageCheck, Save } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

function createDraft(item) {
  return {
    stock_quantity: item.stock_quantity === null ? "" : String(item.stock_quantity),
    low_stock_threshold: item.low_stock_threshold === null ? "" : String(item.low_stock_threshold),
    reason: "",
  };
}

function formatTimestamp(value) {
  return new Date(value).toLocaleString();
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [items, history] = await Promise.all([
        api.get("/api/inventory/"),
        api.get("/api/inventory/movements?limit=50"),
      ]);
      setInventory(items);
      setMovements(history);
      setDrafts(Object.fromEntries(items.map((item) => [item.menu_item_id, createDraft(item)])));
      setError("");
      return true;
    } catch (loadError) {
      setError(loadError.message || "Unable to load inventory.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock_status === "low_stock"),
    [inventory],
  );
  const outOfStockItems = useMemo(
    () => inventory.filter((item) => item.stock_status === "out_of_stock"),
    [inventory],
  );

  function updateDraft(menuItemId, field, value) {
    setDrafts((current) => ({
      ...current,
      [menuItemId]: { ...current[menuItemId], [field]: value },
    }));
  }

  async function saveStock(item) {
    const draft = drafts[item.menu_item_id];
    if (!draft || draft.stock_quantity === "" || draft.low_stock_threshold === "") {
      setError(`Enter stock quantity and low-stock threshold for ${item.name}.`);
      return;
    }
    if (!draft.reason.trim()) {
      setError(`Enter a reason for the stock change to ${item.name}.`);
      return;
    }

    setSavingId(item.menu_item_id);
    setError("");
    setMessage("");
    try {
      await api.put(`/api/inventory/${item.menu_item_id}`, {
        stock_quantity: Number(draft.stock_quantity),
        low_stock_threshold: Number(draft.low_stock_threshold),
        reason: draft.reason.trim(),
      });
      if (await loadData()) {
        setMessage(`${item.name} inventory was updated.`);
      } else {
        setError(`${item.name} was updated, but inventory could not be refreshed. Reload to verify.`);
      }
    } catch (saveError) {
      setError(saveError.message || `Unable to update ${item.name} inventory.`);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Sidebar
      title="Inventory"
      subtitle="Track on-hand menu stock, availability, and every recorded adjustment."
    >
      {error && <p className="alert" role="alert">{error}</p>}
      {message && <p className="alert alert--success" role="status">{message}</p>}

      <section className="inventory-alert-grid" aria-label="Inventory alerts">
        <article className="inventory-alert inventory-alert--low">
          <span className="inventory-alert__icon"><AlertTriangle size={18} /></span>
          <div><strong>{lowStockItems.length} low-stock</strong><span>At or below configured threshold</span></div>
        </article>
        <article className="inventory-alert inventory-alert--empty">
          <span className="inventory-alert__icon"><Boxes size={18} /></span>
          <div><strong>{outOfStockItems.length} out of stock</strong><span>Automatically unavailable to students</span></div>
        </article>
        <article className="inventory-alert inventory-alert--untracked">
          <span className="inventory-alert__icon"><PackageCheck size={18} /></span>
          <div><strong>{inventory.filter((item) => item.stock_status === "untracked").length} not configured</strong><span>Set an initial balance; no stock is assumed</span></div>
        </article>
      </section>

      {outOfStockItems.length > 0 && (
        <p className="inventory-alert-message" role="status">
          <AlertTriangle size={16} />
          Out of stock: {outOfStockItems.map((item) => item.name).join(", ")}.
        </p>
      )}
      {lowStockItems.length > 0 && (
        <p className="inventory-alert-message inventory-alert-message--low" role="status">
          <AlertTriangle size={16} />
          Low stock: {lowStockItems.map((item) => item.name).join(", ")}.
        </p>
      )}

      <section className="panel inventory-panel">
        <div className="panel__header">
          <div>
            <h2>Menu item stock</h2>
            <p className="panel__subtitle">Set an explicit starting quantity and threshold. Every balance change requires a reason.</p>
          </div>
          <span className="table-count">{inventory.length} items</span>
        </div>
        {loading ? (
          <div className="loading-state"><Clock3 size={20} /> Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="empty-state"><Boxes size={24} /><h2>No menu items yet</h2><p>Add menu items before setting up inventory.</p></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table inventory-table">
              <thead>
                <tr><th>Menu item</th><th>On hand</th><th>Low-stock threshold</th><th>Availability</th><th>Stock status</th><th>Reason for adjustment</th><th /></tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const draft = drafts[item.menu_item_id] || createDraft(item);
                  return (
                    <tr key={item.menu_item_id}>
                      <td><strong>{item.name}</strong><span className="table-description">{item.category_name}</span></td>
                      <td>
                        <label className="sr-only" htmlFor={`stock-${item.menu_item_id}`}>Stock quantity for {item.name}</label>
                        <input id={`stock-${item.menu_item_id}`} className="inventory-number-input" type="number" min="0" step="1" value={draft.stock_quantity} onChange={(event) => updateDraft(item.menu_item_id, "stock_quantity", event.target.value)} />
                      </td>
                      <td>
                        <label className="sr-only" htmlFor={`threshold-${item.menu_item_id}`}>Low-stock threshold for {item.name}</label>
                        <input id={`threshold-${item.menu_item_id}`} className="inventory-number-input" type="number" min="0" step="1" value={draft.low_stock_threshold} onChange={(event) => updateDraft(item.menu_item_id, "low_stock_threshold", event.target.value)} />
                      </td>
                      <td><span className={`status-badge status-badge--${item.is_available ? "available" : "unavailable"}`}>{item.is_available ? "Available" : "Unavailable"}</span></td>
                      <td><span className={`inventory-stock-status inventory-stock-status--${item.stock_status}`}>{item.stock_status.replaceAll("_", " ")}</span></td>
                      <td>
                        <label className="sr-only" htmlFor={`reason-${item.menu_item_id}`}>Reason for stock change to {item.name}</label>
                        <input id={`reason-${item.menu_item_id}`} className="inventory-reason-input" type="text" maxLength="255" placeholder="e.g. Morning restock" value={draft.reason} onChange={(event) => updateDraft(item.menu_item_id, "reason", event.target.value)} />
                      </td>
                      <td><button className="button inventory-save-button" type="button" onClick={() => saveStock(item)} disabled={savingId === item.menu_item_id}><Save size={14} />{savingId === item.menu_item_id ? "Saving..." : item.stock_status === "untracked" ? "Set stock" : "Save stock"}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel inventory-history-panel">
        <div className="panel__header"><div><h2>Recent stock movements</h2><p className="panel__subtitle">Recorded stock additions, deductions, and initial balances.</p></div></div>
        {loading ? (
          <div className="loading-state"><Clock3 size={20} /> Loading stock history...</div>
        ) : movements.length === 0 ? (
          <div className="table-empty">Stock movement history will appear after an admin records an initial balance or changes stock.</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Menu item</th><th>Change</th><th>Balance</th><th>Reason</th><th>Recorded</th></tr></thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td><strong>{movement.menu_item_name}</strong></td>
                    <td className={movement.quantity_change < 0 ? "inventory-movement--deduction" : "inventory-movement--addition"}>
                      {movement.quantity_change < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                      {movement.quantity_change > 0 ? "+" : ""}{movement.quantity_change}
                    </td>
                    <td>{movement.quantity_before} → {movement.quantity_after}</td>
                    <td>{movement.reason}</td>
                    <td>{formatTimestamp(movement.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Sidebar>
  );
}
