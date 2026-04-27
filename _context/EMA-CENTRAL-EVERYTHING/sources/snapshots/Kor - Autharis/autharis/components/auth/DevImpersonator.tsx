import { getDemoProfiles, type AuthSession, type UserRole } from "@/lib/auth";

import styles from "./auth-console.module.css";

type DevImpersonatorProps = {
  currentSession: AuthSession | null;
  nextPath: string | null;
  requiredRole: UserRole | null;
};

export function DevImpersonator({
  currentSession,
  nextPath,
  requiredRole,
}: DevImpersonatorProps) {
  const profiles = getDemoProfiles();

  return (
    <section className={styles.card}>
      <div className={styles.sessionHeader}>
        <span className={styles.kicker}>Dev impersonator</span>
        <h2>Switch roles without touching protected surfaces.</h2>
        <p className={styles.helperCopy}>
          Each card below posts to a lane-local route handler that mints a signed demo session
          cookie and lands on the right role surface.
        </p>
      </div>

      <div className={styles.stack}>
        {profiles.map((profile) => {
          const isActive = currentSession?.profileId === profile.id;
          const roleIsRequired = requiredRole === profile.role;

          return (
            <article
              className={[
                styles.profileCard,
                isActive ? styles.profileCardActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={profile.id}
            >
              <div className={styles.profileHeader}>
                <div>
                  <h3>{profile.name}</h3>
                  <p className={styles.muted}>
                    {profile.title} · {profile.organization}
                  </p>
                </div>
                <span className={styles.pill}>{profile.role}</span>
              </div>

              <p className={styles.helperCopy}>{profile.notes}</p>

              {isActive ? (
                <p className={styles.helperCopy}>Current session is already impersonating this role.</p>
              ) : null}

              {roleIsRequired ? (
                <p className={styles.helperCopy}>
                  This is the role required for the route you just tried to open.
                </p>
              ) : null}

              <form action="/auth/session" className={styles.form} method="post">
                <input name="profileId" type="hidden" value={profile.id} />
                <input name="redirectTo" type="hidden" value={nextPath ?? profile.defaultPath} />
                <button className={styles.action} type="submit">
                  Enter as {profile.role}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
