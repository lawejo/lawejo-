import { login } from "./actions";

export default function LoginPage() {
  return (
    <>
      <h1>Log ind</h1>
      <form action={login}>
        <label className="full">
          Adgangskode
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Log ind</button>
      </form>
    </>
  );
}
