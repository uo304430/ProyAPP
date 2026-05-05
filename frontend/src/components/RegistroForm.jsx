import React, { useState } from 'react';
import { registrarUsuario } from '../services/api';

const RegistroForm = ({ onRegisterSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('athlete');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            const data = await registrarUsuario(email, password, role);
            setMensaje(`Usuario registrado con éxito. Redirigiendo...`);
            
            // Esperamos 1.5 segundos para mostrar el mensaje y luego pasamos al menú
            setTimeout(() => {
                if (onRegisterSuccess) {
                    onRegisterSuccess(data.usuario_id);
                }
            }, 1500);
            
        } catch (err) {
            setError(err.detail || err.error || "Hubo un error al registrarse");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '40px auto', padding: '25px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2>Registro de Usuario</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label>Email:</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa' }}
                />

                <label>Contraseña:</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa' }}
                />

                <label>Rol:</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #aaa' }}>
                    <option value="athlete">Atleta</option>
                    <option value="coach">Entrenador</option>
                </select>

                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Registrarse
                </button>
            </form>

            {mensaje && <p style={{ color: 'green', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default RegistroForm;