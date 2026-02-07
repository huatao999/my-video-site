import {NextRequest, NextResponse} from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const localeCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (!localeCookie || (localeCookie !== "zh" && localeCookie !== "en")) {
    res.cookies.set("NEXT_LOCALE", "zh", {path: "/", maxAge: 31536000});
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|admin|.*\\..*).*)"],
};
