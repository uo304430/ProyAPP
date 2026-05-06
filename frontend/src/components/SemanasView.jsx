import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SemanasView = ({ blockId, onSelectWeek, onBack }) => {
    const [semanas, setSemanas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarTodas, setMostrarTodas] = useState(false);

    useEffect(() => {
        const fetchSemanas = async () => {
            if (!blockId) return;
            
            try {
                const response = await axios.get(`http://127.0.0.1:8000/blocks/${blockId}/weeks/`);
                setSemanas(response.data.semanas);
            } catch (err) {
                setError('No se pudieron cargar las semanas de este bloque.');
            } finally {
                setCargando(false);
            }
        };

        fetchSemanas();
    }, [blockId]);

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
            <h2>Semanas del Bloque</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>Selecciona una semana para ver los días:</p>

            {cargando && <p style={{ textAlign: 'center' }}>Cargando semanas...</p>}
            {error && <p style={{ color: '#ff5252', textAlign: 'center' }}>{error}</p>}

            {!cargando && semanas.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888' }}>No hay semanas creadas para este bloque.</p>
            )}

            {!cargando && semanas.length > 1 && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => setMostrarTodas(!mostrarTodas)}
                        style={{ padding: '10px 16px', backgroundColor: '#00e676', color: '#121212', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {mostrarTodas ? 'Ocultar semanas posteriores' : 'Mostrar semanas posteriores'}
                    </button>
                </div>
            )}

            <div>
                {semanas.filter((semana) => mostrarTodas || semana.week_number === 1).map((semana) => (
                    <div 
                        key={semana.id} 
                        style={tarjetaEstilos}
                        onClick={() => onSelectWeek(semana.id)}
                    >
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Semana {semana.week_number}</h3>
                            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                                Planificación de semana
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
                Volver a Bloques
            </button>
        </div>
    );
};

export default SemanasView;