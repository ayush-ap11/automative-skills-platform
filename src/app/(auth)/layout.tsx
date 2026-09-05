export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Automotive Skills Assessment Platform
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Evidence-based skills assessment for Australia&apos;s evolving
            automotive workforce.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
