
import { useEffect, useState } from "react";
import api from "../../services/api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
};

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [menu, categoryData] = await Promise.all([
        api.get("/api/menu/"),
        api.get("/api/categories/"),
      ]);
      setItems(menu);
      setCategories(categoryData);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
      category_id: Number(form.category_id),
    };

    try {
      if (editingId) {
        await api.put(`/api/menu/${editingId}`, payload);
        setMessage("Menu item updated successfully.");
      } else {
        await api.post("/api/menu/", payload);
        setMessage("Menu item added successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category_id: String(item.category_id),
      image_url: item.image_url || "",
    });
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this menu item?")) return;

    try {
      await api.delete(`/api/menu/${id}`);
      setMessage("Menu item deleted.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Menu Management</h1>
      <p>Add, update and remove canteen menu items.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px", maxWidth: "450px" }}>
        <input name="name" placeholder="Item name" value={form.name} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="price" type="number" min="0.01" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required />

        <select name="category_id" value={form.category_id} onChange={handleChange} required>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <input name="image_url" placeholder="Image URL (optional)" value={form.image_url} onChange={handleChange} />

        <button type="submit">{editingId ? "Update Item" : "Add Item"}</button>

        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
            Cancel Edit
          </button>
        )}
      </form>

      <h2 style={{ marginTop: "30px" }}>Existing Menu Items</h2>

      {items.map((item) => (
        <article key={item.id} style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
          <strong>{item.name}</strong> — ₹{Number(item.price).toFixed(2)}
          <p>Category ID: {item.category_id} | {item.is_available ? "Available" : "Unavailable"}</p>
          <button onClick={() => startEdit(item)}>Edit</button>
          <button onClick={() => deleteItem(item.id)} style={{ marginLeft: "8px" }}>Delete</button>
        </article>
      ))}
    </main>
  );
}
