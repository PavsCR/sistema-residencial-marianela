import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GestionVecinos.css';
import { houses } from '../shared/data/houses';

const GestionVecinos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredHouses = houses.filter(house => 
    house.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleHouseClick = (houseId: string) => {
    // Implementación a futuro: visualizar información del vecino
  };

  return (
    <div className="page-container">
      <h1>Gestión de Vecinos</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar casa por número (ej: A1, B2)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="results-container">
        {filteredHouses.map(house => (
          <div
            key={house.id}
            className={`house-card ${house.status}`}
            onClick={() => handleHouseClick(house.id)}
          >
            <h3>Casa {house.id}</h3>
            <p>Estado: {house.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionVecinos;