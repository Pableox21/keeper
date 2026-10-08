import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Field from "../molecules/Field";
import ButtonLogin from "../atoms/Buttons/ButtonLogin";

// Traduce la respuesta del servidor a un mensaje claro para el usuario
const getLoginErrorMessage = (message = '') => {
    const text = message.toLowerCase();

    if (text.includes('credenciales')) {
        return 'Usuario o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.';
    }
    if (text.includes('no activo')) {
        return 'Tu usuario está deshabilitado. Contacta al administrador.';
    }
    if (text.includes('failed to fetch') || text.includes('networkerror') || text.includes('load failed')) {
        return 'No se pudo conectar con el servidor. Inténtalo nuevamente en unos minutos.';
    }
    return message || 'Error al iniciar sesión';
};

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

    // Al escribir de nuevo se limpia el mensaje de error
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        if (error) setError('');
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Ingresa tu usuario y tu contraseña.');
            return;
        }

        setLoading(true);

        const result = await login({ username: username.trim(), password });

        if (result.success) {
            window.location.href = '/';
        } else {
            setError(getLoginErrorMessage(result.error));
            setPassword('');
        }

        setLoading(false);
    };

    return (
        <div className="w-full max-w-sm p-0">
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
                        onChange={handleUsernameChange}
                        placeholder="Ingresa tu usuario o email"
                    />
                    <Field
                        id="password"
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Ingresa tu contraseña"
                    />
                    {error && (
                        <div
                            role="alert"
                            className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}
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
