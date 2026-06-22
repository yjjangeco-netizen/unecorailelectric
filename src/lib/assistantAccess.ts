const defaultOwnerUsernames = ['yjjang']
const defaultOwnerEmails = ['yjjangeco@gmail.com']

export type AssistantOwnerUser = {
  id: string
  username?: string | null
  email?: string | null
  name?: string | null
  level?: string | null
}

function configuredOwners() {
  const usernames = (process.env['ASSISTANT_OWNER_USERNAMES'] || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const emails = (process.env['ASSISTANT_OWNER_EMAILS'] || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return {
    usernames: usernames.length > 0 ? usernames : defaultOwnerUsernames,
    emails: emails.length > 0 ? emails : defaultOwnerEmails
  }
}

export function isAssistantOwner(user?: Partial<AssistantOwnerUser> | null) {
  if (!user) return false

  const owners = configuredOwners()
  const username = String(user.username || '').toLowerCase()
  const email = String(user.email || '').toLowerCase()

  return owners.usernames.includes(username) || owners.emails.includes(email)
}
