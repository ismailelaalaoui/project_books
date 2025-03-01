import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; // Google icon from react-icons

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials.');
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to Google OAuth endpoint or handle Google login logic
        window.location.href = 'http://localhost:5000/auth/google'; // Example Google OAuth endpoint
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
                <h2>Login</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>

                {/* Connect with Google Button */}
                <button type="button" className="google-login-button" onClick={handleGoogleLogin}>
                    <FcGoogle size={20} style={{ marginRight: '10px' }} /> Connect with Google
                </button>

                <div className="links">
                    <a href="/forgot-password">Forgot Password?</a>
                    <a href="/register">Register</a>
                </div>
            </form>
        </div>
    );
};

export default Login;