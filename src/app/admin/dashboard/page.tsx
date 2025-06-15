'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'


type Undian = {
  id: number
  id_telegram: string
  address_mon: string
  no_pilihan: number
  pemenang: boolean
  ranking: number | null
  hadiah_mon: number | null 
}

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<Undian[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [inputLimit, setInputLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState<'id_telegram' | 'no_pilihan'>('id_telegram')
  const [winnerRank, setWinnerRank] = useState<string>('')
  const [prizeAmount, setPrizeAmount] = useState<string>('')
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const res = await fetch('/api/session')
      if (!res.ok) router.push('/admin')
    }
    checkSession()
  }, [router])


  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('undian_data')
      .select('*')
      .order('ranking', { ascending: true, nullsFirst: false }) 
      .order('id', { ascending: false })

    if (error) {
      toast.error('Gagal memuat data')
    } else {
      setData(data as Undian[])
    }
    setLoading(false)
  }, []) 


  const fetchInputLimit = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('input_limit')
      .single()
    if (!error && data) {
      setInputLimit(data.input_limit)
    }
  }


  useEffect(() => {
    fetchData()
    fetchInputLimit()
  }, [fetchData]) 

  const handleSearch = useCallback(async () => {
    setLoading(true)
    if (!searchTerm.trim()) {
      fetchData()
      return
    }
    let query = supabase
      .from('undian_data')
      .select('*')
      .order('id', { ascending: false })
    if (searchBy === 'id_telegram') {
      query = query.ilike(searchBy, `%${searchTerm}%`)
    } else if (searchBy === 'no_pilihan') {
      const numberSearch = Number(searchTerm)
      if (!isNaN(numberSearch)) {
        query = query.eq(searchBy, numberSearch)
      }
    }
    const { data, error } = await query
    if (error) {
      toast.error('Gagal melakukan pencarian')
    } else {
      setData(data as Undian[])
    }
    setLoading(false)
  }, [searchTerm, searchBy, fetchData])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch()
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [handleSearch])



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

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return
    const confirmed = window.confirm('Yakin ingin menghapus data terpilih?')
    if (!confirmed) return
    const { error } = await supabase
      .from('undian_data')
      .delete()
      .in('id', selected)

    if (error) {
      toast.error('Gagal menghapus data')
    } else {
      toast.success('Data berhasil dihapus')
      setSelected([])
      fetchData()
    }
  }

  const handleSetWinner = async () => {
    const rank = Number(winnerRank)
    const prize = Number(prizeAmount)

    if (!winnerRank || !prizeAmount || isNaN(rank) || isNaN(prize)) {
      toast.error('Ranking dan Hadiah MON harus diisi dengan angka yang valid.')
      return
    }

    if (selected.length === 0) {
      toast.info('Tidak ada data yang dipilih.')
      return
    }

    const { error } = await supabase
      .from('undian_data')
      .update({ 
        pemenang: true,
        ranking: rank,
        hadiah_mon: prize
       })
      .in('id', selected)

    if (error) {
      toast.error('Gagal menandai pemenang.')
      console.error(error)
    } else {
      toast.success(`Data terpilih berhasil ditandai sebagai pemenang Ranking ${rank}!`)
      setSelected([])
      fetchData()
      setIsWinnerDialogOpen(false) 
      setWinnerRank('') 
      setPrizeAmount('') 
    }
  }
  
  const handleCancelWinner = async () => {
    if (selected.length === 0) {
      toast.info('Pilih minimal satu data untuk dibatalkan status pemenangnya.')
      return
    }
    const confirmed = window.confirm(`Yakin ingin MEMBATALKAN status pemenang pada ${selected.length} data terpilih? Ini akan menghapus ranking dan hadiahnya.`)
    if(!confirmed) return

    const { error } = await supabase
        .from('undian_data')
        .update({ 
            pemenang: false,
            ranking: null, 
            hadiah_mon: null 
        })
        .in('id', selected)

    if(error){
        toast.error('Gagal membatalkan status pemenang.')
        console.error(error)
    } else {
        toast.success('Status pemenang berhasil dibatalkan!')
        setSelected([])
        fetchData()
    }
  }
  
  const handleExport = (type: 'csv' | 'xlsx') => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Undian')
    XLSX.writeFile(wb, `undian_data.${type}`)
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === data.length) {
      setSelected([])
    } else {
      setSelected(data.map((d) => d.id))
    }
  }

  const handleLogout = async () => {
    const res = await fetch('/api/logout', { method: 'POST' })
    if (res.ok) {
      window.location.href = '/admin'
    } else {
      toast.error('Gagal logout')
    }
  }

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 space-y-6">
        {/* ... (Toggle Search) ... */}
        <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600">Dashboard Admin</h1>
        <Button
          onClick={handleLogout}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          Logout
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-purple-700 font-medium">Pencarian</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={searchBy}
              onValueChange={(value: 'id_telegram' | 'no_pilihan') => setSearchBy(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Cari berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id_telegram">ID Telegram</SelectItem>
                <SelectItem value="no_pilihan">No Pilihan</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Masukkan ${searchBy === 'id_telegram' ? 'ID Telegram' : 'No Pilihan'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inputLimit" className="text-purple-700 font-medium">
            Batas Maksimal Input per ID Telegram
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={inputLimit?.toString() ?? ''}
              onValueChange={(value) => setInputLimit(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Pilih limit" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(10)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateLimit} className="bg-purple-600 text-white">
              Simpan
            </Button>
          </div>
        </div>
      </div>


      {/* Act Button Updatte */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Ekspor ke CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            Ekspor ke XLSX
          </Button>
          <a href="/dashboard" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              Input Undian
            </Button>
          </a>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
            <Dialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="default"
                        disabled={selected.length === 0}
                        className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600"
                    >
                        Set sebagai Pemenang ({selected.length})
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Pemenang</DialogTitle>
                        <DialogDescription>
                           Masukkan ranking dan jumlah hadiah untuk {selected.length} data terpilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ranking">Ranking</Label>
                            <Input id="ranking" type="number" placeholder="Contoh: 1" value={winnerRank} onChange={e => setWinnerRank(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hadiah">Hadiah $MON</Label>
                            <Input id="hadiah" type="number" placeholder="Contoh: 100" value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <Button onClick={handleSetWinner}>Simpan Pemenang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                onClick={handleCancelWinner}
                disabled={selected.length === 0}
                className="w-full sm:w-auto"
            >
                Batalkan Pemenang ({selected.length})
            </Button>
            <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selected.length === 0}
                className="w-full sm:w-auto"
            >
                Hapus Data Terpilih ({selected.length})
            </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-x-auto">
        {loading ? (
          <p className="text-center py-6 text-purple-600 font-medium">Memuat data...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-purple-100 text-purple-800">
              <tr>
                <th className="p-2 w-10">
                  <Checkbox
                    checked={selected.length === data.length && data.length > 0}
                    onCheckedChange={selectAll}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </th>
                <th className="text-left p-2">ID Telegram</th>
                <th className="text-left p-2">Address MON</th>
                <th className="text-left p-2">Nomor Pilihan</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Ranking</th>
                <th className="text-left p-2">Hadiah $MON</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((d) => (
                  <tr key={d.id} className={`border-t hover:bg-purple-50 ${d.pemenang ? 'bg-amber-100' : ''}`}>
                    <td className="p-2">
                      <Checkbox
                        checked={selected.includes(d.id)}
                        onCheckedChange={() => toggleSelect(d.id)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                    </td>
                    <td className="p-2">{d.id_telegram}</td>
                    <td className="p-2">{d.address_mon}</td>
                    <td className="p-2">{d.no_pilihan}</td>
                    <td className="p-2">
                      {d.pemenang && (
                        <Badge variant="default" className="bg-amber-500 text-white">
                           <Trophy className="mr-1 h-3 w-3" /> Pemenang
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">{d.ranking ?? '-'}</td>
                    <td className="p-2">{d.hadiah_mon ?? '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}