"use client";

import { useState } from "react";

import {
  formatCurrency,
  talentCategoryOptions,
  talentIndustries,
  talentPerformanceMetrics,
  talentProfile,
  talentSkillCatalog,
} from "@/lib/talent/data";

export function TalentProfileEditor() {
  const [categories, setCategories] = useState<string[]>([...talentProfile.categories]);
  const [skills, setSkills] = useState<string[]>([...talentProfile.skills]);
  const [availability, setAvailability] = useState<"Open to work" | "Paused">(talentProfile.status);
  const [saved, setSaved] = useState(false);

  function toggleValue(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
  }

  return (
    <div className="talent-profileGrid">
      <div className="talent-profileMain">
        <section className="paper talent-panel">
          <div className="talent-panel__head">
            <div>
              <div className="eyebrow">Identity</div>
              <h2>What clients see first</h2>
            </div>
            <div className="talent-inlineActions">
              <button className="btn btn-ghost" type="button">
                Preview public view
              </button>
              <button className="btn btn-primary" onClick={handleSave} type="button">
                {saved ? "Saved" : "Save changes"}
              </button>
            </div>
          </div>

          <div className="talent-formGrid">
            <label className="field">
              <span className="field-label">Full name</span>
              <input className="input" defaultValue={talentProfile.name} />
            </label>
            <label className="field">
              <span className="field-label">Current title</span>
              <input className="input" defaultValue={talentProfile.title} />
            </label>
            <label className="field">
              <span className="field-label">City</span>
              <input className="input" defaultValue={talentProfile.city} />
            </label>
            <label className="field">
              <span className="field-label">Timezone</span>
              <input className="input" defaultValue={talentProfile.timezone} />
            </label>
            <label className="field">
              <span className="field-label">Years of experience</span>
              <input className="input" defaultValue={talentProfile.yearsExperience} type="number" />
            </label>
            <label className="field">
              <span className="field-label">Response expectation</span>
              <input className="input" defaultValue={talentProfile.responseTime} />
            </label>
          </div>
        </section>

        <section className="paper talent-panel">
          <div className="talent-panel__head">
            <div>
              <div className="eyebrow">Work I am open to</div>
              <h2>Signal the next shape of the role</h2>
            </div>
          </div>
          <p className="talent-muted">
            Your current title explains the past. The toggles below tell Autharis what you want next.
          </p>
          <div className="talent-chipGrid">
            {talentCategoryOptions.map((category) => {
              const selected = categories.includes(category.id);

              return (
                <button
                  className="talent-selectCard"
                  data-active={selected}
                  key={category.id}
                  onClick={() => toggleValue(category.id, categories, setCategories)}
                  type="button"
                >
                  <strong>{category.label}</strong>
                  <span>{category.blurb}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="paper talent-panel">
          <div className="talent-panel__head">
            <div>
              <div className="eyebrow">Strength stack</div>
              <h2>Skills that should actually drive matching</h2>
            </div>
          </div>
          <div className="talent-chipRow">
            {talentSkillCatalog.map((skill) => {
              const selected = skills.includes(skill);

              return (
                <button
                  className={`chip chip-interactive ${selected ? "chip-selected" : ""}`}
                  key={skill}
                  onClick={() => toggleValue(skill, skills, setSkills)}
                  type="button"
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </section>

        <section className="paper talent-panel">
          <div className="talent-panel__head">
            <div>
              <div className="eyebrow">About me</div>
              <h2>Editorial note</h2>
            </div>
          </div>
          <label className="field">
            <span className="field-label">Short narrative</span>
            <textarea className="textarea" defaultValue={talentProfile.bio} rows={6} />
          </label>
          <div className="talent-chipRow talent-chipRow--muted">
            {talentIndustries.map((industry) => (
              <span className="chip" key={industry}>
                {industry}
              </span>
            ))}
          </div>
        </section>
      </div>

      <aside className="talent-profileRail">
        <section className="paper talent-panel">
          <div className="eyebrow">Availability & rate</div>
          <div className="talent-railMetric">
            <span>Hourly rate</span>
            <strong>{formatCurrency(talentProfile.rate)}/hr</strong>
          </div>
          <div className="talent-railMetric">
            <span>Weekly capacity</span>
            <strong>{talentProfile.weeklyAvailability} hours</strong>
          </div>
          <div className="talent-segmented" role="tablist" aria-label="Availability">
            {(["Open to work", "Paused"] as const).map((option) => (
              <button
                aria-selected={availability === option}
                data-active={availability === option}
                key={option}
                onClick={() => {
                  setAvailability(option);
                  setSaved(false);
                }}
                role="tab"
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="paper talent-panel">
          <div className="eyebrow">Resume parsing</div>
          <h2 className="talent-sideTitle">{talentProfile.resumeFile}</h2>
          <p className="talent-muted">
            Parsed and mapped into {talentProfile.resumeRoles} role snapshots for matching.
          </p>
          <button className="btn btn-ghost" type="button">
            Replace file
          </button>
        </section>

        <section className="paper talent-panel">
          <div className="eyebrow">Reliability snapshot</div>
          <div className="talent-metricStack">
            {talentPerformanceMetrics.map((metric) => (
              <div className="talent-metricCard" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
