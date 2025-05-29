import React, { useState, useRef, useEffect } from "react";
import { useMsal, useAccount } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../../styles/Layout/HeaderAdmin.css";

const HeaderAdmin = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || null);

  useEffect(() => {
    if (account && account.username && !account.username.endsWith("@maua.br")) {
      alert("Apenas contas @maua.br podem acessar.");
      instance.logoutRedirect();
    }
  }, [account, instance]);

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const handleVoltar = () => {
    navigate("/admin");
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="top-header">
      <div className="logo-section" onClick={handleVoltar}>
        <img src="/maua-branco.png" alt="Mauá E-SPORTS" className="logo" />
        <h1 className="title">E-SPORTS</h1>
      </div>

      <div className="user-dropdown-wrapper" ref={dropdownRef}>
        <div
          className="user-section"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <span>Bem vindo, {account.name || account.username}</span>
          <span className="dropdown">▼</span>
        </div>

        {isDropdownOpen && (
          <div className="dropdown-menu">
            <button onClick={handleLogout}>
              <FaSignOutAlt /> Sair da Conta
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderAdmin;
