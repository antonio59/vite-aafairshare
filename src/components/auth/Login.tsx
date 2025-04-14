import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';

export default function Login() {
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Successful login will trigger the useEffect above
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error messages
      let errorMessage = "Could not sign in with Google.";
      if (error instanceof Error) {
        if (error.message.includes('popup closed')) {
          errorMessage = "Sign-in popup was closed. Please try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">AAFairShare</h1>
        <p className="auth-subtitle">Split expenses fairly and easily.</p>
      </div>

      <div className="auth-card">
        <h2 className="auth-card-title">Welcome Back</h2>
        <p className="auth-card-description">Sign in with your Google account to continue</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          className="google-signin-button" 
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <>
              <div className="loading-spinner"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in with Google</span>
          )}
        </button>
      </div>

      <footer className="auth-footer">
        &copy; {new Date().getFullYear()} AAFairShare. All rights reserved.
      </footer>
    </div>
  );
}