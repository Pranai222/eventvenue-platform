import { Suspense } from "react"
import AdminBookingsContent from "./content"
import Loading from "./loading"

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminBookingsContent />
    </Suspense>
  )
}
