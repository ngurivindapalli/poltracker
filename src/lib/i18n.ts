"use client"

export type LanguageCode = "en" | "es" | "fr" | "de" | "pt" | "hi"

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
]

export type TranslationKey =
  | "Home"
  | "Senators"
  | "Representatives"
  | "Countries"
  | "Campaigns"
  | "News"
  | "Bills"
  | "Investments"
  | "Net Worth"
  | "Comments"
  | "Search"
  | "Filter"
  | "Select country"
  | "Read more"
  | "Latest News"
  | "Community Discussion"
  | "Choose news sources"
  | "Campaign Tracker"
  | "Europe"
  | "Canada"
  | "Latin America"
  | "Login"
  | "Profile"
  | "Save"
  | "Cancel"
  | "Delete"
  | "Reply"
  | "Like"
  | "Translation"
  | "Loading"
  | "No results found"
  | "View all"
  | "Back"

type TranslationDictionary = Record<TranslationKey, string>
type Translations = Record<LanguageCode, TranslationDictionary>

export const translations: Translations = {
  en: {
    Home: "Home",
    Senators: "Senators",
    Representatives: "Representatives",
    Countries: "Countries",
    Campaigns: "Campaigns",
    News: "News",
    Bills: "Bills",
    Investments: "Investments",
    "Net Worth": "Net Worth",
    Comments: "Comments",
    Search: "Search",
    Filter: "Filter",
    "Select country": "Select country",
    "Read more": "Read more",
    "Latest News": "Latest News",
    "Community Discussion": "Community Discussion",
    "Choose news sources": "Choose news sources",
    "Campaign Tracker": "Campaign Tracker",
    Europe: "Europe",
    Canada: "Canada",
    "Latin America": "Latin America",
    Login: "Login",
    Profile: "Profile",
    Save: "Save",
    Cancel: "Cancel",
    Delete: "Delete",
    Reply: "Reply",
    Like: "Like",
    Translation: "Translation",
    Loading: "Loading",
    "No results found": "No results found",
    "View all": "View all",
    Back: "Back",
  },
  es: {
    Home: "Inicio",
    Senators: "Senadores",
    Representatives: "Representantes",
    Countries: "Países",
    Campaigns: "Campañas",
    News: "Noticias",
    Bills: "Proyectos de ley",
    Investments: "Inversiones",
    "Net Worth": "Patrimonio",
    Comments: "Comentarios",
    Search: "Buscar",
    Filter: "Filtrar",
    "Select country": "Seleccionar país",
    "Read more": "Leer más",
    "Latest News": "Últimas noticias",
    "Community Discussion": "Discusión comunitaria",
    "Choose news sources": "Elegir fuentes de noticias",
    "Campaign Tracker": "Rastreador de campañas",
    Europe: "Europa",
    Canada: "Canadá",
    "Latin America": "América Latina",
    Login: "Iniciar sesión",
    Profile: "Perfil",
    Save: "Guardar",
    Cancel: "Cancelar",
    Delete: "Eliminar",
    Reply: "Responder",
    Like: "Me gusta",
    Translation: "Traducción",
    Loading: "Cargando",
    "No results found": "No se encontraron resultados",
    "View all": "Ver todo",
    Back: "Atrás",
  },
  fr: {
    Home: "Accueil",
    Senators: "Sénateurs",
    Representatives: "Représentants",
    Countries: "Pays",
    Campaigns: "Campagnes",
    News: "Actualités",
    Bills: "Projets de loi",
    Investments: "Investissements",
    "Net Worth": "Patrimoine",
    Comments: "Commentaires",
    Search: "Rechercher",
    Filter: "Filtrer",
    "Select country": "Sélectionner un pays",
    "Read more": "Lire la suite",
    "Latest News": "Dernières actualités",
    "Community Discussion": "Discussion communautaire",
    "Choose news sources": "Choisir les sources",
    "Campaign Tracker": "Suivi des campagnes",
    Europe: "Europe",
    Canada: "Canada",
    "Latin America": "Amérique latine",
    Login: "Connexion",
    Profile: "Profil",
    Save: "Enregistrer",
    Cancel: "Annuler",
    Delete: "Supprimer",
    Reply: "Répondre",
    Like: "J'aime",
    Translation: "Traduction",
    Loading: "Chargement",
    "No results found": "Aucun résultat trouvé",
    "View all": "Voir tout",
    Back: "Retour",
  },
  de: {
    Home: "Startseite",
    Senators: "Senatoren",
    Representatives: "Abgeordnete",
    Countries: "Länder",
    Campaigns: "Kampagnen",
    News: "Nachrichten",
    Bills: "Gesetzentwürfe",
    Investments: "Investitionen",
    "Net Worth": "Nettovermögen",
    Comments: "Kommentare",
    Search: "Suchen",
    Filter: "Filtern",
    "Select country": "Land auswählen",
    "Read more": "Mehr lesen",
    "Latest News": "Aktuelle Nachrichten",
    "Community Discussion": "Community-Diskussion",
    "Choose news sources": "Nachrichtenquellen wählen",
    "Campaign Tracker": "Kampagnen-Tracker",
    Europe: "Europa",
    Canada: "Kanada",
    "Latin America": "Lateinamerika",
    Login: "Anmelden",
    Profile: "Profil",
    Save: "Speichern",
    Cancel: "Abbrechen",
    Delete: "Löschen",
    Reply: "Antworten",
    Like: "Gefällt mir",
    Translation: "Übersetzung",
    Loading: "Laden",
    "No results found": "Keine Ergebnisse gefunden",
    "View all": "Alle anzeigen",
    Back: "Zurück",
  },
  pt: {
    Home: "Início",
    Senators: "Senadores",
    Representatives: "Representantes",
    Countries: "Países",
    Campaigns: "Campanhas",
    News: "Notícias",
    Bills: "Projetos de lei",
    Investments: "Investimentos",
    "Net Worth": "Patrimônio",
    Comments: "Comentários",
    Search: "Pesquisar",
    Filter: "Filtrar",
    "Select country": "Selecionar país",
    "Read more": "Ler mais",
    "Latest News": "Últimas notícias",
    "Community Discussion": "Discussão comunitária",
    "Choose news sources": "Escolher fontes de notícias",
    "Campaign Tracker": "Rastreador de campanhas",
    Europe: "Europa",
    Canada: "Canadá",
    "Latin America": "América Latina",
    Login: "Entrar",
    Profile: "Perfil",
    Save: "Salvar",
    Cancel: "Cancelar",
    Delete: "Excluir",
    Reply: "Responder",
    Like: "Curtir",
    Translation: "Tradução",
    Loading: "Carregando",
    "No results found": "Nenhum resultado encontrado",
    "View all": "Ver tudo",
    Back: "Voltar",
  },
  hi: {
    Home: "होम",
    Senators: "सीनेटर",
    Representatives: "प्रतिनिधि",
    Countries: "देश",
    Campaigns: "अभियान",
    News: "समाचार",
    Bills: "विधेयक",
    Investments: "निवेश",
    "Net Worth": "निवल मूल्य",
    Comments: "टिप्पणियां",
    Search: "खोजें",
    Filter: "फ़िल्टर",
    "Select country": "देश चुनें",
    "Read more": "और पढ़ें",
    "Latest News": "ताज़ा समाचार",
    "Community Discussion": "सामुदायिक चर्चा",
    "Choose news sources": "समाचार स्रोत चुनें",
    "Campaign Tracker": "अभियान ट्रैकर",
    Europe: "यूरोप",
    Canada: "कनाडा",
    "Latin America": "लैटिन अमेरिका",
    Login: "लॉगिन",
    Profile: "प्रोफाइल",
    Save: "सहेजें",
    Cancel: "रद्द करें",
    Delete: "हटाएं",
    Reply: "जवाब दें",
    Like: "पसंद",
    Translation: "अनुवाद",
    Loading: "लोड हो रहा है",
    "No results found": "कोई परिणाम नहीं मिला",
    "View all": "सभी देखें",
    Back: "वापस",
  },
}

export const LANGUAGE_STORAGE_KEY = "poltracker-language"

export function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en"
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored && Object.keys(translations).includes(stored)) {
    return stored as LanguageCode
  }
  return "en"
}

export function setStoredLanguage(code: LanguageCode): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
}

export function translate(key: TranslationKey, lang: LanguageCode): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key
}
