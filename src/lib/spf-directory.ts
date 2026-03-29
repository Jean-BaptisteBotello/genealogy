export interface SPF {
  nom: string
  departement: string
  departementNom: string
  email: string
}

// Metropolitan France + DOM SPF directory
// Source: annuaire des Services de Publicité Foncière (DGFiP)
export const SPF_DIRECTORY: SPF[] = [
  { departement: '01', departementNom: 'Ain', nom: 'SPF de Bourg-en-Bresse', email: 'spf.bourg-en-bresse@dgfip.finances.gouv.fr' },
  { departement: '02', departementNom: 'Aisne', nom: 'SPF de Laon', email: 'spf.laon@dgfip.finances.gouv.fr' },
  { departement: '03', departementNom: 'Allier', nom: 'SPF de Moulins', email: 'spf.moulins@dgfip.finances.gouv.fr' },
  { departement: '04', departementNom: 'Alpes-de-Haute-Provence', nom: 'SPF de Digne-les-Bains', email: 'spf.digne@dgfip.finances.gouv.fr' },
  { departement: '05', departementNom: 'Hautes-Alpes', nom: 'SPF de Gap', email: 'spf.gap@dgfip.finances.gouv.fr' },
  { departement: '06', departementNom: 'Alpes-Maritimes', nom: 'SPF de Nice', email: 'spf.nice@dgfip.finances.gouv.fr' },
  { departement: '07', departementNom: 'Ardèche', nom: 'SPF de Privas', email: 'spf.privas@dgfip.finances.gouv.fr' },
  { departement: '08', departementNom: 'Ardennes', nom: 'SPF de Charleville-Mézières', email: 'spf.charleville@dgfip.finances.gouv.fr' },
  { departement: '09', departementNom: 'Ariège', nom: 'SPF de Foix', email: 'spf.foix@dgfip.finances.gouv.fr' },
  { departement: '10', departementNom: 'Aube', nom: 'SPF de Troyes', email: 'spf.troyes@dgfip.finances.gouv.fr' },
  { departement: '11', departementNom: 'Aude', nom: 'SPF de Carcassonne', email: 'spf.carcassonne@dgfip.finances.gouv.fr' },
  { departement: '12', departementNom: 'Aveyron', nom: 'SPF de Rodez', email: 'spf.rodez@dgfip.finances.gouv.fr' },
  { departement: '13', departementNom: 'Bouches-du-Rhône', nom: 'SPF de Marseille', email: 'spf.marseille@dgfip.finances.gouv.fr' },
  { departement: '14', departementNom: 'Calvados', nom: 'SPF de Caen', email: 'spf.caen@dgfip.finances.gouv.fr' },
  { departement: '15', departementNom: 'Cantal', nom: 'SPF d\'Aurillac', email: 'spf.aurillac@dgfip.finances.gouv.fr' },
  { departement: '16', departementNom: 'Charente', nom: 'SPF d\'Angoulême', email: 'spf.angouleme@dgfip.finances.gouv.fr' },
  { departement: '17', departementNom: 'Charente-Maritime', nom: 'SPF de La Rochelle', email: 'spf.la-rochelle@dgfip.finances.gouv.fr' },
  { departement: '18', departementNom: 'Cher', nom: 'SPF de Bourges', email: 'spf.bourges@dgfip.finances.gouv.fr' },
  { departement: '19', departementNom: 'Corrèze', nom: 'SPF de Tulle', email: 'spf.tulle@dgfip.finances.gouv.fr' },
  { departement: '2A', departementNom: 'Corse-du-Sud', nom: 'SPF d\'Ajaccio', email: 'spf.ajaccio@dgfip.finances.gouv.fr' },
  { departement: '2B', departementNom: 'Haute-Corse', nom: 'SPF de Bastia', email: 'spf.bastia@dgfip.finances.gouv.fr' },
  { departement: '21', departementNom: 'Côte-d\'Or', nom: 'SPF de Dijon', email: 'spf.dijon@dgfip.finances.gouv.fr' },
  { departement: '22', departementNom: 'Côtes-d\'Armor', nom: 'SPF de Saint-Brieuc', email: 'spf.saint-brieuc@dgfip.finances.gouv.fr' },
  { departement: '23', departementNom: 'Creuse', nom: 'SPF de Guéret', email: 'spf.gueret@dgfip.finances.gouv.fr' },
  { departement: '24', departementNom: 'Dordogne', nom: 'SPF de Périgueux', email: 'spf.perigueux@dgfip.finances.gouv.fr' },
  { departement: '25', departementNom: 'Doubs', nom: 'SPF de Besançon', email: 'spf.besancon@dgfip.finances.gouv.fr' },
  { departement: '26', departementNom: 'Drôme', nom: 'SPF de Valence', email: 'spf.valence@dgfip.finances.gouv.fr' },
  { departement: '27', departementNom: 'Eure', nom: 'SPF d\'Évreux', email: 'spf.evreux@dgfip.finances.gouv.fr' },
  { departement: '28', departementNom: 'Eure-et-Loir', nom: 'SPF de Chartres', email: 'spf.chartres@dgfip.finances.gouv.fr' },
  { departement: '29', departementNom: 'Finistère', nom: 'SPF de Quimper', email: 'spf.quimper@dgfip.finances.gouv.fr' },
  { departement: '30', departementNom: 'Gard', nom: 'SPF de Nîmes', email: 'spf.nimes@dgfip.finances.gouv.fr' },
  { departement: '31', departementNom: 'Haute-Garonne', nom: 'SPF de Toulouse', email: 'spf.toulouse@dgfip.finances.gouv.fr' },
  { departement: '32', departementNom: 'Gers', nom: 'SPF d\'Auch', email: 'spf.auch@dgfip.finances.gouv.fr' },
  { departement: '33', departementNom: 'Gironde', nom: 'SPF de Bordeaux', email: 'spf.bordeaux@dgfip.finances.gouv.fr' },
  { departement: '34', departementNom: 'Hérault', nom: 'SPF de Montpellier', email: 'spf.montpellier@dgfip.finances.gouv.fr' },
  { departement: '35', departementNom: 'Ille-et-Vilaine', nom: 'SPF de Rennes', email: 'spf.rennes@dgfip.finances.gouv.fr' },
  { departement: '36', departementNom: 'Indre', nom: 'SPF de Châteauroux', email: 'spf.chateauroux@dgfip.finances.gouv.fr' },
  { departement: '37', departementNom: 'Indre-et-Loire', nom: 'SPF de Tours', email: 'spf.tours@dgfip.finances.gouv.fr' },
  { departement: '38', departementNom: 'Isère', nom: 'SPF de Grenoble', email: 'spf.grenoble@dgfip.finances.gouv.fr' },
  { departement: '39', departementNom: 'Jura', nom: 'SPF de Lons-le-Saunier', email: 'spf.lons-le-saunier@dgfip.finances.gouv.fr' },
  { departement: '40', departementNom: 'Landes', nom: 'SPF de Mont-de-Marsan', email: 'spf.mont-de-marsan@dgfip.finances.gouv.fr' },
  { departement: '41', departementNom: 'Loir-et-Cher', nom: 'SPF de Blois', email: 'spf.blois@dgfip.finances.gouv.fr' },
  { departement: '42', departementNom: 'Loire', nom: 'SPF de Saint-Étienne', email: 'spf.saint-etienne@dgfip.finances.gouv.fr' },
  { departement: '43', departementNom: 'Haute-Loire', nom: 'SPF du Puy-en-Velay', email: 'spf.le-puy@dgfip.finances.gouv.fr' },
  { departement: '44', departementNom: 'Loire-Atlantique', nom: 'SPF de Nantes', email: 'spf.nantes@dgfip.finances.gouv.fr' },
  { departement: '45', departementNom: 'Loiret', nom: 'SPF d\'Orléans', email: 'spf.orleans@dgfip.finances.gouv.fr' },
  { departement: '46', departementNom: 'Lot', nom: 'SPF de Cahors', email: 'spf.cahors@dgfip.finances.gouv.fr' },
  { departement: '47', departementNom: 'Lot-et-Garonne', nom: 'SPF d\'Agen', email: 'spf.agen@dgfip.finances.gouv.fr' },
  { departement: '48', departementNom: 'Lozère', nom: 'SPF de Mende', email: 'spf.mende@dgfip.finances.gouv.fr' },
  { departement: '49', departementNom: 'Maine-et-Loire', nom: 'SPF d\'Angers', email: 'spf.angers@dgfip.finances.gouv.fr' },
  { departement: '50', departementNom: 'Manche', nom: 'SPF de Saint-Lô', email: 'spf.saint-lo@dgfip.finances.gouv.fr' },
  { departement: '51', departementNom: 'Marne', nom: 'SPF de Reims', email: 'spf.reims@dgfip.finances.gouv.fr' },
  { departement: '52', departementNom: 'Haute-Marne', nom: 'SPF de Chaumont', email: 'spf.chaumont@dgfip.finances.gouv.fr' },
  { departement: '53', departementNom: 'Mayenne', nom: 'SPF de Laval', email: 'spf.laval@dgfip.finances.gouv.fr' },
  { departement: '54', departementNom: 'Meurthe-et-Moselle', nom: 'SPF de Nancy', email: 'spf.nancy@dgfip.finances.gouv.fr' },
  { departement: '55', departementNom: 'Meuse', nom: 'SPF de Bar-le-Duc', email: 'spf.bar-le-duc@dgfip.finances.gouv.fr' },
  { departement: '56', departementNom: 'Morbihan', nom: 'SPF de Vannes', email: 'spf.vannes@dgfip.finances.gouv.fr' },
  { departement: '57', departementNom: 'Moselle', nom: 'SPF de Metz', email: 'spf.metz@dgfip.finances.gouv.fr' },
  { departement: '58', departementNom: 'Nièvre', nom: 'SPF de Nevers', email: 'spf.nevers@dgfip.finances.gouv.fr' },
  { departement: '59', departementNom: 'Nord', nom: 'SPF de Lille', email: 'spf.lille@dgfip.finances.gouv.fr' },
  { departement: '60', departementNom: 'Oise', nom: 'SPF de Beauvais', email: 'spf.beauvais@dgfip.finances.gouv.fr' },
  { departement: '61', departementNom: 'Orne', nom: 'SPF d\'Alençon', email: 'spf.alencon@dgfip.finances.gouv.fr' },
  { departement: '62', departementNom: 'Pas-de-Calais', nom: 'SPF d\'Arras', email: 'spf.arras@dgfip.finances.gouv.fr' },
  { departement: '63', departementNom: 'Puy-de-Dôme', nom: 'SPF de Clermont-Ferrand', email: 'spf.clermont-ferrand@dgfip.finances.gouv.fr' },
  { departement: '64', departementNom: 'Pyrénées-Atlantiques', nom: 'SPF de Pau', email: 'spf.pau@dgfip.finances.gouv.fr' },
  { departement: '65', departementNom: 'Hautes-Pyrénées', nom: 'SPF de Tarbes', email: 'spf.tarbes@dgfip.finances.gouv.fr' },
  { departement: '66', departementNom: 'Pyrénées-Orientales', nom: 'SPF de Perpignan', email: 'spf.perpignan@dgfip.finances.gouv.fr' },
  { departement: '67', departementNom: 'Bas-Rhin', nom: 'SPF de Strasbourg', email: 'spf.strasbourg@dgfip.finances.gouv.fr' },
  { departement: '68', departementNom: 'Haut-Rhin', nom: 'SPF de Colmar', email: 'spf.colmar@dgfip.finances.gouv.fr' },
  { departement: '69', departementNom: 'Rhône', nom: 'SPF de Lyon', email: 'spf.lyon@dgfip.finances.gouv.fr' },
  { departement: '70', departementNom: 'Haute-Saône', nom: 'SPF de Vesoul', email: 'spf.vesoul@dgfip.finances.gouv.fr' },
  { departement: '71', departementNom: 'Saône-et-Loire', nom: 'SPF de Mâcon', email: 'spf.macon@dgfip.finances.gouv.fr' },
  { departement: '72', departementNom: 'Sarthe', nom: 'SPF du Mans', email: 'spf.le-mans@dgfip.finances.gouv.fr' },
  { departement: '73', departementNom: 'Savoie', nom: 'SPF de Chambéry', email: 'spf.chambery@dgfip.finances.gouv.fr' },
  { departement: '74', departementNom: 'Haute-Savoie', nom: 'SPF d\'Annecy', email: 'spf.annecy@dgfip.finances.gouv.fr' },
  { departement: '75', departementNom: 'Paris', nom: 'SPF de Paris', email: 'spf.paris@dgfip.finances.gouv.fr' },
  { departement: '76', departementNom: 'Seine-Maritime', nom: 'SPF de Rouen', email: 'spf.rouen@dgfip.finances.gouv.fr' },
  { departement: '77', departementNom: 'Seine-et-Marne', nom: 'SPF de Melun', email: 'spf.melun@dgfip.finances.gouv.fr' },
  { departement: '78', departementNom: 'Yvelines', nom: 'SPF de Versailles', email: 'spf.versailles@dgfip.finances.gouv.fr' },
  { departement: '79', departementNom: 'Deux-Sèvres', nom: 'SPF de Niort', email: 'spf.niort@dgfip.finances.gouv.fr' },
  { departement: '80', departementNom: 'Somme', nom: 'SPF d\'Amiens', email: 'spf.amiens@dgfip.finances.gouv.fr' },
  { departement: '81', departementNom: 'Tarn', nom: 'SPF d\'Albi', email: 'spf.albi@dgfip.finances.gouv.fr' },
  { departement: '82', departementNom: 'Tarn-et-Garonne', nom: 'SPF de Montauban', email: 'spf.montauban@dgfip.finances.gouv.fr' },
  { departement: '83', departementNom: 'Var', nom: 'SPF de Toulon', email: 'spf.toulon@dgfip.finances.gouv.fr' },
  { departement: '84', departementNom: 'Vaucluse', nom: 'SPF d\'Avignon', email: 'spf.avignon@dgfip.finances.gouv.fr' },
  { departement: '85', departementNom: 'Vendée', nom: 'SPF de La Roche-sur-Yon', email: 'spf.la-roche-sur-yon@dgfip.finances.gouv.fr' },
  { departement: '86', departementNom: 'Vienne', nom: 'SPF de Poitiers', email: 'spf.poitiers@dgfip.finances.gouv.fr' },
  { departement: '87', departementNom: 'Haute-Vienne', nom: 'SPF de Limoges', email: 'spf.limoges@dgfip.finances.gouv.fr' },
  { departement: '88', departementNom: 'Vosges', nom: 'SPF d\'Épinal', email: 'spf.epinal@dgfip.finances.gouv.fr' },
  { departement: '89', departementNom: 'Yonne', nom: 'SPF d\'Auxerre', email: 'spf.auxerre@dgfip.finances.gouv.fr' },
  { departement: '90', departementNom: 'Territoire de Belfort', nom: 'SPF de Belfort', email: 'spf.belfort@dgfip.finances.gouv.fr' },
  { departement: '91', departementNom: 'Essonne', nom: 'SPF d\'Évry', email: 'spf.evry@dgfip.finances.gouv.fr' },
  { departement: '92', departementNom: 'Hauts-de-Seine', nom: 'SPF de Nanterre', email: 'spf.nanterre@dgfip.finances.gouv.fr' },
  { departement: '93', departementNom: 'Seine-Saint-Denis', nom: 'SPF de Bobigny', email: 'spf.bobigny@dgfip.finances.gouv.fr' },
  { departement: '94', departementNom: 'Val-de-Marne', nom: 'SPF de Créteil', email: 'spf.creteil@dgfip.finances.gouv.fr' },
  { departement: '95', departementNom: 'Val-d\'Oise', nom: 'SPF de Pontoise', email: 'spf.pontoise@dgfip.finances.gouv.fr' },
  // DOM
  { departement: '971', departementNom: 'Guadeloupe', nom: 'SPF de Basse-Terre', email: 'spf.basse-terre@dgfip.finances.gouv.fr' },
  { departement: '972', departementNom: 'Martinique', nom: 'SPF de Fort-de-France', email: 'spf.fort-de-france@dgfip.finances.gouv.fr' },
  { departement: '973', departementNom: 'Guyane', nom: 'SPF de Cayenne', email: 'spf.cayenne@dgfip.finances.gouv.fr' },
  { departement: '974', departementNom: 'La Réunion', nom: 'SPF de Saint-Denis', email: 'spf.saint-denis-reunion@dgfip.finances.gouv.fr' },
  { departement: '976', departementNom: 'Mayotte', nom: 'SPF de Mamoudzou', email: 'spf.mamoudzou@dgfip.finances.gouv.fr' },
]

/**
 * Extract département code from a lieu string.
 * Supports: "Toulon (83)", "Toulon, 83", "Toulon 83", "Ajaccio (2A)"
 */
function extractDepartement(lieu: string): string | null {
  if (!lieu) return null

  // Pattern 1: (XX) or (XXX) or (2A) or (2B)
  const parenMatch = lieu.match(/\((\d{2,3}|2[AB])\)/)
  if (parenMatch) return parenMatch[1]

  // Pattern 2: trailing number after comma or space
  const trailingMatch = lieu.match(/[,\s]+(\d{2,3}|2[AB])\s*$/)
  if (trailingMatch) return trailingMatch[1]

  return null
}

/**
 * Find the SPF for a given lieu (birth/death place).
 * Returns null if no département can be extracted or no SPF found.
 */
export function findSPFByLieu(lieu: string): SPF | null {
  const dept = extractDepartement(lieu)
  if (!dept) return null
  return SPF_DIRECTORY.find(s => s.departement === dept) ?? null
}
