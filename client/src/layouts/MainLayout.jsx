import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

/**
 * MainLayout — wraps all authenticated/app pages with the top navbar.
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
