import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, login, notice, clearNotice } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/tasks" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    clearNotice();
    setSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nb-auth">
      <div className="nb-auth__panel">
        <header className="nb-auth__header">
          <p className="nb-auth__eyebrow">ToDo</p>
          <h1 className="nb-auth__title">Log in</h1>
        </header>

        <div className="nb-auth__body">
          {notice && <Banner tone="info">{notice}</Banner>}
          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="your-username"
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <Button
              type="submit"
              variant="primary"
              block
              disabled={submitting || !username.trim() || !password}
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
        </div>

        <footer className="nb-auth__footer">
          No account yet?{' '}
          <Link className="nb-link" to="/signup">
            Sign up
          </Link>
        </footer>
      </div>
    </div>
  );
}
