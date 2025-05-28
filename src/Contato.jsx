import React, { useState } from "react";
import { useEffect } from "react";
import emailjs from "@emailjs/browser";
import "../styles/Contato.css";
import { FaInstagram } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";

import ReactVLibras from "react-vlibras-plugin";

function Contato() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    mensagem: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .send(
        "service_ujdd19b",
        "template_q76er4c",
        formData,
        "TndTwX4-rmLTk0oRe"
      )
      .then((response) => {
        alert("Mensagem enviada com sucesso!!!");
        setFormData({ nome: "", email: "", mensagem: "" });
      })
      .catch((err) => {
        console.error("Erro ao enviar:", err);
        alert("Erro ao enviar a mensagem. Tente novamente.");
      });
  };

  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  const faqList = [
    {
      question: "O processo seletivo está aberto?",
      answer: "Sim! As inscrições estão abertas durante o mês de março.",
    },
    {
      question: "Devo cumprir algum pré-requisito para me inscrever?",
      answer:
        "Não há pré-requisitos técnicos. Qualquer aluno pode se inscrever!",
    },
    {
      question: "Quais campeonatos vocês participam?",
      answer: "Participamos de torneios universitários e campeonatos online.",
    },
    {
      question: "Quais times que tem no Mauá E-Sports?",
      answer:
        "Temos times de League of Legends, Valorant, CS:GO, e Rocket League.",
    },
    {
      question: "Quais times que tem no Mauá E-Sports?",
      answer:
        "Temos times de League of Legends, Valorant, CS:GO, e Rocket League.",
    },
    {
      question: "Quais times que tem no Mauá E-Sports?",
      answer:
        "Temos times de League of Legends, Valorant, CS:GO, e Rocket League.",
    },
  ];

  const toggleFAQ = (index) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  useEffect(() => {
    const checkVLibras = setInterval(() => {
      const pluginRoot = document.querySelector(".vw-plugin-wrapper");
      if (pluginRoot) {
        console.log("VLibras carregado com sucesso");
        clearInterval(checkVLibras);
      }
    }, 500);

    return () => clearInterval(checkVLibras);
  }, []);

  return (
    <div className="contato-container">
      <Header />

      <main className="comeco-content">
        <h1>CONTATO</h1>
        <p>
          Preencha o formulário abaixo com sua mensagem, dúvida ou sugestão. As
          informações enviadas serão encaminhadas diretamente para o nosso
          e-mail institucional e entraremos em contato o mais breve possível.
        </p>
      </main>
      <section className="formulario-secao">
        <form className="formulario-contato" onSubmit={handleSubmit}>
          <label htmlFor="nome" className="rotulo-campo">
            NOME COMPLETO
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            className="input-campo"
            placeholder="Nome completo"
            value={formData.nome}
            onChange={handleChange}
          />

          <label htmlFor="email" className="rotulo-campo">
            EMAIL
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="input-campo"
            placeholder="email@maua.br"
            value={formData.email}
            onChange={handleChange}
          />

          <label htmlFor="mensagem" className="rotulo-campo">
            MENSAGEM
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            className="textarea-campo"
            placeholder="No que podemos te ajudar?"
            value={formData.mensagem}
            onChange={handleChange}
          ></textarea>

          <button type="submit" className="botao-enviar">
            ENVIAR MENSAGEM
          </button>
        </form>
      </section>

      <div className="contato-info">
        <span>
          {" "}
          <IoMail className="icon-info" /> esports@maua.br
        </span>
        <a
          href="https://www.instagram.com/esportsmaua/"
          target="_blank"
          rel="noopener noreferrer"
          className="link-instagram"
        >
          <FaInstagram className="icon-info" /> @esportsmaua
        </a>
      </div>

      <section className="faq-container">
        <h2 className="faq-title">Perguntas Frequentes</h2>
        <div className="faq-list">
          {faqList.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${faqOpenIndex === index ? "open" : ""}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={faqOpenIndex === index}
              >
                {item.question}
              </button>
              <div className="faq-answer">{item.answer}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ zIndex: 9999, position: "relative" }}>
        <ReactVLibras position="right" avatar="guga" opacity={1} />
      </div>

      <Footer />
    </div>
  );
}

export default Contato;
