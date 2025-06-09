'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

type Undian = {
  id: number
  id_telegram: string
  address_mon: string
  no_pilihan: number
}

interface DataTableProps {
  searchQuery: string
}

export function DataTable({ searchQuery }: DataTableProps) {
  const [data, setData] = useState<Undian[]>([])
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('undian_data')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      toast.error('Gagal memuat data')
    } else {
      setData(data)
    }
  }

  const filteredData = data.filter((d) =>
    d.id_telegram.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === filteredData.length) {
      setSelected([])
    } else {
      setSelected(filteredData.map((d) => d.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return
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
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Undian')
    XLSX.writeFile(wb, `undian_data.${type}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2 items-center">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Ekspor ke CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            Ekspor ke XLSX
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteSelected}
          disabled={selected.length === 0}
        >
          Hapus Data Terpilih
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-purple-100 text-purple-800">
            <tr>
              <th className="p-2">
                <Checkbox
                  checked={selected.length === filteredData.length}
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
            {filteredData.map((d) => (
              <tr key={d.id} className="border-t">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
