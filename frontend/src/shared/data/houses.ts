import type { HouseStatus } from './House';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface HouseData {
  id: string;
  status: HouseStatus;
  position: {
    top: string;
    left: string;
  };
}

export interface ApiHouse {
  id: string;
  status: string;
  usuariosCount: number;
}

// Static position data for houses (since this is layout-specific)
const housePositions: { [key: string]: { top: string; left: string } } = {
  '1': { top: '5%', left: '25%' },
  '2': { top: '10%', left: '25%' },
  '3': { top: '15%', left: '25%' },
  '4': { top: '20%', left: '25%' },
  '5': { top: '25%', left: '25%' },
  '6': { top: '30%', left: '25%' },
  '7': { top: '35%', left: '25%' },
  '8': { top: '40%', left: '25%' },
  '9': { top: '45%', left: '25%' },
  '10': { top: '50%', left: '25%' },
  '11': { top: '55%', left: '25%' },
  '12': { top: '60%', left: '25%' },
  '13': { top: '65%', left: '25%' },
  '14': { top: '70%', left: '25%' },
  '15': { top: '75%', left: '25%' },
  '16': { top: '80%', left: '25%' },
  '17': { top: '85%', left: '25%' },
  '18': { top: '90%', left: '25%' },
  //
  '19': { top: '5%', left: '30%' },
  '20': { top: '10%', left: '30%' },
  '21': { top: '15%', left: '30%' },
  '22': { top: '20%', left: '30%' },
  '23': { top: '25%', left: '30%' },
  '24': { top: '30%', left: '30%' },
  '25': { top: '35%', left: '30%' },
  '26': { top: '40%', left: '30%' },
  '27': { top: '45%', left: '30%' },
  '28': { top: '50%', left: '30%' },
  '29': { top: '55%', left: '30%' },
  '30': { top: '60%', left: '30%' },
  '31': { top: '65%', left: '30%' },  
  '32': { top: '70%', left: '30%' },
  '33': { top: '75%', left: '30%' },
  '34': { top: '80%', left: '30%' },
  '35': { top: '85%', left: '30%' },
  '36': { top: '90%', left: '30%' },
  // 
  '37': { top: '5%', left: '35%' },
  '38': { top: '10%', left: '35%' },
  '39': { top: '15%', left: '35%' },
  '40': { top: '20%', left: '35%' },
  '41': { top: '25%', left: '35%' },
  '42': { top: '30%', left: '35%' },
  '43': { top: '35%', left: '35%' },
  '44': { top: '40%', left: '35%' },
  '45': { top: '45%', left: '35%' },
  '46': { top: '50%', left: '35%' },
  '47': { top: '55%', left: '35%' },
  '48': { top: '60%', left: '35%' },
  '49': { top: '65%', left: '35%' },
  '50': { top: '70%', left: '35%' },
  '51': { top: '75%', left: '35%' },
  '52': { top: '80%', left: '35%' },
  '53': { top: '85%', left: '35%' },
  '54': { top: '90%', left: '35%' },
  //
  '55': { top: '5%', left: '40%' },
  '56': { top: '10%', left: '40%' },
  '57': { top: '15%', left: '40%' },
  '58': { top: '20%', left: '40%' },
  '59': { top: '25%', left: '40%' },
  '60': { top: '30%', left: '40%' },
  '61': { top: '35%', left: '40%' },
  '62': { top: '40%', left: '40%' },
  '63': { top: '45%', left: '40%' },
  '64': { top: '50%', left: '40%' },
  '65': { top: '55%', left: '40%' },
  '66': { top: '60%', left: '40%' },
  '67': { top: '65%', left: '40%' },
  '68': { top: '70%', left: '40%' },
  '69': { top: '75%', left: '40%' },
  '70': { top: '80%', left: '40%' },
  '71': { top: '85%', left: '40%' },
  '72': { top: '90%', left: '40%' },
  //
  '73': { top: '5%', left: '45%' },
  '74': { top: '10%', left: '45%' },
  '75': { top: '15%', left: '45%' },
  '76': { top: '20%', left: '45%' },
  '77': { top: '25%', left: '45%' },
  '78': { top: '30%', left: '45%' },
  '79': { top: '35%', left: '45%' },
  '80': { top: '40%', left: '45%' },
  '81': { top: '45%', left: '45%' },
  '82': { top: '50%', left: '45%' },
  '83': { top: '55%', left: '45%' },
  '84': { top: '60%', left: '45%' },
  '85': { top: '65%', left: '45%' },
  '86': { top: '70%', left: '45%' },
  '87': { top: '75%', left: '45%' },
  '88': { top: '80%', left: '45%' },
  '89': { top: '85%', left: '45%' },
  '90': { top: '90%', left: '45%' },
  //
  '91': { top: '5%', left: '50%' },
  '92': { top: '10%', left: '50%' },
  '93': { top: '15%', left: '50%' },
  '94': { top: '20%', left: '50%' },
  '95': { top: '25%', left: '50%' },
  '96': { top: '30%', left: '50%' },
  '97': { top: '35%', left: '50%' },
  '98': { top: '40%', left: '50%' },
  '99': { top: '45%', left: '50%' },
  '100': { top: '50%', left: '50%' },
  '101': { top: '55%', left: '50%' },
  '102': { top: '60%', left: '50%' },
  '103': { top: '65%', left: '50%' },
  '104': { top: '70%', left: '50%' },
  '105': { top: '75%', left: '50%' },
  '106': { top: '80%', left: '50%' },
  '107': { top: '85%', left: '50%' },
  '108': { top: '90%', left: '50%' },
  //
  '109': { top: '5%', left: '55%' },
  '110': { top: '10%', left: '55%' },
  '111': { top: '15%', left: '55%' },
  '112': { top: '20%', left: '55%' },
  '113': { top: '25%', left: '55%' },
  '114': { top: '30%', left: '55%' },
  '115': { top: '35%', left: '55%' },
  '116': { top: '40%', left: '55%' },
  '117': { top: '45%', left: '55%' },
  '118': { top: '50%', left: '55%' },
  '119': { top: '55%', left: '55%' },
  '120': { top: '60%', left: '55%' },
};

// Map database status to frontend status
const mapDatabaseStatus = (dbStatus: string): HouseStatus => {
  const statusMap: { [key: string]: HouseStatus } = {
    'al_dia': 'al_dia',
    'moroso': 'pendiente',
    'en_arreglo': 'especial',
    'pendiente': 'pendiente',
    'especial': 'especial',
    'extra': 'extra'
  };
  
  return statusMap[dbStatus] || 'al_dia';
};

// Function to fetch houses from API
export const fetchHousesFromAPI = async (): Promise<HouseData[]> => {
  try {
    const response = await fetch(`${API_URL}/api/casas`);
    const data = await response.json();
    
    if (data.success) {
      // Combine API data with position data
      return data.data
        .filter((house: ApiHouse) => housePositions[house.id]) // Only include houses with positions
        .map((house: ApiHouse) => ({
          id: house.id,
          status: mapDatabaseStatus(house.status),
          position: housePositions[house.id]
        }));
    }
    
    throw new Error(data.message || 'Error fetching houses');
  } catch (error) {
    console.error('Error fetching houses:', error);
    // Return empty array if API fails
    return [];
  }
};