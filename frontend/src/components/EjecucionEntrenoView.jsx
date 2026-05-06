import React, { useState } from 'react';
import axios from 'axios';

const EjecucionEntrenoView = ({ workout, onBack }) => {
    // workout contendrá los datos del entrenamiento y sus series planificadas
    const [series, setSeries] = useState([
        { id: 1, planned_weight: 100, planned_reps: 3, planned_rpe: 8, actual_weight: '', actual_reps: '', actual_rpe: '' },
        { id: 2, planned_weight: 100, planned_reps: 3, planned_rpe: 8, actual_weight: '', actual_reps: '', actual_rpe: '' },
        { id: 3, planned_weight: 100, planned_reps: 3, planned_rpe: 6, actual_weight: '', actual_reps: '', actual_rpe: '' },
        { id: 4, planned_weight: 100, planned_reps: 3, planned_rpe: 6, actual_weight: '', actual_reps: '', actual_rpe: '' },
    ]);
    
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSeriesChange = (index, field, value) => {
        const newSeries = [...series];
        newSeries[index] = { ...newSeries[index], [field]: value };
        setSeries(newSeries);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        try {
            // Transformamos el estado local al formato que espera el endpoint
            const formattedSeries = series.map(s => ({
                workout_id: workout.plan_id,
                exercise_id: workout.ejercicio_id,
                planned_weight: s.planned_weight || 0,
                planned_reps: s.planned_reps || 0,
                planned_rpe: s.planned_rpe || 0,
                // Si el atleta no rellenó el campo, enviamos 0 o el valor que corresponda
                weight: parseFloat(s.actual_weight) || 0,
                reps: parseInt(s.actual_reps) || 0,
                rpe: parseFloat(s.actual_rpe) || 0
            }));

            await axios.post('http://127.0.0.1:8000/series/batch/', {
                series: formattedSeries
            });
            
            setMensaje('¡Entrenamiento registrado con éxito en la base de datos!');
        } catch (err) {
            setError('Error al registrar las series. Comprueba los campos.');
        }
    };

    return (
        <div style={{
            maxWidth: '550px',
            margin: '30px auto',
            padding: '25px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #2c2c2c',
            borderRadius: '10px',
            color: '#ffffff',
            fontFamily: 'sans-serif'
        }}>
            <h2>Ejecución del Ejercicio</h2>
            <div style={{ margin: '15px 0', padding: '12px', backgroundColor: '#121212', borderRadius: '6px' }}>
                <h3 style={{ margin: 0, color: '#00e676' }}>Squat (Variante: Competición)</h3>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Cabecera de la tabla */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                    <span>Serie</span>
                    <span>Peso (kg)</span>
                    <span>Reps</span>
                    <span>RPE</span>
                </div>

                {/* Filas de series */}
                {series.map((serie, index) => (
                    <div key={serie.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', borderBottom: '1px solid #2c2c2c', paddingBottom: '8px' }}>
                        <span>Serie {index + 1}</span>
                        
                        {/* Input para el peso real */}
                        <input 
                            type="number" 
                            step="0.5" 
                            placeholder={`${serie.planned_weight} kg`} 
                            value={serie.actual_weight}
                            onChange={(e) => handleSeriesChange(index, 'actual_weight', e.target.value)}
                            style={{ padding: '6px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', width: '90%' }}
                        />

                        {/* Input para las repeticiones reales */}
                        <input 
                            type="number" 
                            placeholder={`${serie.planned_reps}`} 
                            value={serie.actual_reps}
                            onChange={(e) => handleSeriesChange(index, 'actual_reps', e.target.value)}
                            style={{ padding: '6px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', width: '90%' }}
                        />

                        {/* Input para el RPE real */}
                        <input 
                            type="number" 
                            step="0.5" 
                            placeholder={`${serie.planned_rpe}`} 
                            value={serie.actual_rpe}
                            onChange={(e) => handleSeriesChange(index, 'actual_rpe', e.target.value)}
                            style={{ padding: '6px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', width: '90%' }}
                        />
                    </div>
                ))}

                <button type="submit" style={{ padding: '12px', backgroundColor: '#00e676', color: '#121212', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    Guardar Resultados
                </button>
            </form>

            {mensaje && <p style={{ color: '#00e676', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}

            <button onClick={onBack} style={{ width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Volver
            </button>
        </div>
    );
};

export default EjecucionEntrenoView;