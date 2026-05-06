import React, { useState } from 'react';
import axios from 'axios';

const CrearBloqueView = ({ coachId, athleteId, onBack, onBlockCreated }) => {
    const [name, setName] = useState('');
    const [numWeeks, setNumWeeks] = useState(4);
    const [daysPerWeek, setDaysPerWeek] = useState(4);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/blocks/full/', {
                name,
                coach_id: parseInt(coachId) || 1,
                athlete_id: parseInt(athleteId) || 1,
                num_weeks: parseInt(numWeeks),
                days_per_week: parseInt(daysPerWeek)
            });
            
            setMensaje(response.data.mensaje);
            
            // Extraemos el ID del bloque creado
            const nuevoBlockId = response.data.bloque_id;

            setTimeout(() => {
                if (onBlockCreated) {
                    // Pasamos el ID a la función de App.jsx
                    onBlockCreated(nuevoBlockId);
                }
            }, 1000);
        } catch (err) {
            setError('Error al crear el bloque completo.');
        }
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '30px auto',
            padding: '20px',
            backgroundColor: '#121212',
            color: '#fff',
            borderRadius: '10px',
            border: '1px solid #2c2c2c',
            fontFamily: 'sans-serif'
        }}>
            <h2>Crear Nuevo Bloque</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <label>Nombre del bloque:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej: Bloque de Peaking I"
                    style={{ padding: '8px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                />
                <label>Semanas del bloque:</label>
                <input
                    type="number"
                    value={numWeeks}
                    onChange={(e) => setNumWeeks(e.target.value)}
                    required
                    min="1"
                    style={{ padding: '8px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                />
                <label>Días de entrenamiento por semana:</label>
                <input
                    type="number"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(e.target.value)}
                    required
                    min="1"
                    style={{ padding: '8px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#00e676', color: '#121212', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Crear Bloque
                </button>
            </form>
            {mensaje && <p style={{ color: '#00e676', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}
            
            <button
                onClick={onBack}
                style={{ width: '100%', marginTop: '15px', padding: '8px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Volver
            </button>
        </div>
    );
};

export default CrearBloqueView;     