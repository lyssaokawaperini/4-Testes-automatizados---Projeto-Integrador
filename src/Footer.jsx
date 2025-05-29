import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaDiscord, FaTwitch, FaYoutube } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-wrapper">
        <div className="footer-brand">
          <img
            src={mauaLogo}
            alt="Logo Mauá Esports"
            className="footer-logo-img"
          />
          <div className="footer-brand-text">
            <h2>MAUÁ</h2>
            <h3>E-SPORTS</h3>
          </div>
        </div>

        <div className="footer-description">
          <p>
            Liga Universitária de Esports do Instituto Mauá de Tecnologia,
            promovendo competições, treinamentos e integração entre alunos
            apaixonados por games, representando a instituição em torneios
            acadêmicos.
          </p>
        </div>

        <div className="footer-links">
          <ul className="footer-nav">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/sobre">Sobre</Link>
            </li>
            <li>
              <Link to="/campeonatos">Campeonatos</Link>
            </li>
            <li>
              <Link to="/times">Times</Link>
            </li>
          </ul>
          <div className="social-icons">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord />
            </a>
            <a
              href="https://twitch.tv"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitch />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © 2025 Mauá e-Sports. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
