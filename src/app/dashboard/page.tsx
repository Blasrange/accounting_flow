import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  // Redirect to the main dashboard page
  redirect('/dashboard/dispatches');
}
