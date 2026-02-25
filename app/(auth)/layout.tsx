export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f5f6f8] px-4 py-12">
      <div className="mx-auto flex w-full max-w-[520px] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
