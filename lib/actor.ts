import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";


export interface Actor {
  id: string;
  name: string;
  role: string;
}

/**
 * Every service mutation runs on behalf of an Actor. Web callers omit
 * `explicit` and fall back to the cookie session; non-web callers (e.g. the
 * Discord bot) resolve their own Actor ahead of time and pass it in.
 */
export async function resolveActor(explicit?: Actor): Promise<Actor | null> {
  if (explicit) return explicit;
  const session = await getSession();
  if (!session) return null;
  return { id: session.user.id, name: session.user.name, role: session.user.role ?? ROLES.USER };
}

export function actorIsAdmin(actor: Actor): boolean {
  return actor.role === ROLES.ADMIN;
}
