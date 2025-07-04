// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import LoadingSpinner from './LoadingSpinner';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, showAppModal } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      login(data); // Call the login function from AuthContext
      navigate('/'); // Redirect to home page after successful login
    } catch (error) {
      console.error('Login error:', error);
      showAppModal('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center text-xl"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-gray-700">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline font-semibold">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
