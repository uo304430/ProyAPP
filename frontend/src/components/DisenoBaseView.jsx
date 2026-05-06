import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DisenoBaseView = ({ blockId, daysPerWeek, onBack, onFinish }) => {
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
    const [selectedDay, setSelectedDay] = useState(1);
    
    // Estados para la selección/creación de ejercicios
    const [exerciseName, setExerciseName] = useState('');
    const [category, setCategory] = useState('basic');
    const [variant, setVariant] = useState('');
    const [selectedExerciseId, setSelectedExerciseId] = useState('');
    
    // Estados para las series dinámicas
    const [numSeries, setNumSeries] = useState(4);
    const [series, setSeries] = useState(Array(4).fill({ weight: '', reps: '', rpe: '' }));
    const [modifier, setModifier] = useState('');
    
    // Estados para subformulario de crear ejercicio
    const [mostrarCrearEj, setMostrarCrearEj] = useState(false);
    
    // Estados para mensajes y panel lateral
    const [ejerciciosDelDia, setEjerciciosDelDia] = useState([]);
    const [currentDayId, setCurrentDayId] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchEjercicios = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/ejercicios/');
            setEjerciciosDisponibles(response.data.ejercicios || response.data);
        } catch (err) {
            console.error('Error al cargar ejercicios');
        }
    };

    const fetchWeekDayIds = async (dayNumber) => {
        if (!blockId) return [];
        try {
            console.log('Obteniendo semanas del bloque...');
            const weeksResponse = await axios.get(`http://127.0.0.1:8000/blocks/${blockId}/weeks/`);
            const semanas = weeksResponse.data.semanas || [];
            console.log('Semanas encontradas:', semanas.length);
            const dayIds = [];

            for (const semana of semanas) {
                try {
                    console.log(`Buscando día ${dayNumber} en semana ${semana.week_number}...`);
                    const response = await axios.get(`http://127.0.0.1:8000/blocks/${blockId}/weeks/${semana.week_number}/days/${dayNumber}/`);
                    if (response.data?.day_id) {
                        dayIds.push({ week_number: semana.week_number, day_id: response.data.day_id });
                        console.log(`Día encontrado: semana ${semana.week_number}, day_id ${response.data.day_id}`);
                    }
                } catch (err) {
                    console.warn(`No se encontró el día ${dayNumber} en la semana ${semana.week_number}`, err);
                }
            }
            console.log('Días recopilados:', dayIds.length);
            return dayIds;
        } catch (err) {
            console.error('Error al cargar las semanas del bloque', err);
            return [];
        }
    };

    const fetchCurrentDayId = async (dayNumber) => {
        if (!blockId) {
            setCurrentDayId(null);
            return;
        }
        try {
            const response = await axios.get(`http://127.0.0.1:8000/blocks/${blockId}/weeks/1/days/${dayNumber}/`);
            setCurrentDayId(response.data.day_id);
        } catch (err) {
            console.error('No se pudo obtener el day_id del bloque:', err);
            setCurrentDayId(null);
        }
    };

    const fetchEjerciciosDelDia = async (diaId) => {
        if (!diaId) {
            setEjerciciosDelDia([]);
            return;
        }
        try {
            const response = await axios.get(`http://127.0.0.1:8000/days/${diaId}/workouts/`);
            setEjerciciosDelDia(response.data.entrenos || []);
        } catch (err) {
            setEjerciciosDelDia([]);
        }
    };

    useEffect(() => {
        fetchEjercicios();
    }, []);

    useEffect(() => {
        const initializeForBlock = async () => {
            if (!blockId) return;
            try {
                setSelectedDay(1);
                setEjerciciosDelDia([]);
                setCurrentDayId(null);
                await fetchCurrentDayId(1);
            } catch (err) {
                console.error('Error initializing block:', err);
            }
        };
        initializeForBlock();
    }, [blockId]);

    useEffect(() => {
        fetchEjerciciosDelDia(currentDayId);
    }, [currentDayId]);

    useEffect(() => {
        if (selectedExerciseId === '') {
            setNumSeries(4);
            setSeries(Array(4).fill({ weight: '', reps: '', rpe: '' }));
            setModifier('');
        }
    }, [selectedExerciseId]);

    const handleNumSeriesChange = (num) => {
        const count = parseInt(num) || 1;
        setNumSeries(count);
        setSeries(Array(count).fill({ weight: '', reps: '', rpe: '' }));
    };

    const handleSeriesChange = (index, field, value) => {
        const newSeries = [...series];
        newSeries[index] = { ...newSeries[index], [field]: value };
        setSeries(newSeries);
    };

    const handleAddExercise = async () => {
        setLoading(true);
        setError('');
        setMensaje('');

        try {
            let exerciseId = selectedExerciseId;

            if (!exerciseId) {
                const res = await axios.post('http://127.0.0.1:8000/ejercicios/', {
                    name: exerciseName,
                    category: category,
                    variant: variant || null
                });
                exerciseId = res.data.id;
            }

            const firstSeries = series[0];
            const res2 = await axios.post('http://127.0.0.1:8000/planned_workouts/', {
                day_id: currentDayId,
                exercise_id: exerciseId,
                target_weight: firstSeries.weight === '' ? null : parseFloat(firstSeries.weight),
                target_reps: parseInt(firstSeries.reps),
                target_rpe: parseFloat(firstSeries.rpe),
                modifier: modifier || null
            });
            const workoutId = res2.data.plan_id;

            await axios.post('http://127.0.0.1:8000/series/', {
                workout_id: workoutId,
                exercise_id: exerciseId,
                planned_weight: firstSeries.weight === '' ? null : parseFloat(firstSeries.weight),
                planned_reps: parseInt(firstSeries.reps),
                planned_rpe: parseFloat(firstSeries.rpe),
                weight: null,
                reps: null,
                rpe: null
            });

            setMensaje('Ejercicio guardado correctamente.');
            setLoading(false);

            setSeries(Array(4).fill({ weight: '', reps: '', rpe: '' }));
            setExerciseName('');
            setVariant('');
            setSelectedExerciseId('');
            setModifier('');
            setSelectedPlanId(null);
            setIsEditing(false);

            fetchEjerciciosDelDia(currentDayId);
        } catch (err) {
            setError('Error al guardar: ' + (err.message || 'Desconocido'));
            setLoading(false);
        }
    };

    const handleCrearEjercicio = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        try {
            await axios.post('http://127.0.0.1:8000/ejercicios/', {
                name: exerciseName,
                category: category,
                variant: variant || null
            });

            setMensaje('Ejercicio añadido a la BBDD.');
            setExerciseName('');
            setVariant('');
            setMostrarCrearEj(false);
            fetchEjercicios();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al crear el ejercicio.');
        }
    };

    const handleEliminarEjercicio = async (planId) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/planned_workouts/${planId}/`);
            setMensaje('Ejercicio eliminado correctamente.');
            fetchEjerciciosDelDia(currentDayId);
        } catch (err) {
            setError('Error al eliminar el ejercicio.');
        }
    };

    const handleEditarEjercicio = (plan) => {
        setSelectedPlanId(plan.plan_id);
        setIsEditing(true);
        setSelectedExerciseId(plan.ejercicio_id.toString());
        setModifier(plan.modifier || '');
        setNumSeries(plan.series?.length || 4);
        setSeries((plan.series || []).map((serie) => ({
            weight: serie.planned_weight ?? '',
            reps: serie.planned_reps ?? '',
            rpe: serie.planned_rpe ?? ''
        })));
        setMensaje(`Editando ${plan.ejercicio_nombre} del Día ${selectedDay}. Haz los cambios y guarda.`);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            maxWidth: '950px',
            margin: '30px auto',
            padding: '25px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #2c2c2c',
            borderRadius: '10px',
            color: '#ffffff',
            fontFamily: 'sans-serif'
        }}>
            {/* Columna Izquierda: Formulario de diseño */}
            <div style={{ flex: '1 1 450px', minWidth: '300px' }}>
                <h2>Diseño del Entrenamiento</h2>
                <p style={{ color: '#a0a0a0' }}>Crea la estructura de tus días antes de generar el bloque completo.</p>

                {/* Selector de día */}
                <div style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
                    {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map((d) => (
                        <button
                            key={d}
                            onClick={() => setSelectedDay(d)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: selectedDay === d ? '#00e676' : '#2c2c2c',
                                color: selectedDay === d ? '#121212' : '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Día {d}
                        </button>
                    ))}
                </div>
                <p style={{ color: '#a0a0a0', marginTop: '8px' }}>Las configuraciones del Día {selectedDay} se usarán como base para replicar el mismo día en las semanas posteriores del bloque.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <label>Seleccionar ejercicio:</label>
                    <select 
                        value={selectedExerciseId}
                        onChange={(e) => setSelectedExerciseId(e.target.value)} 
                        style={{ padding: '8px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333' }}
                    >
                        <option value="">-- Nuevo Ejercicio (Escribe abajo) --</option>
                        {ejerciciosDisponibles.map((ej) => (
                            <option key={ej.id} value={ej.id}>
                                {ej.name} {ej.variant ? `(${ej.variant})` : ''}
                            </option>
                        ))}
                    </select>

                    <button 
                        type="button"
                        onClick={() => setMostrarCrearEj(!mostrarCrearEj)}
                        style={{ background: 'none', border: 'none', color: '#00e676', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}
                    >
                        + ¿No está el ejercicio? Crea uno nuevo
                    </button>

                    {/* Subformulario de crear ejercicio */}
                    {mostrarCrearEj && (
                        <div style={{ border: '1px solid #424242', padding: '15px', borderRadius: '6px', backgroundColor: '#121212' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Crear Nuevo Ejercicio</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label>Nombre:</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Squat" 
                                    value={exerciseName} 
                                    onChange={(e) => setExerciseName(e.target.value)}
                                    style={{ padding: '6px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333' }}
                                />
                                <label>Categoría:</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{ padding: '6px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333' }}
                                >
                                    <option value="basic">Básico</option>
                                    <option value="accessory">Accesorio</option>
                                </select>
                                <label>Variante:</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Low Bar, Sumo..." 
                                    value={variant} 
                                    onChange={(e) => setVariant(e.target.value)}
                                    style={{ padding: '6px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleCrearEjercicio}
                                    style={{ padding: '6px', backgroundColor: '#00e676', color: '#121212', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}
                                >
                                    Guardar Ejercicio en BBDD
                                </button>
                            </div>
                        </div>
                    )}

                    <label>Número de series:</label>
                    <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={numSeries} 
                        onChange={(e) => handleNumSeriesChange(e.target.value)} 
                        style={{ padding: '8px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333', width: '80px' }}
                    />

                    <div>
                        <h4 style={{ margin: '10px 0', borderBottom: '1px solid #333', paddingBottom: '4px' }}>Series Planificadas</h4>
                        {series.map((serie, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <span style={{ minWidth: '60px' }}>Serie {index + 1}:</span>
                                <input 
                                    type="number" 
                                    step="0.5" 
                                    placeholder="Peso (kg)" 
                                    value={serie.weight} 
                                    onChange={(e) => handleSeriesChange(index, 'weight', e.target.value)}
                                    style={{ padding: '6px', width: '80px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333' }}
                                />
                                <input 
                                    type="number" 
                                    required 
                                    placeholder="Reps*" 
                                    value={serie.reps} 
                                    onChange={(e) => handleSeriesChange(index, 'reps', e.target.value)}
                                    style={{ padding: '6px', width: '70px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333' }}
                                />
                                <input 
                                    type="number" 
                                    step="0.5" 
                                    required 
                                    placeholder="RPE*" 
                                    value={serie.rpe} 
                                    onChange={(e) => handleSeriesChange(index, 'rpe', e.target.value)}
                                    style={{ padding: '6px', width: '70px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333' }}
                                />
                            </div>
                        ))}
                    </div>

                    <label>Modificador (Opcional):</label>
                    <input 
                        type="text" 
                        value={modifier} 
                        onChange={(e) => setModifier(e.target.value)} 
                        placeholder="Ej: Tempo 3-0-0" 
                        style={{ padding: '8px', backgroundColor: '#121212', color: '#fff', border: '1px solid #333' }}
                    />

                    <button type="button" onClick={handleAddExercise} disabled={loading} style={{ padding: '10px', backgroundColor: loading ? '#555' : '#00e676', color: '#121212', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                        {loading ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar Ejercicio y Series' : 'Guardar Ejercicio y Series')}
                    </button>
                </div>

                {mensaje && <p style={{ color: '#00e676', marginTop: '10px' }}>{mensaje}</p>}
                {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}

                <button 
                    onClick={onFinish} 
                    style={{ width: '100%', marginTop: '25px', padding: '12px', backgroundColor: '#424242', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Finalizar diseño del Bloque
                </button>
                
                {onBack && (
                    <button 
                        onClick={onBack} 
                        style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Volver
                    </button>
                )}
            </div>

            {/* Columna Derecha: Panel de ejercicios del día */}
            <div style={{ flex: '1 1 300px', backgroundColor: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #333', minHeight: '350px' }}>
                <h3>Ejercicios en el Día {selectedDay}</h3>
                {ejerciciosDelDia.length === 0 ? (
                    <p style={{ color: '#888' }}>No hay ejercicios planificados para hoy.</p>
                ) : (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {ejerciciosDelDia.map((item) => (
                            <li key={item.plan_id} style={{ borderBottom: '1px solid #222', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <strong>{item.ejercicio_nombre}</strong>
                                    {item.modifier && <div style={{ fontSize: '11px', color: '#00e676' }}>Mod: {item.modifier}</div>}
                                    <div style={{ marginTop: '5px' }}>
                                        {item.series && item.series.length > 0 ? (
                                            item.series.map((serie, index) => (
                                                <div key={serie.id} style={{ fontSize: '12px', color: '#aaa', marginBottom: '2px' }}>
                                                    Serie {index + 1}: {serie.planned_weight ?? ''}{serie.planned_weight != null ? 'kg' : ''} x {serie.planned_reps} @ {serie.planned_rpe}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>
                                                Target: {item.target_weight != null ? `${item.target_weight}kg x ${item.target_reps} @ ${item.target_rpe}` : `${item.target_reps} reps @ ${item.target_rpe}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleEditarEjercicio(item)}
                                        style={{ backgroundColor: '#00a6ff', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleEliminarEjercicio(item.plan_id)}
                                        style={{ backgroundColor: '#ff5252', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        X
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DisenoBaseView;