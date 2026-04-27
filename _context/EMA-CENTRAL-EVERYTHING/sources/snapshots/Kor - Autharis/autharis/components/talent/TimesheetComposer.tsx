"use client";

import { useMemo, useState } from "react";

import { CheckIcon } from "@/components/talent/TalentIcons";
import { currentTimesheet, formatCurrency, type TimesheetEntry } from "@/lib/talent/data";

const initialEntries = currentTimesheet.entries.map((entry) => ({ ...entry }));

export function TimesheetComposer() {
  const [entries, setEntries] = useState<TimesheetEntry[]>(initialEntries);
  const [submitted, setSubmitted] = useState(false);

  const totalHours = useMemo(
    () =>
      entries.reduce((sum, entry) => {
        const parsed = Number.parseFloat(entry.hours);
        return sum + (Number.isFinite(parsed) ? parsed : 0);
      }, 0),
    [entries],
  );

  const projectedPayout = totalHours * currentTimesheet.rate;

  function updateEntry(index: number, key: keyof TimesheetEntry, value: string) {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry,
      ),
    );
    setSubmitted(false);
  }

  function resetDraft() {
    setEntries(initialEntries.map((entry) => ({ ...entry })));
    setSubmitted(false);
  }

  return (
    <section className="paper talent-panel">
      <div className="talent-panel__head">
        <div>
          <div className="eyebrow">Current week</div>
          <h2>
            {currentTimesheet.engagement} <span>for {currentTimesheet.client}</span>
          </h2>
        </div>
        <div className="talent-inlineActions">
          <button className="btn btn-ghost" onClick={resetDraft} type="button">
            Discard
          </button>
          <button
            className="btn btn-primary"
            disabled={totalHours === 0 || submitted}
            onClick={() => setSubmitted(true)}
            type="button"
          >
            {submitted ? "Submitted" : "Submit for approval"}
          </button>
        </div>
      </div>

      <div className="talent-timesheetMeta">
        <span>{currentTimesheet.weekOf}</span>
        <span>{formatCurrency(currentTimesheet.rate)}/hr</span>
        <span>{formatCurrency(projectedPayout)} projected</span>
      </div>

      <div className="talent-timesheetTable" role="table" aria-label="Timesheet entries">
        <div className="talent-timesheetRow talent-timesheetRow--head" role="row">
          <span role="columnheader">Day</span>
          <span role="columnheader">Notes</span>
          <span role="columnheader">Hours</span>
        </div>

        {entries.map((entry, index) => (
          <div className="talent-timesheetRow" key={entry.day} role="row">
            <span className="talent-timesheetDay" role="cell">
              {entry.day}
            </span>
            <label className="talent-timesheetField" role="cell">
              <span className="sr-only">Notes for {entry.day}</span>
              <input
                className="input"
                onChange={(event) => updateEntry(index, "note", event.target.value)}
                placeholder="What moved forward today?"
                value={entry.note}
              />
            </label>
            <label className="talent-timesheetHours" role="cell">
              <span className="sr-only">Hours for {entry.day}</span>
              <input
                className="input"
                inputMode="decimal"
                onChange={(event) => updateEntry(index, "hours", event.target.value)}
                placeholder="0.0"
                value={entry.hours}
              />
            </label>
          </div>
        ))}

        <div className="talent-timesheetRow talent-timesheetRow--total" role="row">
          <span role="cell" />
          <span role="cell">Projected earnings</span>
          <strong role="cell">
            {totalHours.toFixed(1)} hrs / {formatCurrency(projectedPayout)}
          </strong>
        </div>
      </div>

      {submitted ? (
        <div className="talent-successBanner" role="status">
          <CheckIcon size={18} />
          <div>
            <strong>Submitted for approval.</strong>
            <p>{currentTimesheet.client} will review this draft and trigger payout once approved.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
