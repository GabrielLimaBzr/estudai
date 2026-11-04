import type { Block, LinkItem, Subject, Task } from '@/lib/types'

/** Qual janela de formulário está aberta (a tela inteira tem no máximo uma). */
export type Dialog =
  | { k: 'subject'; item?: Subject }
  | { k: 'task'; item?: Task }
  | { k: 'block'; item?: Block; weekday?: number }
  | { k: 'link'; item?: LinkItem }
  | { k: 'log'; subject?: string | null }
export type OpenDialog = (d: Dialog) => void
