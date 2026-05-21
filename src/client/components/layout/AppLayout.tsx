import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-bold text-lg text-primary">
            RentReview
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              Search
            </NavLink>
            <NavLink
              to="/rankings/tenants"
              className={({ isActive }) =>
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              Rankings
            </NavLink>
            <NavLink
              to="/write-review"
              className={({ isActive }) =>
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              Write a Review
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/my-properties"
                  className={({ isActive }) =>
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'
                  }
                >
                  My Properties
                </NavLink>
                <NavLink
                  to={`/users/${user.id}`}
                  className={({ isActive }) =>
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'
                  }
                >
                  {user.name}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log out
                </button>
              </>
            )}
          </nav>
          {/* Mobile: just show username + logout */}
          <div className="flex md:hidden items-center gap-3 text-sm">
            {user && (
              <>
                <Link to={`/users/${user.id}`} className="text-muted-foreground">
                  {user.name}
                </Link>
                <button onClick={handleLogout} className="text-muted-foreground">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
