// Limites de taille de fichier (en Mo) — cohérentes avec un usage réel de chorale.
export const FILE_LIMITS = {
  audio: 50,   // un chant complet en MP3 320 kbps ~ 10-15 Mo ; marge confortable
  pdf: 25,     // partitions multi-pages
  photo: 15,   // photos haute résolution du fil
  video: 200   // captations de répétition / prestation courtes
}

export const MB = 1024 * 1024

/** Vérifie la taille d'un fichier ; renvoie un message d'erreur ou null. */
export function checkFileSize(file, kind) {
  const limit = FILE_LIMITS[kind]
  if (!limit) return null
  if (file.size > limit * MB) {
    return `Fichier trop volumineux (${(file.size / MB).toFixed(0)} Mo). Limite : ${limit} Mo.`
  }
  return null
}

// Domaine synthétique pour les comptes sans email réel.
// L'email d'authentification est alors dérivé du numéro de téléphone.
export const SYNTHETIC_DOMAIN = 'members.choraledivineprovidence.app'

/** Normalise un numéro pour en faire un identifiant email stable. */
export function phoneToAuthEmail(phone) {
  const digits = String(phone).replace(/[^0-9]/g, '')
  return `${digits}@${SYNTHETIC_DOMAIN}`
}

/** Un email est-il synthétique (donc pas un vrai email de contact) ? */
export function isSyntheticEmail(email) {
  return !!email && email.endsWith(`@${SYNTHETIC_DOMAIN}`)
}

/** Ressemble à un email (contient @ et un point) plutôt qu'à un téléphone. */
export function looksLikeEmail(v) {
  return /@/.test(v) && /\./.test(v)
}

/** Lien vers la page de connexion de l'app (pour le message de validation). */
export function loginUrl() {
  return `${window.location.origin}/login`
}

/** Lien d'inscription pré-rempli avec un code d'invitation (pour le partage). */
export function inviteUrl(code) {
  return `${window.location.origin}/register?code=${encodeURIComponent(code)}`
}
