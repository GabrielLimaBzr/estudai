'use client'
import { Shelf } from '@/components/Shelf'
import { Skeleton } from '@/components/Skeleton'
import { useReadyApp } from '@/contexts/app'

export default function Page() {
  const app = useReadyApp()
  if (!app) return <Skeleton />
  return <Shelf app={app} />
}
