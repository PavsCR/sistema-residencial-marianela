import { useState, useEffect } from 'react';
import './GestionVecinos.css';
import { fetchHousesFromAPI, type HouseData } from '../shared/data/houses';
import HouseUsersModal from './components/HouseUsersModal';

const GestionVecinos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const housesFromAPI = await fetchHousesFromAPI();
        setHouses(housesFromAPI);
      } catch (error) {
        console.error('Error loading houses:', error);
        // Keep static houses as fallback
      } finally {
        setLoading(false);
      }
    };

    loadHouses();
  }, []);

  const filteredHouses = houses
    .filter(house => 
      house.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort houses numerically by their ID
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      return numA - numB;
    });

  const handleHouseClick = (houseId: string) => {
    setSelectedHouseId(houseId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHouseId('');
  };

  return (
    <div className="page-container">
      <h1>Gestión de Vecinos</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar casa por número (ej: 1, 2)"
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

      <HouseUsersModal
        isOpen={isModalOpen}
        houseId={selectedHouseId}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default GestionVecinos;