import Link from "next/link";
import { PasskeyLogin } from "@/components/PasskeyLogin";

export default function LoginPage() {
  return (
    <>
      <h1>Log ind</h1>
      <PasskeyLogin />
      <p className="muted">
        Ny enhed eller ny passkey? <Link href="/login/registrer">Opret passkey</Link>
      </p>
    </>
  );
}
