import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';

/** Renders its child only when there is a live session. */
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="nb-center">Checking your session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
