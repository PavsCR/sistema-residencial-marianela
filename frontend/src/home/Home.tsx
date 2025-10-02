import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import mapaImage from './assets-mapa/mapa-vacio-temp.png';
import { House } from '../shared/data/House';
import { houses as initialHouses, type HouseData } from '../shared/data/houses';

const Home = () => {
  const [houses] = useState<HouseData[]>(initialHouses);
  const navigate = useNavigate();

  const handleHouseClick = (id: string) => {
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
              onClick={handleHouseClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home