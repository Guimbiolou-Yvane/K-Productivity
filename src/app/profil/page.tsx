"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";

export default function ProfilRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          router.replace(`/profil/${user.id}`);
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center max-w-4xl mx-auto font-sans pb-32 overflow-x-hidden">
      <div className="w-full h-44 sm:h-56 bg-gray-200 animate-pulse" />
      <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center">
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-300 animate-pulse border-[6px] border-gray-200" />
        <div className="h-7 w-44 bg-gray-200 animate-pulse mt-4" />
        <div className="h-4 w-32 bg-gray-200 animate-pulse mt-2" />
      </div>
    </div>
  );
}
