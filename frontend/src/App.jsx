// frontend/src/App.jsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from './components/AdminDashboard';
import UserTestPage from './components/UserTestPage';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';
import Login from './components/Login';
import Register from './components/Register';

// Context for Authentication and User Data
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// ProtectedRoute component to guard routes based on authentication and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-lg text-gray-700">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to home or unauthorized page if role not allowed
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // Tracks if initial auth check is done

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const showAppModal = (title, message) => {
    setModalContent({ title, message });
    setShowModal(true);
  };

  // Function to handle login
  const login = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.username);
    localStorage.setItem('userRole', data.role);

    setToken(data.token);
    setUserId(data.userId);
    setUserName(data.username);
    setUserRole(data.role);
    setIsAuthenticated(true);
    showAppModal('Login Successful', `Welcome, ${data.username}!`);
  }, [showAppModal]);

  // Function to handle logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');

    setToken(null);
    setUserId(null);
    setUserName(null);
    setUserRole(null);
    setIsAuthenticated(false);
    showAppModal('Logged Out', 'You have been logged out.');
  }, [showAppModal]);

  // Effect to check for token on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const storedUserRole = localStorage.getItem('userRole');

    if (storedToken && storedUserId && storedUserName && storedUserRole) {
      // In a real app, you'd send this token to the backend to verify its validity
      // For this example, we assume if it's present, it's valid for initial load
      setToken(storedToken);
      setUserId(storedUserId);
      setUserName(storedUserName);
      setUserRole(storedUserRole);
      setIsAuthenticated(true);
    }
    setIsAuthReady(true); // Mark auth check as complete
  }, []);

  // Main application layout and routing
  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, userName, userRole, token, isAuthReady, login, logout, showAppModal }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          {/* Optional: Navigation bar visible when authenticated */}
          {isAuthenticated && (
            <nav className="bg-gray-800 text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">
                  <a href="/">Quiz App</a>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">Logged in as: {userName} ({userRole})</span>
                  {userRole === 'admin' && (
                    <a href="/admin" className="hover:text-blue-300 transition-colors">Admin Panel</a>
                  )}
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          )}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Home Page - Accessible to all */}
            <Route path="/" element={
              <> {/* Added React.Fragment here */}
                <div className="flex flex-col items-center justify-center flex-grow bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
                  <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
                    <h1 className="text-5xl font-extrabold mb-6 text-gray-800">Welcome to Quiz Competition!</h1>
                    {!isAuthenticated ? (
                      <div className="space-y-4">
                        <p className="text-xl text-gray-600 mb-8">Please login or register to continue.</p>
                        <a href="/login" className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 text-xl">
                          Login
                        </a>
                        <a href="/register" className="w-full inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 text-xl">
                          Register
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <p className="text-xl text-gray-600 mb-8">Hello, {userName}! You are logged in as {userRole}.</p>
                         {userRole === 'admin' && (
                            <a href="/admin" className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 text-xl">
                              Go to Admin Panel
                            </a>
                         )}
                         <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                            <p className="text-gray-700 text-lg mb-4">
                              Or, if you have a test link, paste it below:
                            </p>
                            <input
                              type="text"
                              placeholder="Enter Test ID (e.g., 60c72b2f1e2c3d4e5f6a7b8c)"
                              className="w-full p-3 border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-lg"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const id = e.target.value.trim();
                                  if (id) {
                                    window.location.href = `/test/${id}`; // Navigate to test page
                                  } else {
                                    showAppModal('Invalid Input', 'Please enter a valid Test ID.');
                                  }
                                }
                              }}
                            />
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </>  
            } />

            {/* Protected Admin Route */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Protected User Test Route */}
            <Route path="/test/:testId" element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <UserTestPage />
              </ProtectedRoute>
            } />

            {/* Catch-all for undefined routes */}
            <Route path="*" element={
              <div className="flex items-center justify-center flex-grow bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
                  <p className="text-lg text-gray-600 mb-6">The page you are looking for does not exist.</p>
                  <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300">Go to Home</a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
      <Modal
        title={modalContent.title}
        message={modalContent.message}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </AuthContext.Provider>
  );
}

export default App;
