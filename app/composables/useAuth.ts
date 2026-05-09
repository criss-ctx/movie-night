export function useAuth() {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const showLoginModal = useState('showLoginModal', () => false)
  const pendingAction = useState<(() => Promise<void>) | null>('pendingAction', () => null)

  // Auto-execute pending action when session opens in the same tab
  watch(user, async (newUser) => {
    if (newUser && pendingAction.value) {
      await pendingAction.value()
      pendingAction.value = null
      showLoginModal.value = false
    }
  })

  async function requireAuth(action: () => Promise<void>) {
    if (user.value) {
      await action()
    } else {
      pendingAction.value = action
      showLoginModal.value = true
    }
  }

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false
      }
    })
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
