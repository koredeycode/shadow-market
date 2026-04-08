import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { CategoryBar } from './CategoryBar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen bg-obsidian text-slate-200 flex flex-col relative">
      <TopBar />
      <div className="fixed top-16 left-0 right-0 z-40">
        <CategoryBar />
      </div>
      <main className="flex-1 p-4 pt-32">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
