import Header from "../components/Header";
import SpendKpiCard from "./executive/SpendKpiCard";
import TotalRunsKpiCard from "./executive/TotalRunsKpiCard";
import SuccessRateKpiCard from "./executive/SuccessRateKpiCard";
import ProjectedSpendCard from "./executive/ProjectedSpendCard";
import MonthlySpendChart from "./executive/MonthlySpendChart";
import SuccessRateGauge from "./executive/SuccessRateGauge";
import RunVolumeSparkline from "./executive/RunVolumeSparkline";
import TopCostCentersTable from "./executive/TopCostCentersTable";

export default function ExecutiveSummary() {
  return (
    <>
      <Header title="Executive Summary" />

      <div className="kpi-row">
        <SpendKpiCard />
        <TotalRunsKpiCard />
        <SuccessRateKpiCard />
        <ProjectedSpendCard />
      </div>

      <div className="grid-2-1">
        <MonthlySpendChart />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SuccessRateGauge />
          <RunVolumeSparkline />
        </div>
      </div>

      <TopCostCentersTable />
    </>
  );
}
