// src/Service/trainingApi.js
const API_BASE_URL = "http://localhost:5000/api"; // Your backend API
const MAUA_ESPORTS_API_URL = "http://localhost:5001"; // Mauá Esports API for modalities
const MAUA_ESPORTS_API_TOKEN = "frontendmauaesports";


const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API call error to ${endpoint}:`, error);
    throw error;
  }
};

const mauaEsportsRequest = async (endpoint, params = {}) => {
    try {
      const url = new URL(`${MAUA_ESPORTS_API_URL}${endpoint}`);
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
      );

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${MAUA_ESPORTS_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ${response.status}: ${response.statusText}\nResposta: ${errorText}`
        );
      }
      return response.json();
    } catch (error) {
      console.error("Erro na requisição à API Mauá Esports:", error);
      throw error;
    }
};

export const fetchTrainings = () => request('/trainings');
export const getTrainingById = (id) => request(`/trainings/${id}`);
export const createTraining = (trainingData) => request('/trainings', { method: 'POST', body: JSON.stringify(trainingData) });
export const updateTraining = (id, trainingData) => request(`/trainings/${id}`, { method: 'PUT', body: JSON.stringify(trainingData) });
export const deleteTraining = (id) => request(`/trainings/${id}`, { method: 'DELETE' });

// Fetch modalities from Mauá Esports API
export const fetchExternalModalities = () => mauaEsportsRequest("/modality/all");

// Fetch users (members) from your own API
export const fetchUsers = () => request('/users'); // Assuming you have this from GerenciarMembros