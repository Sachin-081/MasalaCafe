import { LogOut, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function StaffDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="staff-page">
      <section className="staff-card">
        <span className="brand-mark__icon"><UtensilsCrossed size={21} /></span>
        <p className="eyebrow">MASALACAFE · CAMPUS CANTEEN</p>
        <h1>Welcome{user?.name ? `, ${user.name}` : ""}.</h1>
        <p className="page-subtitle">A dedicated staff workspace is not configured yet. Contact your administrator for access to the kitchen or management tools.</p>
        <button className="button button--outline" onClick={logout}><LogOut size={16} /> Sign out</button>
      </section>
    </main>
  );
}
