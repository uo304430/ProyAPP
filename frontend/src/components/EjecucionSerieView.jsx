import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EjecucionSerieView = ({ workout, athleteId, onBack }) => {
    const [series, setSeries] = useState([]);
    const [realizados, setRealizados] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSeries = async () => {
            if (!workout?.plan_id) {
                setSeries([]);
                setRealizados([]);
                return;
            }

            try {
                const response = await axios.get(`http://127.0.0.1:8000/planned_workouts/${workout.plan_id}/series/`);
                const loadedSeries = response.data.series || [];
                setSeries(loadedSeries);
                setRealizados(loadedSeries.map((serie) => ({
                    weight: serie.weight ?? '',
                    reps: serie.reps ?? '',
                    rpe: serie.rpe ?? ''
                })));
            } catch (err) {
                console.error('Error al cargar las series del entrenamiento:', err);
                setSeries([]);
                setRealizados([]);
            }
        };

        fetchSeries();
    }, [workout]);

    if (!workout) {
        return (
            <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
                <p>No hay un entrenamiento seleccionado.</p>
                <button onClick={onBack} style={{ padding: '8px 16px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Volver
                </button>
            </div>
        );
    }

    const handleRealizadoChange = async (index, field, value) => {
        const newRealizados = [...realizados];
        newRealizados[index] = { ...newRealizados[index], [field]: value };
        setRealizados(newRealizados);

        if (value === '') {
            return;
        }

        const serie = series[index];
        if (serie && serie.id) {
            try {
                await axios.put(`http://127.0.0.1:8000/series/${serie.id}/`, {
                    weight: parseFloat(newRealizados[index].weight) || 0,
                    reps: parseInt(newRealizados[index].reps) || 0,
                    rpe: parseFloat(newRealizados[index].rpe) || 0,
                });
            } catch (err) {
                console.error('Error al actualizar serie:', err);
            }
        }
    };

    return (
        <div style={{
            maxWidth: '1000px',
            margin: '30px auto',
            padding: '20px',
            backgroundColor: '#121212',
            color: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontFamily: 'sans-serif'
        }}>
            <h2>{workout.ejercicio_nombre}</h2>
            {workout.modifier && (
                <p style={{ color: '#00e676', fontWeight: 'bold' }}>Variante: {workout.modifier}</p>
            )}
            
            <div>
                {series.length === 0 ? (
                    <p style={{ color: '#aaa', padding: '10px', textAlign: 'center' }}>Cargando series o no hay series definidas para este ejercicio.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e1e1e' }}>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>Serie</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>Peso Planificado (kg)</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>Reps Planificadas</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>RPE Planificado</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>Peso Realizado (kg)</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>Reps Realizadas</th>
                                <th style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>RPE Percibido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {series.map((serie, index) => (
                                <tr key={serie.id} style={{ backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#121212' }}>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{serie.planned_weight !== null && serie.planned_weight !== undefined ? serie.planned_weight : ''}</td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{serie.planned_reps ?? ''}</td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>{serie.planned_rpe ?? ''}</td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>
                                        <input 
                                            type="number" 
                                            step="0.5" 
                                            value={realizados[index]?.weight || ''} 
                                            onChange={(e) => handleRealizadoChange(index, 'weight', e.target.value)} 
                                            style={{ width: '80px', padding: '5px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>
                                        <input 
                                            type="number" 
                                            value={realizados[index]?.reps || ''} 
                                            onChange={(e) => handleRealizadoChange(index, 'reps', e.target.value)} 
                                            style={{ width: '80px', padding: '5px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #333', textAlign: 'center' }}>
                                        <input 
                                            type="number" 
                                            step="0.5" 
                                            value={realizados[index]?.rpe || ''} 
                                            onChange={(e) => handleRealizadoChange(index, 'rpe', e.target.value)} 
                                            style={{ width: '80px', padding: '5px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}

            <button 
                onClick={onBack} 
                style={{ width: '100%', marginTop: '25px', padding: '10px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                Volver a Ejercicios
            </button>
        </div>
    );
};

export default EjecucionSerieView;