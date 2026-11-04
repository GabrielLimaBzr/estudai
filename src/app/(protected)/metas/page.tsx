'use client'
import { Insights } from '@/components/Insights'
import { Skeleton } from '@/components/Skeleton'
import { useReadyApp } from '@/contexts/app'

export default function Page() {
  const app = useReadyApp()
  if (!app) return <Skeleton />
  return <Insights app={app} />
}
