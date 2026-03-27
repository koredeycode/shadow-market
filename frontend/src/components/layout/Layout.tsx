import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function Layout() {
  return (
    <div className="min-h-screen bg-obsidian text-slate-200 flex flex-col">
      <TopBar />
      <main className="mt-16 p-4 md:p-8 flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
