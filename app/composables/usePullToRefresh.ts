import type { ConfirmState, EditModalState } from '~/types'

const THRESHOLD = 64
const MAX_PULL = 100

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  while (el && el !== document.body) {
    const overflowY = getComputedStyle(el).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return el
    el = el.parentElement
  }
  return null
}

function dampen(raw: number): number {
  return MAX_PULL * (1 - Math.exp(-raw / MAX_PULL))
}

export function usePullToRefresh() {
  const pullDistance = useState('ptrDistance', () => 0)
  const isRefreshing = useState('ptrRefreshing', () => false)

  let startY = 0
  let scrollParent: HTMLElement | null = null
  let tracking = false

  function anyModalOpen(): boolean {
    const confirm = useState<ConfirmState>('confirmModal', () => ({
      visible: false, message: '', label: 'Confirmer', resolve: null
    }))
    const edit = useState<EditModalState>('editModal', () => ({
      visible: false, entry: null, profiles: [], resolve: null
    }))
    const login = useState('showLoginModal', () => false)
    const person = useState<number | null>('personModal', () => null)
    return confirm.value.visible || edit.value.visible || login.value || person.value !== null
  }

  function onTouchStart(e: TouchEvent) {
    if (isRefreshing.value || anyModalOpen()) return
    scrollParent = findScrollParent(e.target as HTMLElement)
    if (!scrollParent || scrollParent.scrollTop > 0) {
      scrollParent = null
      return
    }
    startY = e.touches[0]!.clientY
    tracking = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!tracking || !scrollParent) return
    if (scrollParent.scrollTop > 0) {
      tracking = false
      pullDistance.value = 0
      return
    }
    const diff = e.touches[0]!.clientY - startY
    if (diff <= 0) {
      pullDistance.value = 0
      return
    }
    e.preventDefault()
    pullDistance.value = dampen(diff)
  }

  function onTouchEnd() {
    if (!tracking) return
    tracking = false
    scrollParent = null
    if (pullDistance.value >= THRESHOLD) {
      isRefreshing.value = true
      pullDistance.value = THRESHOLD
      setTimeout(() => location.reload(), 300)
    } else {
      pullDistance.value = 0
    }
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
  })
  onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })

  return { pullDistance, isRefreshing, threshold: THRESHOLD }
}
