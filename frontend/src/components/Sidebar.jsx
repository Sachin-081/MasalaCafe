import { LayoutDashboard, ClipboardList, CookingPot, ChartNoAxesCombined, Boxes, LogOut, UtensilsCrossed, UserRoundPlus, UserRoundX } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/menu", label: "Menu management", icon: UtensilsCrossed },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/admin/kitchen-users", label: "Kitchen accounts", icon: UserRoundPlus },
  { to: "/admin/account-deletion-requests", label: "Deletion requests", icon: UserRoundX },
  { to: "/kitchen", label: "Kitchen display", icon: CookingPot },
];

export default function Sidebar({ title, subtitle, eyebrow = "Workspace", actions, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link to="/admin" className="brand-mark">
            <span className="brand-mark__icon"><UtensilsCrossed size={19} /></span>
            <span className="brand-mark__name">Masala<span>Cafe</span></span>
          </Link>
        </div>
        <p className="admin-sidebar__section">Management</p>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-sidebar__link${isActive ? " active" : ""}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "A"}</span>
            <div><strong>{user?.name || "Administrator"}</strong><span>{user?.role || "admin"} account</span></div>
          </div>
          <button type="button" className="button button--soft" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__crumb">MasalaCafe <span>/</span> <strong>{title}</strong></div>
          <div className="admin-topbar__right"><span>Campus canteen</span><span className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "A"}</span></div>
        </header>
        <main className="admin-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
