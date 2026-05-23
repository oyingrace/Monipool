'use client'

export default function DashboardError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Something went wrong loading your dashboard.</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
