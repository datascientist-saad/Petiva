import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ConfigGate } from "@/components/shared/config-gate";
import { brand } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigGate>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="mb-8 text-center">
          <Logo className="items-center" showTagline />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{brand.subtitle}</p>
        </div>
        <div className="w-full max-w-md animate-gentle-scale">{children}</div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </ConfigGate>
  );
}
