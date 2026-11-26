import Link from "next/link";
import { PasskeyButton } from "@/components/PasskeyButton";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <>
      <h1>Log ind</h1>
      <PasskeyButton action={login} label="Log ind med passkey" redirectTo="/" />
      <p className="muted">
        Ny enhed eller ny passkey? <Link href="/login/registrer">Opret passkey</Link>
      </p>
    </>
  );
}
