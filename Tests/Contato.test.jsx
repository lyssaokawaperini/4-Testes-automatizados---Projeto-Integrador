import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import Contato from "../src/Contato.jsx";
import { BrowserRouter } from "react-router-dom";

jest.mock("@emailjs/browser", () => ({
  send: jest.fn(),
}));
jest.mock("../src/Header.jsx", () => () => (
  <div data-testid="header-mock">Header Mock</div>
));
jest.mock("../src/Footer.jsx", () => () => (
  <div data-testid="footer-mock">Footer Mock</div>
));
jest.mock("react-vlibras-plugin", () => () => (
  <div data-testid="vlibras-mock">VLibras Mock</div>
));

import emailjs from "@emailjs/browser";

global.window.alert = jest.fn();

describe("Componente Contato", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deve renderizar os elementos estáticos principais corretamente", () => {
    render(<Contato />);

    expect(screen.getByTestId("header-mock")).toBeInTheDocument();
    expect(screen.getByTestId("footer-mock")).toBeInTheDocument();
    expect(screen.getByTestId("vlibras-mock")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /CONTATO/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Preencha o formulário abaixo com sua mensagem/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/NOME COMPLETO/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();

    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("email@maua.br")).toBeInTheDocument();

    expect(screen.getByLabelText(/MENSAGEM/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("No que podemos te ajudar?")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /ENVIAR MENSAGEM/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/esports@maua.br/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /@esportsmaua/i })).toHaveAttribute(
      "href",
      "https://www.instagram.com/esportsmaua/"
    );

    expect(
      screen.getByRole("heading", { name: /Perguntas Frequentes/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("O processo seletivo está aberto?")
    ).toBeInTheDocument();
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
    emailjs.send.mockResolvedValueOnce({ status: 200, text: "OK" });

    render(<Contato />);

    const nomeInput = screen.getByLabelText(/NOME COMPLETO/i);
    const emailInput = screen.getByLabelText(/EMAIL/i);
    const mensagemTextarea = screen.getByLabelText(/MENSAGEM/i);
    const botaoEnviar = screen.getByRole("button", {
      name: /ENVIAR MENSAGEM/i,
    });

    await user.type(nomeInput, "Maria Oliveira");
    await user.type(emailInput, "maria.oliveira@teste.com");
    await user.type(
      mensagemTextarea,
      "Gostaria de saber mais sobre o processo seletivo."
    );

    await user.click(botaoEnviar);

    expect(emailjs.send).toHaveBeenCalledWith(
      "service_ujdd19b",
      "template_q76er4c",
      {
        nome: "Maria Oliveira",
        email: "maria.oliveira@teste.com",
        mensagem: "Gostaria de saber mais sobre o processo seletivo.",
      },
      "TndTwX4-rmLTk0oRe"
    );
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Mensagem enviada com sucesso!!!"
      );
    });

    expect(nomeInput).toHaveValue("");
    expect(emailInput).toHaveValue("");
    expect(mensagemTextarea).toHaveValue("");
  });

  test("deve exibir alerta de erro se o envio do formulário falhar", async () => {
    emailjs.send.mockRejectedValueOnce(new Error("Falha no envio"));

    render(<Contato />);

    const nomeInput = screen.getByLabelText(/NOME COMPLETO/i);
    const emailInput = screen.getByLabelText(/EMAIL/i);
    const mensagemTextarea = screen.getByLabelText(/MENSAGEM/i);
    const botaoEnviar = screen.getByRole("button", {
      name: /ENVIAR MENSAGEM/i,
    });

    await user.type(nomeInput, "Teste Falha");
    await user.type(emailInput, "falha@teste.com");
    await user.type(mensagemTextarea, "Mensagem que vai falhar.");

    await user.click(botaoEnviar);

    expect(emailjs.send).toHaveBeenCalled();

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Erro ao enviar a mensagem. Tente novamente."
      );
    });
    expect(nomeInput).toHaveValue("Teste Falha");
  });
  test("deve exibir e ocultar a resposta de um FAQ ao clicar na pergunta", async () => {
    render(<Contato />);
    const user = userEvent.setup();
    const primeiraPergunta = screen.getByText(
      "O processo seletivo está aberto?"
    );
    const faqItem = primeiraPergunta.closest(".faq-item");
    const primeiraResposta = within(faqItem).getByText(
      "Sim! As inscrições estão abertas durante o mês de março."
    );

    expect(faqItem).not.toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");

    await user.click(primeiraPergunta);
    expect(faqItem).toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "true");

    await user.click(primeiraPergunta);
    expect(faqItem).not.toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");
  });

  test("deve abrir uma nova resposta do FAQ e fechar a anterior, se houver", async () => {
    render(<Contato />);
    const user = userEvent.setup();

    const primeiraPergunta = screen.getByText(
      "O processo seletivo está aberto?"
    );
    const segundaPergunta = screen.getByText(
      "Devo cumprir algum pré-requisito para me inscrever?"
    );

    const faqItem1 = primeiraPergunta.closest(".faq-item");
    const faqItem2 = segundaPergunta.closest(".faq-item");

    await user.click(primeiraPergunta);
    expect(faqItem1).toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "true");
    expect(faqItem2).not.toHaveClass("open");
    expect(segundaPergunta).toHaveAttribute("aria-expanded", "false");

    await user.click(segundaPergunta);
    expect(faqItem1).not.toHaveClass("open");
    expect(primeiraPergunta).toHaveAttribute("aria-expanded", "false");
    expect(faqItem2).toHaveClass("open");
    expect(segundaPergunta).toHaveAttribute("aria-expanded", "true");
  });
});
