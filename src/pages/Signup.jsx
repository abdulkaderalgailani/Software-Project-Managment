import React from 'react';
import { Link } from 'react-router-dom';
import { SignupForm } from '../features/auth/SignupForm';

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white p-8 rounded-xl shadow-md border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-ink">Sign Up</h2>
        <SignupForm />
        <div className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
