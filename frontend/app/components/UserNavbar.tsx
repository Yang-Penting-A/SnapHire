"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/app/lib/supabase"; // Sesuaikan path kalo beda

export default function UserNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // State buat nyimpen data user dinamis
  const [userName, setUserName] = useState("Loading...");
  const [userInitial, setUserInitial] = useState("");

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Daftar Lowongan", path: "/lowongan" },
    { name: "Riwayat Lamaran", path: "/riwayat" },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 1. Cek user yang lagi login pake bawaan Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (user?.email) {
          // 2. Kalo dapet emailnya, kita cari namanya di tabel 'User' lu (sesuai ERD)
          // Catatan: Ganti 'user' jadi 'User' kalo di Supabase lu huruf depannya gede
          const { data, error } = await supabase
            .from("User") 
            .select("name")
            .eq("email", user.email)
            .single();

          if (data && data.name) {
            setUserName(data.name);
            setUserInitial(data.name.charAt(0).toUpperCase());
          } else {
            // Kalo ga ketemu namanya, pake email aja sementara
            const fallbackName = user.email.split("@")[0];
            setUserName(fallbackName);
            setUserInitial(fallbackName.charAt(0).toUpperCase());
          }
        } else {
          // Kalo belum login atau session habis
          setUserName("Guest (Belum Login)");
          setUserInitial("G");
        }
      } catch (err) {
        console.error("Gagal narik profil:", err);
        setUserName("Error Profile");
        setUserInitial("!");
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-blue-600 tracking-tight">
                snap<span className="text-gray-900">Hire</span>
              </span>
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.path);
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600 py-5"
                      : "text-gray-500 hover:text-blue-600 py-5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Profil User (Desktop) - Bisa Diklik ke /profil */}
            <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{userName}</span>
            <Link href="/profil">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all">
                {userInitial}
                </div>
            </Link>
            </div>

          {/* Hamburger Menu (Mobile) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile (Dropdown) */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg absolute w-full">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          {/* Profil di Mobile - SEKARANG DINAMIS! */}
          <div className="border-t border-gray-100 mt-4 pt-4 flex items-center gap-3 px-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {userInitial}
            </div>
            <div>
              <p className="text-base font-medium text-gray-800">{userName}</p>
              <p className="text-sm font-medium text-gray-500">Kandidat</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}