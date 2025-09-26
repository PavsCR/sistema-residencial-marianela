import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import mapaImage from './assets-mapa/mapa-vacio-temp.png';
import { House, type HouseStatus } from './components/House';

interface HouseData {
  id: string;
  status: HouseStatus;
  position: {
    top: string;
    left: string;
  };
}

const initialHouses: HouseData[] = [
  // Left side houses (A series)
  { id: 'A1', status: 'al_dia', position: { top: '15%', left: '28%' } },
  { id: 'A2', status: 'al_dia', position: { top: '25%', left: '28%' } },
  { id: 'A3', status: 'pendiente', position: { top: '35%', left: '28%' } },
  { id: 'A4', status: 'al_dia', position: { top: '45%', left: '28%' } },
  { id: 'A5', status: 'especial', position: { top: '55%', left: '28%' } },
  { id: 'A6', status: 'al_dia', position: { top: '65%', left: '28%' } },
  
  // Right side houses (B series)
  { id: 'B1', status: 'al_dia', position: { top: '15%', left: '72%' } },
  { id: 'B2', status: 'extra', position: { top: '25%', left: '72%' } },
  { id: 'B3', status: 'al_dia', position: { top: '35%', left: '72%' } },
  { id: 'B4', status: 'pendiente', position: { top: '45%', left: '72%' } },
  { id: 'B5', status: 'al_dia', position: { top: '55%', left: '72%' } },
  { id: 'B6', status: 'especial', position: { top: '65%', left: '72%' } },
];

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