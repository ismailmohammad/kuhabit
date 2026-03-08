import React, { useState } from "react";
import "./LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../api/api";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../../redux/userSlice";

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await api.auth.login(username, password);
            dispatch(setUserInfo(user));
            toast.success("Welcome back!");
            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Log in</h1>
                <form onSubmit={handleLogin} className="auth-form">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                        autoComplete="username"
                    />
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        autoComplete="current-password"
                    />
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Logging in…" : "Log in"}
                    </button>
                </form>
                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Get started</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
