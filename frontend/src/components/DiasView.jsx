import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DiasView = ({ weekId, onSelectDay, onBack }) => {
    const [dias, setDias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDias = async () => {
            if (!weekId) return;
            
            try {
                const response = await axios.get(`http://127.0.0.1:8000/weeks/${weekId}/days/`);
                setDias(response.data.dias);
            } catch (err) {
                setError('No se pudieron cargar los días de esta semana.');
            } finally {
                setCargando(false);
            }
        };

        fetchDias();
    }, [weekId]);

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
            <h2>Días de Entrenamiento</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>Selecciona el día de la semana:</p>

            {cargando && <p style={{ textAlign: 'center' }}>Cargando días...</p>}
            {error && <p style={{ color: '#ff5252', textAlign: 'center' }}>{error}</p>}

            {!cargando && dias.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888' }}>No hay días creados para esta semana.</p>
            )}

            <div>
                {dias.map((dia) => (
                    <div 
                        key={dia.id} 
                        style={tarjetaEstilos}
                        onClick={() => onSelectDay(dia.id)}
                    >
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Día {dia.day_number}</h3>
                            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                                Toca para ver los ejercicios planificados
                            </span>
                        </div>
                        <span style={{ color: '#aaa', fontSize: '20px' }}>›</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={onBack} 
                style={{ width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Volver a Semanas
            </button>
        </div>
    );
};

export default DiasView;