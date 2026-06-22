// src/app/page.tsx
// Redirige la raíz al dashboard (el middleware maneja auth)
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
