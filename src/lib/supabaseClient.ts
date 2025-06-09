'use client'

import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createPagesBrowserClient()


export const createClient = () => {
  return createClientComponentClient()
}
