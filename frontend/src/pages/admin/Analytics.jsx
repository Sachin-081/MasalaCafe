import { BarChart3, CircleHelp } from "lucide-react";
import Sidebar from "../../components/Sidebar";

export default function Analytics() {
  return (
    <Sidebar title="Analytics" subtitle="Understand canteen performance when reporting is available.">
      <section className="feature-unavailable" role="status">
        <CircleHelp size={20} />
        <div>
          <h2>Analytics reporting isn't connected yet</h2>
          <p>The current backend does not expose analytics endpoints, so sales trends and performance reports are not available. The overview dashboard shows basic totals from the existing order API.</p>
        </div>
      </section>
      <section className="analytics-preview panel">
        <div className="panel__header"><h2><BarChart3 size={18} /> Reports planned for this workspace</h2></div>
        <div className="panel__body inventory-preview__items">
          <span>Popular menu items</span><span>Sales over time</span><span>Order volume and status</span>
        </div>
      </section>
    </Sidebar>
  );
}
