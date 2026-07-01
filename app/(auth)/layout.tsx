export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(200,91,59,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_#fff7f1_0%,_#fffdfb_44%,_#f8efe8_100%)] px-4 py-10">
      <div className="absolute left-[-6rem] top-16 h-72 w-72 rounded-full bg-[#ffd9c7]/70 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-[#ffd79f]/45 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[960px] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
