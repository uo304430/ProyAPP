import axios from 'axios';

// La URL base donde está corriendo tu backend de FastAPI
const API_URL = '/api';

export const registrarUsuario = async (email, password, role) => {
    try {
        const response = await axios.post(`${API_URL}/register/`, {
            email: email,
            password: password,
            role: role
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { error: "Error de conexión con el servidor" };
        }
    }
};  