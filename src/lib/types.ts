export type ClientStatus = "lead" | "confirmat" | "finalizat";

export interface Client {
  id: string;
  couple: string;
  family: string;
  event_date: string; // ISO yyyy-mm-dd or ""
  city: string;
  venue: string;
  fee: number | null;
  currency: string; // EUR / RON
  status: ClientStatus;
  svc_mc: boolean;
  svc_program: boolean;
  svc_games: boolean;
  svc_flowers: boolean;
  svc_kids: boolean;
  svc_rentals: boolean;
  svc_corporate: boolean;
  guests: number | null;
  deposit: number | null; // avans convenit
  paid: number | null;    // total încasat
  notes: string;
  program_start: string; // "16:00" (fallback)
  program_starts?: Record<string, string>; // ora de start per fază
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  category: string;
  instructions: string;
  favorite: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  notes: string;
  category: string; // "jocuri" | "flori" | "altele"
}

export const INVENTORY_CATEGORIES = [
  { key: "jocuri", label: "Jocuri & Rentals" },
  { key: "flori", label: "Flori & Decor" },
  { key: "altele", label: "Altele" },
];

export interface Allocation {
  id: string;
  client_id: string;
  inventory_id: string;
  qty: number;
}

export interface ProgramItem {
  id: string;
  client_id: string;
  position: number;
  duration_min: number;
  activity: string;
  description: string;
  color: string;
  start_time: string; // "HH:MM" setată manual, sau "" pentru calcul automat
  phase: string; // "pregatiri" | "ceremonie" | "petrecere"
}

export const PROGRAM_PHASES = [
  { key: "pregatiri", label: "Pregătiri", short: "Pregătiri", defaultStart: "08:00" },
  { key: "ceremonie", label: "Ceremonia religioasă", short: "Ceremonie", defaultStart: "14:00" },
  { key: "petrecere", label: "Nuntă & petrecere", short: "Petrecere", defaultStart: "18:00" },
] as const;

export interface OfferItem {
  id: string;
  category: string; // MC / Flori / Rentals / Kids / Corporate / Altele
  description: string;
  qty: number;
  unit_price: number;
}

export interface Offer {
  id: string;
  client_id: string | null;
  couple: string;
  event_date: string;
  venue: string;
  guests: number | null;
  currency: string;
  discount: number; // percent
  notes: string;
  terms: string;
  items: OfferItem[];
  created_at: string;
}

export interface Task {
  id: string;
  kind: "meeting" | "todo"; // întâlnire sau task personal
  title: string;
  client_id: string | null;
  meeting_type: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  done: boolean;
  notes: string;
  created_at: string;
}

export interface CorporateLead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  date: string;
  status: string; // lead | oferta | confirmat | finalizat
  participants: number | null;
  format: string[];
  objectives: string[];
  activities: string[];
  location: string;
  catering: string;
  budget: number | null;
  deadline: string;
  notes: string;
  created_at: string;
}

export const CORP_FORMATS = ["La birou (2-3h)", "La birou (4h)", "Team-building 1 zi", "Team-building multi-zi", "After-work / team dinner", "Family day", "Petrecere companie"];
export const CORP_OBJECTIVES = ["Coeziune echipă", "Comunicare", "Energizare / fun", "Leadership", "Onboarding", "Clarificare procese", "Sărbătorire / aniversare"];
export const CORP_ACTIVITIES = ["Jocul cu slide-urile", "Jackbox Party", "Scavenger hunt urban", "Blind Tent", "Startup Wars", "Kahoot — Istoria firmei", "Sesiuni MBTI", "Brainstorming Walt Disney", "Board of Directors"];
export const CORP_STATUS = ["lead", "oferta", "confirmat", "finalizat"];

export const MEETING_TYPES = [
  "Întâlnire de cunoaștere",
  "Stabilire program",
  "Vizită locație",
  "Recap final",
  "Call telefonic",
  "Altele",
];

// Flexible JSON forms
export type ChecklistData = Record<string, unknown>;
export type ProfileData = Record<string, unknown>;
export type ContractData = Record<string, unknown>;

// Datele prestatorului (EMZEE) — memorate o dată, refolosite pe orice contract.
export const PROVIDER_DEFAULTS = {
  legal: "EMZEE Events",
  repr: "Marius Radu",
  cui: "",
  reg: "",
  address: "",
  email: "office@wle.ro",
  phone: "",
  iban: "",
  bank: "",
};

// Servicii tipice care pot fi contractate (pentru pre-completare).
export const CONTRACT_SERVICES = [
  "Servicii MC / prezentare eveniment",
  "Coordonare & program eveniment",
  "Jocuri & momente de animație",
  "Aranjamente florale & decor",
  "Zonă & animație copii (kids corner)",
  "Închiriere echipamente (rentals)",
];

export interface DB {
  clients: Client[];
  games: Game[];
  inventory: InventoryItem[];
  allocations: Allocation[];
  program_items: ProgramItem[];
  offers: Offer[];
  tasks: Task[];
  corporate: CorporateLead[];
  checklists: Record<string, ChecklistData>; // by client_id
  profiles: Record<string, ProfileData>; // by client_id
  florals: Record<string, ProfileData>; // brief floral, by client_id
  contracts: Record<string, ContractData>; // contract, by client_id
}
