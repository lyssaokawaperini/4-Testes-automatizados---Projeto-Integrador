import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GerenciarTreinos.css"; // Ensure this path is correct
import { FaSearch, FaEdit, FaTrashAlt, FaFilter, FaPlus, FaUserPlus, FaUserMinus } from "react-icons/fa";
import Footer from "./Layout/Footer.jsx";
import HeaderAdmin from "./Layout/HeaderAdmin.jsx";
import {
  fetchTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
  fetchExternalModalities,
  fetchUsers, // Make sure you have a fetchUsers in your memberApi or a similar service
} from "../Service/trainingApi.js"; // Adjust path as needed

const GerenciarTreinos = () => {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [externalModalities, setExternalModalities] = useState([]); // For dropdown
  const [users, setUsers] = useState([]); // For participant selection

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState(""); // "proximos", "passados"
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentTraining, setCurrentTraining] = useState(null); // For edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTraining, setDeletingTraining] = useState(null);

  const initialNewTrainingState = {
    modalityId: "",
    modalityName: "",
    modalityTag: "",
    status: "SCHEDULED",
    startTimestamp: new Date().toISOString().slice(0, 16),
    endTimestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours later
    attendedPlayers: [], // Array of user IDs
    description: "",
  };
  const [newTraining, setNewTraining] = useState(initialNewTrainingState);
  
  // For managing participants in modals
  const [selectedParticipants, setSelectedParticipants] = useState([]);


  const loadTrainings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrainings();
      // Apply client-side filtering if backend doesn't support all filters yet
      let filteredData = data;
      if (filtroStatus) {
        filteredData = filteredData.filter(t => t.status === filtroStatus);
      }
      if (filtroPeriodo) {
        const now = Date.now();
        if (filtroPeriodo === "proximos") {
          filteredData = filteredData.filter(t => new Date(t.startTimestamp).getTime() >= now);
        } else if (filtroPeriodo === "passados") {
          filteredData = filteredData.filter(t => new Date(t.startTimestamp).getTime() < now);
        }
      }
      setTrainings(filteredData);
    } catch (err) {
      setError("Falha ao carregar treinos: " + err.message);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, filtroPeriodo]);

  const loadExternalModalities = async () => {
    try {
      const data = await fetchExternalModalities();
      // The API returns an object, convert to array if needed or use as is
      const modalitiesArray = Object.values(data).map(mod => ({
        id: mod._id, // Make sure the ID field is correct
        name: mod.Name,
        tag: mod.Tag,
      }));
      setExternalModalities(modalitiesArray);
    } catch (err) {
      console.error("Erro ao buscar modalidades externas:", err);
      setError((prevError) => prevError + "\nFalha ao carregar modalidades externas.");
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers(); // From your user/member API
      setUsers(data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setError((prevError) => prevError + "\nFalha ao carregar usuários.");
    }
  };

  useEffect(() => {
    loadTrainings();
  }, [loadTrainings]); // Reload when filters change

  useEffect(() => {
    loadExternalModalities();
    loadUsers();
  }, []);


  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === "new") {
      setNewTraining((prev) => ({ ...prev, [name]: value }));
      if (name === "modalityId") {
        const selectedMod = externalModalities.find(mod => mod.id === value);
        if (selectedMod) {
            setNewTraining((prev) => ({
                ...prev,
                modalityName: selectedMod.name,
                modalityTag: selectedMod.tag,
            }));
        }
      }
    } else if (formType === "edit" && currentTraining) {
      setCurrentTraining((prev) => ({ ...prev, [name]: value }));
       if (name === "modalityId") {
        const selectedMod = externalModalities.find(mod => mod.id === value);
        if (selectedMod) {
            setCurrentTraining((prev) => ({
                ...prev,
                modalityName: selectedMod.name,
                modalityTag: selectedMod.tag,
            }));
        }
      }
    }
  };
  
  const handleParticipantChange = (userId, action, formType) => {
    if (formType === "new") {
        setNewTraining(prev => ({
            ...prev,
            attendedPlayers: action === 'add'
                ? [...prev.attendedPlayers, userId]
                : prev.attendedPlayers.filter(id => id !== userId)
        }));
    } else if (formType === "edit" && currentTraining) {
        setCurrentTraining(prev => ({
            ...prev,
            attendedPlayers: action === 'add'
                ? [...prev.attendedPlayers, userId]
                : prev.attendedPlayers.filter(id => id !== userId)
        }));
    }
  };


  const handleAddTrainingClick = () => {
    setNewTraining(initialNewTrainingState);
    if (externalModalities.length > 0) { // Pre-select first modality if available
        const firstMod = externalModalities[0];
        setNewTraining(prev => ({
            ...prev,
            modalityId: firstMod.id,
            modalityName: firstMod.name,
            modalityTag: firstMod.tag,
        }));
    }
    setShowAddModal(true);
  };

  const handleSaveNewTraining = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const trainingToSave = {
        ...newTraining,
        startTimestamp: new Date(newTraining.startTimestamp).toISOString(),
        endTimestamp: new Date(newTraining.endTimestamp).toISOString(),
      };
      const created = await createTraining(trainingToSave);
      setTrainings((prev) => [...prev, created]);
      setShowAddModal(false);
      // Optionally, show success notification
    } catch (err) {
      setError("Erro ao criar treino: " + err.message);
    }
  };

  const handleEditTraining = (training) => {
    setCurrentTraining({
      ...training,
      startTimestamp: new Date(training.startTimestamp).toISOString().slice(0, 16),
      endTimestamp: new Date(training.endTimestamp).toISOString().slice(0, 16),
      attendedPlayers: training.attendedPlayers.map(p => p._id) // Store only IDs for editing
    });
    setShowEditModal(true);
  };

  const handleSaveTraining = async (event) => {
    event.preventDefault();
    if (!currentTraining) return;
    setError(null);
    try {
      const trainingToUpdate = {
        ...currentTraining,
        startTimestamp: new Date(currentTraining.startTimestamp).toISOString(),
        endTimestamp: new Date(currentTraining.endTimestamp).toISOString(),
      };
      const updated = await updateTraining(currentTraining._id, trainingToUpdate);
      setTrainings((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setShowEditModal(false);
      setCurrentTraining(null);
      // Optionally, show success notification
    } catch (err) {
      setError("Erro ao atualizar treino: " + err.message);
    }
  };

  const handleDeleteClick = (training) => {
    setDeletingTraining(training);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTraining) return;
    setError(null);
    try {
      await deleteTraining(deletingTraining._id);
      setTrainings((prev) => prev.filter((t) => t._id !== deletingTraining._id));
      setShowDeleteModal(false);
      setDeletingTraining(null);
      // Optionally, show success notification
    } catch (err) {
      setError("Erro ao excluir treino: " + err.message);
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
  };
  
  const formatarDataParaInput = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    // Adjust for timezone offset to display correctly in datetime-local
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };


  const treinosFiltradosPorPesquisa = trainings.filter((treino) => {
    if (!pesquisa.trim()) return true;
    const termo = pesquisa.toLowerCase();
    return (
      (treino.modalityName && treino.modalityName.toLowerCase().includes(termo)) ||
      (treino.modalityTag && treino.modalityTag.toLowerCase().includes(termo)) ||
      (treino.status && treino.status.toLowerCase().includes(termo)) ||
      (treino.description && treino.description.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="gerenciar-treinos-page">
      <HeaderAdmin />
      <main className="treinos-main">
        <div className="title-search">
          <div className="title-actions">
            <h1>GERENCIAR TREINOS</h1>
            <button className="add-button" onClick={handleAddTrainingClick}>
              <FaPlus /> Novo Treino
            </button>
          </div>
          <div className="search-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Pesquisar por modalidade, status..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
            <button
              className="filter-button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FaFilter /> Filtros
            </button>
          </div>
        </div>

        {showFilterMenu && (
          <div className="filtros-container">
            <div className="filtro-grupo">
              <label htmlFor="filtroStatus">Status:</label>
              <select id="filtroStatus" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="RUNNING">Em andamento</option>
                <option value="COMPLETED">Finalizado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <div className="filtro-grupo">
              <label htmlFor="filtroPeriodo">Período:</label>
              <select id="filtroPeriodo" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
                <option value="">Todos</option>
                <option value="proximos">Próximos treinos</option>
                <option value="passados">Treinos passados</option>
              </select>
            </div>
            <button onClick={loadTrainings} className="aplicar-filtros">
              Aplicar Filtros
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Carregando treinos...</div>
        ) : (
          <div className="treinos-grid">
            {treinosFiltradosPorPesquisa.length > 0 ? (
              <table className="treinos-table">
                <thead>
                  <tr>
                    <th>MODALIDADE</th>
                    <th>DESCRIÇÃO</th>
                    <th>INÍCIO</th>
                    <th>FIM</th>
                    <th>STATUS</th>
                    <th>PARTICIPANTES</th>
                    <th>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {treinosFiltradosPorPesquisa.map((treino) => (
                    <tr key={treino._id}>
                      <td>
                        <span className="modalidade-tag">{treino.modalityTag}</span>
                        {treino.modalityName}
                      </td>
                      <td>{treino.description || "-"}</td>
                      <td>{formatarData(treino.startTimestamp)}</td>
                      <td>{formatarData(treino.endTimestamp)}</td>
                      <td>
                        <span className={`status-badge ${treino.status ? treino.status.toLowerCase() : ''}`}>
                          {treino.status}
                        </span>
                      </td>
                      <td>{treino.attendedPlayers ? treino.attendedPlayers.length : 0}</td>
                      <td className="acoes-cell">
                        <button className="action-btn edit" onClick={() => handleEditTraining(treino)}>
                          <FaEdit />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDeleteClick(treino)}>
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-results">Nenhum treino encontrado.</div>
            )}
          </div>
        )}
      </main>

      {/* Add Training Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Adicionar Novo Treino</h2>
            <form onSubmit={handleSaveNewTraining}>
              <div className="form-group">
                <label htmlFor="modalityIdAdd">Modalidade:</label>
                <select
                  id="modalityIdAdd"
                  name="modalityId"
                  value={newTraining.modalityId}
                  onChange={(e) => handleInputChange(e, "new")}
                  required
                >
                  <option value="">Selecione uma modalidade</option>
                  {externalModalities.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.tag})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="descriptionAdd">Descrição (Opcional):</label>
                <input
                  type="text"
                  id="descriptionAdd"
                  name="description"
                  value={newTraining.description}
                  onChange={(e) => handleInputChange(e, "new")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTimestampAdd">Data/Hora de Início:</label>
                <input
                  type="datetime-local"
                  id="startTimestampAdd"
                  name="startTimestamp"
                  value={newTraining.startTimestamp}
                  onChange={(e) => handleInputChange(e, "new")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTimestampAdd">Data/Hora de Término:</label>
                <input
                  type="datetime-local"
                  id="endTimestampAdd"
                  name="endTimestamp"
                  value={newTraining.endTimestamp}
                  onChange={(e) => handleInputChange(e, "new")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="statusAdd">Status:</label>
                <select
                  id="statusAdd"
                  name="status"
                  value={newTraining.status}
                  onChange={(e) => handleInputChange(e, "new")}
                  required
                >
                  <option value="SCHEDULED">Agendado</option>
                  <option value="RUNNING">Em andamento</option>
                  <option value="COMPLETED">Finalizado</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </div>
               <div className="form-group">
                <label>Participantes:</label>
                <div className="participants-list">
                    {newTraining.attendedPlayers.map(playerId => {
                        const player = users.find(u => u._id === playerId);
                        return player ? <span key={playerId} className="participant-tag">{player.name} <FaUserMinus onClick={() => handleParticipantChange(playerId, 'remove', 'new')} /></span> : null;
                    })}
                </div>
                <select onChange={(e) => e.target.value && handleParticipantChange(e.target.value, 'add', 'new')} value="">
                    <option value="">Adicionar participante...</option>
                    {users.filter(user => !newTraining.attendedPlayers.includes(user._id)).map(user => (
                        <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                    ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="save-button">Criar Treino</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Training Modal */}
      {showEditModal && currentTraining && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setCurrentTraining(null); }}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Treino</h2>
            <form onSubmit={handleSaveTraining}>
              <div className="form-group">
                <label htmlFor="modalityIdEdit">Modalidade:</label>
                 <select
                  id="modalityIdEdit"
                  name="modalityId"
                  value={currentTraining.modalityId}
                  onChange={(e) => handleInputChange(e, "edit")}
                  required
                >
                  <option value="">Selecione uma modalidade</option>
                  {externalModalities.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.name} ({mod.tag})
                    </option>
                  ))}
                </select>
              </div>
               <div className="form-group">
                <label htmlFor="descriptionEdit">Descrição (Opcional):</label>
                <input
                  type="text"
                  id="descriptionEdit"
                  name="description"
                  value={currentTraining.description}
                  onChange={(e) => handleInputChange(e, "edit")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTimestampEdit">Data/Hora de Início:</label>
                <input
                  type="datetime-local"
                  id="startTimestampEdit"
                  name="startTimestamp"
                  value={currentTraining.startTimestamp}
                  onChange={(e) => handleInputChange(e, "edit")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTimestampEdit">Data/Hora de Término:</label>
                <input
                  type="datetime-local"
                  id="endTimestampEdit"
                  name="endTimestamp"
                  value={currentTraining.endTimestamp}
                  onChange={(e) => handleInputChange(e, "edit")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="statusEdit">Status:</label>
                <select
                  id="statusEdit"
                  name="status"
                  value={currentTraining.status}
                  onChange={(e) => handleInputChange(e, "edit")}
                  required
                >
                  <option value="SCHEDULED">Agendado</option>
                  <option value="RUNNING">Em andamento</option>
                  <option value="COMPLETED">Finalizado</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Participantes:</label>
                <div className="participants-list">
                    {currentTraining.attendedPlayers.map(playerId => {
                        const player = users.find(u => u._id === playerId);
                        return player ? <span key={playerId} className="participant-tag">{player.name} <FaUserMinus onClick={() => handleParticipantChange(playerId, 'remove', 'edit')} /></span> : null;
                    })}
                </div>
                <select onChange={(e) => e.target.value && handleParticipantChange(e.target.value, 'add', 'edit')} value="">
                    <option value="">Adicionar participante...</option>
                    {users.filter(user => !currentTraining.attendedPlayers.includes(user._id)).map(user => (
                        <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                    ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowEditModal(false); setCurrentTraining(null); }}>Cancelar</button>
                <button type="submit" className="save-button">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTraining && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja excluir o treino de{" "}
              <strong>{deletingTraining.modalityName}</strong> agendado para{" "}
              <strong>{formatarData(deletingTraining.startTimestamp)}</strong>?
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button type="button" className="delete-button" onClick={handleDeleteConfirm}>Excluir Treino</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default GerenciarTreinos;