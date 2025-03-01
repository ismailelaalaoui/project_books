import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/forgot-password`, { email });
            setMessage('Password reset link sent to your email.');
        } catch (err) {
            setMessage('Failed to send password reset link.');
        }
    };

    return (
        <div className="forgot-password-container">
            <form onSubmit={handleSubmit} className="forgot-password-form">
                <h2>Forgot Password</h2>
                {message && <p className={message.includes('sent') ? 'success' : 'error'}>{message}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Send Reset Link</button>
                <a href="/login">Back to Login</a>
            </form>
        </div>
    );
};

export default ForgotPassword;