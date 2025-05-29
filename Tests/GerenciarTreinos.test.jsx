import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import GerenciarTreinos from "../src/GerenciarTreinos.jsx";

jest.mock("../src/trainingApi.js", () => ({
  fetchTrainings: jest.fn(),
  createTraining: jest.fn(),
  updateTraining: jest.fn(),
  deleteTraining: jest.fn(),
  fetchExternalModalities: jest.fn(),
  fetchUsers: jest.fn(),
}));

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

import {
  fetchTrainings,
  createTraining,
  fetchExternalModalities,
  fetchUsers,
} from "../src/trainingApi.js";

const renderComponent = () => {
  return render(
    <Router>
      <GerenciarTreinos />
    </Router>
  );
};

describe("Componente GerenciarTreinos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchTrainings.mockResolvedValue([]);
    fetchExternalModalities.mockResolvedValue({});
    fetchUsers.mockResolvedValue([]);
  });

  test("deve exibir 'Carregando treinos...' inicialmente e depois a lista de treinos", async () => {

    const mockTrainingData = [
      { _id: "1", modalityName: "CS2", modalityTag: "CS", description: "Treino tático mapa Dust II", startTimestamp: "2025-06-10T10:00:00.000Z", endTimestamp: "2025-06-10T12:00:00.000Z", status: "SCHEDULED", attendedPlayers: [{_id: 'u1', name: 'Jogador Alfa'}] }
    ];
    fetchTrainings.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(mockTrainingData), 0))
    );
    fetchExternalModalities.mockResolvedValueOnce({ mod1: {_id: "m1", Name: "Counter-Strike 2", Tag: "CS2"} });
    fetchUsers.mockResolvedValueOnce([{ _id: 'u1', name: 'Jogador Alfa', email: 'alfa@teste.com'}]);
    renderComponent();
    expect(screen.getByText("Carregando treinos...")).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Treino tático mapa Dust II")).toBeInTheDocument();
    expect(screen.queryByText("Carregando treinos...")).not.toBeInTheDocument();
  });

  test("deve exibir 'Nenhum treino encontrado.' se não houver treinos após o carregamento", async () => {
    fetchTrainings.mockResolvedValueOnce([]);
    fetchExternalModalities.mockResolvedValueOnce({});
    fetchUsers.mockResolvedValueOnce([]);

    renderComponent();
    expect(await screen.findByText("Nenhum treino encontrado.")).toBeInTheDocument();
  });

  test("deve exibir mensagem de erro se o carregamento de treinos falhar", async () => {
    fetchTrainings.mockRejectedValueOnce(new Error("Falha épica na API"));
    fetchExternalModalities.mockResolvedValueOnce({});
    fetchUsers.mockResolvedValueOnce([]);

    renderComponent();
    expect(await screen.findByText(/Falha ao carregar treinos: Falha épica na API/i)).toBeInTheDocument();
  });

  test("deve abrir o modal 'Adicionar Novo Treino', permitir preenchimento e fechar ao cancelar", async () => {
    const user = userEvent.setup();
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
    await screen.findByRole("heading", { name: "GERENCIAR TREINOS" });

    const addButton = screen.getByRole("button", { name: /Novo Treino/i });
    await user.click(addButton);

    expect(await screen.findByRole("heading", { name: "Adicionar Novo Treino" })).toBeInTheDocument();

    const modalitySelect = screen.getByLabelText(/Modalidade:/i);
    await user.selectOptions(modalitySelect, "idModA"); // Seleciona League of Legends
    expect(modalitySelect).toHaveValue("idModA");

    const descriptionInput = screen.getByLabelText(/Descrição \(Opcional\):/i);
    await user.type(descriptionInput, "Treino de farm e rotação");
    expect(descriptionInput).toHaveValue("Treino de farm e rotação");

    const participantSelect = screen.getByDisplayValue("Adicionar participante...");
    await user.selectOptions(participantSelect, "userA");
    expect(await screen.findByText("Jonas")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    await user.click(cancelButton);
    expect(screen.queryByRole("heading", { name: "Adicionar Novo Treino" })).not.toBeInTheDocument();
  });

  test("deve salvar um novo treino com sucesso ao submeter o formulário", async () => {
    const user = userEvent.setup();
    const initialTrainings = [];
    const newTrainingDataFromApi = { 
      _id: "novoTreino123",
      modalityId: "idModX",
      modalityName: "Fórmula 1", 
      modalityTag: "F1",    
      status: "SCHEDULED",
      startTimestamp: "2025-07-01T14:00:00.000Z",
      endTimestamp: "2025-07-01T16:00:00.000Z",
      attendedPlayers: [{_id: 'playerZ', name: 'Piloto Z'}], 
      description: "Treino de classificação Mônaco",
    };

    fetchTrainings.mockResolvedValue(initialTrainings); 
    fetchExternalModalities.mockResolvedValueOnce({
      idModX: { _id: "idModX", Name: "Fórmula 1", Tag: "F1" }
    });
    fetchUsers.mockResolvedValueOnce([
      {_id: 'playerZ', name: 'Piloto Z', email: 'pilotoz@teste.com'}
    ]);
    createTraining.mockResolvedValue(newTrainingDataFromApi); 

    renderComponent();
    await screen.findByRole("heading", { name: "GERENCIAR TREINOS" }); 

    await user.click(screen.getByRole("button", { name: /Novo Treino/i }));
    await screen.findByRole("heading", { name: "Adicionar Novo Treino" });

    await user.selectOptions(screen.getByLabelText(/Modalidade:/i), "idModX");
    await user.type(screen.getByLabelText(/Descrição \(Opcional\):/i), newTrainingDataFromApi.description);
    
    const startDateInput = screen.getByLabelText(/Data\/Hora de Início:/i);
    fireEvent.change(startDateInput, { target: { value: "2025-07-01T14:00" } });
    
    const endDateInput = screen.getByLabelText(/Data\/Hora de Término:/i);
    fireEvent.change(endDateInput, { target: { value: "2025-07-01T16:00" } });
    
    await user.selectOptions(screen.getByDisplayValue("Adicionar participante..."), "playerZ");

    await user.click(screen.getByRole("button", { name: "Criar Treino" }));

    expect(createTraining).toHaveBeenCalledWith(expect.objectContaining({
      modalityId: "idModX",
      modalityName: "Fórmula 1",
      modalityTag: "F1",
      description: newTrainingDataFromApi.description,
      status: "SCHEDULED",
      startTimestamp: new Date("2025-07-01T14:00:00.000Z").toISOString(),
      endTimestamp: new Date("2025-07-01T16:00:00.000Z").toISOString(),
      attendedPlayers: ['playerZ']
    }));

    expect(screen.queryByRole("heading", { name: "Adicionar Novo Treino" })).not.toBeInTheDocument();

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

    await user.selectOptions(screen.getByLabelText(/Modalidade:/i), "idModY");
    fireEvent.change(screen.getByLabelText(/Data\/Hora de Início:/i), { target: { value: "2025-08-01T10:00" } });
    fireEvent.change(screen.getByLabelText(/Data\/Hora de Término:/i), { target: { value: "2025-08-01T11:00" } });

    await user.click(screen.getByRole("button", { name: "Criar Treino" }));
    expect(await screen.findByText(/Erro ao criar treino: Erro ao salvar no banco/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Adicionar Novo Treino" })).toBeInTheDocument();
  });
});