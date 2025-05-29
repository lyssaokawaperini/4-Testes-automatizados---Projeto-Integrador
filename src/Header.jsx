import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaMicrosoft } from "react-icons/fa";
import { CiLogin } from "react-icons/ci"; // Keep CiLogin for logout
import { useMsal } from "@azure/msal-react";
import mauaLogo from "../../assets/ui/maua-branco.png";
import "../../styles/Layout/Header.css";

const Header = ({ onLoginClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts && accounts.length > 0;

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup();
      if (loginResponse) {
        localStorage.setItem("token", loginResponse.accessToken || "authenticated");
        navigate("/admin");
      }
      
    } catch (error) {
      if (error.errorCode === "user_cancelled") {
        return;
      }
      console.error("Erro ao fazer login:", error);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Function to get the first name
  const getFirstName = (fullName) => {
    if (!fullName) return "Usuário";
    return fullName.split(' ')[0];
  };

  return (
    <header className="home-header">
      <div className="logo">
        <img src={mauaLogo} alt="Logo Mauá" className="logo-img" />
        <h1>MAUÁ E-SPORTS</h1>
        <button
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <FaBars />
        </button>
      </div>
      <nav className={`navigation ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/sobre">Sobre</Link>
          </li>
          <li>
            <Link to="/times">Times</Link>
          </li>
          <li>
            <Link to="/campeonatos">Campeonatos</Link>
          </li>
          <li>
            <Link to="/contato">Contato</Link>
          </li>
          <li>
            <Link to="/capitao">Capitao</Link>
          </li>
          <li>
            <Link to="/painelUsuario">Usuário</Link>
          </li>
          <li>
            <div className="auth-links">
              {!isAuthenticated ? (
                <button className="login-btn microsoft-login-btn" onClick={handleLogin}>
                  <FaMicrosoft className="microsoft-icon" />
                  Login
                </button>
              ) : (
                <button className="login-btn logout-btn" onClick={handleLogout}>
                  Logout ({getFirstName(accounts[0]?.name)})
                  <CiLogin className="logout-icon" />
                </button>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;