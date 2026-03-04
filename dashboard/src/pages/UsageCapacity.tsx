import Header from "../components/Header";
import ActiveTeamsKpiCard from "./usage-capacity/ActiveTeamsKpiCard";
import ActiveUsersKpiCard from "./usage-capacity/ActiveUsersKpiCard";
import PeakConcurrencyKpiCard from "./usage-capacity/PeakConcurrencyKpiCard";
import NewAgentTypesKpiCard from "./usage-capacity/NewAgentTypesKpiCard";
import ConcurrencyChart from "./usage-capacity/ConcurrencyChart";
import RunVolumeByTeamChart from "./usage-capacity/RunVolumeByTeamChart";
import RunHeatmap from "./usage-capacity/RunHeatmap";
import AgentAdoptionChart from "./usage-capacity/AgentAdoptionChart";

export default function UsageCapacity() {
  return (
    <>
      <Header title="Usage & Capacity" />
      <div className="kpi-row">
        <ActiveTeamsKpiCard />
        <ActiveUsersKpiCard />
        <PeakConcurrencyKpiCard />
        <NewAgentTypesKpiCard />
      </div>
      <ConcurrencyChart />
      <div className="grid-2">
        <RunVolumeByTeamChart />
        <RunHeatmap />
      </div>
      <AgentAdoptionChart />
    </>
  );
}
