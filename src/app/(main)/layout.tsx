import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import { Providers } from "@/components/Providers";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Providers session={session}>
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Üst header */}
        <div className="h-14 bg-gray-800 border-b border-gray-900">
          <Header user={session.user} />
        </div>

        {/* Alt kısım */}
        <div className="flex-1 flex">
          {/* Sol sidebar - Odalar listesi */}
          <div className="w-64 bg-gray-800 flex-shrink-0">
            <Sidebar />
          </div>

          {/* Ana içerik alanı */}
          <main className="flex-1 overflow-y-auto bg-gray-900">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
