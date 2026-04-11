export interface TypewriterExample {
  demandeur: string
  personne: string
  immeuble: string
}

export const examples: TypewriterExample[] = [
  {
    demandeur: 'Pierre Dupont',
    personne: 'DUPONT Antoine — 12/03/1892 à Marseille',
    immeuble: 'MARSEILLE — 38 avenue Foch · section E n°68',
  },
  {
    demandeur: 'Camille Duval',
    personne: 'DUVAL Marguerite — 04/07/1923 à Lyon',
    immeuble: 'LYON 6e — 14 rue Vauban · section CK n°122',
  },
  {
    demandeur: 'Théo Lefebvre',
    personne: 'LEFEBVRE Henri — 22/11/1908 à Lille',
    immeuble: 'ROUBAIX — 7 place de la Liberté · section AB n°45',
  },
  {
    demandeur: 'Léa Martin',
    personne: 'MARTIN Jeanne — 18/05/1936 à Bordeaux',
    immeuble: 'BORDEAUX — 22 cours Pasteur · section MX n°9',
  },
]
