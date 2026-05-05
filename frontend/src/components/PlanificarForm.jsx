import React, { useState } from 'react';
import axios from 'axios';

const PlanificarForm = () => {
    const [coachId, setCoachId] = useState('');
    const [athleteId, setAthleteId] = useState('');
    const [exerciseId, setExerciseId] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [targetReps, setTargetReps] = useState('');
    const [targetRpe, setTargetRpe] = useState('');
    const [modifier, setModifier] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/planificar/', {
                coach_id: parseInt(coachId),
                athlete_id: parseInt(athleteId),
                exercise_id: parseInt(exerciseId),
                target_weight: parseFloat(targetWeight),
                target_reps: parseInt(targetReps),
                target_rpe: parseFloat(targetRpe),
                modifier: modifier || null
            });
            setMensaje(response.data.mensaje);
        } catch (err) {
            setError(err.response?.data?.detail || "Error al planificar el entrenamiento");
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Planificar Entrenamiento</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>ID Entrenador:</label>
                <input type="number" value={coachId} onChange={(e) => setCoachId(e.target.value)} required />

                <label>ID Atleta:</label>
                <input type="number" value={athleteId} onChange={(e) => setAthleteId(e.target.value)} required />

                <label>ID Ejercicio:</label>
                <input type="number" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} required />

                <label>Peso Objetivo (kg):</label>
                <input type="number" step="0.5" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} required />

                <label>Reps Objetivo:</label>
                <input type="number" value={targetReps} onChange={(e) => setTargetReps(e.target.value)} required />

                <label>RPE Objetivo:</label>
                <input type="number" step="0.5" value={targetRpe} onChange={(e) => setTargetRpe(e.target.value)} required />

                <label>Variante/Modificador (Opcional):</label>
                <input type="text" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="Ej: Tempo 3-0-0" />

                <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Planificar
                </button>
            </form>

            {mensaje && <p style={{ color: 'green', marginTop: '10px' }}>{mensaje}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default PlanificarForm;