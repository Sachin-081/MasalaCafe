import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Search, Sparkles } from "lucide-react";
import Navbar from "../../components/Navbar";
import MenuCard from "../../components/MenuCard";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart, increaseQuantity, decreaseQuantity, cartItems, cartCount } = useCart();

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
        setError(err.message || "Unable to load the menu.");
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const filteredItems = useMemo(() => menuItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || `${item.name} ${item.description || ""}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }), [menuItems, activeCategory, searchQuery]);

  return (
    <>
      <Navbar />
      <main className="menu-page">
        <section className="menu-hero">
          <div className="menu-hero__content">
            <span className="eyebrow">MASALACAFE · CAMPUS CANTEEN</span>
            <h1>A good meal makes a good day.</h1>
            <p>Freshly prepared campus favorites, just a few taps away. Find your next canteen classic.</p>
            <div className="menu-hero__action">
              <Link to="/cart" className="button">View your cart <ArrowRight size={16} /></Link>
              <span className="menu-hero__note"><Clock3 size={15} /> Made fresh on campus</span>
            </div>
          </div>
        </section>

        <section aria-label="Browse menu">
          <div className="menu-toolbar">
            <nav className="category-navigation" aria-label="Menu categories">
              <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>Everything</button>
              {categories.map((category) => (
                <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>
                  {category.name}
                </button>
              ))}
            </nav>
            <label className="search-box menu-toolbar__search">
              <Search size={17} />
              <input type="search" placeholder="Find something tasty..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search menu" />
            </label>
          </div>

          {loading && <div className="loading-state"><Clock3 size={22} /> Bringing up the menu...</div>}
          {error && <p className="alert" role="alert">{error}</p>}
          {!loading && !error && (
            <>
              <div className="menu-results__meta">
                <span>{filteredItems.length} delicious {filteredItems.length === 1 ? "option" : "options"}</span>
                <span><Sparkles size={14} /> Freshly made for you</span>
              </div>
              {filteredItems.length ? (
                <div className="menu-grid">
                  {filteredItems.map((item) => {
                    const category = categories.find((entry) => entry.id === item.category_id);
                    return (
                      <MenuCard
                        key={item.id}
                        item={item}
                        category={category?.name}
                        cartItem={cartItems.find((cartItem) => cartItem.id === item.id)}
                        addToCart={addToCart}
                        increaseQuantity={increaseQuantity}
                        decreaseQuantity={decreaseQuantity}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state"><Search size={22} /><h2>Nothing on the menu just yet</h2><p>Try a different search or category.</p></div>
              )}
            </>
          )}
        </section>

        {cartCount > 0 && (
          <Link to="/cart" className="floating-cart-link">
            <span><strong>{cartCount}</strong> {cartCount === 1 ? "item" : "items"} in your cart</span>
            <span>View cart <ArrowRight size={16} /></span>
          </Link>
        )}
      </main>
    </>
  );
}
