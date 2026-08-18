import { STATUS, type StatusValue } from '../../authed/likeness/constants/constants'

export function getMenuItems(contentId: string, contentType?: string, status?: StatusValue) {
  const type = String(contentType ?? '').toLowerCase()
  const editHref = type.includes('likeness')
    ? `/authed/likeness/${contentId}`
    : type.includes('location')
      ? `/authed/locations/${contentId}`
      : `/authed/files/${contentId}`

  return [
    {
      text: 'Edit listing',
      href: editHref,
    },
    ...(status === STATUS.DRAFT
      ? []
      : [
          status === STATUS.ACTIVE
            ? { text: 'Deactivate', action: 'deactivate' }
            : { text: 'Activate', action: 'activate' },
        ]),
    {
      text: 'View history',
      href: '/authed/history',
    },
  ]
}
