import { useRef, useState } from "react";
import { ArrowRight, Check, ClipboardList, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import CartItem from "../../components/CartItem";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const submitting = useRef(false);

  async function placeOrder() {
    if (submitting.current) return;
    if (!cartItems.length) {
      setError("Your cart is empty. Add items before placing an order.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const createdOrder = await api.post("/api/orders/", {
        items: cartItems.map((item) => ({ menu_item_id: item.id, quantity: item.quantity })),
      });
      const names = Object.fromEntries(cartItems.map((item) => [item.id, item]));
      setOrder({
        ...createdOrder,
        items: createdOrder.items.map((item) => ({
          ...item,
          name: names[item.menu_item_id]?.name,
          image: names[item.menu_item_id]?.image,
        })),
      });
      clearCart();
    } catch (err) {
      setError(err.message || "Unable to place your order. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="cart-page">
        <header className="cart-header">
          <p className="eyebrow">{order ? "ORDER CONFIRMED" : "ONE LAST LOOK"}</p>
          <h1>{order ? "It's on its way." : "Checkout"}</h1>
          <p className="menu-description">{order ? "Your order is with the canteen team now." : "Review your order and send it to the kitchen."}</p>
        </header>

        {error && <p className="alert" role="alert">{error}</p>}
        {order ? (
          <>
            <section className="checkout-confirmation">
              <span className="status-badge status-badge--ready"><Check size={13} /> Order received</span>
              <div className="checkout-confirmation__token"><span>Pickup token</span> {order.token_number}</div>
              <p>Order #{order.id} · <strong>{order.status}</strong></p>
              <p>Keep this token handy when you collect your order.</p>
            </section>
            <section className="cart-content">
              <div className="cart-items">
                <div className="cart-section-heading"><h2>Order details</h2><span className="order-card__meta">{order.items.length} {order.items.length === 1 ? "item" : "items"}</span></div>
                {order.items.map((item) => <CartItem key={item.id} item={item} readOnly />)}
              </div>
              <aside className="cart-summary">
                <h2>Next up</h2>
                <p className="cart-summary__note">The kitchen will update your order as it is prepared.</p>
                <Link to="/my-orders" className="button">Track in my orders <ArrowRight size={16} /></Link>
              </aside>
            </section>
          </>
        ) : cartItems.length === 0 ? (
          <section className="empty-cart">
            <span className="empty-cart__icon"><ShoppingBagIcon /></span>
            <h2>Your cart is empty</h2>
            <p>Let's find something delicious to order.</p>
            <Link to="/" className="button">Browse the menu <ArrowRight size={16} /></Link>
          </section>
        ) : (
          <section className="cart-content">
            <div className="cart-items">
              <div className="cart-section-heading"><h2>Order items</h2><Link to="/cart" className="text-link">Edit cart</Link></div>
              {cartItems.map((item) => <CartItem key={item.id} item={item} readOnly />)}
            </div>
            <aside className="cart-summary">
              <h2>Payment summary</h2>
              <div className="cart-summary__detail"><span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span><span>₹{cartTotal.toFixed(2)}</span></div>
              <div className="cart-summary__detail"><span>Pickup</span><span className="cart-summary__free">At the canteen</span></div>
              <div className="cart-total"><span>Total</span><strong>₹{cartTotal.toFixed(2)}</strong></div>
              <button className="checkout-button" onClick={placeOrder} disabled={loading || cartItems.length === 0}>
                {loading ? <><Clock3 size={16} /> Placing your order...</> : <>Place your order <ArrowRight size={16} /></>}
              </button>
              <p className="cart-summary__note">You won't be charged until you collect your order.</p>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}

function ShoppingBagIcon() {
  return <ClipboardList size={25} />;
}
