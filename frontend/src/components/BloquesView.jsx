import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BloquesView = ({ athleteId, onSelectBlock, onBack }) => {
    const [bloques, setBloques] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBloques = async () => {
            try {
                // Hacemos la petición al nuevo endpoint del backend
                const response = await axios.get(`http://127.0.0.1:8000/atleta/${athleteId}/blocks/`);
                setBloques(response.data.bloques);
            } catch (err) {
                setError('No se pudieron cargar los bloques de entrenamiento.');
            } finally {
                setCargando(false);
            }
        };

        fetchBloques();
    }, [athleteId]);

    const contenedorEstilos = {
        maxWidth: '500px',
        margin: '30px auto',
        padding: '20px',
        backgroundColor: '#121212',
        color: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif'
    };

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
        <div style={contenedorEstilos}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Bloques</h2>
                <button 
                    style={{ background: 'transparent', border: 'none', color: '#00e676', fontSize: '24px', cursor: 'pointer' }}
                    onClick={() => alert('Función para crear nuevo bloque en desarrollo')}
                >
                    +
                </button>
            </div>

            {cargando && <p style={{ textAlign: 'center' }}>Cargando bloques...</p>}
            {error && <p style={{ color: '#ff5252', textAlign: 'center' }}>{error}</p>}

            {!cargando && bloques.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888' }}>No hay bloques creados para este atleta.</p>
            )}

            <div>
                {bloques.map((bloque) => (
                    <div 
                        key={bloque.id} 
                        style={tarjetaEstilos}
                        onClick={() => onSelectBlock(bloque.id)}
                    >
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{bloque.name}</h3>
                            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                                📅 Bloque personalizado del atleta {bloque.athlete_id}
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
                Volver al menú
            </button>
        </div>
    );
};

export default BloquesView;