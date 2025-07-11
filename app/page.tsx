import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* GitHub Logo */}
        <div className="mb-8">
          <svg
            height="64"
            aria-hidden="true"
            viewBox="0 0 16 16"
            version="1.1"
            width="64"
            className="mx-auto fill-white"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
        </div>

        <h1 className="text-4xl font-light text-white mb-2">Welcome to PetHub</h1>
        <p className="text-[#8b949e] text-lg mb-8">Join millions of pet owners sharing amazing pet profiles</p>

        <div className="space-y-4">
          <Link href="/register">
            <button className="w-full max-w-xs bg-[#238636] hover:bg-[#2ea043] text-white py-3 px-6 rounded-md font-medium transition-colors">
              Sign up for PetHub
            </button>
          </Link>
          <div className="text-[#8b949e]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#58a6ff] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
