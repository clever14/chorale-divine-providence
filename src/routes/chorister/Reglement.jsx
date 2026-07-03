import { Scroll } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Screen, BackHeader } from '../../components/Layout'
import { Loader, EmptyState } from '../../components/ui'

export default function Reglement() {
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.from('reglement_articles').select('*').order('num')
    return data || []
  }, [])

  return (
    <Screen>
      <BackHeader title="Règlement" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        <p style={{ font: 'italic 400 13px var(--font-serif)', color: 'var(--body-2)', lineHeight: 1.7, marginBottom: 22 }}>
          Les articles ci-dessous encadrent la vie de la chorale et sont partagés avec tous les membres.
        </p>

        {loading ? <Loader /> : !data.length ? (
          <EmptyState icon={<Scroll size={42} weight="light" />} title="Aucun article" text="Le règlement sera bientôt publié." />
        ) : (
          <div className="stack" style={{ gap: 14 }}>
            {data.map((a) => (
              <div key={a.id} className="card" style={{ padding: 18 }}>
                <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                  <div className="center" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--field-bg)', font: '700 13px var(--font-serif)', color: 'var(--navy)' }}>
                    {a.num}
                  </div>
                  <span style={{ font: '700 15px var(--font-serif)', color: 'var(--title)' }}>{a.title}</span>
                </div>
                <p style={{ font: '400 13.5px var(--font-ui)', color: 'var(--body)', lineHeight: 1.7, margin: 0 }}>{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}
