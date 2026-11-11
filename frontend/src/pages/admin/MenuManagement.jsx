import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import MenuImage from "../../components/MenuImage";
import api from "../../services/api";
import { getMenuImage, menuItems as preloadedItems } from "../../data/menuData";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  is_available: true,
};

const categoryAliases = {
  breakfast: ["breakfast"],
  "main-course": ["main course", "lunch"],
  snacks: ["snacks", "snacks & bakery"],
  "hot-beverages": ["hot beverages", "beverages"],
  "cold-beverages": ["cold beverages", "beverages"],
};

const normalizeMenuName = (name) => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized === "idli" ? "idly" : normalized;
};

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState(null);
  const [showPreloaded, setShowPreloaded] = useState(false);
  const [selectedPreloaded, setSelectedPreloaded] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [addingPreloaded, setAddingPreloaded] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [menu, categoryData] = await Promise.all([api.get("/api/menu/"), api.get("/api/categories/")]);
      setItems(menu);
      setCategories(categoryData);
      setError("");
      return true;
    } catch (err) {
      setError(err.message || "Unable to load menu data.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => items.filter((item) => (
    `${item.name} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase())
  )), [items, search]);

  const preloadedWithStatus = useMemo(() => preloadedItems.map((preloaded) => {
    const categoryName = {
      "breakfast": "Breakfast",
      "main-course": "Main Course",
      "snacks": "Snacks & Bakery",
      "hot-beverages": "Hot Beverages",
      "cold-beverages": "Cold Beverages",
    }[preloaded.category];
    const category = categories.find((entry) => (
      categoryAliases[preloaded.category].includes(entry.name.trim().toLowerCase())
    ));
    const existingItem = items.find((item) => normalizeMenuName(item.name) === normalizeMenuName(preloaded.name));
    const duplicate = Boolean(existingItem?.is_available);
    return {
      ...preloaded,
      categoryName,
      categoryId: selectedCategories[preloaded.id] ?? category?.id,
      existingItem,
      duplicate,
    };
  }), [categories, items, selectedCategories]);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category_id: String(item.category_id),
      image_url: item.image_url || "",
      is_available: item.is_available,
    });
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const duplicate = items.find((item) =>
      normalizeMenuName(item.name) === normalizeMenuName(form.name)
      && item.id !== editingId
    );
    if (duplicate) {
      setError(`“${duplicate.name}” is already active in the menu.`);
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      category_id: Number(form.category_id),
    };
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        await api.put(`/api/menu/${editingId}`, payload);
      } else {
        await api.post("/api/menu/", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      if (await loadData()) {
        setMessage(wasEditing ? "Menu item updated." : "Menu item added.");
      } else {
        setError("The menu item was saved, but the menu could not be refreshed. Reload the page to verify it.");
      }
    } catch (err) {
      setError(err.message || "Unable to save this menu item.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Remove ${item.name} from the active menu? If it has order history, it will be made unavailable so past orders remain intact. The preloaded catalog will remain available.`)) return;
    setDeletingId(item.id);
    setError("");
    setMessage("");
    try {
      const result = await api.delete(`/api/menu/${item.id}`);
      if (await loadData()) {
        setMessage(result.message || `${item.name} was removed from the active menu.`);
      } else {
        setError(`${item.name} was removed, but the menu could not be refreshed. Reload the page to verify it.`);
      }
    } catch (err) {
      setError(err.message || "Unable to delete this menu item.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleAvailability(item) {
    setUpdatingAvailabilityId(item.id);
    setError("");
    setMessage("");
    try {
      await api.put(`/api/menu/${item.id}`, { is_available: !item.is_available });
      if (await loadData()) {
        setMessage(`${item.name} is now ${item.is_available ? "unavailable" : "available"}.`);
      } else {
        setError(`${item.name} was updated, but the menu could not be refreshed. Reload the page to verify it.`);
      }
    } catch (err) {
      setError(err.message || "Unable to update availability.");
    } finally {
      setUpdatingAvailabilityId(null);
    }
  }

  function togglePreloadedSelection(id) {
    setSelectedPreloaded((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  }

  async function addSelectedPreloaded() {
    const selected = preloadedWithStatus.filter((item) =>
      selectedPreloaded.includes(item.id) && (item.existingItem || item.categoryId) && !item.duplicate
    );
    if (!selected.length) return;

    setAddingPreloaded(true);
    setError("");
    setMessage("");
    const added = [];
    const failed = [];

    for (const item of selected) {
      try {
        if (item.existingItem) {
          await api.put(`/api/menu/${item.existingItem.id}`, { is_available: true });
          added.push(`${item.name} restored`);
        } else {
          await api.post("/api/menu/", {
            name: item.name,
            description: null,
            price: item.price,
            category_id: item.categoryId,
            image_url: item.image,
            is_available: true,
          });
          added.push(item.name);
        }
      } catch (err) {
        failed.push(`${item.name}: ${err.message || "Unable to add item"}`);
      }
    }

    const refreshed = await loadData();
    setSelectedPreloaded([]);
    setAddingPreloaded(false);
    if (failed.length) {
      setError([
        added.length ? `Added ${added.length} item${added.length === 1 ? "" : "s"}.` : "",
        ...failed,
      ].filter(Boolean).join(" "));
    } else if (refreshed) {
      setMessage(`Updated ${added.length} preloaded menu item${added.length === 1 ? "" : "s"} in the active menu.`);
    } else {
      setError("Selected catalog items were updated, but the menu could not be refreshed. Reload the page to verify.");
    }
  }

  const selectedAddableCount = preloadedWithStatus.filter((item) =>
    selectedPreloaded.includes(item.id) && (item.existingItem || item.categoryId) && !item.duplicate
  ).length;

  const categoryName = (id) => categories.find((category) => category.id === id)?.name || `Category #${id}`;

  return (
    <Sidebar
      title="Menu management"
      subtitle="Keep your campus menu fresh, accurate and available."
      actions={
        <div className="form-actions menu-management-actions">
          <button className="button button--soft" type="button" onClick={() => setShowPreloaded(true)}><Plus size={16} /> Add Existing Item</button>
          <button className="button" type="button" onClick={startCreate}><Plus size={16} /> Add New Menu Item</button>
        </div>
      }
    >
      {error && <p className="alert" role="alert">{error}</p>}
      {message && <p className="alert alert--success" role="status"><Check size={16} /> {message}</p>}

      <section className="panel preloaded-panel">
        <div className="panel__header">
          <div>
            <h2>Preloaded menu <span className="table-count">{preloadedItems.length}</span></h2>
            <p className="panel__subtitle">Add items from the existing local menu catalog to your database-backed menu.</p>
          </div>
          <button className="button button--soft" onClick={() => setShowPreloaded((open) => !open)}>
            {showPreloaded ? <X size={15} /> : <Plus size={15} />}
            {showPreloaded ? "Close catalog" : "Choose preloaded items"}
          </button>
        </div>
        {showPreloaded && (
          <>
            <div className="preloaded-list">
              {preloadedWithStatus.map((item) => {
                return (
                  <div className={`preloaded-item${(item.duplicate || addingPreloaded) ? " is-disabled" : ""}`} key={item.id}>
                    <input
                      id={`preloaded-item-${item.id}`}
                      type="checkbox"
                      checked={selectedPreloaded.includes(item.id)}
                      onChange={() => togglePreloadedSelection(item.id)}
                      disabled={item.duplicate || (!item.existingItem && !item.categoryId) || addingPreloaded}
                    />
                    <MenuImage item={item} className="preloaded-item__image" />
                    <span className="preloaded-item__details">
                      <label htmlFor={`preloaded-item-${item.id}`}><strong>{item.name}</strong></label>
                      <small>{item.categoryId ? categoryName(item.categoryId) : "Select a database category"} · ₹{Number(item.price).toFixed(2)}</small>
                      {item.duplicate && <small className="preloaded-item__status">Already active in menu</small>}
                      {!item.duplicate && item.existingItem && <small className="preloaded-item__warning">Unavailable · select to restore</small>}
                      {!item.duplicate && !item.existingItem && (
                        <select
                          className="preloaded-item__category"
                          aria-label={`Database category for ${item.name}`}
                          value={item.categoryId ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSelectedCategories((current) => ({
                              ...current,
                              [item.id]: value ? Number(value) : "",
                            }));
                          }}
                          disabled={addingPreloaded || !categories.length}
                        >
                          <option value="">Choose database category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {!categories.length && (
              <p className="preloaded-warning"><AlertCircle size={15} /> Categories could not be matched. Load or create the required database categories before adding these items.</p>
            )}
            <div className="preloaded-actions">
              <span>{selectedAddableCount} item{selectedAddableCount === 1 ? "" : "s"} selected</span>
              <button className="button" onClick={addSelectedPreloaded} disabled={addingPreloaded || selectedAddableCount === 0}>
                {addingPreloaded ? "Adding items..." : <><Plus size={15} /> Add selected to menu</>}
              </button>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <section className="panel admin-form-panel">
          <div className="panel__header"><h2>{editingId ? "Edit menu item" : "Add a menu item"}</h2><button className="icon-button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={17} /></button></div>
          <div className="panel__body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field"><label htmlFor="item-name">Item name</label><input id="item-name" name="name" value={form.name} onChange={handleChange} required minLength="2" maxLength="150" /></div>
                <div className="form-field"><label htmlFor="item-price">Price (₹)</label><input id="item-price" name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} required /></div>
                <div className="form-field"><label htmlFor="item-category">Category</label><select id="item-category" name="category_id" value={form.category_id} onChange={handleChange} required><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                <div className="form-field">
                  <label htmlFor="item-image">Image URL or public path</label>
                  <input
                    id="item-image"
                    name="image_url"
                    type="text"
                    list="menu-image-options"
                    value={form.image_url}
                    onChange={handleChange}
                    maxLength="500"
                    placeholder="/images/menu/dosa.jpg"
                  />
                  <datalist id="menu-image-options">
                    {preloadedItems.map((item) => (
                      <option key={item.id} value={item.image}>{item.name}</option>
                    ))}
                  </datalist>
                </div>
                <div className="form-field form-field--wide">
                  <label className="availability-field" htmlFor="item-availability">
                    <input id="item-availability" name="is_available" type="checkbox" checked={form.is_available} onChange={(event) => setForm((current) => ({ ...current, is_available: event.target.checked }))} />
                    Available to students
                  </label>
                </div>
                <div className="form-field form-field--wide"><label htmlFor="item-description">Description</label><textarea id="item-description" name="description" value={form.description} onChange={handleChange} placeholder="A short description (optional)" /></div>
              </div>
              {getMenuImage({ name: form.name, image_url: form.image_url }) && (
                <div className="menu-image-preview">
                  <MenuImage key={`${form.name}-${form.image_url}`} item={{ name: form.name, image_url: form.image_url }} className="menu-image-preview__image" alt={`${form.name || "Menu item"} preview`} loading="eager" />
                  <span>Menu image preview</span>
                </div>
              )}
              <div className="form-actions">
                <button className="button" type="submit" disabled={saving}>{saving ? "Saving..." : <><Check size={15} /> {editingId ? "Save changes" : "Add to menu"}</>}</button>
                <button className="button button--soft" type="button" onClick={() => { setFormOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancel</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="panel menu-admin-panel">
        <div className="panel__header">
          <h2>All menu items <span className="table-count">{items.length}</span></h2>
          <label className="search-box menu-admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu..." aria-label="Search menu items" /></label>
        </div>
        <div className="data-table-wrap">
          {loading && <div className="loading-state"><AlertCircle size={18} /> Loading menu items...</div>}
          <table className="data-table menu-admin-table">
            <thead><tr><th>Image</th><th>Dish</th><th>Category</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <MenuImage key={`${item.id}-${item.image_url || item.name}`} item={item} className="menu-table-image" />
                  </td>
                  <td><strong>{item.name}</strong>{item.description && <span className="table-description">{item.description}</span>}</td>
                  <td>{categoryName(item.category_id)}</td>
                  <td>₹{Number(item.price).toFixed(2)}</td>
                  <td><button className={`status-badge status-badge--${item.is_available ? "available" : "unavailable"} availability-toggle`} onClick={() => toggleAvailability(item)} disabled={updatingAvailabilityId === item.id || deletingId === item.id}>{updatingAvailabilityId === item.id ? "Updating..." : item.is_available ? "Available" : "Unavailable"}</button></td>
                  <td><div className="table-actions"><button className="icon-button" onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`} disabled={saving || deletingId === item.id}><Edit3 size={15} /></button><button className="icon-button table-delete" onClick={() => deleteItem(item)} aria-label={`Remove ${item.name} from active menu`} title="Remove from active menu" disabled={deletingId === item.id || saving}>{deletingId === item.id ? "…" : <Trash2 size={15} />}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="menu-admin-cards">
            {filteredItems.map((item) => (
              <article className="menu-admin-card" key={item.id}>
                <div className="menu-admin-card__details">
                  <MenuImage key={`${item.id}-${item.image_url || item.name}`} item={item} className="menu-admin-card__image" />
                  <div className="menu-admin-card__copy">
                    <strong>{item.name}</strong>
                    {item.description && <span>{item.description}</span>}
                  </div>
                </div>
                <div className="menu-admin-card__meta">
                  <span>{categoryName(item.category_id)}</span>
                  <strong>₹{Number(item.price).toFixed(2)}</strong>
                </div>
                <div className="menu-admin-card__actions">
                  <button
                    className={`status-badge status-badge--${item.is_available ? "available" : "unavailable"} availability-toggle`}
                    onClick={() => toggleAvailability(item)}
                    disabled={updatingAvailabilityId === item.id || deletingId === item.id}
                  >
                    {updatingAvailabilityId === item.id ? "Updating..." : item.is_available ? "Available" : "Unavailable"}
                  </button>
                  <div>
                    <button className="button button--soft" onClick={() => startEdit(item)} disabled={saving || deletingId === item.id}>
                      <Edit3 size={15} /> Edit
                    </button>
                    <button
                      className="icon-button table-delete"
                      onClick={() => deleteItem(item)}
                      aria-label={`Remove ${item.name} from active menu`}
                      title="Remove from active menu"
                      disabled={deletingId === item.id || saving}
                    >
                      {deletingId === item.id ? "…" : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!loading && filteredItems.length === 0 && <div className="table-empty">{search ? "No menu items match your search." : "No menu items yet. Add the first dish to get started."}</div>}
        </div>
      </section>
    </Sidebar>
  );
}
