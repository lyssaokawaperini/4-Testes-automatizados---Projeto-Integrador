import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import GerenciarMembros from "../src/GerenciarMembros.jsx";

jest.mock("../src/memberApi.js", () => ({
  fetchMembers: jest.fn(),
  updateMember: jest.fn(),
  deleteMember: jest.fn(),
  createMember: jest.fn(),
}));

jest.mock("../src/api.js", () => ({
  fetchModalities: jest.fn(),
}));

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

global.window.confirm = jest.fn();
global.window.showNotification = jest.fn();

import {
  fetchMembers,
  updateMember,
  deleteMember,
  createMember,
} from "../src/memberApi.js";
import { fetchModalities } from "../src/api.js";

const renderComponent = () => {
  return render(
    <Router>
      <GerenciarMembros />
    </Router>
  );
};

describe("Componente GerenciarMembros", () => {
  const user = userEvent.setup();

  const mockModalitiesData = {
    cs: { _id: "m1", Name: "Counter-Strike", Tag: "CS" },
    lol: { _id: "m2", Name: "League of Legends", Tag: "LoL" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMembers.mockResolvedValue([]);
    fetchModalities.mockResolvedValue({});
    global.window.confirm.mockReturnValue(true);
  });

  test("deve exibir 'Carregando membros...' inicialmente e depois a lista de membros", async () => {
    const mockMembersData = [
      {
        _id: "1",
        name: "Ana Silva",
        discordId: "ana#1234",
        email: "ana@teste.com",
        modality: "CS",
        role: "member",
        paeHours: 10,
      },
      {
        _id: "2",
        name: "Bruno Costa",
        discordId: "bruno#5678",
        email: "bruno@teste.com",
        modality: "LoL",
        role: "captain",
        paeHours: 20,
      },
    ];
    fetchMembers.mockImplementationOnce(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockMembersData), 0))
    );
    fetchModalities.mockResolvedValueOnce({
      modCS: { _id: "cs1", Name: "Counter-Strike", Tag: "CS" },
      modLoL: { _id: "lol1", Name: "League of Legends", Tag: "LoL" },
    });

    renderComponent();
    expect(screen.getByText("Carregando membros...")).toBeInTheDocument();

    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Bruno Costa")).toBeInTheDocument();
    expect(screen.queryByText("Carregando membros...")).not.toBeInTheDocument();
  });

  test("deve exibir mensagem de erro se o carregamento de membros falhar", async () => {
    fetchMembers.mockRejectedValueOnce(
      new Error("Falha ao buscar membros da API")
    );
    fetchModalities.mockResolvedValueOnce({});

    renderComponent();

    expect(
      await screen.findByText(
        /Não foi possível carregar os membros. Por favor, tente novamente mais tarde./i
      )
    ).toBeInTheDocument();
  });

  test("deve exibir uma tabela vazia (ou mensagem apropriada) se não houver membros", async () => {
    fetchMembers.mockResolvedValueOnce([]);
    fetchModalities.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() =>
      expect(
        screen.queryByText("Carregando membros...")
      ).not.toBeInTheDocument()
    );

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.queryByText("Ana Silva")).not.toBeInTheDocument();
  });

  test("deve abrir o modal 'Adicionar Membro', permitir preenchimento e chamar createMember ao salvar", async () => {
    fetchMembers.mockResolvedValueOnce([]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);

    const novoMembroMock = {
      _id: "novo1",
      name: "Carlos Lima",
      discordId: "carlos#0001",
      email: "carlos@maua.br",
      role: "member",
      modality: "CS",
      paeHours: 0,
    };
    createMember.mockResolvedValueOnce(novoMembroMock);

    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /Adicionar Membro/i }));
    expect(
      await screen.findByRole("heading", { name: "ADICIONAR MEMBRO" })
    ).toBeInTheDocument();

    const modalAdicionar = screen.getByRole("heading", { name: "ADICIONAR MEMBRO" }).closest("div.edit-modal-content");

    await user.type(within(modalAdicionar).getByPlaceholderText("Nome completo do aluno"), novoMembroMock.name);
    await user.type(within(modalAdicionar).getByPlaceholderText("Ex: usuario#1234"), novoMembroMock.discordId);
    await user.type(within(modalAdicionar).getByPlaceholderText("Ex: 24.00000-0@maua.br"), novoMembroMock.email);

    const roleSelectAdd = within(modalAdicionar).getByLabelText("FUNÇÃO");
    await user.selectOptions(roleSelectAdd, "captain");

    const modalitySelectAdd = within(modalAdicionar).getByLabelText("MODALIDADE");
    expect(await within(modalitySelectAdd).findByText("Counter-Strike")).toBeVisible();
    await user.selectOptions(modalitySelectAdd, "CS");

    await user.type(within(modalAdicionar).getByLabelText("HORAS PAE"), String(novoMembroMock.paeHours));

    await user.click(within(modalAdicionar).getByRole("button", { name: "ADICIONAR" }));

    expect(createMember).toHaveBeenCalledWith({
      name: novoMembroMock.name,
      discordId: novoMembroMock.discordId,
      email: novoMembroMock.email,
      role: "captain",
      modality: "CS",
      teams: [],
      paeHours: novoMembroMock.paeHours,
    });
    expect(window.showNotification).toHaveBeenCalledWith(
      "success",
      "Membro adicionado com sucesso!",
      3000
    );
    expect(screen.queryByRole("heading", { name: "ADICIONAR MEMBRO" })).not.toBeInTheDocument();
    expect(await screen.findByText(novoMembroMock.name)).toBeInTheDocument();
  });

  test("deve exibir notificação de erro se createMember falhar", async () => {
    fetchMembers.mockResolvedValueOnce([]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    createMember.mockRejectedValueOnce(new Error("Erro na API ao criar"));

    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Adicionar Membro/i }));
    const modalAdicionar = await screen.findByRole("heading", { name: "ADICIONAR MEMBRO" });

    await user.type(screen.getByPlaceholderText("Nome completo do aluno"), "Membro Teste Erro");
    await user.type(screen.getByPlaceholderText("Ex: 24.00000-0@maua.br"), "erro@teste.com");

    await user.click(screen.getByRole("button", { name: "ADICIONAR" }));

    expect(createMember).toHaveBeenCalled();
    expect(window.showNotification).toHaveBeenCalledWith(
      "error",
      "Erro ao adicionar membro!",
      5000
    );
  });

  test("deve abrir o modal 'Editar Membro' com os dados corretos e salvar as alterações", async () => {
    const membroParaEditar = {
      _id: "edit1", name: "Julia Alves", discordId: "julia#1111", email: "julia@maua.br",
      role: "member", modality: "LoL", paeHours: 5,
    };
    const membroAtualizadoMock = { ...membroParaEditar, name: "Julia Alves Martins", paeHours: 15 };

    fetchMembers.mockResolvedValueOnce([membroParaEditar]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    updateMember.mockResolvedValueOnce(membroAtualizadoMock);

    renderComponent();
    expect(await screen.findByText("Julia Alves")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Carregando modalidades...")).not.toBeInTheDocument());

    const linhaJulia = screen.getByText("Julia Alves").closest("tr");
    const botaoEditarJulia = within(linhaJulia).getByRole("button", { name: /edit/i });
    await user.click(botaoEditarJulia);

    const modalEditarHeading = await screen.findByRole("heading", { name: "EDITAR MEMBRO" });
    expect(modalEditarHeading).toBeInTheDocument();
    const modalEditar = modalEditarHeading.closest("div.edit-modal-content");

    expect(within(modalEditar).getByLabelText("NOME")).toHaveValue("Julia Alves");
    expect(within(modalEditar).getByLabelText("EMAIL")).toHaveValue("julia@maua.br");
    expect(within(modalEditar).getByLabelText("MODALIDADE")).toHaveValue("LoL");

    const inputNome = within(modalEditar).getByLabelText("NOME");
    await user.clear(inputNome);
    await user.type(inputNome, "Julia Alves Martins");

    const inputHoras = within(modalEditar).getByLabelText("HORAS PAE");
    await user.clear(inputHoras);
    await user.type(inputHoras, "15");

    await user.click(within(modalEditar).getByRole("button", { name: "SALVAR" }));

    expect(updateMember).toHaveBeenCalledWith(
      membroParaEditar._id,
      expect.objectContaining({ name: "Julia Alves Martins", paeHours: 15, modality: "LoL" })
    );
    expect(window.showNotification).toHaveBeenCalledWith("success", "Membro atualizado com sucesso!", 3000);
    expect(screen.queryByRole("heading", { name: "EDITAR MEMBRO" })).not.toBeInTheDocument();
    expect(await screen.findByText("Julia Alves Martins")).toBeInTheDocument();
    expect(screen.queryByText("Julia Alves")).not.toBeInTheDocument();
  });

  test("deve excluir um membro com sucesso após confirmação", async () => {
    const membroParaExcluir = {
      _id: "del1", name: "Pedro Rocha", discordId: "pedro#2222", email: "pedro@maua.br",
      role: "admin", modality: "CS", paeHours: 0,
    };
    fetchMembers.mockResolvedValueOnce([membroParaExcluir]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    deleteMember.mockResolvedValueOnce({});
    global.window.confirm.mockReturnValueOnce(true);

    renderComponent();
    expect(await screen.findByText("Pedro Rocha")).toBeInTheDocument();

    const linhaPedro = screen.getByText("Pedro Rocha").closest("tr");
    const botaoExcluirPedro = within(linhaPedro).getByRole("button", { name: /delete/i });
    await user.click(botaoExcluirPedro);

    expect(global.window.confirm).toHaveBeenCalledWith("Tem certeza que deseja excluir este membro?");
    expect(deleteMember).toHaveBeenCalledWith(membroParaExcluir._id);
    expect(window.showNotification).toHaveBeenCalledWith("success", "Membro excluído com sucesso!", 3000);
    await waitFor(() => {
      expect(screen.queryByText("Pedro Rocha")).not.toBeInTheDocument();
    });
  });

  test("NÃO deve excluir um membro se a confirmação for cancelada", async () => {
    const membroParaNaoExcluir = {
      _id: "nodelete1", name: "Laura Mendes", discordId: "laura#3333", email: "laura@maua.br",
      role: "member", modality: "LoL", paeHours: 0,
    };
    fetchMembers.mockResolvedValueOnce([membroParaNaoExcluir]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    global.window.confirm.mockReturnValueOnce(false);

    renderComponent();
    expect(await screen.findByText("Laura Mendes")).toBeInTheDocument();

    const linhaLaura = screen.getByText("Laura Mendes").closest("tr");
    const botaoExcluirLaura = within(linhaLaura).getByRole("button", { name: /delete/i });
    await user.click(botaoExcluirLaura);

    expect(global.window.confirm).toHaveBeenCalledWith("Tem certeza que deseja excluir este membro?");
    expect(deleteMember).not.toHaveBeenCalled();
    expect(window.showNotification).not.toHaveBeenCalledWith("success", "Membro excluído com sucesso!", 3000);
    expect(screen.getByText("Laura Mendes")).toBeInTheDocument();
  });

  test("deve filtrar membros ao digitar no campo de pesquisa", async () => {
    const membros = [
      { _id: "s1", name: "Mario Andrade", email: "mario@teste.com", modality: "CS", role: "member" },
      { _id: "s2", name: "Luigi Santos", email: "luigi@teste.com", modality: "LoL", role: "captain" },
      { _id: "s3", name: "Peach Oliveira", email: "peach@teste.com", modality: "CS", role: "member" },
    ];
    fetchMembers.mockResolvedValueOnce(membros);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);

    renderComponent();
    expect(await screen.findByText("Mario Andrade")).toBeInTheDocument();
    expect(screen.getByText("Luigi Santos")).toBeInTheDocument();
    expect(screen.getByText("Peach Oliveira")).toBeInTheDocument();

    const campoPesquisa = screen.getByPlaceholderText("Pesquise por nome, ID ou email");
    await user.type(campoPesquisa, "Mario");
    expect(screen.getByText("Mario Andrade")).toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.queryByText("Peach Oliveira")).not.toBeInTheDocument();

    await user.clear(campoPesquisa);
    await user.type(campoPesquisa, "CS");
    expect(screen.getByText("Mario Andrade")).toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.getByText("Peach Oliveira")).toBeInTheDocument();

    await user.clear(campoPesquisa);
    await user.type(campoPesquisa, "ZeldaInexistente");
    expect(screen.queryByText("Mario Andrade")).not.toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.queryByText("Peach Oliveira")).not.toBeInTheDocument();
  });
});