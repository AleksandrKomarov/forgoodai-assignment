import { useState } from "react";
import Header from "../components/Header";
import TeamSelector from "./team-drilldown/TeamSelector";
import TeamKpiRow from "./team-drilldown/TeamKpiRow";
import TopAgentsTable from "./team-drilldown/TopAgentsTable";
import UserActivityTable from "./team-drilldown/UserActivityTable";

export default function TeamDrillDown() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  return (
    <>
      <Header title="Team Drill-Down" />
      <TeamSelector selected={selectedTeamId} onSelect={setSelectedTeamId} />
      {selectedTeamId && (
        <>
          <TeamKpiRow teamId={selectedTeamId} />
          <TopAgentsTable teamId={selectedTeamId} />
          <UserActivityTable teamId={selectedTeamId} />
        </>
      )}
    </>
  );
}
