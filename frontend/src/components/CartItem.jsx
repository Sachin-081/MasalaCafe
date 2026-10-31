import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({ item, increaseQuantity, decreaseQuantity, removeFromCart, readOnly = false }) {
  return (
    <article className="cart-item">
      {item.image && <img src={item.image} alt={item.name || `Menu item ${item.menu_item_id}`} />}
      <div className="cart-item-details">
        <h2>{item.name || `Menu item #${item.menu_item_id}`}</h2>
        <p>₹{Number(item.price ?? item.unit_price).toFixed(2)} per item</p>
        {!readOnly && (
          <div className="quantity-controls">
            <button onClick={() => decreaseQuantity(item.id)} aria-label={`Decrease ${item.name}`}><Minus size={15} /></button>
            <span>{item.quantity}</span>
            <button onClick={() => increaseQuantity(item.id)} aria-label={`Increase ${item.name}`}><Plus size={15} /></button>
          </div>
        )}
        {readOnly && <p>Quantity: {item.quantity}</p>}
      </div>
      <div className="cart-item-actions">
        <strong>₹{Number(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}</strong>
        {!readOnly && (
          <button className="remove-item-button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
    </article>
  );
}
