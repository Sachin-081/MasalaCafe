import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, LogOut, Menu as MenuIcon, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="student-nav">
      <Link to="/" className="brand-mark" aria-label="MasalaCafe home" onClick={closeMenu}>
        <span className="brand-mark__icon"><UtensilsCrossed size={19} /></span>
        <span className="brand-mark__name">Masala<span>Cafe</span></span>
      </Link>

      <nav className={`student-nav__links${menuOpen ? " is-open" : ""}`} aria-label="Student navigation">
        <NavLink to="/" end className={({ isActive }) => `student-nav__link${isActive ? " active" : ""}`} onClick={closeMenu}>
          <UtensilsCrossed size={16} /> Menu
        </NavLink>
        <NavLink to="/my-orders" className={({ isActive }) => `student-nav__link${isActive ? " active" : ""}`} onClick={closeMenu}>
          <ArrowUpRight size={16} /> My orders
        </NavLink>
      </nav>

      <div className="student-nav__actions">
        <span className="student-nav__user">
          <span className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || "S"}</span>
          {user?.name || "Student"}
        </span>
        <Link to="/cart" className="icon-button cart-button" aria-label={`Cart with ${cartCount} items`}>
          <ShoppingBag size={18} />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
        <button className="icon-button" onClick={logout} aria-label="Log out" title="Log out">
          <LogOut size={17} />
        </button>
        <button
          className="icon-button mobile-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>
    </header>
  );
}
