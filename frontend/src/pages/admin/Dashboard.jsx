
export default function AdminDashboard() {
  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>MasalaCafe Admin Dashboard</h1>
      <p>Welcome to the canteen management system.</p>

      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
        <a href="/admin/menu">Menu Management</a>
        <a href="/admin/orders">Orders</a>
        <a href="/admin/inventory">Inventory</a>
        <a href="/admin/analytics">Analytics</a>
        <a href="/kitchen">Kitchen Dashboard</a>
      </div>
    </main>
  );
}
