import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitPullRequest, BookOpen, Settings, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: GitPullRequest, label: 'Pipeline' },
  { to: '/prompts', icon: BookOpen, label: 'Prompt Library' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const engineStatus = useStore((s) => s.engineStatus);
  const terminalOpen = useStore((s) => s.terminalOpen);
  const setTerminalOpen = useStore((s) => s.setTerminalOpen);

  const statusColor = engineStatus === 'ready' ? 'bg-success' : engineStatus === 'analyzing' ? 'bg-warning animate-pulse' : 'bg-danger';
  const statusText = engineStatus === 'ready' ? 'Engine ready' : engineStatus === 'analyzing' ? 'Analyzing...' : 'Error';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-white/[0.07] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.07]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight">Superman</span>
          <span className="text-sm font-light text-muted ml-1">IDE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-0.5
              ${isActive
                ? 'bg-cyan/[0.04] text-cyan border-l-[3px] border-l-cyan -ml-[3px] pl-[15px]'
                : 'text-muted hover:text-white hover:bg-white/[0.03]'
              }
            `}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Engine status — click to toggle terminal */}
      <button
        onClick={() => setTerminalOpen(!terminalOpen)}
        className="w-full px-5 py-4 border-t border-white/[0.07] hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-muted">{statusText}</span>
        </div>
      </button>
    </aside>
  );
}
