import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/LoginForm';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function Login() {
  return (
    <div className="min-h-screen bg-page-bg relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="max-w-6xl mx-auto px-6 min-h-screen flex items-center justify-center">
        <div className="bg-surface p-8 rounded-xl shadow-md border border-border w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            <span className="text-[#F26722]">Reset</span> <span className="text-slate-900 dark:text-white">Tracker</span>
          </h2>
          <LoginForm />
          <div className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand hover:opacity-90 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
