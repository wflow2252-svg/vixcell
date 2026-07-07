import ClientMeetingPage from './ClientMeetingPage'

export function generateStaticParams() {
  return [
    { code: 'lobby' },
    { code: 'demo' }
  ]
}

export default function MeetingPage() {
  return <ClientMeetingPage />
}
