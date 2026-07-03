import { useState, useMemo } from 'react'
import { CaretRight, ChatCircleDots, CaretLeft as CL } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { TabHeader } from '../../components/Layout'
import { Loader, EmptyState, Segmented } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { timeOnly, MONTHS, DAYS } from '../../lib/format'

export default function Agenda() {
  const [view, setView] = useState('list')
  const [refresh, setRefresh] = useState(0)
  const { user } = useAuth()

  const { data, loading } = useAsync(async () => {
    const [{ data: events }, { data: mine }] = await Promise.all([
      supabase.from('events').select('*').order('starts_at'),
      supabase.from('event_attendance').select('*').eq('user_id', user.id)
    ])
    const byEvent = new Map()
    ;(mine || []).forEach((a) => byEvent.set(a.event_id, a.status))
    return { events: events || [], mine: byEvent }
  }, [refresh])

  return (
    <>
      <TabHeader title="Agenda" />
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'flex-end' }}>
        <Segmented
          options={[{ value: 'list', label: 'Liste' }, { value: 'month', label: 'Mois' }]}
          value={view}
          onChange={setView}
        />
      </div>

      {loading ? <Loader /> : (
        view === 'list'
          ? <ListView events={data.events} mine={data.mine} onChange={() => setRefresh((n) => n + 1)} userId={user.id} />
          : <MonthView events={data.events} />
      )}
    </>
  )
}

/* --------- Vue Liste --------- */
function ListView({ events, mine, onChange, userId }) {
  const { show } = useToast()
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))

  // Bandeau des 5 prochains jours (à partir d'aujourd'hui)
  const days = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    days.push(d)
  }

  const mark = async (eventId, status) => {
    const { error } = await supabase.from('event_attendance').upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    )
    if (error) show(error.message, 'error')
    else { show(status === 'present' ? 'Présence confirmée' : 'Absence enregistrée', 'success'); onChange() }
  }

  return (
    <div className="pad" style={{ paddingBottom: 30 }}>
      {/* Bandeau jours */}
      <div className="row" style={{ gap: 10, marginBottom: 18, justifyContent: 'space-between' }}>
        {days.map((d, i) => {
          const has = upcoming.some((e) => sameDay(new Date(e.starts_at), d))
          const active = i === 0
          return (
            <div key={i} className="center stack" style={{ flex: 1, gap: 4 }}>
              <span style={{ font: '700 10px var(--font-ui)', letterSpacing: 1, color: 'var(--muted)' }}>{DAYS[d.getDay()].toUpperCase()}</span>
              <div className="center" style={{ width: 42, height: 42, borderRadius: '50%', background: active ? 'var(--navy)' : 'transparent', border: active ? 'none' : '1px solid var(--border)', color: active ? '#fff' : 'var(--title)', font: '700 15px var(--font-ui)', position: 'relative' }}>
                {d.getDate()}
                {has && !active && <span style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />}
              </div>
            </div>
          )
        })}
      </div>

      {upcoming.length === 0 ? (
        <EmptyState title="Aucun événement à venir" text="L'agenda est vide pour l'instant." />
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {upcoming.map((e) => {
            const status = mine.get(e.id)
            return (
              <div key={e.id} className="card" style={{ padding: 14 }}>
                <div className="row" style={{ gap: 14 }}>
                  <div className="center stack" style={{ width: 44, gap: 2 }}>
                    <span style={{ font: '700 18px var(--font-serif)', color: 'var(--title)' }}>{new Date(e.starts_at).getDate()}</span>
                    <span style={{ font: '700 9px var(--font-ui)', letterSpacing: 1, color: 'var(--muted)' }}>{DAYS[new Date(e.starts_at).getDay()].toUpperCase()}</span>
                  </div>
                  <div className="stack grow">
                    <span style={{ font: '700 10px var(--font-ui)', letterSpacing: 1, color: 'var(--cyan-dark)', textTransform: 'uppercase' }}>{e.type || 'Événement'}</span>
                    <span style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>{e.title}</span>
                    <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)', marginTop: 3 }}>
                      🕒 {timeOnly(e.starts_at)}{e.location ? ` · ${e.location}` : ''}
                    </span>
                  </div>
                </div>
                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                  <button className="tap grow" onClick={() => mark(e.id, 'present')} style={pillBtn(status === 'present', 'green')}>Présent</button>
                  <button className="tap grow" onClick={() => mark(e.id, 'absent')} style={pillBtn(status === 'absent', 'red')}>Absent</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card row tap" style={{ marginTop: 16, padding: 14, gap: 10, background: 'var(--field-bg)', border: '1px dashed var(--border)' }}>
        <ChatCircleDots size={20} color="var(--cyan-dark)" weight="fill" />
        <span style={{ font: '600 13px var(--font-ui)', color: 'var(--title)' }} className="grow">Confirmer mes présences</span>
        <CaretRight size={16} color="var(--muted)" />
      </div>
    </div>
  )
}

function pillBtn(active, tone) {
  const on = tone === 'green'
    ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid #cfe0bf' }
    : { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid #f2c7c4' }
  const off = { background: 'var(--card-bg)', color: 'var(--muted)', border: '1px solid var(--border)' }
  return { padding: '9px 12px', borderRadius: 12, font: '600 12.5px var(--font-ui)', ...(active ? on : off) }
}

/* --------- Vue Mois (calendrier) --------- */
function MonthView({ events }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const eventsByDay = useMemo(() => {
    const map = new Map()
    events.forEach((e) => {
      const d = new Date(e.starts_at)
      if (d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
        const k = d.getDate()
        map.set(k, [...(map.get(k) || []), e])
      }
    })
    return map
  }, [events, cursor])

  const firstDay = cursor.getDay() || 7 // lundi=1
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 1; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="pad" style={{ paddingBottom: 30 }}>
      <div className="spread" style={{ marginBottom: 14 }}>
        <button className="tap" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} style={{ color: 'var(--navy)', display: 'flex' }}>
          <CL size={20} weight="bold" />
        </button>
        <span style={{ font: '700 16px var(--font-serif)', color: 'var(--title)' }}>
          {MONTHS[cursor.getMonth()].charAt(0).toUpperCase() + MONTHS[cursor.getMonth()].slice(1)} {cursor.getFullYear()}
        </span>
        <button className="tap" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={{ color: 'var(--navy)', display: 'flex' }}>
          <CaretRight size={20} weight="bold" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="center" style={{ font: '700 10px var(--font-ui)', color: 'var(--muted)' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          const dayEvents = d ? eventsByDay.get(d) || [] : []
          const isToday = d && sameDay(new Date(cursor.getFullYear(), cursor.getMonth(), d), new Date())
          return (
            <div key={i} className="center stack" style={{
              aspectRatio: '1/1', borderRadius: 10,
              background: isToday ? 'var(--navy)' : d && dayEvents.length ? 'var(--cyan-soft)' : 'transparent',
              color: isToday ? '#fff' : 'var(--title)', gap: 2,
              font: '600 13px var(--font-ui)'
            }}>
              {d && d}
              {d && dayEvents.length > 0 && !isToday && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan-dark)' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function sameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
