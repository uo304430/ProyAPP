import React from 'react';

const MenuView = ({ setView }) => {
    return (
        <div style={{
            maxWidth: '400px', 
            margin: '40px auto', 
            padding: '25px', 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #2c2c2c', 
            borderRadius: '10px', 
            textAlign: 'center', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            color: '#ffffff',
            fontFamily: 'sans-serif'
        }}>
            <h2>Menú Principal</h2>
            <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>Selecciona una opción para continuar:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button 
                    onClick={() => setView('blocks')}
                    style={{ 
                        padding: '12px', 
                        backgroundColor: '#00e676', 
                        color: '#121212', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                    }}
                >
                    Ver Bloques de Entrenamiento
                </button>
                
                <button 
                    onClick={() => setView('register')}
                    style={{ 
                        padding: '10px', 
                        backgroundColor: '#424242', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Cerrar sesión / Volver al Registro
                </button>
            </div>
        </div>
    );
};

export default MenuView;