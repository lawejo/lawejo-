import { PasskeyRegister } from "@/components/PasskeyRegister";

export default function RegisterPage() {
  return (
    <>
      <h1>Opret passkey</h1>
      <p className="muted">
        Passkeyen virker først, når du har lagt den i Vercel. Indtil da giver den ikke adgang til noget.
      </p>
      <PasskeyRegister />
    </>
  );
}
