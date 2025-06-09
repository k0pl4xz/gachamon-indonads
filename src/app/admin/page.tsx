'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    if (res.ok) {
      toast.success('Login berhasil')
      router.push('/admin/dashboard')
    } else {
      toast.error(data.error || 'Login gagal')
    }
  }
    

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-100 px-4">
      <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center text-purple-700 mb-6">Login Admin</h1>
        <div className="space-y-4">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white border-blue-300 text-black"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white border-blue-300 text-black"
          />
          <Button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
          >
            Login
          </Button>
         <a
  href="/dashboard"
  target="_blank"
  rel="noopener noreferrer"
  className="w-full"
>
  <Button variant="outline" className="w-full">
    Input Undian
  </Button>
</a>
        </div>
      </div>
    </div>
  )
}
