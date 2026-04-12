import type { Page } from "../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "library", label: "Library", icon: "🎮" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-100">Achievement Watcher</h1>
        <p className="text-xs text-zinc-500">v2.0.0</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors ${
              currentPage === item.id
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <span>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
