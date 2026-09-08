import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Layout() {
  return (
    <div className="flex h-screen bg-page-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute top-6 right-8 z-50">
          <ThemeToggle />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
