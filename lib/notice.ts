import { cookies } from "next/headers";

export async function setNotice(message: string) {
  const store = await cookies();
  store.set("apehs-notice", `${Date.now()}|${message}`, { path: "/", maxAge: 30, httpOnly: false });
}
