import type { FC } from 'react';
import houseImage from '../assets-mapa/casa-temp.png';

export type HouseStatus = 'al_dia' | 'especial' | 'pendiente' | 'extra';

interface HouseProps {
  id: string;
  status: HouseStatus;
  position: {
    top: string;
    left: string;
  };
  onClick?: (id: string) => void;
}

const statusColors = {
  al_dia: '#4CAF50',     // Green - Al día
  especial: '#FFC107',   // Yellow - Caso especial
  pendiente: '#F44336',  // Red - Pendiente de pago
  extra: '#2196F3'       // Blue - Extra
};

export const House: FC<HouseProps> = ({ id, status, position, onClick }) => {
  return (
    <div
      className="house-container"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        cursor: 'pointer'
      }}
      onClick={() => onClick?.(id)}
    >
      <div
        className="house-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: statusColors[status],
          opacity: 0.5,
          borderRadius: '4px'
        }}
      />
      <div style={{ position: 'relative' }}>
        <img
          src={houseImage}
          alt={`Casa ${id}`}
          style={{
            width: '40px',
            height: 'auto'
          }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0)',
          padding: '2px 4px',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#000000ff'
        }}>
          {id}
        </div>
      </div>
    </div>
  );
};