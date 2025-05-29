// Serviço para comunicação com a API Stage-API-Maua-Esports

// URL da API conforme documentação
const API_URL = 'https://API-Esports.lcstuber.net';
const API_TOKEN = 'frontendmauaesports';

// Dados mockados para fallback
const MOCK_MODALITIES = {
  "64124b9114a24f13c339bb21": {
    "_id": "64124b9114a24f13c339bb21",
    "Name": "Counter Strike 2",
    "Tag": "CS2",
    "ScheduledTrainings": [
      { "Start": "0 00 20 * * 1", "End": "0 00 22 * * 1" },
      { "Start": "0 00 20 * * 3", "End": "0 00 22 * * 3" }
    ]
  },
  "64124b9114a24f13c339bb22": {
    "_id": "64124b9114a24f13c339bb22",
    "Name": "League of Legends",
    "Tag": "LOL",
    "ScheduledTrainings": [
      { "Start": "0 00 19 * * 2", "End": "0 00 22 * * 2" }
    ]
  },
  "64124b9114a24f13c339bb23": {
    "_id": "64124b9114a24f13c339bb23",
    "Name": "Valorant",
    "Tag": "VAL",
    "ScheduledTrainings": [
      { "Start": "0 00 18 * * 4", "End": "0 00 21 * * 4" }
    ]
  }
};

// Headers padrão para todas as requisições
const getHeaders = () => {
  return {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  };
};

// Função para buscar modalidades
export const fetchModalities = async (tag = null) => {
  try {
    // Devido a problemas de CORS, vamos retornar imediatamente os dados mockados
    // Isso resolve temporariamente o problema até que o backend seja configurado corretamente
    console.log('Usando dados mockados para modalidades devido a CORS');
    
    // Filtrar por tag se necessário
    if (tag) {
      const filtered = {};
      Object.entries(MOCK_MODALITIES).forEach(([id, modality]) => {
        if (modality.Tag === tag) filtered[id] = modality;
      });
      return filtered;
    }
    return MOCK_MODALITIES;
    
    /* Mantenha este código comentado para quando o CORS for resolvido
    let url = `${API_URL}/modality/all`;
    
    // Adicionar filtro por tag se fornecido
    if (tag) {
      url += `?Tag=${encodeURIComponent(tag)}`;
    }
    
    console.log('Tentando acessar a API:', url);
    
    const response = await fetch(url, {
      headers: getHeaders(),
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
    */
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    
    // Retornar dados mockados em caso de erro
    if (tag) {
      const filtered = {};
      Object.entries(MOCK_MODALITIES).forEach(([id, modality]) => {
        if (modality.Tag === tag) filtered[id] = modality;
      });
      return filtered;
    }
    return MOCK_MODALITIES;
  }
};

// Função para buscar treinos com filtros opcionais
export const fetchTrainings = async (filters = {}) => {
  try {
    let url = `${API_URL}/trains/all`;
    
    // Construir query string baseada nos filtros
    const queryParams = [];
    if (filters.status) {
      queryParams.push(`Status=${filters.status}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders(),
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar treinos:', error);
    
    // Notificar usuário
    if (typeof window.showNotification === 'function') {
      window.showNotification('error', 'Não foi possível carregar os treinos. Usando dados locais.', 5000);
    }
    
    // Dados mockados para treinos
    return [
      {
        "_id": "train1",
        "ModalityId": "64124b9114a24f13c339bb21",
        "StartTimestamp": Date.now(),
        "EndTimestamp": Date.now() + 7200000,
        "Status": "SCHEDULED",
        "AttendedPlayers": []
      },
      {
        "_id": "train2",
        "ModalityId": "64124b9114a24f13c339bb22",
        "StartTimestamp": Date.now() + 86400000,
        "EndTimestamp": Date.now() + 86400000 + 10800000,
        "Status": "SCHEDULED",
        "AttendedPlayers": []
      }
    ];
  }
};

// Função para atualizar os treinos agendados de uma modalidade
export const updateModalityScheduledTrainings = async (modalityId, scheduledTrainings) => {
  try {
    const response = await fetch(`${API_URL}/modality`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        _id: modalityId,
        ScheduledTrainings: scheduledTrainings
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar modalidade:', error);
    
    // Notificar usuário
    if (typeof window.showNotification === 'function') {
      window.showNotification('error', 'Falha ao atualizar treinos agendados: ' + error.message, 5000);
    }
    
    throw error;
  }
};

// Outras funções de API conforme necessário...
export const createModality = async (modalityData) => {
  // implementação
};

export const updateModality = async (id, modalityData) => {
  // implementação  
};

export const deleteModality = async (id) => {
  // implementação
};

export const createTraining = async (trainingData) => {
  // implementação
};

export const updateTraining = async (id, trainingData) => {
  // implementação
};

export const deleteTraining = async (id) => {
  // implementação
};