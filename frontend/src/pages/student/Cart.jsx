
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartTotal,
  } = useCart()

  return (
    <main className="cart-page">
      <header className="cart-header">
        <p className="menu-eyebrow">MASALACAFE / YOUR ORDER</p>
        <h1>Your Cart</h1>
        <p className="menu-description">
          Review your selected items.
        </p>
      </header>

      {cartItems.length === 0 ? (
        <section className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add something delicious from our menu.</p>
          <Link to="/">Explore Menu</Link>
        </section>
      ) : (
        <section className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div className="cart-item-details">
                  <h2>{item.name}</h2>
                  <p>₹{item.price} per item</p>

                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item.id)}>
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <strong>
                    ₹{item.price * item.quantity}
                  </strong>

                  <button
                    className="remove-item-button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-total">
              <span>Total</span>
              <strong>₹{cartTotal}</strong>
            </div>

            <button
              className="checkout-button"
              onClick={() => alert('Checkout will be available soon!')}
            >
              Proceed to Checkout
            </button>
          </aside>
        </section>
      )}
    </main>
  )
}

export default Cart
