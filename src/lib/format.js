const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
]

export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

export function dayShort(date) {
  return DAYS[new Date(date).getDay()]
}

export function dayNum(date) {
  return new Date(date).getDate()
}

/** "Ven · 19h00" */
export function shortDateTime(date) {
  const d = new Date(date)
  const h = d.getHours()
  const m = d.getMinutes()
  const time = `${h}h${m ? String(m).padStart(2, '0') : '00'}`
  return `${DAYS[d.getDay()]} · ${time}`
}

/** "19h00" */
export function timeOnly(date) {
  const d = new Date(date)
  const m = d.getMinutes()
  return `${d.getHours()}h${m ? String(m).padStart(2, '0') : '00'}`
}

/** "12 juin 2025" */
export function longDate(date) {
  const d = new Date(date)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Nom du mois courant capitalisé : "Juin" */
export function monthName(date = new Date()) {
  const n = MONTHS[new Date(date).getMonth()]
  return n.charAt(0).toUpperCase() + n.slice(1)
}

/** "il y a 3 h", "hier", "à l'instant"… */
export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'hier'
  return `il y a ${Math.floor(diff / 86400)} j`
}

/** Horodatage compact pour la liste des conversations (façon maquette) :
 *  "14:20" aujourd'hui, "Hier", "Lun"…"Dim" (< 7 jours), sinon "12/06". */
export function messageTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (days <= 0) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (days === 1) return 'Hier'
  if (days < 7) return DAYS[d.getDay()]
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export { MONTHS, DAYS }
