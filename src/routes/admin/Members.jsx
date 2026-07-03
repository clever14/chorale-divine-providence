import { useState } from 'react'
import { CaretDown, Users } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, ChipSelect, Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { PUPITRES, pupitreLabel } from '../../data/enums'

export default function Members() {
  const { show } = useToast()
  const [openId, setOpenId] = useState(null)

  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, pupitre, avatar_initials, photo_url, status').eq('status', 'active').order('full_name')
    return data || []
  }, [])

  const changePupitre = async (id, pupitre) => {
    const { error } = await supabase.from('profiles').update({ pupitre }).eq('id', id)
    if (error) show(error.message, 'error')
    else { show('Pupitre mis à jour', 'success'); reload() }
  }

  return (
    <Screen>
      <BackHeader title="Membres" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<Users size={42} weight="light" />} title="Aucun membre actif" />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {data.map((m) => {
              const open = openId === m.id
              return (
                <div key={m.id} className="card" style={{ overflow: 'hidden' }}>
                  <button className="tap row" onClick={() => setOpenId(open ? null : m.id)} style={{ padding: 14, gap: 12, width: '100%', textAlign: 'left' }}>
                    <Avatar name={m.full_name} initials={m.avatar_initials} url={m.photo_url} size={44} bg="var(--pink-bg)" color="var(--pink)" />
                    <div className="stack grow">
                      <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{m.full_name}</span>
                      <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{pupitreLabel(m.pupitre)}</span>
                    </div>
                    <CaretDown size={18} color="var(--muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                  {open && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <span className="label" style={{ display: 'block', marginBottom: 8 }}>Changer de pupitre</span>
                      <ChipSelect options={PUPITRES} value={m.pupitre} onChange={(v) => changePupitre(m.id, v)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Screen>
  )
}
