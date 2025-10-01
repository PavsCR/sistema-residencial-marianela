import type { HouseStatus } from './House';

export interface HouseData {
  id: string;
  status: HouseStatus;
  position: {
    top: string;
    left: string;
  };
}

export const houses: HouseData[] = [
  // Left side houses (A series)
  { id: 'A1', status: 'al_dia', position: { top: '10%', left: '23.5%' } },
  { id: 'A2', status: 'al_dia', position: { top: '15%', left: '23.5%' } },
  { id: 'A3', status: 'pendiente', position: { top: '20%', left: '23.5%' } },
  { id: 'A4', status: 'al_dia', position: { top: '25%', left: '24%' } },
  { id: 'A5', status: 'especial', position: { top: '30%', left: '24%' } },
  { id: 'A6', status: 'al_dia', position: { top: '35%', left: '25%' } },
  
  // Right side houses (B series)
  { id: 'B1', status: 'extra', position: { top: '10%', left: '30%' } },
  { id: 'B2', status: 'pendiente', position: { top: '15%', left: '30.5%' } },
  { id: 'B3', status: 'al_dia', position: { top: '20%', left: '31%' } },
  { id: 'B4', status: 'pendiente', position: { top: '25%', left: '31%' } },
  { id: 'B5', status: 'al_dia', position: { top: '30%', left: '31%' } },
  { id: 'B6', status: 'especial', position: { top: '35%', left: '32%' } },
];