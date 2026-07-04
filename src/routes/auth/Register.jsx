import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SealCheck, EnvelopeSimple, Phone, Lock } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { PUPITRES } from '../../data/enums'
import { phoneToAuthEmail } from '../../lib/config'
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
  // email est désormais FACULTATIF ; le téléphone est l'identifiant principal.
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
    // Nom, téléphone et mot de passe obligatoires. Email facultatif.
    if (!form.full_name.trim() || !form.phone.trim() || !form.password) {
      show('Nom, téléphone et mot de passe sont obligatoires.', 'error'); return
    }
    if (form.password.length < 6) {
      show('Le mot de passe doit faire au moins 6 caractères.', 'error'); return
    }
    setBusy(true)

    // L'email d'authentification est l'email réel s'il est fourni,
    // sinon un email synthétique dérivé du numéro de téléphone.
    const hasRealEmail = !!form.email.trim()
    const authEmail = hasRealEmail ? form.email.trim() : phoneToAuthEmail(form.phone)

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          pupitre: form.pupitre,
          contact_email: hasRealEmail ? form.email.trim() : null
        }
      }
    })
    if (error) { setBusy(false); show(traduireErreur(error.message), 'error'); return }

    // Le code d'invitation, s'il est valide, est consommé (usage unique).
    // Il ne suffit PLUS à activer le compte : la validation par l'admin est requise.
    if (codeValid) {
      await supabase.rpc('redeem_invitation', { p_code: code })
    }

    // Toute nouvelle inscription part en attente de validation par l'administrateur.
    setBusy(false)
    nav('/pending', { replace: true, state: { reason: 'admin' } })
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
            label="Code d'invitation (facultatif)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CDP-XXXX"
          />
        )}

        <Field label="Prénom & nom" value={form.full_name} onChange={set('full_name')} placeholder="Ex. Marie Kouassi" />
        <Field label="Téléphone" value={form.phone} onChange={set('phone')} placeholder="+225 …" icon={<Phone size={19} />} />
        <Field label="Email (facultatif)" type="email" value={form.email} onChange={set('email')} placeholder="vous@mail.com" icon={<EnvelopeSimple size={19} />} />

        <div className="stack" style={{ gap: 10, marginBottom: 16 }}>
          <span className="label">Pupitre</span>
          <ChipSelect options={PUPITRES} value={form.pupitre} onChange={(v) => setForm({ ...form, pupitre: v })} />
        </div>

        <Field label="Mot de passe" type="password" value={form.password} onChange={set('password')} placeholder="Au moins 6 caractères" icon={<Lock size={19} />} />

        <p style={{ font: '400 12px var(--font-ui)', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
          Votre demande sera examinée par l'administrateur de la chorale. Vous pourrez vous connecter avec votre <strong>téléphone</strong> (ou votre email si vous l'avez renseigné) une fois validée.
        </p>

        <Button variant="primary" onClick={submit} disabled={busy}>
          {busy ? 'Création…' : 'Envoyer ma demande'}
        </Button>
      </div>
    </Screen>
  )
}

function traduireErreur(msg) {
  if (/already registered|already been registered/i.test(msg)) return 'Ce téléphone ou cet email est déjà utilisé.'
  if (/password/i.test(msg)) return 'Mot de passe invalide (min. 6 caractères).'
  return msg
}
