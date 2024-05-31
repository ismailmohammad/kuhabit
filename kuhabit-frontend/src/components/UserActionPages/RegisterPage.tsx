import { useState } from "react";
import Header from "../Header";
import { useNavigate } from "react-router-dom";


const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === "a@b.com" && password === confirmPassword) {
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
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <button className="form-button" type="submit">Register</button>
                </form>
            </div>
        </>
    );
}

export default RegisterPage;