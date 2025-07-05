"use client";

import useAuthStore from "../../store/authStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 transition-all duration-300">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-4">
          ¡Bienvenido al Home!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Has iniciado sesión correctamente.
        </p>
      </div>
    </main>
  );
}
