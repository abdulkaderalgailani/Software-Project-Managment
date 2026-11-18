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
import { ThemeToggle } from '../ui/ThemeToggle';

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
    <aside className="w-64 bg-navy text-white h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight"><span className="text-brand">Reset</span> <span className="text-white">Tracker</span></h1>
      </div>
      <nav className="flex-1 px-5 flex flex-col gap-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand text-white'
                  : 'bg-white/5 border border-white/5 text-[#8595BD] hover:text-white hover:bg-white/10'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-5 border-t border-white/10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand text-white'
                  : 'bg-white/5 border border-white/5 text-[#8595BD] hover:text-white hover:bg-white/10'
              }`
            }
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>

          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-white/5 border border-white/5 text-[#8595BD] hover:text-white hover:bg-white/10 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
        
        {profile && (
          <div className="mt-2 px-3 py-2 bg-surface/5 rounded-xl">
            <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-white/60 capitalize">{profile.role}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
