import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Field from "../molecules/Field";
import ButtonLogin from "../atoms/Buttons/ButtonLogin";
import { useAlert } from '../../hooks/useAlert';
import Alert from '../atoms/Alert';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { alert, showAlert, closeAlert } = useAlert();

    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const result = await login({ username, password });

        if (result.success) {
            window.location.href = '/';
        } else {
            showAlert({
                type: 'error',
                message: result.error || 'Error al iniciar sesión',
                duration: 3500
            });
        }

        setLoading(false);
    };

    return (
        <div className="w-full max-w-sm p-0">
            <Alert
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={closeAlert}
                duration={3000}
            />
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-md rounded-md p-8 flex flex-col items-center border border-blue-100"
                style={{ minWidth: 320 }}
            >
                <h2 className="text-blue-700 text-3xl font-bold font-sans text-center mb-2 tracking-wide drop-shadow-sm select-none">KEEPER</h2>
                <p className="text-gray-500 text-sm mb-6 text-center select-none">Sistema de Inventario</p>
                <div className="flex flex-col gap-5 w-full">
                    <Field
                        id="username"
                        label="Usuario o Email"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ingresa tu usuario o email"
                    />
                    <Field
                        id="password"
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña"
                    />
                    <div className="w-full">
                        <ButtonLogin
                            texto={loading ? "Entrando..." : "Entrar"}
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-400 text-white py-4 rounded-xl text-[16px] font-semibold shadow-md cursor-pointer transition-all duration-300 hover:bg-blue-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;