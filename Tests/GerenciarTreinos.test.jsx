import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import GerenciarTreinos from "./GerenciarTreinos";

// Mock das funções de trainingApi.js
// Coloque o caminho CORRETO para seu arquivo trainingApi.js
jest.mock("../Service/trainingApi.js", () => ({
  fetchTrainings: jest.fn(),
  createTraining: jest.fn(),
  updateTraining: jest.fn(),
  deleteTraining: jest.fn(),
  fetchExternalModalities: jest.fn(),
  fetchUsers: jest.fn(),
}));

// Mock para useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // Importa e usa o módulo real para tudo, exceto o que mockamos
  useNavigate: () => mockedNavigate,
}));

// Importar as funções mockadas para poder controlá-las nos testes
// Certifique-se que o caminho para trainingApi.js está correto aqui também
import {
  fetchTrainings,
  createTraining,
  // updateTraining, // Descomente se for usar nos testes de edição
  // deleteTraining, // Descomente se for usar nos testes de deleção
  fetchExternalModalities,
  fetchUsers,
} from "../Service/trainingApi.js";

// Função helper para renderizar o componente com o Router
const renderComponent = () => {
  return render(
    <Router>
      <GerenciarTreinos />
    </Router>
  );
};

// Bloco principal de testes para o componente
describe("Componente GerenciarTreinos", () => {
  // Limpar todos os mocks antes de cada teste para garantir isolamento
  beforeEach(() => {
    jest.clearAllMocks();

    // Definir mocks padrão para as chamadas de API que ocorrem no useEffect inicial do componente
    // Isso evita erros caso um teste não mock especificamente essas chamadas.
    fetchTrainings.mockResolvedValue([]);
    fetchExternalModalities.mockResolvedValue({}); // API original retorna objeto
    fetchUsers.mockResolvedValue([]);
  });

  // Seus testes virão aqui!
});

  test("deve exibir 'Carregando treinos...' inicialmente e depois a lista de treinos", async () => {
    // Configura o mock de fetchTrainings para simular uma pequena demora e depois retornar dados
    const mockTrainingData = [
      { _id: "1", modalityName: "CS2", modalityTag: "CS", description: "Treino tático mapa Dust II", startTimestamp: "2025-06-10T10:00:00.000Z", endTimestamp: "2025-06-10T12:00:00.000Z", status: "SCHEDULED", attendedPlayers: [{_id: 'u1', name: 'Jogador Alfa'}] }
    ];
    fetchTrainings.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(mockTrainingData), 0))
    );
    // Mocks para outras chamadas que podem ocorrer na montagem
    fetchExternalModalities.mockResolvedValueOnce({ mod1: {_id: "m1", Name: "Counter-Strike 2", Tag: "CS2"} });
    fetchUsers.mockResolvedValueOnce([{ _id: 'u1', name: 'Jogador Alfa', email: 'alfa@teste.com'}]);

    renderComponent();

    // 1. Verifica o estado de carregamento
    expect(screen.getByText("Carregando treinos...")).toBeInTheDocument();

    // 2. Espera que a tabela (ou um item dela) apareça após o carregamento
    // await waitFor(() => expect(screen.getByText("Treino tático mapa Dust II")).toBeInTheDocument());
    // OU, uma forma mais robusta se o texto exato mudar:
    expect(await screen.findByRole("table")).toBeInTheDocument(); // Espera a tabela
    expect(screen.getByText("Treino tático mapa Dust II")).toBeInTheDocument();


    // 3. Verifica se a mensagem de carregamento sumiu
    expect(screen.queryByText("Carregando treinos...")).not.toBeInTheDocument();
  });

  test("deve exibir 'Nenhum treino encontrado.' se não houver treinos após o carregamento", async () => {
    fetchTrainings.mockResolvedValueOnce([]); // API retorna array vazio
    // Mocks para outras chamadas
    fetchExternalModalities.mockResolvedValueOnce({});
    fetchUsers.mockResolvedValueOnce([]);

    renderComponent();

    // Espera a mensagem "Nenhum treino encontrado." aparecer.
    // O await screen.findByText é importante porque o estado de loading é mostrado primeiro.
    expect(await screen.findByText("Nenhum treino encontrado.")).toBeInTheDocument();
  });

  test("deve exibir mensagem de erro se o carregamento de treinos falhar", async () => {
    fetchTrainings.mockRejectedValueOnce(new Error("Falha épica na API"));
    // Mocks para outras chamadas
    fetchExternalModalities.mockResolvedValueOnce({});
    fetchUsers.mockResolvedValueOnce([]);

    renderComponent();

    // Espera a mensagem de erro que seu componente define.
    // O regex /i torna a busca case-insensitive.
    expect(await screen.findByText(/Falha ao carregar treinos: Falha épica na API/i)).toBeInTheDocument();
  });

  test("deve abrir o modal 'Adicionar Novo Treino', permitir preenchimento e fechar ao cancelar", async () => {
    const user = userEvent.setup(); // userEvent é ótimo para simular interações do usuário
    // Mocks para as chamadas iniciais que ocorrem no useEffect
    fetchTrainings.mockResolvedValueOnce([]);
    fetchExternalModalities.mockResolvedValueOnce({
      modA: { _id: "idModA", Name: "League of Legends", Tag: "LoL" },
      modB: { _id: "idModB", Name: "Valorant", Tag: "VAL" }
    });
    fetchUsers.mockResolvedValueOnce([
      {_id: 'userA', name: 'Jonas', email: 'j@teste.com'},
      {_id: 'userB', name: 'Maria', email: 'm@teste.com'}
    ]);

    renderComponent();
    
    // Garante que os dados iniciais (modalidades, usuários) foram carregados antes de interagir
    // Esperamos um elemento que só aparece depois dos fetches iniciais, como o título principal.
    await screen.findByRole("heading", { name: "GERENCIAR TREINOS" });

    // 1. Clicar no botão "Novo Treino"
    const addButton = screen.getByRole("button", { name: /Novo Treino/i });
    await user.click(addButton);

    // 2. Verificar se o modal abriu
    expect(await screen.findByRole("heading", { name: "Adicionar Novo Treino" })).toBeInTheDocument();

    // 3. Interagir com os campos do formulário
    // Selecionar modalidade
    const modalitySelect = screen.getByLabelText(/Modalidade:/i);
    await user.selectOptions(modalitySelect, "idModA"); // Seleciona League of Legends
    expect(modalitySelect).toHaveValue("idModA");

    // Preencher descrição
    const descriptionInput = screen.getByLabelText(/Descrição \(Opcional\):/i);
    await user.type(descriptionInput, "Treino de farm e rotação");
    expect(descriptionInput).toHaveValue("Treino de farm e rotação");

    // Adicionar participante
    // O seletor para o <select> de participantes pode ser um pouco mais complexo
    // Se o <select> não tiver um label direto, pode ser necessário usar screen.getByRole('combobox') e filtrar.
    // Vamos assumir que você consegue pegá-lo, por exemplo, pelo valor da option "Adicionar participante..."
    const participantSelect = screen.getByDisplayValue("Adicionar participante...");
    await user.selectOptions(participantSelect, "userA"); // Adiciona Jonas
    // Verificar se o participante Jonas aparece na lista de tags de participantes
    expect(await screen.findByText("Jonas")).toBeInTheDocument();


    // 4. Clicar no botão "Cancelar"
    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    await user.click(cancelButton);

    // 5. Verificar se o modal fechou
    expect(screen.queryByRole("heading", { name: "Adicionar Novo Treino" })).not.toBeInTheDocument();
  });

  test("deve salvar um novo treino com sucesso ao submeter o formulário", async () => {
    const user = userEvent.setup();
    const initialTrainings = [];
    const newTrainingDataFromApi = { // O que a API createTraining retornaria
      _id: "novoTreino123",
      modalityId: "idModX",
      modalityName: "Fórmula 1", // Nome da modalidade vindo da API
      modalityTag: "F1",       // Tag da modalidade vinda da API
      status: "SCHEDULED",
      startTimestamp: "2025-07-01T14:00:00.000Z",
      endTimestamp: "2025-07-01T16:00:00.000Z",
      attendedPlayers: [{_id: 'playerZ', name: 'Piloto Z'}], // A API pode popular os players
      description: "Treino de classificação Mônaco",
    };

    fetchTrainings.mockResolvedValue(initialTrainings); // Mock para a chamada inicial
    fetchExternalModalities.mockResolvedValueOnce({
      idModX: { _id: "idModX", Name: "Fórmula 1", Tag: "F1" }
    });
    fetchUsers.mockResolvedValueOnce([
      {_id: 'playerZ', name: 'Piloto Z', email: 'pilotoz@teste.com'}
    ]);
    createTraining.mockResolvedValue(newTrainingDataFromApi); // Mock para a função de criar treino

    renderComponent();
    await screen.findByRole("heading", { name: "GERENCIAR TREINOS" }); // Espera carregar

    // Abrir modal
    await user.click(screen.getByRole("button", { name: /Novo Treino/i }));
    await screen.findByRole("heading", { name: "Adicionar Novo Treino" });

    // Preencher o formulário (similar ao teste anterior, mas com dados para salvar)
    await user.selectOptions(screen.getByLabelText(/Modalidade:/i), "idModX");
    await user.type(screen.getByLabelText(/Descrição \(Opcional\):/i), newTrainingDataFromApi.description);
    
    // Datas: datetime-local pode ser sensível. fireEvent.change é mais direto.
    const startDateInput = screen.getByLabelText(/Data\/Hora de Início:/i);
    fireEvent.change(startDateInput, { target: { value: "2025-07-01T14:00" } }); // Formato YYYY-MM-DDTHH:mm
    
    const endDateInput = screen.getByLabelText(/Data\/Hora de Término:/i);
    fireEvent.change(endDateInput, { target: { value: "2025-07-01T16:00" } });
    
    await user.selectOptions(screen.getByDisplayValue("Adicionar participante..."), "playerZ");

    // Submeter o formulário
    await user.click(screen.getByRole("button", { name: "Criar Treino" }));

    // Verificar se createTraining foi chamado com os dados corretos
    // Note que o componente envia os dados formatados (ISODateString para datas)
    expect(createTraining).toHaveBeenCalledWith(expect.objectContaining({
      modalityId: "idModX",
      modalityName: "Fórmula 1", // Adicionado pelo handleInputChange
      modalityTag: "F1",         // Adicionado pelo handleInputChange
      description: newTrainingDataFromApi.description,
      status: "SCHEDULED", // Valor padrão inicial
      startTimestamp: new Date("2025-07-01T14:00:00.000Z").toISOString(),
      endTimestamp: new Date("2025-07-01T16:00:00.000Z").toISOString(),
      attendedPlayers: ['playerZ']
    }));

    // Verificar se o modal fechou
    expect(screen.queryByRole("heading", { name: "Adicionar Novo Treino" })).not.toBeInTheDocument();

    // Verificar se o novo treino (com a descrição) aparece na lista principal
    // Isso assume que a lista é atualizada após a criação bem-sucedida.
    expect(await screen.findByText(newTrainingDataFromApi.description)).toBeInTheDocument();
    expect(screen.getByText(newTrainingDataFromApi.modalityName)).toBeInTheDocument(); // ou Tag
  });


  test("deve exibir mensagem de erro no modal se a criação do treino falhar", async () => {
    const user = userEvent.setup();
    fetchTrainings.mockResolvedValue([]);
    fetchExternalModalities.mockResolvedValueOnce({ idModY: { _id: "idModY", Name: "Basquete", Tag: "NBA" } });
    fetchUsers.mockResolvedValueOnce([]);
    createTraining.mockRejectedValueOnce(new Error("Erro ao salvar no banco")); // Simula falha na API

    renderComponent();
    await screen.findByRole("heading", { name: "GERENCIAR TREINOS" });

    await user.click(screen.getByRole("button", { name: /Novo Treino/i }));
    await screen.findByRole("heading", { name: "Adicionar Novo Treino" });

    // Preencher minimamente para tentar salvar
    await user.selectOptions(screen.getByLabelText(/Modalidade:/i), "idModY");
    fireEvent.change(screen.getByLabelText(/Data\/Hora de Início:/i), { target: { value: "2025-08-01T10:00" } });
    fireEvent.change(screen.getByLabelText(/Data\/Hora de Término:/i), { target: { value: "2025-08-01T11:00" } });

    await user.click(screen.getByRole("button", { name: "Criar Treino" }));

    // Verificar se a mensagem de erro definida no componente aparece
    // Esta mensagem de erro é a que é setada no catch do handleSaveNewTraining
    expect(await screen.findByText(/Erro ao criar treino: Erro ao salvar no banco/i)).toBeInTheDocument();
    
    // Opcional: Verificar se o modal ainda está aberto
    expect(screen.getByRole("heading", { name: "Adicionar Novo Treino" })).toBeInTheDocument();
  });