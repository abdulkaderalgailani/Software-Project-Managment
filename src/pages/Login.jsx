import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white p-8 rounded-xl shadow-md border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-ink">Sign In</h2>
        <LoginForm />
        <div className="mt-6 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
