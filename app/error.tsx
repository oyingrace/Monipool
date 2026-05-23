'use client'

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">Please try refreshing the page.</p>
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
