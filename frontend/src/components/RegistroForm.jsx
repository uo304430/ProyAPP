import React, { useState } from 'react';
import axios from 'axios';

const RegistroForm = ({ onRegisterSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('athlete'); // 'athlete' o 'coach'
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/register/', {
                email: email,
                password: password,
                role: role
            });

            setMensaje('Usuario registrado correctamente. Redirigiendo...');
            
            setTimeout(() => {
                // Pasamos el ID del usuario recién registrado
                if (onRegisterSuccess) {
                    onRegisterSuccess(response.data.usuario_id);
                }
            }, 1000);
            
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al registrar el usuario.');
        }
    };

    return (
        <div style={{
            maxWidth: '400px', 
            margin: '20px auto', 
            padding: '25px', 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #2c2c2c', 
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            color: '#ffffff',
            fontFamily: 'sans-serif'
        }}>
            <h2>Registro de Usuario</h2>
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

                <label>Rol en la plataforma:</label>
                <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#121212', color: '#fff' }}
                >
                    <option value="athlete">Atleta</option>
                    <option value="coach">Entrenador (Coach)</option>
                </select>

                <button type="submit" style={{ padding: '10px', backgroundColor: '#00e676', color: '#121212', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Registrarse
                </button>
            </form>

            {mensaje && <p style={{ color: '#00e676', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default RegistroForm;