import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EntrenosDiaView = ({ dayId, onBack, onSelectWorkout }) => {
    const [entrenos, setEntrenos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEntrenos = async () => {
            if (!dayId) return;
            try {
                const response = await axios.get(`http://127.0.0.1:8000/days/${dayId}/workouts/`);
                setEntrenos(response.data.entrenos);
            } catch (err) {
                setError('No se pudieron cargar los entrenamientos de este día.');
            } finally {
                setCargando(false);
            }
        };

        fetchEntrenos();
    }, [dayId]);

    const tarjetaEstilos = {
        backgroundColor: '#1e1e1e',
        padding: '18px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '1px solid #2c2c2c',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        color: '#fff',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={{
            maxWidth: '500px',
            margin: '30px auto',
            padding: '20px',
            backgroundColor: '#121212',
            color: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontFamily: 'sans-serif'
        }}>
            <h2>Ejercicios del Día</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>Toca un ejercicio para ver el desglose de series:</p>

            {cargando && <p style={{ textAlign: 'center' }}>Cargando ejercicios...</p>}
            {error && <p style={{ color: '#ff5252', textAlign: 'center' }}>{error}</p>}

            {!cargando && entrenos.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888' }}>No hay ejercicios planificados para hoy.</p>
            )}

            <div>
                {entrenos.map((entreno) => (
                    <div 
                        key={entreno.plan_id} 
                        style={tarjetaEstilos}
                        onClick={() => onSelectWorkout(entreno)}
                    >
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#00e676' }}>{entreno.ejercicio_nombre}</h3>
                            {entreno.modifier && (
                                <span style={{ fontSize: '12px', color: '#e0e0e0', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px' }}>
                                    {entreno.modifier}
                                </span>
                            )}
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#a0a0a0' }}>
                                Target: {entreno.target_weight != null ? `${entreno.target_weight} kg | ` : ''}{entreno.target_reps} reps | RPE {entreno.target_rpe}
                            </div>
                        </div>
                        <span style={{ color: '#aaa', fontSize: '20px' }}>›</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={onBack} 
                style={{ width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Volver a Días
            </button>
        </div>
    );
};

export default EntrenosDiaView; 