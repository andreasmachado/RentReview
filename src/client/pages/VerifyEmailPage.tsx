import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    fetch(`/api/auth/verify/${token}`, { redirect: 'manual' })
      .then((res) => {
        setStatus(res.ok || res.status === 0 ? 'success' : 'error');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold">Email verified!</h2>
          <p className="text-muted-foreground text-sm">Your account is now active.</p>
          <Link to="/login?verified=true" className="text-primary text-sm hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold">Verification failed</h2>
        <p className="text-muted-foreground text-sm">
          The link may have expired or is invalid.
        </p>
        <Link to="/login" className="text-primary text-sm hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
