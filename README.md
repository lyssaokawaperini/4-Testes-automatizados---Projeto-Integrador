# 🧪 Projeto Integrador - Testes Automatizados com TDD (React)

Este repositório contém um projeto desenvolvido por alunos de Ciência da Computação (CIC) como parte do Projeto Integrador. O foco principal é aplicar os princípios de **Test-Driven Development (TDD)** utilizando **React** e testes automatizados com **Jest** e **React Testing Library**.

---

## 🎯 Objetivo

- Aplicar TDD no desenvolvimento de funcionalidades React.
- Garantir a qualidade do código com testes automatizados.
- Seguir o ciclo: **Red → Green → Refactor**.
- Criar uma aplicação web interativa e responsiva.
- Utilizar boas práticas de versionamento e organização de código.

---

## 🔧 Tecnologias Utilizadas

- **React** – Biblioteca principal para construção da interface.
- **CSS** – Estilização dos componentes.
- **Jest** – Framework de testes.
- **React Testing Library** – Utilizada para testes de componentes React.
- **Visual Studio Code** – Ambiente de desenvolvimento.
- **React Router DOM** – Para controle de rotas (se aplicável).
- **Mock de APIs** com `jest.fn()`.

---

## ✨ Funcionalidades Desenvolvidas

- Gerenciamento de treinos:
  - ✅ Listagem de treinos
  - ✅ Adição de novo treino via modal
  - ✅ Validação de formulário
  - ✅ Feedback visual de sucesso e erro
  - 🚧 Edição e exclusão de treinos (em desenvolvimento)

---

## ✅ Requisitos de Testes Automatizados

Os testes são escritos **antes da implementação** de cada funcionalidade, seguindo o ciclo TDD. Os principais casos cobertos incluem:

- Renderização inicial e carregamento de dados
- Tratamento de erro da API
- Comportamento do modal de adicionar treino
- Submissão do formulário e chamadas à API
- Estados condicionais de erro, sucesso e loading

Exemplo de testes incluídos:
```bash
✔️ Exibe loading durante a busca
✔️ Mostra "Nenhum treino encontrado" se a lista estiver vazia
✔️ Mostra erro se a requisição falhar
✔️ Abre e fecha modal corretamente
✔️ Submete treino novo e exibe sucesso
✔️ Lida com falha ao cadastrar treino
