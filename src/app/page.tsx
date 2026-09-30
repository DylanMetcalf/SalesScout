import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function Root() {
  redirect((await getSessionUser()) ? "/home" : "/login");
}
