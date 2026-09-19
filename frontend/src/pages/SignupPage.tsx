import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const { user, signup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/tasks" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(username.trim(), password, phoneNumber.trim());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    username.trim().length >= 3 &&
    password.length >= 8 &&
    confirm.length > 0 &&
    phoneNumber.trim().length >= 6;

  return (
    <div className="nb-auth">
      <div className="nb-auth__panel">
        <header className="nb-auth__header">
          <p className="nb-auth__eyebrow">ToDo</p>
          <h1 className="nb-auth__title">Sign up</h1>
        </header>

        <div className="nb-auth__body">
          {error && <Banner tone="error">{error}</Banner>}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="your-username"
              hint="At least 3 characters. Letters, numbers, . - _"
              required
            />
            <TextField
              label="Phone number"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              autoComplete="tel"
              placeholder="+60 12-345 6789"
              hint="How we reach you."
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              hint="At least 8 characters."
              required
            />
            <TextField
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            <Button
              type="submit"
              variant="primary"
              block
              disabled={submitting || !canSubmit}
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <footer className="nb-auth__footer">
          Already have an account?{' '}
          <Link className="nb-link" to="/login">
            Log in
          </Link>
        </footer>
      </div>
    </div>
  );
}
