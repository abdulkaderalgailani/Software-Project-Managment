import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  Users, 
  Activity, 
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/progress', icon: CheckSquare, label: 'Daily Progress' },
  { to: '/tasks', icon: FileText, label: 'Tasks' },
  { to: '/reports', icon: FileText, label: 'Weekly Reports' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/logs', icon: Activity, label: 'Activity Log' },
];

export function Sidebar() {
  const { profile } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="w-64 bg-white border-r border-border h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-ink">Intern Tracker</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border-l-2 border-brand-500'
                  : 'text-muted hover:text-ink hover:bg-surface'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border flex flex-col gap-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700 border-l-2 border-brand-500'
                : 'text-muted hover:text-ink hover:bg-surface'
            }`
          }
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </NavLink>
        
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-muted hover:text-ink hover:bg-surface w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
        
        {profile && (
          <div className="mt-2 px-3 py-2 bg-surface rounded-xl">
            <p className="text-sm font-medium text-ink truncate">{profile.full_name}</p>
            <p className="text-xs text-muted capitalize">{profile.role}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
