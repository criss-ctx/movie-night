import type { ConfirmState } from '~/types'

export function useConfirm() {
  const state = useState<ConfirmState>('confirmModal', () => ({
    visible: false,
    message: '',
    label: 'Confirmer',
    resolve: null
  }))

  function confirm(message: string, label = 'Confirmer'): Promise<boolean> {
    return new Promise(resolve => {
      state.value = { visible: true, message, label, resolve }
    })
  }

  return { confirm }
}
