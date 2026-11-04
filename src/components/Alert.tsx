import { AlertCircle, CheckCircle2 } from 'lucide-react'

const LOOK = {
  error: { box: 'border-bad/50 bg-bad/10', Icon: AlertCircle, role: 'alert' as const },
  success: { box: 'border-ok/50 bg-ok/10', Icon: CheckCircle2, role: 'status' as const },
}

/** Aviso com ícone + texto (nunca só a cor). Erros são anunciados por leitores de tela. */
export function Alert({ kind = 'error', children, action }: { kind?: keyof typeof LOOK; children: React.ReactNode; action?: React.ReactNode }) {
  const { box, Icon, role } = LOOK[kind]
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-ink ${box}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{children}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
