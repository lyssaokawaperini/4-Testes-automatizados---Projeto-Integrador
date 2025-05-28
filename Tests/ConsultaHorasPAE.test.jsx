import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import ConsultaHorasPAE from "./ConsultaHorasPAE"; // Ajuste o caminho se necessário

// Mock da função fetchMembers de memberApi.js
// Ajuste o caminho para seu arquivo memberApi.js
jest.mock("../Service/memberApi.js", () => ({
  fetchMembers: jest.fn(),
}));

// Mock para componentes filhos (opcional, mas bom para isolar o teste)
jest.mock("./Layout/HeaderAdmin.jsx", () => () => <div data-testid="header-admin-mock">Header Admin Mock</div>);
jest.mock("./Layout/Footer", () => () => <div data-testid="footer-mock">Footer Mock</div>);

// Importar a função mockada para poder controlá-la nos testes
import { fetchMembers } from "../Service/memberApi.js"; // Ajuste o caminho

// Bloco principal de testes para o componente
describe("Componente ConsultaHorasPAE", () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();

    // Mock padrão para fetchMembers para evitar erros em testes que não o especificam.
    // Pode ser sobrescrito em cada teste conforme necessário.
    fetchMembers.mockResolvedValue([]);
  });

  // Seus testes virão aqui!
});
  test("deve renderizar os elementos estáticos e o estado de carregamento inicial", async () => {
    // Fazer fetchMembers demorar para capturar o estado de loading
    fetchMembers.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

    render(<ConsultaHorasPAE />);

    // Verificar mocks dos componentes filhos
    expect(screen.getByTestId("header-admin-mock")).toBeInTheDocument();
    expect(screen.getByTestId("footer-mock")).toBeInTheDocument();

    // Verificar título principal e do formulário
    expect(screen.getByRole("heading", { name: /CONSULTA DE HORAS PAE/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Digite seu e-mail institucional ou Discord ID/i })).toBeInTheDocument();

    // Verificar campo de input e botão
    expect(screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Consultar/i })).toBeInTheDocument();

    // Verificar estado de carregamento inicial
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();

    // Esperar o carregamento terminar (mesmo que a promise demore um pouco)
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());
  });

  test("deve exibir mensagem de erro se o carregamento inicial de membros falhar", async () => {
    fetchMembers.mockRejectedValueOnce(new Error("Falha na API ao carregar membros"));

    render(<ConsultaHorasPAE />);

    // Esperar a mensagem de erro aparecer após a tentativa de carregamento
    expect(await screen.findByText("Não foi possível carregar os dados dos membros.")).toBeInTheDocument();
    // Garantir que o loading sumiu
    expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument();
  });

  test("deve carregar os membros com sucesso e não exibir erro nem loading após o carregamento", async () => {
    const mockMembers = [
      { _id: "1", name: "Fulano de Tal", email: "fulano@maua.br", discordId: "fulano#123", paeHours: 10, modality: "CS" },
    ];
    fetchMembers.mockResolvedValueOnce(mockMembers);

    render(<ConsultaHorasPAE />);

    // Esperar o carregamento terminar
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    // Verificar que não há mensagem de erro de carregamento
    expect(screen.queryByText("Não foi possível carregar os dados dos membros.")).not.toBeInTheDocument();
    // Verificar que o formulário está pronto para uso
    expect(screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i)).toBeEnabled();
  });
  const user = userEvent.setup();
  const mockMembersData = [
    { _id: "m1", name: "Alice Wonderland", email: "alice@maua.br", discordId: "alice#1234", paeHours: 25, modality: "LoL" },
    { _id: "m2", name: "Bob The Builder", email: "bob@maua.br", discordId: "bob#5678", paeHours: 12, modality: "CS" },
    { _id: "m3", name: "Charlie Brown", email: "charlie@instituto.br", discordId: "charlie#0000", paeHours: 30, modality: "Valorant" },
  ];

  beforeEach(() => {
    // Mock padrão para fetchMembers para a maioria dos testes de busca
    // Pode ser sobrescrito se um teste específico precisar de um estado diferente de fetchMembers
    fetchMembers.mockResolvedValue(mockMembersData);
  });


  test("deve exibir erro se o campo de busca estiver vazio ao submeter", async () => {
    render(<ConsultaHorasPAE />);
    // Esperar o carregamento inicial (se houver)
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });
    await user.click(botaoConsultar);

    expect(await screen.findByText("Por favor, digite seu e-mail institucional ou Discord ID.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Alice Wonderland" })).not.toBeInTheDocument(); // Nenhum resultado deve ser exibido
  });

  test("deve encontrar e exibir os dados do membro ao buscar por email existente (case-insensitive)", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const inputBusca = screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i);
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "ALICE@maua.br"); // Busca case-insensitive
    await user.click(botaoConsultar);

    // Verificar se os detalhes do membro "Alice Wonderland" são exibidos
    expect(await screen.findByRole("heading", { name: "Alice Wonderland" })).toBeInTheDocument();
    expect(screen.getByText("alice#1234")).toBeInTheDocument(); // Discord ID
    // O email exibido deve ser o do objeto, não o input
    expect(within(screen.getByText("E-mail").closest('.detail-row')).getByText("alice@maua.br")).toBeInTheDocument();
    expect(screen.getByText("LoL")).toBeInTheDocument(); // Modalidade
    expect(within(screen.getByText("Horas PAE").closest('.detail-row')).getByText("25")).toBeInTheDocument(); // Horas PAE

    // Nenhum erro deve ser exibido
    expect(screen.queryByText("Usuário não encontrado.")).not.toBeInTheDocument();
    expect(screen.queryByText("Por favor, digite seu e-mail")).not.toBeInTheDocument();
  });

  test("deve encontrar e exibir os dados do membro ao buscar por Discord ID existente", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const inputBusca = screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i);
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "bob#5678");
    await user.click(botaoConsultar);

    expect(await screen.findByRole("heading", { name: "Bob The Builder" })).toBeInTheDocument();
    expect(within(screen.getByText("E-mail").closest('.detail-row')).getByText("bob@maua.br")).toBeInTheDocument();
    expect(within(screen.getByText("Horas PAE").closest('.detail-row')).getByText("12")).toBeInTheDocument();
  });

  test("deve exibir erro se o usuário não for encontrado", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const inputBusca = screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i);
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "usuarioinexistente@maua.br");
    await user.click(botaoConsultar);

    expect(await screen.findByText("Usuário não encontrado. Verifique o e-mail ou Discord ID.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Alice Wonderland/i })).not.toBeInTheDocument(); // Nenhum resultado
  });

  test("deve limpar o resultado anterior ao realizar uma nova busca", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const inputBusca = screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i);
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    // Primeira busca (bem-sucedida)
    await user.type(inputBusca, "alice@maua.br");
    await user.click(botaoConsultar);
    expect(await screen.findByRole("heading", { name: "Alice Wonderland" })).toBeInTheDocument();

    // Segunda busca (usuário não encontrado)
    await user.clear(inputBusca);
    await user.type(inputBusca, "ninguem@maua.br");
    await user.click(botaoConsultar);

    // Resultado anterior (Alice) não deve estar mais visível
    expect(screen.queryByRole("heading", { name: "Alice Wonderland" })).not.toBeInTheDocument();
    // Mensagem de erro da segunda busca deve estar visível
    expect(await screen.findByText("Usuário não encontrado. Verifique o e-mail ou Discord ID.")).toBeInTheDocument();
  });

  test("deve exibir 0 para horas PAE e '-' para modalidade/discordId se não definidos no membro encontrado", async () => {
    const membroSemDadosOpcionais = [
        { _id: "m4", name: "Visitante Anonimo", email: "visitante@maua.br", paeHours: null /* ou undefined */ } // sem discordId, modality, paeHours
    ];
    fetchMembers.mockResolvedValueOnce(membroSemDadosOpcionais);

    render(<ConsultaHorasPAE />);
    await waitFor(() => expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument());

    const inputBusca = screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i);
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "visitante@maua.br");
    await user.click(botaoConsultar);

    expect(await screen.findByRole("heading", { name: "Visitante Anonimo" })).toBeInTheDocument();
    // Verifica se campos opcionais são exibidos com fallback
    expect(within(screen.getByText("Discord ID").closest('.detail-row')).getByText("-")).toBeInTheDocument();
    expect(within(screen.getByText("Modalidade").closest('.detail-row')).getByText("-")).toBeInTheDocument();
    expect(within(screen.getByText("Horas PAE").closest('.detail-row')).getByText("0")).toBeInTheDocument();
  });