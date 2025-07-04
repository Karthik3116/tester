// frontend/src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import LoadingSpinner from './LoadingSpinner';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showAppModal } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      showAppModal('Registration Successful', `User ${data.username} registered as ${data.role}. You can now log in.`);
      navigate('/login'); // Redirect to login page after successful registration
    } catch (error) {
      console.error('Registration error:', error);
      showAppModal('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-teal-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Register</h2>
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
          <div>
            <label htmlFor="role" className="block text-gray-700 text-lg font-semibold mb-2 text-left">Select Role:</label>
            <select
              id="role"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-800"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-sm text-gray-500 mt-2 text-left">
              Choose 'Admin' only if you intend to create and manage tests.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 flex items-center justify-center text-xl"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-gray-700">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-semibold">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
