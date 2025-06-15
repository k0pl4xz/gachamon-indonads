'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog' 

import { Trophy } from 'lucide-react'

type Winner = {
  id_telegram: string
  no_pilihan: number
  address_mon: string
}

export default function DashboardPage() {
  const [idTelegram, setIdTelegram] = useState<string>('')
  const [addressMon, setAddressMon] = useState<string>('')
  const [noPilihan, setNoPilihan] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [takenNumbers, setTakenNumbers] = useState<number[]>([])
  const [isCheckingNumbers, setIsCheckingNumbers] = useState<boolean>(false)

  const [winners, setWinners] = useState<Winner[]>([])
  const [isCheckingWinners, setIsCheckingWinners] = useState<boolean>(false)

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

  
  const fetchWinners = async () => {
    setIsCheckingWinners(true)
    try {
        const { data, error } = await supabase
            .from('undian_data')
            .select('id_telegram, no_pilihan, address_mon')
            .eq('pemenang', true) 
            .order('no_pilihan', { ascending: true })

        if (error) throw error;
        
        setWinners(data as Winner[]);
    } catch (error) {
        console.error('Error fetching winners:', error);
        toast.error('Gagal mengambil data pemenang.');
    } finally {
        setIsCheckingWinners(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-4">
      <div className="bg-white border border-purple-300 rounded-xl py-6 px-4 shadow-lg shadow-purple-300">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-center">
              <Image
                src="/logo-mon.png"
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
              placeholder="Username Telegram/DC"
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
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
              >
                {isLoading ? 'Menyimpan...' : 'Submit'}
              </Button>
              
              <ResponsiveDialog
                title="Status Ketersediaan Nomor"
                description="Nomor yang ditandai merah sudah terisi."
                trigger={
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={fetchTakenNumbers}
                  >
                    Cek Ketersediaan Nomor
                  </Button>
                }
              >
                <div className="flex flex-wrap gap-2 py-4">
                  {isCheckingNumbers ? (
                    <p>Memuat nomor...</p>
                  ) : (
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
              </ResponsiveDialog>

              {/* Cek Pemenang */}
              <ResponsiveDialog
                title="Daftar Pemenang Undian"
                trigger={
                    <Button
                        variant="default"
                        className="w-full bg-amber-500 text-white hover:bg-amber-600"
                        onClick={fetchWinners}
                    >
                        <Trophy className="mr-2 h-4 w-4" /> Cek Pemenang
                    </Button>
                }
              >
                <div className="py-4 space-y-4">
                    {isCheckingWinners ? (
                        <p>Memuat data pemenang...</p>
                    ) : winners.length > 0 ? (
                        winners.map((winner) => (
                            <Card key={winner.no_pilihan} className="bg-purple-50 border-purple-200">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="flex items-center text-purple-800">
                                            <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                                            Nomor Pemenang: {winner.no_pilihan}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">ID:</span> {winner.id_telegram}
                                    </p>
                                    <p className="text-sm text-gray-600 break-all">
                                      <span className="font-semibold">Address:</span> {winner.address_mon}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">
                            Belum ada pemenang yang diumumkan. Tunggu Jam 21.00 Ya ^_^ Bareng k0pl4xz dan Romusha
                        </p>
                    )}
                </div>
              </ResponsiveDialog>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}