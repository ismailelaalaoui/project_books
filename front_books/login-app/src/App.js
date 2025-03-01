import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register';
import ForgotPassword from './components/Forgetpassword';
import Dashboard from './components/dashbord';
import PrivateRoute from './routes/privatrout';
import './App.css';

function App() {
    return (
       
        <div className="app">
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
}

export default App;