
import React from "react";
import LoginForm from "../components/organisms/LoginForm";
import ParticlesBackground from "../components/atoms/ParticlesBackground";


const Login = () => {
    return (
        <div className="min-h-screen relative flex items-center justify-center font-sans" style={{ background: 'transparent' }}>
            <ParticlesBackground />
            <div style={{ position: 'relative', zIndex: 1 }}>
                <LoginForm/>
            </div>
        </div>
    );
};

export default Login;