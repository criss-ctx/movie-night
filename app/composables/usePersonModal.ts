export function usePersonModal() {
  const personId = useState<number | null>('personModal', () => null)

  function openPerson(id: number) {
    personId.value = id
  }

  function closePerson() {
    personId.value = null
  }

  return { personId, openPerson, closePerson }
}
