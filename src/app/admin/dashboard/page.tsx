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

type Undian = {
  id: number
  id_telegram: string
  address_mon: string
  no_pilihan: number
}

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<Undian[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [inputLimit, setInputLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState<'id_telegram' | 'no_pilihan'>('id_telegram')

  // Cek sesi login
  useEffect(() => {
    async function checkSession() {
      const res = await fetch('/api/session')
      if (!res.ok) router.push('/admin')
    }
    checkSession()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('undian_data')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      toast.error('Gagal memuat data')
    } else {
      setData(data)
    }
    setLoading(false)
  }

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
  }, [])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    if (!searchTerm.trim()) {
      fetchData()
      return
    }

    const { data, error } = await supabase
      .from('undian_data')
      .select('*')
      .ilike(searchBy, `%${searchTerm}%`)
      .order('id', { ascending: false })

    if (error) {
      toast.error('Gagal melakukan pencarian')
    } else {
      setData(data)
    }
    setLoading(false)
  }, [searchTerm, searchBy])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      } else {
        fetchData()
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, searchBy, handleSearch])

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
    <div className="max-w-6xl mx-auto mt-6 px-4 space-y-6">
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
        {/* Search Section */}
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
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-purple-600 text-white">
              Cari
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                fetchData()
              }}
              disabled={!searchTerm}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Limit Section */}
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Ekspor ke CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            Ekspor ke XLSX
          </Button>
        </div>
                  <a href="/dashboard" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              Input Undian
            </Button>
          </a>

        <Button
          variant="destructive"
          onClick={handleDeleteSelected}
          disabled={selected.length === 0}
          className="w-full sm:w-auto"
        >
          Hapus Data Terpilih ({selected.length})
        </Button>
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
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-purple-50">
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500">
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
