import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, LogIn, UserPlus, Wand2 } from "lucide-react";
import {
  clearAuthStorage,
  getAuthUser,
  isAuthenticated,
} from "../../features/auth/authStorage";

type AppShellProps = {
  children: ReactNode;
};

function getNavLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-full px-3 py-1.5 text-xs font-medium transition",
    isActive
      ? "border border-indigo-400/50 bg-indigo-500/15 text-indigo-100"
      : "border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-100",
  ].join(" ");
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const authUser = getAuthUser();
  const loggedIn = isAuthenticated();

  function handleLogout() {
    clearAuthStorage();
    navigate("/login");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div
        className={[
          "relative z-10 mx-auto flex min-h-screen w-full flex-col px-3 sm:px-5 lg:px-6",
          isAuthPage ? "max-w-5xl py-4 sm:py-5" : "max-w-6xl py-6",
        ].join(" ")}
      >
        <header
          className={[
            "rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-[0_18px_60px_rgba(15,23,42,0.65)] backdrop-blur-2xl",
            isAuthPage ? "mb-8 px-4 py-3 sm:px-5" : "mb-6 px-4 py-4 sm:px-6",
          ].join(" ")}
        >
          <div
            className={[
              "flex flex-col lg:flex-row lg:items-center lg:justify-between",
              isAuthPage ? "gap-3" : "gap-4",
            ].join(" ")}
          >
            <Link to="/" className="flex items-center gap-3">
              <div
                className={[
                  "flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 shadow-lg shadow-indigo-500/40",
                  isAuthPage ? "h-9 w-9" : "h-10 w-10",
                ].join(" ")}
              >
                <span className="text-lg font-black text-slate-950">ET</span>
              </div>

              <div>
                <p
                  className={[
                    "font-semibold tracking-tight text-slate-100",
                    isAuthPage ? "text-base" : "text-lg",
                  ].join(" ")}
                >
                  Error Translator
                </p>
                <p className="text-xs text-slate-400">AI debugging workspace</p>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/" className={getNavLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  Analyzer
                </span>
              </NavLink>

              {loggedIn && (
                <NavLink to="/dashboard" className={getNavLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </span>
                </NavLink>
              )}

              {!loggedIn && (
                <>
                  <NavLink to="/login" className={getNavLinkClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <LogIn className="h-3.5 w-3.5" />
                      Login
                    </span>
                  </NavLink>

                  <NavLink to="/register" className={getNavLinkClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" />
                      Register
                    </span>
                  </NavLink>
                </>
              )}

              {loggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:border-red-400/60 hover:bg-red-500/15"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              )}
            </nav>
          </div>

          {loggedIn && authUser && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
              <span>
                Signed in as{" "}
                <span className="font-medium text-slate-200">
                  {authUser.full_name}
                </span>
              </span>
              <span>{authUser.email}</span>
            </div>
          )}
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
