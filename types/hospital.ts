export type Hospital = {
  id: string;
  name: string;
  state?: string;
  district?: string;
  address?: string;
  category?: string;
  systemOfMedicine?: string;
  specialties?: string[];
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: string[];
};

export type DirectoryResponse = {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  freshness: string;
  total?: number;
  partial: boolean;
  hospitals: Hospital[];
  status?: string;
};
