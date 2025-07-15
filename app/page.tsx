import Link from "next/link"
import { PetHubLogo } from "@/components/ui/pethub-logo"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      <div className="text-center">
       {/* PetHub Logo */}
      <div className="flex justify-center mb-12">
        <PetHubLogo size={80} />
        </div>

        <h1 className="text-4xl font-light text-white mb-2">Welcome to PetHub</h1>
        <p className="text-[#8b949e] text-lg mb-8">Because every pet has a story to tell. </p>

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
