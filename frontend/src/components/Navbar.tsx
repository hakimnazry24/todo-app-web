import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

/** Minutes:seconds left before the 30-minute session expires. */
function useTimeRemaining(expiresAt: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setLabel(null);
      return;
    }

    const render = () => {
      const msLeft = new Date(expiresAt).getTime() - Date.now();
      const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setLabel(`${minutes}:${String(seconds).padStart(2, '0')}`);
    };

    render();
    const interval = window.setInterval(render, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return label;
}

export function Navbar() {
  const { user, expiresAt, logout } = useAuth();
  const remaining = useTimeRemaining(expiresAt);
  const [loggingOut, setLoggingOut] = useState(false);

  const isRunningOut =
    expiresAt !== null && new Date(expiresAt).getTime() - Date.now() < 5 * 60_000;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="nb-nav">
      <div className="nb-nav__brand">
        <span className="nb-logo" aria-hidden="true">
          ✓
        </span>
        <span className="nb-nav__title">ToDo</span>
      </div>

      <div className="nb-nav__user">
        {remaining && (
          <span
            className={`nb-countdown${isRunningOut ? ' nb-countdown--warning' : ''}`}
            title="Time left in this session"
          >
            {remaining}
          </span>
        )}
        {user && <span className="nb-nav__username">@{user.username}</span>}
        <Button variant="primary" small onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out…' : 'Logout'}
        </Button>
      </div>
    </nav>
  );
}
