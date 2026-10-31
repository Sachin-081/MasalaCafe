import { Boxes, CircleHelp } from "lucide-react";
import Sidebar from "../../components/Sidebar";

export default function Inventory() {
  return (
    <Sidebar title="Inventory" subtitle="A clear view of canteen stock, when inventory tracking is connected.">
      <section className="feature-unavailable" role="status">
        <CircleHelp size={20} />
        <div>
          <h2>Inventory tracking isn't connected yet</h2>
          <p>The current backend has no inventory model or inventory API, so stock levels and adjustments cannot be shown here. Menu availability remains manageable from Menu Management.</p>
        </div>
      </section>
      <section className="inventory-preview panel">
        <div className="panel__header"><h2><Boxes size={18} /> What will be available here</h2></div>
        <div className="panel__body inventory-preview__items">
          <span>Ingredient and item stock</span><span>Low-stock alerts</span><span>Stock adjustments</span>
        </div>
      </section>
    </Sidebar>
  );
}
