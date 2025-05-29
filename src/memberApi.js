// API client for members management
import axios from 'axios';

// API Base URL (servidor backend) - usa a URL do arquivo de ambiente ou um valor padrão
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Dados mockados para fallback
const MOCK_MEMBERS = [
  {
    _id: '1',
    discordId: "000000000000000001",
    email: "24.01193-2@maua.br",
    name: "Lucas Silva",
    role: "captain",
    modality: "Counter-Strike 2",
    paeHours: 15
  },
  {
    _id: '2',
    discordId: "000000000000000002",
    email: "24.02193-3@maua.br",
    name: "Maria Oliveira",
    role: "member",
    modality: "League of Legends",
    paeHours: 12
  },
  {
    _id: '3',
    discordId: "000000000000000003",
    email: "24.03193-4@maua.br",
    name: "João Santos",
    role: "member",
    modality: "Valorant",
    paeHours: 10
  }
];

// Fetch all members
export const fetchMembers = async () => {
  try {
    // Chamada real para a API
    const response = await axios.get(`${API_BASE_URL}/users`);
    console.log("Dados recuperados do MongoDB:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching members:', error);
    console.log("Usando dados mockados devido a falha na API");
    return MOCK_MEMBERS;
  }
};

// Update a member
export const updateMember = async (id, memberData) => {
  try {
    // Chamada real para a API
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, memberData);
    console.log("Atualizado com sucesso:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating member:', error);
    // Mock para desenvolvimento sem backend
    console.log("Usando mock para update:", id, memberData);
    return memberData;
  }
};

// Delete a member
export const deleteMember = async (id) => {
  try {
    // Chamada real para a API
    const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
    console.log("Excluído com sucesso:", response.data);
    return { success: true };
  } catch (error) {
    console.error('Error deleting member:', error);
    // Mock para desenvolvimento sem backend
    console.log("Usando mock para delete:", id);
    return { success: true };
  }
};

// Create a new member
export const createMember = async (memberData) => {
  try {
    // Chamada real para a API
    const response = await axios.post(`${API_BASE_URL}/users`, memberData);
    console.log("Criado com sucesso:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating member:', error);
    // Mock para desenvolvimento sem backend
    console.log("Usando mock para create:", memberData);
    return {
      ...memberData,
      _id: Date.now().toString() // Gera um ID mock
    };
  }
};