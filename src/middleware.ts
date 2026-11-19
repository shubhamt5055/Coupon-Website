import { defineMiddleware } from "astro:middleware";
import { getAuthenticatedAdmin, getAuthenticatedUser } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  // 1. Populate visitor user session if cookie exists
  const userSession = await getAuthenticatedUser(context.request);
  if (userSession) {
    context.locals.user = {
      id: userSession.sub,
      email: userSession.email,
      name: userSession.name,
      role: userSession.role,
    };
  }

  // 2. Protect visitor routes: /submit-coupon, /my-coupons, /api/coupons/submit
  const isProtectedUserPage =
    pathname === "/submit-coupon" ||
    pathname.startsWith("/submit-coupon/") ||
    pathname === "/my-coupons" ||
    pathname.startsWith("/my-coupons/");
  const isProtectedUserApi = pathname === "/api/coupons/submit";

  if (isProtectedUserPage || isProtectedUserApi) {
    if (!userSession) {
      if (isProtectedUserApi) {
        return Response.json(
          { error: "Unauthorized. Please sign in to submit a coupon." },
          { status: 401 }
        );
      }
      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/login?next=${nextPath}&reason=signin-required`);
    }
  }

  // 3. Admin routes protection
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPublicAdminApi =
    pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  if ((isAdminPage && !isAdminLoginPage) || (isAdminApi && !isPublicAdminApi)) {
    const session = await getAuthenticatedAdmin(context.request);

    if (!session.authenticated) {
      if (isAdminApi) {
        return Response.json(
          { error: "Unauthorized. Admin login required." },
          { status: 401 }
        );
      }

      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/admin/login?next=${nextPath}`);
    }

    context.locals.adminUser = session.username;
  }

  return next();
});
