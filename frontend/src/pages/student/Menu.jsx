
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useCart } from "../../context/CartContext";

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const { addToCart, increaseQuantity, decreaseQuantity, cartItems, cartCount } =
    useCart();

  useEffect(() => {
    async function loadMenu() {
      try {
        const [categoryData, menuData] = await Promise.all([
          api.get("/api/categories/"),
          api.get("/api/menu/"),
        ]);

        setCategories(categoryData);
        setMenuItems(menuData.filter((item) => item.is_available));
      } catch (err) {
        setError(err.message || "Unable to load menu.");
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" ||
        item.category_id === activeCategory;

      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <main className="menu-page">
      <header className="menu-header">
        <p className="menu-eyebrow">MASALACAFE / CAMPUS CANTEEN</p>

        <div className="menu-heading-row">
          <div>
            <h1>Our Menu</h1>
            <p className="menu-description">
              Good food. Simple ordering.
            </p>
          </div>

          <Link to="/cart" className="cart-link">
            Cart ({cartCount})
          </Link>
        </div>
      </header>

      <section className="menu-controls">
        <nav className="category-navigation">
          <button
            className={activeCategory === "all" ? "active" : ""}
            onClick={() => setActiveCategory("all")}
          >
            All items
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={
                activeCategory === category.id ? "active" : ""
              }
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <input
          type="search"
          placeholder="Search the menu..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search menu items"
        />
      </section>

      <section className="menu-results">
        {loading && <p>Loading menu...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <>
            <p>{filteredItems.length} items available in the menu</p>

            <div className="menu-grid">
              {filteredItems.map((item) => {
                const cartItem = cartItems.find(
                  (cartItem) => cartItem.id === item.id
                );

                const category = categories.find(
                  (category) => category.id === item.category_id
                );

                return (
                  <article className="menu-item" key={item.id}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="menu-item-image"
                      />
                    ) : (
                      <div className="menu-item-image menu-image-placeholder">
                        {item.name}
                      </div>
                    )}

                    <div className="menu-item-details">
                      <h2>{item.name}</h2>
                      <p>{category?.name || "Menu item"}</p>
                      <p className="menu-item-price">
                        ₹{Number(item.price).toFixed(2)}
                      </p>

                      {cartItem ? (
                        <div className="menu-quantity-controls">
                          <button onClick={() => decreaseQuantity(item.id)}>
                            −
                          </button>
                          <span>{cartItem.quantity}</span>
                          <button onClick={() => increaseQuantity(item.id)}>
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add-to-cart-button"
                          onClick={() => addToCart({
                            ...item,
                            category: item.category_id,
                            image: item.image_url,
                            price: Number(item.price),
                          })}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <p>No matching items found.</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
