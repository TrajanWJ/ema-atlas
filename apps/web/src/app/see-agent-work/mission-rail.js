import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("section", { className: "ema-panel ema-saw-region ema-saw-mission-rail", "aria-label": "Mission rail", children: [_jsxs("div", { className: "ema-panel__heading", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: "mission rail" }), _jsx("h2", { children: "Campaigns & missions" })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-saw-mission-rail__track", children: byCampaign.map(({ campaign, missions: missionsForCampaign }) => (_jsxs("div", { className: "ema-saw-mission-rail__group", children: [_jsxs("header", { className: "ema-saw-mission-rail__group-heading", children: [_jsx("p", { className: "ema-kicker", children: "campaign" }), _jsx("strong", { children: campaign.title }), _jsx("small", { children: campaign.signal }), _jsx("span", { className: "ema-pill", "data-campaign-status": campaign.status, children: campaign.status })] }), _jsxs("ol", { className: "ema-saw-mission-rail__missions", children: [missionsForCampaign.length === 0 && (_jsx("li", { className: "ema-saw-mission-rail__empty", children: "no missions in this campaign" })), missionsForCampaign.map((mission) => (_jsxs("li", { className: "ema-saw-mission-card", title: `ema mission show --mission ${mission.id}`, children: [_jsxs("p", { className: "ema-kicker", children: ["mission \u00B7 ", mission.status] }), _jsx("strong", { children: mission.title }), _jsxs("small", { className: "ema-saw-cli-hint", children: ["ema mission show --mission ", mission.id] })] }, mission.id)))] })] }, campaign.id))) })] }));
}
