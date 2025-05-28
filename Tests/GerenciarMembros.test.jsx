import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { BrowserRouter as Router } from "react-router-dom";
import GerenciarMembros from "./GerenciarMembros"; // Ajuste o caminho se necessário

// Mock das funções de memberApi.js
// Ajuste o caminho para seu arquivo memberApi.js
jest.mock("../Service/memberApi.js", () => ({
  fetchMembers: jest.fn(),
  updateMember: jest.fn(),
  deleteMember: jest.fn(),
  createMember: jest.fn(),
}));

// Mock das funções de api.js (para fetchModalities)
// Ajuste o caminho para seu arquivo api.js
jest.mock("../Service/api.js", () => ({
  fetchModalities: jest.fn(),
}));

// Mock para useNavigate
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

// Mock para funções globais do window
global.window.confirm = jest.fn();
global.window.showNotification = jest.fn();


// Importar as funções mockadas para poder controlá-las nos testes
import {
  fetchMembers,
  updateMember,
  deleteMember,
  createMember,
} from "../Service/memberApi.js"; // Ajuste o caminho
import { fetchModalities } from "../Service/api.js"; // Ajuste o caminho


// Função helper para renderizar o componente com o Router
const renderComponent = () => {
  return render(
    <Router>
      <GerenciarMembros />
    </Router>
  );
};

// Bloco principal de testes para o componente
describe("Componente GerenciarMembros", () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();

    // Mocks padrão para chamadas de API iniciais
    fetchMembers.mockResolvedValue([]);
    fetchModalities.mockResolvedValue({}); // API original parece retornar objeto para modalidades

    // Mock padrão para window.confirm
    global.window.confirm.mockReturnValue(true); // Padrão para confirmar a ação
  });

  test("deve exibir 'Carregando membros...' inicialmente e depois a lista de membros", async () => {
    const mockMembersData = [
      { _id: "1", name: "Ana Silva", discordId: "ana#1234", email: "ana@teste.com", modality: "CS", role: "member", paeHours: 10 },
      { _id: "2", name: "Bruno Costa", discordId: "bruno#5678", email: "bruno@teste.com", modality: "LoL", role: "captain", paeHours: 20 },
    ];
    fetchMembers.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(mockMembersData), 0))
    );
    // Mock para fetchModalities que é chamado no useEffect também
    fetchModalities.mockResolvedValueOnce({ modCS: { _id: "cs1", Name: "Counter-Strike", Tag: "CS" } });


    renderComponent();

    expect(screen.getByText("Carregando membros...")).toBeInTheDocument();

    // Esperar que os membros apareçam na tabela
    expect(await screen.findByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Bruno Costa")).toBeInTheDocument();
    expect(screen.queryByText("Carregando membros...")).not.toBeInTheDocument();
  });

  test("deve exibir mensagem de erro se o carregamento de membros falhar", async () => {
    fetchMembers.mockRejectedValueOnce(new Error("Falha ao buscar membros da API"));
    fetchModalities.mockResolvedValueOnce({}); // fetchModalities pode ter sucesso

    renderComponent();

    expect(await screen.findByText(/Não foi possível carregar os membros. Por favor, tente novamente mais tarde./i)).toBeInTheDocument();
  });

  test("deve exibir uma tabela vazia (ou mensagem) se não houver membros após o carregamento", async () => {
    fetchMembers.mockResolvedValueOnce([]); // Retorna array vazio
    fetchModalities.mockResolvedValueOnce({});

    renderComponent();

    // Esperar o carregamento terminar
    await waitFor(() => expect(screen.queryByText("Carregando membros...")).not.toBeInTheDocument());

    // Verificar se a tabela está presente, mas sem linhas de dados (exceto cabeçalho)
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    const tbody = table.querySelector("tbody");
    // O componente renderiza filteredMembers.map(...), então se filteredMembers for vazio, o tbody não terá <tr> de dados.
    // Se você adicionar uma mensagem "Nenhum membro encontrado" quando a lista estiver vazia, teste por ela aqui.
    // Por enquanto, vamos verificar se algum nome de membro dos mocks anteriores NÃO está presente.
    expect(screen.queryByText("Ana Silva")).not.toBeInTheDocument();
    // Para ser mais robusto, você poderia verificar se o tbody tem 0 tr ou um tr com uma mensagem de "nenhum membro".
    // Ex: expect(tbody.querySelectorAll('tr').length).toBe(0); // se não houver mensagem de 'nenhum membro'
  });
  const mockModalitiesData = {
    cs: { _id: "m1", Name: "Counter-Strike", Tag: "CS" },
    lol: { _id: "m2", Name: "League of Legends", Tag: "LoL" },
  };

  test("deve abrir o modal 'Adicionar Membro', permitir preenchimento e chamar createMember ao salvar", async () => {
    const user = userEvent.setup();
    fetchMembers.mockResolvedValueOnce([]); // Nenhuns membros iniciais
    fetchModalities.mockResolvedValueOnce(mockModalitiesData); // Modalidades para o select

    const novoMembroMock = {
      _id: "novo1", name: "Carlos Lima", discordId: "carlos#0001", email: "carlos@maua.br", role: "member", modality: "CS", paeHours: 0
    };
    createMember.mockResolvedValueOnce(novoMembroMock); // O que a API retorna ao criar

    renderComponent();
    await waitFor(() => expect(screen.queryByText("Carregando membros...")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText("Carregando modalidades...")).not.toBeInTheDocument());


    // 1. Clicar no botão "Adicionar Membro"
    await user.click(screen.getByRole("button", { name: /Adicionar Membro/i }));

    // 2. Verificar se o modal abriu
    expect(await screen.findByRole("heading", { name: "ADICIONAR MEMBRO" })).toBeInTheDocument();

    // 3. Preencher o formulário
    await user.type(screen.getByPlaceholderText("Nome completo do aluno"), novoMembroMock.name);
    await user.type(screen.getByPlaceholderText("Ex: usuario#1234"), novoMembroMock.discordId);
    await user.type(screen.getByPlaceholderText("Ex: 24.00000-0@maua.br"), novoMembroMock.email);

    // Selecionar função (o valor padrão é 'member', então podemos testar mudando)
    // O Label para o select de FUNÇÃO no modal de adicionar é "FUNÇÃO"
    const roleSelectAdd = within(screen.getByRole('heading', { name: 'ADICIONAR MEMBRO' }).closest('div.edit-modal-content')).getByLabelText('FUNÇÃO');
    await user.selectOptions(roleSelectAdd, "captain");


    // Selecionar modalidade
    // O Label para o select de MODALIDADE no modal de adicionar é "MODALIDADE"
    const modalitySelectAdd = within(screen.getByRole('heading', { name: 'ADICIONAR MEMBRO' }).closest('div.edit-modal-content')).getByLabelText('MODALIDADE');
    // Esperar as opções de modalidade carregarem no select
    expect(await within(modalitySelectAdd).findByText("Counter-Strike")).toBeVisible();
    await user.selectOptions(modalitySelectAdd, "CS");


    await user.type(within(screen.getByRole('heading', { name: 'ADICIONAR MEMBRO' }).closest('div.edit-modal-content')).getByLabelText('HORAS PAE'), String(novoMembroMock.paeHours));


    // 4. Clicar em "ADICIONAR"
    await user.click(screen.getByRole("button", { name: "ADICIONAR" }));

    // 5. Verificar se createMember foi chamado com os dados corretos
    expect(createMember).toHaveBeenCalledWith({
      name: novoMembroMock.name,
      discordId: novoMembroMock.discordId,
      email: novoMembroMock.email,
      role: "captain", // Mudamos no teste
      modality: "CS", // Selecionamos
      teams: [], // Valor padrão do estado newMember
      paeHours: novoMembroMock.paeHours,
    });

    // 6. Verificar se a notificação de sucesso foi chamada
    expect(window.showNotification).toHaveBeenCalledWith("success", "Membro adicionado com sucesso!", 3000);

    // 7. Verificar se o modal fechou
    expect(screen.queryByRole("heading", { name: "ADICIONAR MEMBRO" })).not.toBeInTheDocument();

    // 8. Verificar se o novo membro aparece na lista
    expect(await screen.findByText(novoMembroMock.name)).toBeInTheDocument();
  });

  test("deve exibir notificação de erro se createMember falhar", async () => {
    const user = userEvent.setup();
    fetchMembers.mockResolvedValueOnce([]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    createMember.mockRejectedValueOnce(new Error("Erro na API ao criar"));

    renderComponent();
    await waitFor(() => expect(screen.queryByText("Carregando membros...")).not.toBeInTheDocument());


    await user.click(screen.getByRole("button", { name: /Adicionar Membro/i }));
    await screen.findByRole("heading", { name: "ADICIONAR MEMBRO" });

    // Preencher o mínimo para tentar salvar
    await user.type(screen.getByPlaceholderText("Nome completo do aluno"), "Membro Teste Erro");
    await user.type(screen.getByPlaceholderText("Ex: 24.00000-0@maua.br"), "erro@teste.com");

    await user.click(screen.getByRole("button", { name: "ADICIONAR" }));

    expect(createMember).toHaveBeenCalled();
    expect(window.showNotification).toHaveBeenCalledWith("error", "Erro ao adicionar membro!", 5000);
    // O modal deve permanecer aberto ou fechar dependendo da sua implementação
    // expect(screen.getByRole("heading", { name: "ADICIONAR MEMBRO" })).toBeInTheDocument();
  });
  test("deve abrir o modal 'Editar Membro' com os dados corretos e salvar as alterações", async () => {
    const user = userEvent.setup();
    const membroParaEditar = {
      _id: "edit1", name: "Julia Alves", discordId: "julia#1111", email: "julia@maua.br", role: "member", modality: "LoL", paeHours: 5
    };
    const membroAtualizadoMock = { // O que a API updateMember retorna
      ...membroParaEditar, name: "Julia Alves Martins", paeHours: 15
    };

    fetchMembers.mockResolvedValueOnce([membroParaEditar]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    updateMember.mockResolvedValueOnce(membroAtualizadoMock);

    renderComponent();
    // Esperar o membro inicial aparecer
    expect(await screen.findByText("Julia Alves")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Carregando modalidades...")).not.toBeInTheDocument());


    // 1. Clicar no botão de editar do membro "Julia Alves"
    // Encontrar a linha da tabela que contém "Julia Alves" e depois o botão de editar dentro dessa linha
    const linhaJulia = screen.getByText("Julia Alves").closest("tr");
    const botaoEditarJulia = within(linhaJulia).getByRole("button", { name: /edit/i }); // Assume que o botão tem um aria-label "edit" ou similar
    await user.click(botaoEditarJulia);

    // 2. Verificar se o modal "EDITAR MEMBRO" abriu
    expect(await screen.findByRole("heading", { name: "EDITAR MEMBRO" })).toBeInTheDocument();

    // 3. Verificar se os campos estão preenchidos com os dados de Julia
    const modalEditar = screen.getByRole('heading', { name: 'EDITAR MEMBRO' }).closest('div.edit-modal-content');
    expect(within(modalEditar).getByLabelText("NOME")).toHaveValue("Julia Alves");
    expect(within(modalEditar).getByLabelText("EMAIL")).toHaveValue("julia@maua.br");
    expect(within(modalEditar).getByLabelText("MODALIDADE")).toHaveValue("LoL"); // O valor do select é a Tag da modalidade


    // 4. Modificar o nome e horas PAE
    const inputNome = within(modalEditar).getByLabelText("NOME");
    await user.clear(inputNome);
    await user.type(inputNome, "Julia Alves Martins");

    const inputHoras = within(modalEditar).getByLabelText("HORAS PAE");
    await user.clear(inputHoras);
    await user.type(inputHoras, "15");


    // 5. Clicar em "SALVAR"
    await user.click(within(modalEditar).getByRole("button", { name: "SALVAR" }));

    // 6. Verificar se updateMember foi chamado corretamente
    expect(updateMember).toHaveBeenCalledWith(membroParaEditar._id, expect.objectContaining({
      name: "Julia Alves Martins",
      paeHours: 15,
      modality: "LoL" // Manteve a modalidade
    }));

    // 7. Verificar notificação de sucesso
    expect(window.showNotification).toHaveBeenCalledWith("success", "Membro atualizado com sucesso!", 3000);

    // 8. Verificar se o modal fechou
    expect(screen.queryByRole("heading", { name: "EDITAR MEMBRO" })).not.toBeInTheDocument();

    // 9. Verificar se o nome foi atualizado na tabela
    expect(await screen.findByText("Julia Alves Martins")).toBeInTheDocument();
    expect(screen.queryByText("Julia Alves")).not.toBeInTheDocument(); // Nome antigo sumiu
  });


  // Dentro do describe("Componente GerenciarMembros", () => { ... });

  test("deve excluir um membro com sucesso após confirmação", async () => {
    const user = userEvent.setup();
    const membroParaExcluir = {
      _id: "del1", name: "Pedro Rocha", discordId: "pedro#2222", email: "pedro@maua.br", role: "admin", modality: "CS", paeHours: 0
    };
    fetchMembers.mockResolvedValueOnce([membroParaExcluir]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);
    deleteMember.mockResolvedValueOnce({}); // API de delete geralmente retorna sucesso vazio ou o objeto deletado

    // Mock para window.confirm retornar true
    global.window.confirm.mockReturnValueOnce(true);

    renderComponent();
    expect(await screen.findByText("Pedro Rocha")).toBeInTheDocument(); // Esperar membro aparecer

    // 1. Clicar no botão de excluir do membro "Pedro Rocha"
    const linhaPedro = screen.getByText("Pedro Rocha").closest("tr");
    const botaoExcluirPedro = within(linhaPedro).getByRole("button", { name: /delete/i }); // Assume aria-label "delete"
    await user.click(botaoExcluirPedro);

    // 2. Verificar se window.confirm foi chamado
    expect(global.window.confirm).toHaveBeenCalledWith("Tem certeza que deseja excluir este membro?");

    // 3. Verificar se deleteMember foi chamado com o ID correto
    expect(deleteMember).toHaveBeenCalledWith(membroParaExcluir._id);

    // 4. Verificar notificação de sucesso
    expect(window.showNotification).toHaveBeenCalledWith("success", "Membro excluído com sucesso!", 3000);

    // 5. Verificar se o membro "Pedro Rocha" não está mais na lista
    // Precisamos esperar a remoção da UI
    await waitFor(() => {
      expect(screen.queryByText("Pedro Rocha")).not.toBeInTheDocument();
    });
  });

  test("NÃO deve excluir um membro se a confirmação for cancelada", async () => {
    const user = userEvent.setup();
    const membroParaNaoExcluir = {
      _id: "nodelete1", name: "Laura Mendes", discordId: "laura#3333", email: "laura@maua.br", role: "member", modality: "LoL", paeHours: 0
    };
    fetchMembers.mockResolvedValueOnce([membroParaNaoExcluir]);
    fetchModalities.mockResolvedValueOnce(mockModalitiesData);

    // Mock para window.confirm retornar false
    global.window.confirm.mockReturnValueOnce(false);

    renderComponent();
    expect(await screen.findByText("Laura Mendes")).toBeInTheDocument();

    const linhaLaura = screen.getByText("Laura Mendes").closest("tr");
    const botaoExcluirLaura = within(linhaLaura).getByRole("button", { name: /delete/i });
    await user.click(botaoExcluirLaura);

    expect(global.window.confirm).toHaveBeenCalledWith("Tem certeza que deseja excluir este membro?");
    
    // deleteMember NÃO deve ter sido chamado
    expect(deleteMember).not.toHaveBeenCalled();
    // showNotification NÃO deve ter sido chamada para sucesso de exclusão
    expect(window.showNotification).not.toHaveBeenCalledWith("success", "Membro excluído com sucesso!", 3000);

    // Membro "Laura Mendes" ainda deve estar na lista
    expect(screen.getByText("Laura Mendes")).toBeInTheDocument();
  });
  test("deve filtrar membros ao digitar no campo de pesquisa", async () => {
    const user = userEvent.setup();
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

    // 1. Pesquisar por "Mario"
    const campoPesquisa = screen.getByPlaceholderText("Pesquise por nome, ID ou email");
    await user.type(campoPesquisa, "Mario");

    // Verificar resultados
    expect(screen.getByText("Mario Andrade")).toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.queryByText("Peach Oliveira")).not.toBeInTheDocument();

    // 2. Limpar pesquisa e pesquisar por "CS" (modalidade)
    await user.clear(campoPesquisa);
    await user.type(campoPesquisa, "CS");

    expect(screen.getByText("Mario Andrade")).toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.getByText("Peach Oliveira")).toBeInTheDocument(); // Peach também é CS

    // 3. Pesquisar por algo que não existe
    await user.clear(campoPesquisa);
    await user.type(campoPesquisa, "ZeldaInexistente");
    // O componente não tem uma mensagem "Nenhum membro encontrado" para a pesquisa especificamente,
    // ele apenas renderiza uma tabela vazia se filteredMembers for vazio.
    expect(screen.queryByText("Mario Andrade")).not.toBeInTheDocument();
    expect(screen.queryByText("Luigi Santos")).not.toBeInTheDocument();
    expect(screen.queryByText("Peach Oliveira")).not.toBeInTheDocument();
  });
});

  