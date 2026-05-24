// Modèle d'objet POI
export interface POI {
  id: number;
  name: string;
  lat: number;
  lon: number;
  address?: {
    road?: string;
    city?: string;
    postcode?: string;
  };
  details?:{
    phone?: string;
    website?: string;
    openHours?: string;  
  };
}