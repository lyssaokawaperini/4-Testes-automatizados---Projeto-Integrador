import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import Contato from "./Contato"; // Ajuste o caminho se necessário

// Mock para a biblioteca emailjs
jest.mock("@emailjs/browser", () => ({
  send: jest.fn(),
}));

// Mock para componentes filhos (se não quisermos testar seus detalhes aqui)
// Isso é opcional. Se Header/Footer/ReactVLibras forem simples ou não interferirem,
// não precisa mocká-los. Se forem complexos ou fizerem chamadas de API, mockar pode ser útil.
jest.mock("./Layout/Header", () => () => <div data-testid="header-mock">Header Mock</div>);
jest.mock("./Layout/Footer", () => () => <div data-testid="footer-mock">Footer Mock</div>);
jest.mock("react-vlibras-plugin", () => () => <div data-testid="vlibras-mock">VLibras Mock</div>);


// Importar emailjs (a versão mockada) para controlar nos testes
import emailjs from "@emailjs/browser";

// Mock para funções globais do window
global.window.alert = jest.fn();
// Opcional: mockar console.error se quiser verificar se ele é chamado em caso de erro
// global.console.error = jest.fn();


// Bloco principal de testes para o componente
describe("Componente Contato", () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  // Seus testes virão aqui!
});

  test("deve renderizar os elementos estáticos principais corretamente", () => {
    render(<Contato />);

    // Verificar Cabeçalho e Rodapé (se não mockados, ou os mocks)
    expect(screen.getByTestId("header-mock")).toBeInTheDocument(); // Ou procure por texto/role real do Header
    expect(screen.getByTestId("footer-mock")).toBeInTheDocument(); // Ou procure por texto/role real do Footer
    expect(screen.getByTestId("vlibras-mock")).toBeInTheDocument(); // Ou procure por texto/role real do VLibras

    // Verificar título da página
    expect(screen.getByRole("heading", { name: /CONTATO/i })).toBeInTheDocument();
    expect(screen.getByText(/Preencha o formulário abaixo com sua mensagem/i)).toBeInTheDocument();

    // Verificar campos do formulário
    expect(screen.getByLabelText(/NOME COMPLETO/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();

    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email@maua.br")).toBeInTheDocument();

    expect(screen.getByLabelText(/MENSAGEM/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("No que podemos te ajudar?")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /ENVIAR MENSAGEM/i })).toBeInTheDocument();

    // Verificar informações de contato
    expect(screen.getByText(/esports@maua.br/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /@esportsmaua/i })).toHaveAttribute(
      "href",
      "https://www.instagram.com/esportsmaua/"
    );

    // Verificar seção de FAQ
    expect(screen.getByRole("heading", { name: /Perguntas Frequentes/i })).toBeInTheDocument();
    // Verificar se pelo menos uma pergunta do FAQ está presente
    expect(screen.getByText("O processo seletivo está aberto?")).toBeInTheDocument();
  });
  test("deve permitir que o usuário preencha o formulário", async () => {
    render(<Contato />);

    const nomeInput = screen.getByLabelText(/NOME COMPLETO/i);
    const emailInput = screen.getByLabelText(/EMAIL/i);
    const mensagemTextarea = screen.getByLabelText(/MENSAGEM/i);

    await user.type(nomeInput, "João Silva");
    await user.type(emailInput, "joao.silva@teste.com");
    await user.type(mensagemTextarea, "Olá, esta é uma mensagem de teste.");

    expect(nomeInput).toHaveValue("João Silva");
    expect(emailInput).toHaveValue("joao.silva@teste.com");
    expect(mensagemTextarea).toHaveValue("Olá, esta é uma mensagem de teste.");
  });

  test("deve enviar o formulário com sucesso e limpar os campos", async () => {
    // Mock para emailjs.send resolver com sucesso
    emailjs.send.mockResolvedValueOnce({ status: 200, text: "OK" });

    render(<Contato />);

    const nomeInput = screen.getByLabelText(/NOME COMPLETO/i);
    const emailInput = screen.getByLabelText(/EMAIL/i);
    const mensagemTextarea = screen.getByLabelText(/MENSAGEM/i);
    const botaoEnviar = screen.getByRole("button", { name: /ENVIAR MENSAGEM/i });

    // Preencher formulário
    await user.type(nomeInput, "Maria Oliveira");
    await user.type(emailInput, "maria.oliveira@teste.com");
    await user.type(mensagemTextarea, "Gostaria de saber mais sobre o processo seletivo.");
    
    // Enviar formulário
    await user.click(botaoEnviar);

    // Verificar se emailjs.send foi chamado com os dados corretos
    expect(emailjs.send).toHaveBeenCalledWith(
      "service_ujdd19b", // Service ID
      "template_q76er4c", // Template ID
      { // Dados do formulário
        nome: "Maria Oliveira",
        email: "maria.oliveira@teste.com",
        mensagem: "Gostaria de saber mais sobre o processo seletivo.",
      },
      "TndTwX4-rmLTk0oRe"  // Public Key
    );

    // Verificar se o alerta de sucesso foi exibido (após a promise resolver)
    // Usamos waitFor para esperar que a chamada assíncrona e o alert aconteçam
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Mensagem enviada com sucesso!!!");
    });

    // Verificar se os campos do formulário foram limpos
    expect(nomeInput).toHaveValue("");
    expect(emailInput).toHaveValue("");
    expect(mensagemTextarea).toHaveValue("");
  });

  test("deve exibir alerta de erro se o envio do formulário falhar", async () => {
    // Mock para emailjs.send rejeitar com um erro
    emailjs.send.mockRejectedValueOnce(new Error("Falha no envio"));

    render(<Contato />);

    const nomeInput = screen.getByLabelText(/NOME COMPLETO/i);
    const emailInput = screen.getByLabelText(/EMAIL/i);
    const mensagemTextarea = screen.getByLabelText(/MENSAGEM/i);
    const botaoEnviar = screen.getByRole("button", { name: /ENVIAR MENSAGEM/i });

    await user.type(nomeInput, "Teste Falha");
    await user.type(emailInput, "falha@teste.com");
    await user.type(mensagemTextarea, "Mensagem que vai falhar.");
    
    await user.click(botaoEnviar);

    expect(emailjs.send).toHaveBeenCalled();

    // Verificar se o alerta de erro foi exibido
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Erro ao enviar a mensagem. Tente novamente.");
    });

    // Opcional: verificar se console.error foi chamado
    // expect(console.error).toHaveBeenCalledWith("Erro ao enviar:", expect.any(Error));

    // Verificar se os campos do formulário NÃO foram limpos
    expect(nomeInput).toHaveValue("Teste Falha");
  });
  test("deve exibir e ocultar a resposta de um FAQ ao clicar na pergunta", async () => {
    render(<Contato />);
    const user = userEvent.setup();

    // Encontrar a primeira pergunta do FAQ pelo texto
    // (Assumindo que as perguntas são únicas ou você seleciona de forma mais específica)
    const primeiraPergunta = screen.getByText("O processo seletivo está aberto?");
    // A resposta está associada ao faq-item, que é pai do botão da pergunta.
    // A resposta em si tem a classe faq-answer.
    // Vamos pegar o elemento pai do botão (o faq-item) para encontrar a resposta dentro dele.
    const faqItem = primeiraPergunta.closest('.faq-item');
    const primeiraResposta = within(faqItem).getByText("Sim! As inscrições estão abertas durante o mês de março.");

    // Inicialmente, a resposta não deve estar visível (a menos que a classe 'open' já a torne visível por CSS)
    // A visibilidade aqui é controlada pela classe 'open' e CSS. RTL verifica o DOM.
    // Uma forma de testar é verificar se o container da resposta não tem a classe 'open'
    // ou, se o CSS a oculta, que ela não seja "visível" para o usuário.
    // No seu caso, a classe 'open' é adicionada ao 'faq-item'.
    expect(faqItem).not.toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");


    // Clicar na primeira pergunta para abrir
    await user.click(primeiraPergunta);
    expect(faqItem).toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "true");
    // Agora a resposta deve estar "visível" de acordo com seu CSS


    // Clicar novamente para fechar
    await user.click(primeiraPergunta);
    expect(faqItem).not.toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");
  });

  test("deve abrir uma nova resposta do FAQ e fechar a anterior, se houver", async () => {
    render(<Contato />);
    const user = userEvent.setup();

    const primeiraPergunta = screen.getByText("O processo seletivo está aberto?");
    const segundaPergunta = screen.getByText("Devo cumprir algum pré-requisito para me inscrever?");

    const faqItem1 = primeiraPergunta.closest('.faq-item');
    const faqItem2 = segundaPergunta.closest('.faq-item');

    // Abrir a primeira pergunta
    await user.click(primeiraPergunta);
    expect(faqItem1).toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "true");
    expect(faqItem2).not.toHaveClass("open");
    expect(segundaPergunta).toHaveAttribute("aria-expanded", "false");

    // Abrir a segunda pergunta
    await user.click(segundaPergunta);
    expect(faqItem1).not.toHaveClass("open"); // Primeira deve fechar
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");
    expect(faqItem2).toHaveClass("open");    // Segunda deve abrir
    expect(segundaPergunta).toHaveAttribute("aria-expanded", "true");
  });