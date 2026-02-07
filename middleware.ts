import {NextResponse} from "next/server";

// 单语言中文站：无需 locale 路由，直接放行
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|admin|.*\\..*).*)"],
};
