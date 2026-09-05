import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function SignupSuccessCard() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          Check your inbox
        </h2>
        <p className="text-sm text-muted-foreground">
          We have sent a verification link to your email address. Please click
          the link in the email to activate your candidate assessment account.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
      >
        Back to Log In
      </Link>
    </div>
  );
}
