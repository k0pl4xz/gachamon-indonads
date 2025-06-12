'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function DashboardPage() {
  const [idTelegram, setIdTelegram] = useState<string>('')
  const [addressMon, setAddressMon] = useState<string>('')
  const [noPilihan, setNoPilihan] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  
  const [takenNumbers, setTakenNumbers] = useState<number[]>([])
  const [isCheckingNumbers, setIsCheckingNumbers] = useState<boolean>(false)

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
    if (!idTelegram || !addressMon || !noPilihan.trim()) {
      toast.error('Semua field wajib diisi!')
      return
    }

    const noPilihanInt = Number(noPilihan)
    if (isNaN(noPilihanInt) || noPilihanInt < 1 || noPilihanInt > 100) {
      toast.error('Nomor harus antara 1-100')
      return
    }

    const normalizedIdTelegram = idTelegram.toLowerCase()
    setIsLoading(true)

    try {
      const isAllowed = await checkLimit(normalizedIdTelegram)
      if (!isAllowed) {
        setIsLoading(false)
        return
      }

      const { data: existing } = await supabase
        .from('undian_data')
        .select('id')
        .eq('no_pilihan', noPilihanInt)
        .maybeSingle()

      if (existing) {
        toast.error('Nomor sudah terdaftar!')
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from('undian_data').insert({
        id_telegram: normalizedIdTelegram,
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

  
  const fetchTakenNumbers = async () => {
    setIsCheckingNumbers(true)
    try {
      const { data, error } = await supabase.from('undian_data').select('no_pilihan')

      if (error) throw error

      
      const numbers = data.map(item => item.no_pilihan)
      setTakenNumbers(numbers)
    } catch (error) {
      console.error('Error fetching taken numbers:', error)
      toast.error('Gagal mengambil data nomor.')
    } finally {
      setIsCheckingNumbers(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="bg-white border border-purple-300 rounded-xl py-6 px-4 shadow-lg shadow-purple-300">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-center">
              <Image
                src="/indonads.png"
                alt="Logo"
                width={50}
                height={50}
                priority
                onError={() => console.error('Gambar gagal dimuat')}
              />
            </div>
            <h2 className="text-xl font-bold text-purple-700 text-center">
              Form Undian $MON - Indonads User
            </h2>

            <Input
              placeholder="ID Telegram"
              value={idTelegram}
              onChange={(e) => setIdTelegram(e.target.value)}
              className="bg-white border-blue-300 text-black"
            />

            <Input
              placeholder="Address MON"
              value={addressMon}
              onChange={(e) => setAddressMon(e.target.value)}
              className="bg-white border-blue-300 text-black"
            />

            <Input
              placeholder="Nomor Pilihan (1-100)"
              type="number"
              min="1"
              max="100"
              value={noPilihan}
              onChange={(e) => setNoPilihan(e.target.value)}
              className="bg-white border-blue-300 text-black"
            />
            
            {}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
              >
                {isLoading ? 'Menyimpan...' : 'Submit'}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-blue-300 text-black hover:bg-purple-700 disabled:bg-purple-400"
                    onClick={fetchTakenNumbers} 
                  >
                    Cek Ketersediaan Nomor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Merah Sudah Terisi</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-2 py-4">
                    {isCheckingNumbers ? (
                      <p>Memuat nomor...</p>
                    ) : (
                      // Generate nomor 1-100 dan tandai sesuai status
                      Array.from({ length: 100 }, (_, i) => i + 1).map(
                        (number) => (
                          <Badge
                            key={number}
                            variant={
                              takenNumbers.includes(number)
                                ? 'destructive'
                                : 'outline'
                            }
                            className="w-10 h-10 flex items-center justify-center text-base"
                          >
                            {number}
                          </Badge>
                        )
                      )
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
