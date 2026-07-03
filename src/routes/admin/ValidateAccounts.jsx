import { Check, X, UserCirclePlus } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Avatar, Loader, EmptyState } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { pupitreLabel } from '../../data/enums'

export default function ValidateAccounts() {
  const { show } = useToast()
  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at')
    return data || []
  }, [])

  const decide = async (id, decision) => {
    const status = decision === 'approve' ? 'active' : 'refused'
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    if (error) { show(error.message, 'error'); return }
    if (decision === 'approve') {
      await supabase.from('notifications').insert({ user_id: id, type: 'account', title: 'Compte validé', body: 'Bienvenue dans la chorale !' })
    }
    show(decision === 'approve' ? 'Compte approuvé' : 'Compte refusé', 'success')
    reload()
  }

  return (
    <Screen>
      <BackHeader title="Valider les comptes" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<UserCirclePlus size={42} weight="light" />} title="Aucune demande" text="Toutes les inscriptions ont été traitées." />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {data.map((p) => (
              <div key={p.id} className="card" style={{ padding: 14 }}>
                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                  <Avatar name={p.full_name} initials={p.avatar_initials} size={46} bg="var(--pink-bg)" color="var(--pink)" />
                  <div className="stack grow">
                    <span style={{ font: '700 14px var(--font-ui)', color: 'var(--title)' }}>{p.full_name || '—'}</span>
                    <span style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)' }}>{p.email}</span>
                    <span style={{ font: '600 11px var(--font-ui)', color: 'var(--cyan-dark)', marginTop: 2 }}>{pupitreLabel(p.pupitre)}</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <button className="tap grow row center" onClick={() => decide(p.id, 'refuse')} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--red-bg)', color: 'var(--red)', font: '700 13px var(--font-ui)', gap: 6 }}>
                    <X size={16} weight="bold" /> Refuser
                  </button>
                  <button className="tap grow row center" onClick={() => decide(p.id, 'approve')} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--grad-btn-cyan)', color: '#fff', font: '700 13px var(--font-ui)', gap: 6, boxShadow: 'var(--sh-btn-cyan)' }}>
                    <Check size={16} weight="bold" /> Approuver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
