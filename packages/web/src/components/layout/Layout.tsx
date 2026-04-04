import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { CategoryBar } from './CategoryBar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen bg-obsidian text-slate-200 flex flex-col relative">
      <TopBar />
      <div className="flex-1 flex flex-col pt-16">
        <CategoryBar />
        <main className="flex-1 p-4">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
