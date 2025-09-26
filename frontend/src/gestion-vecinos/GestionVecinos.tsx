import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GestionVecinos.css';

interface House {
  id: string;
  status: 'al_dia' | 'especial' | 'pendiente' | 'extra';
}

const houses: House[] = [
  { id: 'A1', status: 'al_dia' },
  { id: 'A2', status: 'al_dia' },
  { id: 'A3', status: 'pendiente' },
  { id: 'A4', status: 'al_dia' },
  { id: 'A5', status: 'especial' },
  { id: 'A6', status: 'al_dia' },
  { id: 'B1', status: 'al_dia' },
  { id: 'B2', status: 'extra' },
  { id: 'B3', status: 'al_dia' },
  { id: 'B4', status: 'pendiente' },
  { id: 'B5', status: 'al_dia' },
  { id: 'B6', status: 'especial' },
];

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionVecinos;