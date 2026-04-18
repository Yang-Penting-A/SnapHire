import UserNavbar from '../components/UserNavbar';
import Footer from '../components/Footer';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar khusus User yang udah login */}
      <UserNavbar />
      
      {/* Bagian tengah ini yang bakal gonta-ganti isi halamannya (Dashboard, Lowongan, dll) */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer pake ulang dari komponen yang udah ada */}
      <Footer />
    </div>
  );
}