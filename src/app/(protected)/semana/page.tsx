'use client'
import { Week } from '@/components/Week'
import { Skeleton } from '@/components/Skeleton'
import { useReadyApp } from '@/contexts/app'

export default function Page() {
  const app = useReadyApp()
  if (!app) return <Skeleton />
  return <Week app={app} />
}
