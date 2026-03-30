"use client";
import { ViewType } from "@/types";

const navItems: { id: ViewType; icon: string; label: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "workbench", icon: "terminal", label: "Query Workbench" },
  { id: "comparison", icon: "compare_arrows", label: "Comparison View" },
  { id: "configuration", icon: "settings_input_component", label: "Configuration" },
];

const bottomItems = [
  { icon: "menu_book", label: "Documentation" },
  { icon: "support_agent", label: "Support" },
];

export default function Sidebar({
  activeView,
  setActiveView,
}: {
  activeView: ViewType;
  setActiveView: (v: ViewType) => void;
}) {
  return (
    <aside
      className="w-[240px] flex flex-col h-screen shrink-0"
      style={{ background: "var(--surface-container-low)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--primary-cyan), var(--primary-cyan-dim))" }}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ color: "var(--primary-foreground)" }}>bolt</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--on-surface)" }}>
            InsightRush
          </h1>
          <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "var(--on-surface-variant)" }}>
            AQP Engine
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mx-4 mb-4 px-3 py-2 flex items-center gap-2" style={{ background: "var(--surface-container)" }}>
        <div className="pulse-indicator-green" />
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--tertiary-green)" }}>
          System Operational
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`sidebar-nav-item ${activeView === item.id ? "active" : ""}`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-2 pb-4 flex flex-col gap-0.5">
        {bottomItems.map((item) => (
          <div key={item.label} className="sidebar-nav-item">
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--surface-container-lowest)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--tertiary-green)" }}>Online</span>
        </div>
      </div>
    </aside>
  );
}
