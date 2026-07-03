// Pupitres (valeur DB -> libellé UI)
export const PUPITRES = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'tenor', label: 'Ténor' },
  { value: 'basse', label: 'Basse' },
  { value: 'instrumentiste', label: 'Instrumentiste' },
  { value: 'chef_choeur', label: 'Chef de chœur' }
]
export const pupitreLabel = (v) => PUPITRES.find((p) => p.value === v)?.label || '—'

// Catégories de chants (ordre exact du README). 'tous' = filtre par défaut (UI only).
export const SONG_CATEGORIES = [
  { value: 'entree', label: 'Entrée' },
  { value: 'ordinaire', label: 'Ordinaire' },
  { value: 'psaume', label: 'Psaume' },
  { value: 'alleluia', label: 'Alléluia' },
  { value: 'pu', label: 'PU' },
  { value: 'offertoire', label: 'Offertoire' },
  { value: 'communion', label: 'Communion' },
  { value: 'action_de_grace', label: 'Act. de grâce' },
  { value: 'mariale', label: 'Mariale' },
  { value: 'funerailles', label: 'Funérailles' },
  { value: 'esperance', label: 'Espérance' },
  { value: 'louange', label: 'Louange' },
  { value: 'adoration', label: 'Adoration' }
]
export const categoryLabel = (v) => SONG_CATEGORIES.find((c) => c.value === v)?.label || v

// Rôles du bureau (pour l'éditeur admin, en chips)
export const BUREAU_ROLES = [
  'Président', 'Vice-président', 'Secrétaire', 'Trésorier', 'Aumônier', 'Chef de chœur'
]

// Pupitres suivis dans les statistiques agrégées
export const STAT_PUPITRES = [
  { value: 'soprano', label: 'Sopranos' },
  { value: 'alto', label: 'Altos' },
  { value: 'tenor', label: 'Ténors' },
  { value: 'basse', label: 'Basses' },
  { value: 'instrumentiste', label: 'Instrumentistes' }
]
