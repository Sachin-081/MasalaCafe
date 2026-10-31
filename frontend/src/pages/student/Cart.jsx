import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import CartItem from "../../components/CartItem";
import { useCart } from "../../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, cartTotal } = useCart();

  return (
    <>
      <Navbar />
      <main className="cart-page">
        <header className="cart-header">
          <p className="eyebrow">YOUR ORDER</p>
          <h1>Your cart</h1>
          <p className="menu-description">A delicious choice. Review your items before checkout.</p>
        </header>

        {cartItems.length === 0 ? (
          <section className="empty-cart">
            <span className="empty-cart__icon"><ShoppingBag size={26} /></span>
            <h2>Your cart is waiting</h2>
            <p>Pick something delicious from the campus menu and it will show up here.</p>
            <Link to="/" className="button">Explore the menu <ArrowRight size={16} /></Link>
          </section>
        ) : (
          <section className="cart-content">
            <div className="cart-items">
              <div className="cart-section-heading">
                <h2>Your selections</h2>
                <Link to="/" className="text-link"><ArrowLeft size={15} /> Add more</Link>
              </div>
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  increaseQuantity={increaseQuantity}
                  decreaseQuantity={decreaseQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Order summary</h2>
              <div className="cart-summary__detail"><span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span><span>₹{cartTotal.toFixed(2)}</span></div>
              <div className="cart-summary__detail"><span>Pickup</span><span className="cart-summary__free">At the canteen</span></div>
              <div className="cart-total"><span>Total</span><strong>₹{cartTotal.toFixed(2)}</strong></div>
              <button className="checkout-button" onClick={() => navigate("/checkout")}>Continue to checkout <ArrowRight size={16} /></button>
              <p className="cart-summary__note">Your total is confirmed when your order is placed.</p>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}
