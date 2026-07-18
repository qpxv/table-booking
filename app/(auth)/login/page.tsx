import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Image
        src="/club-logo-light.png"
        alt="Dice-Bock e.V."
        width={444}
        height={509}
        priority
        className="h-24 w-auto"
      />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
        <p className="text-sm text-muted-foreground">Dice-Bock e.V.</p>
      </div>
      <LoginForm />
    </div>
  );
}
