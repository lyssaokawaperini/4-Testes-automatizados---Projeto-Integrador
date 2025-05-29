import React, { useState, useEffect } from "react";
import "./ConsultaHorasPAE.css";
import {
  FaSearch,
  FaUserCircle,
  FaClock,
  FaGamepad,
  FaDiscord,
} from "react-icons/fa";
import { fetchMembers } from "memberApi.js";
import Footer from "./Layout/Footer";
import HeaderAdmin from "./Layout/HeaderAdmin.jsx";

const ConsultaHorasPAE = () => {
  const [input, setInput] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchMembers();
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar membros:", err);
        setError("Não foi possível carregar os dados dos membros.");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!input.trim()) {
      setError("Por favor, digite seu e-mail institucional ou Discord ID.");
      return;
    }

    const found = members.find(
      (m) =>
        (m.email && m.email.toLowerCase() === input.toLowerCase()) ||
        (m.discordId && m.discordId.toLowerCase() === input.toLowerCase())
    );

    if (found) {
      setResult(found);
    } else {
      setError("Usuário não encontrado. Verifique o e-mail ou Discord ID.");
    }
  };

  return (
    <div className="consulta-pae-page">
      <HeaderAdmin />

      <main className="consulta-pae-main">
        <div className="title-section">
          <h1>CONSULTA DE HORAS PAE</h1>
        </div>

        <div className="consulta-pae-content">
          <div className="search-section">
            <h2>Digite seu e-mail institucional ou Discord ID</h2>
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-box-container">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Ex: 24.00000-0@maua.br ou Discord ID"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="search-button">
                  Consultar
                </button>
              </div>
            </form>
          </div>

          {loading && <div className="loading">Carregando dados...</div>}

          {error && !loading && <div className="error-message">{error}</div>}

          {result && !loading && (
            <div className="result-container">
              <div className="result-header">
                <div className="user-icon-container">
                  <FaUserCircle className="user-icon" />
                </div>
                <h2>{result.name}</h2>
              </div>

              <div className="result-details">
                <div className="detail-row">
                  <div className="detail-icon">
                    <FaDiscord />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Discord ID</span>
                    <span className="detail-value">
                      {result.discordId || "-"}
                    </span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-icon">
                    <FaSearch />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">E-mail</span>
                    <span className="detail-value">{result.email}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-icon">
                    <FaGamepad />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Modalidade</span>
                    <span className="detail-value">
                      {result.modality || "-"}
                    </span>
                  </div>
                </div>

                <div className="detail-row hours-row">
                  <div className="detail-icon">
                    <FaClock />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Horas PAE</span>
                    <span className="detail-value hours-value">
                      {result.paeHours || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConsultaHorasPAE;
