import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getAppUserById } from "@/lib/auth/users";
import { getAuthSecret } from "@/lib/auth/env";

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!getAuthSecret()) return null;
  try {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (!id) return null;
    const row = await getAppUserById(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || "Member",
      email: row.email,
      image: row.image,
    };
  } catch {
    return null;
  }
}
