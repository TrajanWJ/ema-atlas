import { TimesheetComposer } from "@/components/talent/TimesheetComposer";
import { TalentShell } from "@/components/talent/TalentShell";
import { ChevronRightIcon } from "@/components/talent/TalentIcons";
import { previousTimesheets } from "@/lib/talent/data";

export default function TalentTimesheetsPage() {
  return (
    <TalentShell active="timesheets">
      <section className="paper talent-hero talent-hero--compact">
        <div className="talent-hero__copy">
          <div className="talent-breadcrumbs">
            <span>Talent</span>
            <ChevronRightIcon size={12} />
            <span>Timesheets</span>
          </div>
          <h2>Submit clean hours with enough narrative for fast approvals.</h2>
          <p>
            The current week stays editable here, while recent submissions remain visible for
            payout follow-up.
          </p>
        </div>
      </section>

      <div className="talent-stack">
        <TimesheetComposer />

        <section className="paper talent-panel">
          <div className="talent-panel__head">
            <div>
              <div className="eyebrow">Recent submissions</div>
              <h2>History</h2>
            </div>
          </div>
          <div className="talent-historyTable">
            {previousTimesheets.map((record) => (
              <div className="talent-historyRow" key={record.id}>
                <div>
                  <strong>{record.weekOf}</strong>
                  <span>{record.id}</span>
                </div>
                <div>
                  <strong>{record.hours} hrs</strong>
                  <span>Submitted {record.submittedAt}</span>
                </div>
                <div>
                  <span className={`status ${record.status === "approved" ? "status-paid" : "status-review"}`}>
                    {record.status === "approved" ? "Approved" : "Submitted"}
                  </span>
                  <span>{record.approvedAt ?? "Waiting for client approval"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TalentShell>
  );
}
