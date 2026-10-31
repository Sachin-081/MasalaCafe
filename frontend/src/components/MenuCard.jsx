import { Minus, Plus } from "lucide-react";
import MenuImage from "./MenuImage";
import { getMenuImage } from "../data/menuData";

export default function MenuCard({ item, category, cartItem, addToCart, increaseQuantity, decreaseQuantity }) {
  const image = getMenuImage(item);

  return (
    <article className="menu-item">
      <div className="menu-item__image-wrap">
        <MenuImage item={item} alt={item.name} className="menu-item-image" />
        <span className="menu-item__category">{category || "Fresh today"}</span>
        {!item.is_available && <span className="menu-item__category menu-item__category--unavailable">Unavailable</span>}
      </div>
      <div className="menu-item-details">
        <h2>{item.name}</h2>
        {item.description && <p>{item.description}</p>}
        <div className="menu-item__bottom">
          <span className="menu-item-price">₹{Number(item.price).toFixed(2)}</span>
          {cartItem ? (
            <div className="menu-quantity-controls" aria-label={`${cartItem.quantity} in cart`}>
              <button onClick={() => decreaseQuantity(item.id)} aria-label={`Remove one ${item.name}`}><Minus size={15} /></button>
              <span>{cartItem.quantity}</span>
              <button onClick={() => increaseQuantity(item.id)} aria-label={`Add one ${item.name}`}><Plus size={15} /></button>
            </div>
          ) : (
            <button
              className="add-to-cart-button"
              onClick={() => addToCart({
                ...item,
                category: item.category_id,
                image: image || "",
                price: Number(item.price),
              })}
              disabled={!item.is_available}
            >
              <Plus size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
