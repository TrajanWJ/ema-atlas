import Link from "next/link";

import {
  canRoleAccessPath,
  getRoleHomePath,
  sanitizeInternalPath,
  type AuthSession,
  type UserRole,
} from "@/lib/auth";

import { DevImpersonator } from "./DevImpersonator";
import styles from "./auth-console.module.css";

type AuthConsoleProps = {
  currentSession: AuthSession | null;
  nextPath: string | null;
  errorCode?: string | null;
  requiredRole?: UserRole | null;
};

function getErrorMessage(errorCode: string | null | undefined) {
  if (errorCode === "unknown-profile") {
    return "That dev profile was not found. Choose one of the listed roles and try again.";
  }

  if (errorCode === "invalid-session") {
    return "The session cookie could not be verified, so it was cleared before redirecting here.";
  }

  return null;
}

export function AuthConsole({
  currentSession,
  nextPath,
  errorCode,
  requiredRole = null,
}: AuthConsoleProps) {
  const sessionHome = currentSession ? getRoleHomePath(currentSession.role) : null;
  const safeNextPath = sanitizeInternalPath(nextPath);
  const showContinueAction =
    currentSession && safeNextPath ? canRoleAccessPath(currentSession.role, safeNextPath) : false;
  const errorMessage = getErrorMessage(errorCode);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Autharis identity lane</span>
          <h1>Role-gated access for client, talent, and admin routes.</h1>
          <p>
            This auth surface is intentionally lightweight: a signed cookie session, strict route
            checks in `middleware.ts`, and a dev-only impersonator for moving between isolated role
            surfaces without editing protected entry files.
          </p>
        </section>

        {requiredRole ? (
          <section className={styles.banner}>
            <strong className={styles.bannerStrong}>This route needs `{requiredRole}` access.</strong>
            Switch into that role below, or continue with your current role&rsquo;s home surface.
          </section>
        ) : null}

        {errorMessage ? (
          <section className={styles.banner}>
            <strong className={styles.bannerStrong}>Session reset</strong>
            {errorMessage}
          </section>
        ) : null}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.sessionHeader}>
              <span className={styles.kicker}>Current identity</span>
              <h2>{currentSession ? currentSession.name : "No active session"}</h2>
              <p className={styles.helperCopy}>
                {currentSession
                  ? "The current request resolved a valid signed cookie. You can keep moving, or switch personas."
                  : "Choose a dev identity to mint a cookie session and enter one of the protected role surfaces."}
              </p>
            </div>

            {currentSession ? (
              <>
                <div className={styles.sessionMeta}>
                  <div className={styles.metaRow}>
                    <span>Role</span>
                    <strong>{currentSession.role}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Title</span>
                    <strong>{currentSession.title}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Org</span>
                    <strong>{currentSession.organization}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Email</span>
                    <strong>{currentSession.email}</strong>
                  </div>
                </div>

                <div className={styles.actions}>
                  {showContinueAction && safeNextPath ? (
                    <Link className={styles.action} href={safeNextPath}>
                      Continue to requested route
                    </Link>
                  ) : null}

                  {sessionHome ? (
                    <Link className={styles.ghostAction} href={sessionHome}>
                      Open {currentSession.role} home
                    </Link>
                  ) : null}

                  <form action="/auth/logout" method="post">
                    <button className={styles.ghostAction} type="submit">
                      Clear session
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <p className={styles.helperCopy}>
                Protected routes will redirect here with a `next` hint when a session is missing.
              </p>
            )}
          </section>

          <DevImpersonator
            currentSession={currentSession}
            nextPath={safeNextPath}
            requiredRole={requiredRole}
          />
        </div>
      </div>
    </main>
  );
}
