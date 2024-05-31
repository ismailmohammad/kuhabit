import React, { useState } from "react";
import Header from "../Header";
import "./LoginPage.css";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === "a@b.com" && password === "password") {
            navigate("/dashboard")
        }
    }

    return (
        <>
            <Header staticHeader={true}></Header>
            <div className="login-form ">
                <form onSubmit={handleLogin}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <Link to="/forgot" className="forgot-password">Forgot your password?</Link>
                    <button className="form-button" type="submit">Login</button>
                </form>
            </div>
        </>
    );
}

export default LoginPage