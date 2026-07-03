import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SealCheck, EnvelopeSimple, Phone, Lock } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { PUPITRES } from '../../data/enums'
import { Screen, BackHeader } from '../../components/Layout'
import { Field, Button, ChipSelect } from '../../components/ui'
import { useToast } from '../../context/ToastContext'

export default function Register() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { show } = useToast()
  const initialCode = state?.code || ''

  const [code, setCode] = useState(initialCode)
  const [codeValid, setCodeValid] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', pupitre: 'soprano', password: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    if (!/^CDP-[A-Z0-9]{4}$/.test(code)) { setCodeValid(false); return }
    supabase.rpc('check_invitation', { p_code: code }).then(({ data }) => {
      if (alive) setCodeValid(!!data)
    })
    return () => { alive = false }
  }, [code])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async () => {
    if (!form.full_name || !form.email || !form.password) {
      show('Merci de remplir tous les champs.', 'error'); return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone, pupitre: form.pupitre } }
    })
    if (error) { setBusy(false); show(error.message, 'error'); return }

    // Consomme le code s'il est valide -> compte activé automatiquement.
    if (data.session && codeValid) {
      const { error: rErr } = await supabase.rpc('redeem_invitation', { p_code: code })
      setBusy(false)
      if (!rErr) { nav('/app', { replace: true }); return }
    }
    setBusy(false)
    nav('/pending', { replace: true })
  }

  return (
    <Screen>
      <BackHeader title="Créer mon compte" />
      <div className="pad" style={{ paddingBottom: 30 }}>
        {codeValid ? (
          <div className="card" style={{ background: 'var(--green-bg)', border: '1px solid #d7e6cc', padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <SealCheck size={26} weight="fill" color="var(--green)" />
            <div className="stack">
              <span style={{ font: '700 11px var(--font-ui)', letterSpacing: 1, color: 'var(--green)' }}>CODE VALIDÉ</span>
              <span style={{ font: '600 13px var(--font-ui)', color: 'var(--body)' }}>{code} · Chorale Divine Providence</span>
            </div>
          </div>
        ) : (
          <Field
            label="Code d'invitation"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CDP-XXXX"
          />
        )}

        <Field label="Prénom & nom" value={form.full_name} onChange={set('full_name')} placeholder="Ex. Marie Kouassi" />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="vous@mail.com" icon={<EnvelopeSimple size={19} />} />
        <Field label="Téléphone" value={form.phone} onChange={set('phone')} placeholder="+225 …" icon={<Phone size={19} />} />

        <div className="stack" style={{ gap: 10, marginBottom: 16 }}>
          <span className="label">Pupitre</span>
          <ChipSelect options={PUPITRES} value={form.pupitre} onChange={(v) => setForm({ ...form, pupitre: v })} />
        </div>

        <Field label="Mot de passe" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" icon={<Lock size={19} />} />

        <Button variant="primary" onClick={submit} disabled={busy}>
          {busy ? 'Création…' : 'Créer mon compte'}
        </Button>
      </div>
    </Screen>
  )
}
