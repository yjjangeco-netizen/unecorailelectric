import { isAssistantOwner, type AssistantOwnerUser } from '@/lib/assistantAccess'
import { supabaseServer } from '@/lib/supabaseServer'

export async function getAssistantOwnerById(userId?: string | null) {
  if (!userId) return null
  const identifier = userId.trim()
  if (!identifier) return null

  const { data } = await supabaseServer
    .from('users')
    .select('id, username, email, name, level')
    .or(`id.eq.${identifier},username.eq.${identifier},email.eq.${identifier}`)
    .eq('is_active', true)
    .maybeSingle<AssistantOwnerUser>()

  if (!data || !isAssistantOwner(data)) return null
  return data
}

export async function getDefaultAssistantOwner() {
  const { data } = await supabaseServer
    .from('users')
    .select('id, username, email, name, level')
    .eq('is_active', true)
    .or('username.eq.yjjang,email.eq.yjjangeco@gmail.com')
    .limit(1)
    .maybeSingle<AssistantOwnerUser>()

  if (!data || !isAssistantOwner(data)) return null
  return data
}
