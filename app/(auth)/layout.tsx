export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f5f6f8] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
