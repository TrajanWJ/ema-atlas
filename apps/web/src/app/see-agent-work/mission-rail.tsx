// Region 2 of See Agent Work first screen per SURFACE-SLICE-A.md §"Region 2".
// Horizontal rail grouped by campaign; each mission card shows title + status
// + campaign signal. Hover reveals CLI equivalent (ema mission show --mission <id>).
import { MOCK_PROJECTION_LABEL, seeAgentWorkProjection } from "../mock-projections";

export function MissionRail() {
  const { campaigns, missions } = seeAgentWorkProjection;
  const byCampaign = campaigns.map((campaign) => ({
    campaign,
    missions: missions.filter((m) => m.campaign_id === campaign.id),
  }));

  return (
    <section className="ema-panel ema-saw-region ema-saw-mission-rail" aria-label="Mission rail">
      <div className="ema-panel__heading">
        <div>
          <p className="ema-kicker">mission rail</p>
          <h2>Campaigns & missions</h2>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </div>
      <div className="ema-saw-mission-rail__track">
        {byCampaign.map(({ campaign, missions: missionsForCampaign }) => (
          <div key={campaign.id} className="ema-saw-mission-rail__group">
            <header className="ema-saw-mission-rail__group-heading">
              <p className="ema-kicker">campaign</p>
              <strong>{campaign.title}</strong>
              <small>{campaign.signal}</small>
              <span className="ema-pill" data-campaign-status={campaign.status}>
                {campaign.status}
              </span>
            </header>
            <ol className="ema-saw-mission-rail__missions">
              {missionsForCampaign.length === 0 && (
                <li className="ema-saw-mission-rail__empty">
                  no missions in this campaign
                </li>
              )}
              {missionsForCampaign.map((mission) => (
                <li
                  key={mission.id}
                  className="ema-saw-mission-card"
                  title={`ema mission show --mission ${mission.id}`}
                >
                  <p className="ema-kicker">mission · {mission.status}</p>
                  <strong>{mission.title}</strong>
                  <small className="ema-saw-cli-hint">
                    ema mission show --mission {mission.id}
                  </small>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
