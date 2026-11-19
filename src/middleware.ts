import { defineMiddleware } from "astro:middleware";
import { getAuthenticatedAdmin } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPublicAdminApi =
    pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  if ((isAdminPage && !isAdminLoginPage) || (isAdminApi && !isPublicAdminApi)) {
    const session = await getAuthenticatedAdmin(context.request);

    if (!session.authenticated) {
      if (isAdminApi) {
        return new Response(
          JSON.stringify({ error: "Unauthorized. Admin login required." }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const nextPath = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/admin/login?next=${nextPath}`);
    }

    context.locals.adminUser = session.username;
  }

  return next();
});
