export function useAuth() {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const showLoginModal = useState('showLoginModal', () => false)
  const pendingAction = useState<(() => Promise<void>) | null>('pendingAction', () => null)

  async function requireAuth(action: () => Promise<void>) {
    if (user.value) {
      await action()
    } else {
      pendingAction.value = action
      showLoginModal.value = true
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      showLoginModal.value = false
      if (pendingAction.value) {
        await pendingAction.value()
        pendingAction.value = null
      }
    }
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function dismissLogin() {
    pendingAction.value = null
    showLoginModal.value = false
  }

  return { user, requireAuth, signIn, signOut, showLoginModal, dismissLogin }
}
