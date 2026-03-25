import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 text-white bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl transition-all duration-300 placeholder:text-slate-500 shadow-inner";
  const labelClasses = "text-slate-300 text-sm font-semibold ml-1 mb-1 tracking-wide block";
  const btnClasses = "w-full h-12 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center tracking-wide bg-linear-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white border-none shadow-cyan-500/20 hover:shadow-cyan-500/40";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-10 px-5 relative z-10 w-full">
      <div className="w-full max-w-sm flex flex-col gap-6 p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-cyan-400/80 text-sm font-medium tracking-wide uppercase">Login to continue</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="w-full">
            <label className={labelClasses}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>

          <div className="w-full">
            <label className={labelClasses}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className={`${btnClasses} mt-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
