import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiBaseURL } from '../axiosInstance';

export default function Register() {
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
      const response = await apiBaseURL.post("/register", formData);
      const data = response.data;

      if (data.status) {
        navigate('/login');
      }
      else {
        setError(data.message);
      }
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
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-cyan-400/80 text-sm font-medium tracking-wide uppercase">Join our platform today</p>
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
              placeholder="Choose a username"
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
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className={`${btnClasses} mt-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
