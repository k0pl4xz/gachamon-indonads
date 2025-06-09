'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FilterBarProps {
  filterText: string
  setFilterText: (val: string) => void
}

export function FilterBar({ filterText, setFilterText }: FilterBarProps) {
  return (
    <div className="space-y-1 mb-4">
      <Label htmlFor="filter" className="text-purple-700 font-medium">
        Cari berdasarkan ID Telegram
      </Label>
      <Input
        id="filter"
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Masukkan ID Telegram..."
        className="w-full sm:max-w-sm"
      />
    </div>
  )
}
