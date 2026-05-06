import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BloquesView = ({ athleteId, onSelectBlock, onBack, onCreateBlock }) => {
    const [bloques, setBloques] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const fetchBloques = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/atleta/${athleteId}/blocks/`);
            setBloques(response.data.bloques);
        } catch (err) {
            setError('No se pudieron cargar los bloques de entrenamiento.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        fetchBloques();
    }, [athleteId]);

    const handleEliminarBloque = async (e, blockId) => {
        e.stopPropagation(); // Evita que se abra la vista al hacer clic en el botón
        const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este bloque?');
        if (!confirmar) return;

        try {
            await axios.delete(`http://127.0.0.1:8000/blocks/${blockId}/`);
            fetchBloques(); // Recarga la lista tras borrar
        } catch (err) {
            alert('Error al eliminar el bloque.');
        }
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Bloques</h2>
                <button 
                    style={{ 
                        backgroundColor: '#00e676', 
                        color: '#121212', 
                        border: 'none', 
                        borderRadius: '4px', 
                        padding: '6px 14px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer' 
                    }}
                    onClick={onCreateBlock}
                >
                    + Crear
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
                        style={{
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
                        }}
                        onClick={() => onSelectBlock(bloque.id)}
                    >
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{bloque.name}</h3>
                            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                                Bloque personalizado del atleta {bloque.athlete_id}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button 
                                onClick={(e) => handleEliminarBloque(e, bloque.id)}
                                style={{
                                    backgroundColor: '#ff5252',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                Eliminar
                            </button>
                            <span style={{ color: '#aaa', fontSize: '20px' }}>›</span>
                        </div>
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