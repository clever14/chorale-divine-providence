// =============================================================================
// Messages du jour — thème : le service du chant dans l'église.
// Un message est sélectionné selon le jour de l'année : il change chaque jour,
// est identique pour tous les membres, et ne nécessite ni base de données ni
// intervention de l'administrateur.
//
// Chaque entrée : { text, ref }
//   text : le message affiché (sans guillemets, ajoutés par l'affichage)
//   ref  : source ou thème (les références bibliques sont des inspirations,
//          reformulées — pas des citations d'une traduction en particulier).
// =============================================================================

export const DAILY_MESSAGES = [
  { text: "Chaque voix qui s'élève dans le chœur porte la prière de toute l'assemblée jusqu'au ciel.", ref: 'Le ministère du chant' },
  { text: "Chanter pour le Seigneur, ce n'est pas se faire entendre des hommes, mais ouvrir son cœur à Dieu.", ref: 'Le service du chant' },
  { text: "Le choriste ne cherche pas les applaudissements : il cherche à faire monter la louange.", ref: "L'esprit de service" },
  { text: "Un chœur uni est le reflet d'une communauté qui marche d'un même pas vers Dieu.", ref: "L'unité du chœur" },
  { text: "Servir par le chant, c'est offrir sa voix comme une prière que d'autres pourront prier avec nous.", ref: 'Le service du chant' },
  { text: "La plus belle harmonie naît quand chacun accepte de ne pas couvrir la voix de son voisin.", ref: "L'humilité du choriste" },
  { text: "Répéter dans la fidélité aujourd'hui, c'est préparer la louange qui touchera les cœurs demain.", ref: 'La répétition' },
  { text: "Le chant sacré n'appartient pas au chanteur : il est un don reçu, rendu à Celui qui l'a donné.", ref: 'Le don du chant' },
  { text: "Quand la voix hésite, que le cœur, lui, reste tourné vers Dieu : c'est là l'essentiel du chant.", ref: "L'intention du cœur" },
  { text: "Chanter ensemble, c'est apprendre à s'écouter avant de chercher à être entendu.", ref: "L'écoute mutuelle" },
  { text: "La louange chantée ouvre les portes de la prière pour toute l'église rassemblée.", ref: 'La louange' },
  { text: "Le trac s'efface quand on se souvient pour Qui l'on chante, et non devant qui.", ref: 'La confiance' },
  { text: "Un cantique bien préparé est un service rendu à l'assemblée qui vient prier.", ref: 'La préparation' },
  { text: "La joie de chanter Dieu se partage : elle se répand du chœur jusqu'aux bancs de l'église.", ref: 'La joie du chant' },
  { text: "Prêter sa voix au Seigneur, c'est accepter d'être un instrument dont Il joue la mélodie.", ref: "L'instrument de Dieu" },
  { text: "La discipline du choriste est une forme d'amour : elle respecte le chœur et l'assemblée.", ref: 'La discipline' },
  { text: "Chantez de tout votre cœur : c'est le cœur, plus que la justesse, qui rend le chant vrai.", ref: "D'après Colossiens 3" },
  { text: "Le silence bien tenu fait partie du chant : il laisse à la prière le temps de résonner.", ref: 'Le sens du silence' },
  { text: "Servir dans le chœur, c'est porter les autres quand leur voix faiblit, et se laisser porter à son tour.", ref: 'Le soutien fraternel' },
  { text: "Une répétition n'est jamais perdue : elle sème ce que la célébration fera fleurir.", ref: 'La persévérance' },
  { text: "Louer Dieu en chantant, c'est répondre par la beauté à la beauté qu'Il nous a donnée.", ref: 'La louange' },
  { text: "Le premier auditeur du choriste n'est pas l'assemblée : c'est Dieu Lui-même.", ref: "L'intention du cœur" },
  { text: "Chanter juste importe, mais chanter uni importe davantage : Dieu écoute d'abord la fraternité.", ref: "L'unité du chœur" },
  { text: "Chaque note offerte avec foi devient une prière que les mots seuls ne sauraient dire.", ref: 'Le chant-prière' },
  { text: "Venir répéter fidèlement, c'est déjà chanter : la constance est une louange silencieuse.", ref: 'La fidélité' },
  { text: "Le chœur est une famille : on y grandit en s'accordant les uns aux autres.", ref: 'La famille du chœur' },
  { text: "Que votre chant soit nouveau chaque jour, non par les notes, mais par la ferveur du cœur.", ref: "D'après le Psaume 96" },
  { text: "Servir par la musique sacrée, c'est aider l'assemblée à prier avec plus de profondeur.", ref: 'Le service liturgique' },
  { text: "La voix se fatigue, mais la louange qui vient du cœur ne s'épuise jamais.", ref: 'La louange du cœur' },
  { text: "Chanter pour Dieu élève celui qui chante autant que celui qui écoute.", ref: 'Le fruit du chant' },
  { text: "Accordez d'abord vos cœurs : les voix suivront, et l'harmonie sera vraie.", ref: "L'accord des cœurs" },
  { text: "Le choriste dévoué prépare en semaine ce que l'assemblée recevra le dimanche.", ref: 'La préparation' },
  { text: "Louez le Seigneur par vos voix, mais surtout par une vie accordée à ce que vous chantez.", ref: 'Le témoignage' },
  { text: "Dans le chœur, la place de chacun est précieuse : nul n'est de trop, nul n'est en trop peu.", ref: 'La juste place' },
  { text: "Chanter la gloire de Dieu, c'est laisser passer un peu de lumière à travers sa propre voix.", ref: 'La gloire de Dieu' },
  { text: "La répétition patiente d'aujourd'hui devient la louange inspirée de demain.", ref: 'La persévérance' }
]

/** Message du jour, sélectionné de façon déterministe par le jour de l'année. */
export function messageOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date - start) / 86400000)
  const idx = ((dayOfYear % DAILY_MESSAGES.length) + DAILY_MESSAGES.length) % DAILY_MESSAGES.length
  return DAILY_MESSAGES[idx]
}
