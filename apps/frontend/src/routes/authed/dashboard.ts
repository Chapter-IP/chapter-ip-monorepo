import type { LikenessItem } from './likeness/likeness'
import type { LocationItem } from './location/location'
import type { WorkItem } from './creative-works/works'

export type DashboardCard = {
  id: string
  title: string
  description: string
  imageUrl: string
}

export type DashboardSection = {
  title: string
  ctaLabel: string
  href?: string
  disabled?: boolean
  items: DashboardCard[]
}

export function toDashboardCards(items: LikenessItem[]): DashboardCard[] {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.name || 'Unnamed likeness',
    description: item.bio || 'No biography available yet.',
    imageUrl: item.imageUrl,
  }))
}

export function toLocationDashboardCards(items: LocationItem[]): DashboardCard[] {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.name || 'Unnamed location',
    description: item.description || 'No description available yet.',
    imageUrl: item.imageUrl,
  }))
}

export function toWorkDashboardCards(items: WorkItem[]): DashboardCard[] {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title || 'Untitled work',
    description: item.description || item.contentType || 'No description available yet.',
    imageUrl: item.imageUrl,
  }))
}
