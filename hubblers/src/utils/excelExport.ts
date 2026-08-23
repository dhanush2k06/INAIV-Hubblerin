import type { OrganizerRegistration } from '../services/api'

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * Exports organizer registration records to an Excel-compatible CSV file (with UTF-8 BOM)
 */
export function exportRegistrationsToCsv(
  registrations: OrganizerRegistration[],
  eventNameFilter = 'All_Events',
) {
  if (!registrations || registrations.length === 0) {
    alert('No registration data available to export.')
    return
  }

  const headers = [
    'Student Name',
    'Email Address',
    'Phone Number',
    'College / Institution',
    'Degree',
    'Branch / Department',
    'Year of Study',
    'Event Name',
    'Event Location',
    'Event Date',
    'Registered Date & Time',
    'Attendance Status',
  ]

  const rows = registrations.map((r) => [
    escapeCsvValue(r.name || 'N/A'),
    escapeCsvValue(r.email || 'N/A'),
    escapeCsvValue(r.phone || 'N/A'),
    escapeCsvValue(r.collegeName || 'N/A'),
    escapeCsvValue(r.degree || 'N/A'),
    escapeCsvValue(r.branch || 'N/A'),
    escapeCsvValue(r.year || 'N/A'),
    escapeCsvValue(r.eventTitle || 'N/A'),
    escapeCsvValue(r.eventLocation || 'N/A'),
    escapeCsvValue(r.eventStartDate ? `${r.eventStartDate}${r.eventEndDate && r.eventEndDate !== r.eventStartDate ? ` to ${r.eventEndDate}` : ''}` : 'N/A'),
    escapeCsvValue(formatDate(r.registeredAt)),
    escapeCsvValue(r.attended ? 'Attended (Present)' : 'Registered (Pending)'),
  ])

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n')

  // Prepend UTF-8 BOM so Excel opens it with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const sanitizedEvent = eventNameFilter.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `HubblerX_Registrations_${sanitizedEvent}_${timestamp}.csv`

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
