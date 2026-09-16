import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm text-foreground/85 transition duration-500 hover:border-accent-strong hover:shadow-[0_0_0_1px_rgba(214,161,70,0.2)]"
        type="submit"
      >
        Abmelden
      </button>
    </form>
  );
}
