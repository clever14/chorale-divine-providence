import { WhatsappLogo, EnvelopeSimple, Phone } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Accordion, Avatar, Loader, EmptyState } from '../../components/ui'

export default function Help() {
  const { data, loading } = useAsync(async () => {
    const [{ data: help }, { data: faq }, { data: bureau }] = await Promise.all([
      supabase.from('help_links').select('*').eq('id', 1).maybeSingle(),
      supabase.from('faq').select('*').order('sort_order'),
      supabase.from('bureau_members').select('*').order('sort_order')
    ])
    return { help, faq: faq || [], bureau: bureau || [] }
  }, [])

  if (loading) return <Screen><BackHeader title="Aide & contact" /><Loader /></Screen>

  return (
    <Screen>
      <BackHeader title="Aide & contact" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <div className="row" style={{ gap: 10, marginBottom: 22 }}>
          {data.help?.whatsapp_url && (
            <a href={data.help.whatsapp_url} target="_blank" rel="noreferrer" className="tap grow row center" style={{ background: 'var(--whatsapp)', color: '#fff', padding: '14px 12px', borderRadius: 14, gap: 8, font: '700 13px var(--font-ui)' }}>
              <WhatsappLogo size={18} weight="fill" /> WhatsApp
            </a>
          )}
          {data.help?.email_contact && (
            <a href={`mailto:${data.help.email_contact}`} className="tap grow row center" style={{ background: 'var(--grad-btn)', color: '#fff', padding: '14px 12px', borderRadius: 14, gap: 8, font: '700 13px var(--font-ui)' }}>
              <EnvelopeSimple size={18} weight="fill" /> Email
            </a>
          )}
        </div>

        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Questions fréquentes</span>
        {data.faq.length ? <Accordion items={data.faq} /> : <EmptyState title="Aucune question pour l'instant" />}

        <span className="label" style={{ display: 'block', margin: '24px 0 10px' }}>Bureau</span>
        {!data.bureau.length ? <EmptyState title="Bureau non renseigné" /> : (
          <div className="stack" style={{ gap: 10 }}>
            {data.bureau.map((m) => (
              <div key={m.id} className="card row" style={{ padding: 12, gap: 12 }}>
                <Avatar name={m.name} initials={m.avatar_initials} size={44} bg="var(--pink-bg)" color="var(--pink)" />
                <div className="stack grow">
                  <span style={{ font: '700 13.5px var(--font-ui)', color: 'var(--title)' }}>{m.name}</span>
                  <span style={{ font: '400 11.5px var(--font-ui)', color: 'var(--muted)' }}>{m.role}</span>
                </div>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="tap center" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-btn-cyan)' }} aria-label="Appeler">
                    <Phone size={18} color="#fff" weight="fill" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
