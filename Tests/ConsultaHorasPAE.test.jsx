import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import ConsultaHorasPAE from "../src/ConsultaHorasPAE.jsx";
import { fetchMembers } from "../src/memberApi.js";
import { BrowserRouter } from "react-router-dom";

jest.mock("../src/memberApi.js", () => ({
  fetchMembers: jest.fn(),
}));

jest.mock("../src/HeaderAdmin.jsx", () => () => (
  <div data-testid="header-admin-mock">Header Admin Mock</div>
));
jest.mock("../src/Footer.jsx", () => () => (
  <div data-testid="footer-mock">Footer Mock</div>
));

describe("Componente ConsultaHorasPAE", () => {
  const user = userEvent.setup();

  const mockMembersData = [
    {
      _id: "m1",
      name: "Alice Wonderland",
      email: "alice@maua.br",
      discordId: "alice#1234",
      paeHours: 25,
      modality: "LoL",
    },
    {
      _id: "m2",
      name: "Bob The Builder",
      email: "bob@maua.br",
      discordId: "bob#5678",
      paeHours: 12,
      modality: "CS",
    },
    {
      _id: "m3",
      name: "Charlie Brown",
      email: "charlie@instituto.br",
      discordId: "charlie#0000",
      paeHours: 30,
      modality: "Valorant",
    },
  ];

  const membroSemDadosOpcionais = [
    {
      _id: "m4",
      name: "Visitante Anonimo",
      email: "visitante@maua.br",
      paeHours: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMembers.mockResolvedValue(mockMembersData);
  });

  test("deve renderizar os elementos estáticos e o estado de carregamento inicial", async () => {
    fetchMembers.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(<ConsultaHorasPAE />);

    expect(screen.getByTestId("header-admin-mock")).toBeInTheDocument();
    expect(screen.getByTestId("footer-mock")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /CONSULTA DE HORAS PAE/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Digite seu e-mail institucional ou Discord ID/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Consultar/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );
  });

  test("deve exibir mensagem de erro se o carregamento inicial de membros falhar", async () => {
    fetchMembers.mockRejectedValueOnce(
      new Error("Falha na API ao carregar membros")
    );

    render(<ConsultaHorasPAE />);
    expect(
      await screen.findByText("Não foi possível carregar os dados dos membros.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument();
  });

  test("deve carregar os membros com sucesso e não exibir erro nem loading após o carregamento", async () => {
    const mockSingleMember = [
      {
        _id: "1",
        name: "Fulano de Tal",
        email: "fulano@maua.br",
        discordId: "fulano#123",
        paeHours: 10,
        modality: "CS",
      },
    ];
    fetchMembers.mockResolvedValueOnce(mockSingleMember);

    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );
    expect(
      screen.queryByText("Não foi possível carregar os dados dos membros.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ex: 24.00000-0@maua.br ou Discord ID/i)
    ).toBeEnabled();
  });

  test("deve exibir erro se o campo de busca estiver vazio ao submeter", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });
    await user.click(botaoConsultar);

    expect(
      await screen.findByText(
        "Por favor, digite seu e-mail institucional ou Discord ID."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Alice Wonderland" })
    ).not.toBeInTheDocument();
  });

  test("deve encontrar e exibir os dados do membro ao buscar por email existente (case-insensitive)", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const inputBusca = screen.getByPlaceholderText(
      /Ex: 24.00000-0@maua.br ou Discord ID/i
    );
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "ALICE@maua.br");
    await user.click(botaoConsultar);

    expect(
      await screen.findByRole("heading", { name: "Alice Wonderland" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Discord ID").closest(".detail-row")).getByText(
        "alice#1234"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("E-mail").closest(".detail-row")).getByText(
        "alice@maua.br"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Modalidade").closest(".detail-row")).getByText(
        "LoL"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Horas PAE").closest(".detail-row")).getByText(
        "25"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Usuário não encontrado/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Por favor, digite seu e-mail/i)
    ).not.toBeInTheDocument();
  });

  test("deve encontrar e exibir os dados do membro ao buscar por Discord ID existente", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const inputBusca = screen.getByPlaceholderText(
      /Ex: 24.00000-0@maua.br ou Discord ID/i
    );
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "bob#5678");
    await user.click(botaoConsultar);

    expect(
      await screen.findByRole("heading", { name: "Bob The Builder" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("E-mail").closest(".detail-row")).getByText(
        "bob@maua.br"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Horas PAE").closest(".detail-row")).getByText(
        "12"
      )
    ).toBeInTheDocument();
  });

  test("deve exibir erro se o usuário não for encontrado", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const inputBusca = screen.getByPlaceholderText(
      /Ex: 24.00000-0@maua.br ou Discord ID/i
    );
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "usuarioinexistente@maua.br");
    await user.click(botaoConsultar);

    expect(
      await screen.findByText(
        "Usuário não encontrado. Verifique o e-mail ou Discord ID."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Alice Wonderland/i })
    ).not.toBeInTheDocument();
  });

  test("deve limpar o resultado anterior ao realizar uma nova busca", async () => {
    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const inputBusca = screen.getByPlaceholderText(
      /Ex: 24.00000-0@maua.br ou Discord ID/i
    );
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "alice@maua.br");
    await user.click(botaoConsultar);
    expect(
      await screen.findByRole("heading", { name: "Alice Wonderland" })
    ).toBeInTheDocument();

    await user.clear(inputBusca);
    await user.type(inputBusca, "ninguem@maua.br");
    await user.click(botaoConsultar);

    expect(
      screen.queryByRole("heading", { name: "Alice Wonderland" })
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        "Usuário não encontrado. Verifique o e-mail ou Discord ID."
      )
    ).toBeInTheDocument();
  });

  test("deve exibir 0 para horas PAE e '-' para modalidade/discordId se não definidos no membro encontrado", async () => {
    fetchMembers.mockResolvedValueOnce(membroSemDadosOpcionais);

    render(<ConsultaHorasPAE />);
    await waitFor(() =>
      expect(screen.queryByText("Carregando dados...")).not.toBeInTheDocument()
    );

    const inputBusca = screen.getByPlaceholderText(
      /Ex: 24.00000-0@maua.br ou Discord ID/i
    );
    const botaoConsultar = screen.getByRole("button", { name: /Consultar/i });

    await user.type(inputBusca, "visitante@maua.br");
    await user.click(botaoConsultar);

    expect(
      await screen.findByRole("heading", { name: "Visitante Anonimo" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Discord ID").closest(".detail-row")).getByText(
        "-"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Modalidade").closest(".detail-row")).getByText(
        "-"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Horas PAE").closest(".detail-row")).getByText(
        "0"
      )
    ).toBeInTheDocument();
  });
});