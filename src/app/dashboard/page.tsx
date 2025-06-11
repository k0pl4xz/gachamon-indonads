'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import Image from 'next/image'

export default function DashboardPage() {
  const [idTelegram, setIdTelegram] = useState<string>('')
  const [addressMon, setAddressMon] = useState<string>('')
  const [noPilihan, setNoPilihan] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isTelegramValid, setIsTelegramValid] = useState<boolean>(false)
  const [isCheckingTelegram, setIsCheckingTelegram] = useState<boolean>(false)

  // Validasi real-time ID Telegram
  useEffect(() => {
    const checkTelegram = async () => {
      if (!idTelegram || idTelegram.length < 3) {
        setIsTelegramValid(false)
        return
      }

      setIsCheckingTelegram(true)
      try {
        const response = await fetch('/api/check-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
    'Cache-Control': 'no-store' },
          body: JSON.stringify({ idTelegram: idTelegram.replace(/^@/, '') })
        })
        const { valid } = await response.json()
        setIsTelegramValid(valid)
        if (!valid) toast.error('ID Telegram tidak valid atau tidak ditemukan')
      } catch {
        setIsTelegramValid(false)
        toast.error('Gagal memverifikasi ID Telegram')
      } finally {
        setIsCheckingTelegram(false)
      }
    }

    const timer = setTimeout(checkTelegram, 1000)
    return () => clearTimeout(timer)
  }, [idTelegram])

  const checkLimit = async (id_telegram: string): Promise<boolean> => {
    try {
      const { data: settingData, error: settingError } = await supabase
        .from('settings')
        .select('input_limit')
        .single()

      if (settingError) throw settingError

      const maxLimit = settingData?.input_limit ?? 0

      const { count, error: countError } = await supabase
        .from('undian_data')
        .select('*', { count: 'exact', head: true })
        .eq('id_telegram', id_telegram)

      if (countError) throw countError

      if ((count ?? 0) >= maxLimit) {
        toast.error(`ID Telegram MAX: ${maxLimit} Nomor.`)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in checkLimit:', error)
      toast.error('Terjadi kesalahan saat memeriksa limit.')
      return false
    }
  }

  const handleSubmit = async () => {
    if (!isTelegramValid) {
      toast.error('Harap masukkan ID Telegram yang valid')
      return
    }

    if (!idTelegram || !addressMon || !noPilihan.trim()) {
      toast.error('Semua field wajib diisi!')
      return
    }

    const noPilihanInt = Number(noPilihan)
    if (isNaN(noPilihanInt) || noPilihanInt < 1 || noPilihanInt > 100) {
      toast.error('Nomor harus antara 1-100')
      return
    }

    setIsLoading(true)

    try {
      const isAllowed = await checkLimit(idTelegram)
      if (!isAllowed) return

      const { data: existing } = await supabase
        .from('undian_data')
        .select('id')
        .eq('no_pilihan', noPilihanInt)
        .maybeSingle()

      if (existing) {
        toast.error('Nomor sudah terdaftar!')
        return
      }

      const { error } = await supabase.from('undian_data').insert({
        id_telegram: idTelegram,
        address_mon: addressMon,
        no_pilihan: noPilihanInt,
      })

      if (error) throw error

      toast.success('Data tersimpan!')
      setIdTelegram('')
      setAddressMon('')
      setNoPilihan('')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Gagal menyimpan data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="bg-white border border-purple-300 rounded-xl py-6 px-4 shadow-lg shadow-purple-300">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-center">
              <Image 
                src="/logo-mon.png" 
                alt="Logo" 
                width={50} 
                height={30}
                priority
                onError={() => console.error("Gambar gagal dimuat")}
              />
            </div>
            <h2 className="text-xl font-bold text-purple-700 text-center">
              Form Undian $MON - Indonads User
            </h2>
            
            <div className="relative">
              <Input
                placeholder="ID Telegram (@username atau ID numerik)"
                value={idTelegram}
                onChange={(e) => setIdTelegram(e.target.value)}
                className="bg-white border-blue-300 text-black"
              />
              {isCheckingTelegram && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
                </div>
              )}
              {idTelegram && !isCheckingTelegram && (
                <div className="absolute right-2 top-2">
                  {isTelegramValid ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                </div>
              )}
            </div>
            
            <Input
              placeholder="Address MON"
              value={addressMon}
              onChange={(e) => setAddressMon(e.target.value)}
              className="bg-white border-blue-300 text-black"
              disabled={!isTelegramValid}
            />
            
            <Input
              placeholder="Nomor Pilihan (1-100)"
              type="number"
              min="1"
              max="100"
              value={noPilihan}
              onChange={(e) => setNoPilihan(e.target.value)}
              className="bg-white border-blue-300 text-black"
              disabled={!isTelegramValid}
            />
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isTelegramValid}
              className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Submit'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}