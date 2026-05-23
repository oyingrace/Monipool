import { Navbar } from '@/components/layout/Navbar'
import { PageWrapper } from '@/components/layout/PageWrapper'

export default function DashboardLoading() {
  return (
    <>
      <Navbar />
      <PageWrapper>
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </PageWrapper>
    </>
  )
}
