'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function LimitForm() {
  const [inputLimit, setInputLimit] = useState<number | null>(null)

  useEffect(() => {
    fetchInputLimit()
  }, [])

  const fetchInputLimit = async () => {
    const { data, error } = await supabase.from('settings').select('input_limit').single()
    if (!error && data) {
      setInputLimit(data.input_limit)
    }
  }

  const handleUpdateLimit = async () => {
    if (inputLimit === null || isNaN(inputLimit)) return

    const { error } = await supabase
      .from('settings')
      .update({ input_limit: inputLimit })
      .eq('id', 1)

    if (error) {
      toast.error('Gagal memperbarui limit')
    } else {
      toast.success('Limit berhasil diperbarui!')
    }
  }

  return (
    <div className="space-y-2 mb-6">
      <Label htmlFor="inputLimit" className="text-purple-700 font-medium">
        Batas Maksimal Input per ID Telegram
      </Label>
      <div className="flex gap-2 items-center flex-wrap">
        <Input
          id="inputLimit"
          type="number"
          value={inputLimit ?? ''}
          onChange={(e) => setInputLimit(Number(e.target.value))}
          className="max-w-[120px]"
        />
        <Button onClick={handleUpdateLimit} className="bg-purple-600 text-white">
          Simpan
        </Button>
      </div>
    </div>
  )
}
