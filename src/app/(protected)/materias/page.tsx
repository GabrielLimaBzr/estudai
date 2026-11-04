'use client'
import { Subjects } from '@/components/Subjects'
import { Skeleton } from '@/components/Skeleton'
import { useReadyApp } from '@/contexts/app'

export default function Page() {
  const app = useReadyApp()
  if (!app) return <Skeleton />
  return <Subjects app={app} />
}
