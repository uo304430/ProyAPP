import React, { useState } from 'react';
import axios from 'axios';

const LoginForm = ({ onLoginSuccess, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/login/', {
                email: email,
                password: password,
                role: 'athlete' // El rol aquí es obligatorio por el esquema, pero lo validamos en el endpoint
            });
            
            setMensaje('Inicio de sesión exitoso. Redirigiendo...');
            
            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess(response.data.usuario_id);
                }
            }, 1200);
            
        } catch (err) {
            setError(err.response?.data?.detail || "Error al iniciar sesión");
        }
    };

    return (
        <div style={{
            maxWidth: '400px', 
            margin: '40px auto', 
            padding: '25px', 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #2c2c2c', 
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            color: '#ffffff',
            fontFamily: 'sans-serif'
        }}>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <label>Email:</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#121212', color: '#fff' }}
                />

                <label>Contraseña:</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#121212', color: '#fff' }}
                />

                <button type="submit" style={{ padding: '10px', backgroundColor: '#00e676', color: '#121212', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Entrar
                </button>
            </form>

            {mensaje && <p style={{ color: '#00e676', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}

            <button 
                onClick={() => setView('register')}
                style={{ width: '100%', marginTop: '15px', padding: '8px', backgroundColor: 'transparent', color: '#a0a0a0', border: '1px solid #424242', borderRadius: '4px', cursor: 'pointer' }}
            >
                ¿No tienes cuenta? Regístrate
            </button>
        </div>
    );
};

export default LoginForm;