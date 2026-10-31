import { ArrowRight, ClipboardList, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { cartCount } = useCart();

  return (
    <>
      <Navbar />
      <main className="page-content student-dashboard">
        <section className="student-welcome">
          <div>
            <p className="eyebrow">YOUR CAMPUS CANTEEN</p>
            <h1 className="page-title">Hello, {user?.name?.split(" ")[0] || "there"}.</h1>
            <p className="page-subtitle">A little something delicious can make your day. What are you craving?</p>
            <Link to="/" className="button student-welcome__button">Explore today's menu <ArrowRight size={16} /></Link>
          </div>
          <span className="student-welcome__icon"><Sparkles size={34} /></span>
        </section>

        <div className="student-shortcuts">
          <Link to="/" className="student-shortcut">
            <span className="quick-link__icon"><UtensilsCrossed size={19} /></span>
            <div><strong>Browse the menu</strong><small>See what's fresh today</small></div>
            <ArrowRight size={17} />
          </Link>
          <Link to="/cart" className="student-shortcut">
            <span className="quick-link__icon"><ShoppingBag size={19} /></span>
            <div><strong>Your cart</strong><small>{cartCount ? `${cartCount} items ready to go` : "Nothing in your cart yet"}</small></div>
            <ArrowRight size={17} />
          </Link>
          <Link to="/my-orders" className="student-shortcut">
            <span className="quick-link__icon"><ClipboardList size={19} /></span>
            <div><strong>Order history</strong><small>Check your recent orders</small></div>
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    </>
  );
}
