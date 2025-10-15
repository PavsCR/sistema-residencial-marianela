import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import mapaImage from './assets-mapa/mapa-vacio-temp.png';
import { House } from '../shared/data/House';
import { fetchHousesFromAPI, type HouseData } from '../shared/data/houses';

const Home = () => {
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Solo administradores y super_admin pueden hacer click en las casas
  const isAdmin = user?.rol === 'administrador' || user?.rol === 'super_admin';

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

  const handleHouseClick = (id: string) => {
    if (!isAdmin) return; // Bloquear click si no es admin
    navigate('/finanzas');
    //navigate('/finanzas/pagos');
    /*Implementación a futuro: Al ingresar al modulo "\Finanzas > Pagos\"
    mediante esta redireccion realiza el filtro segun la casa*/
  };

  return (
    <div className="page-container">
      <h1>Bienvenido al Sistema Residencial Marianela</h1>
      <div className="map-container">
        <div style={{ position: 'relative' }}>
          <img 
            src={mapaImage} 
            alt="Mapa de Residencial Marianela" 
            className="map-image"
          />
          {houses.map(house => (
            <House
              key={house.id}
              {...house}
              onClick={isAdmin ? handleHouseClick : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home