import Header from "../components/Header";
import SuccessRateKpiCard from "./performance/SuccessRateKpiCard";
import P50LatencyKpiCard from "./performance/P50LatencyKpiCard";
import P95LatencyKpiCard from "./performance/P95LatencyKpiCard";
import P99LatencyKpiCard from "./performance/P99LatencyKpiCard";
import SuccessFailureChart from "./performance/SuccessFailureChart";
import ErrorTaxonomyPie from "./performance/ErrorTaxonomyPie";
import LatencyDistributionChart from "./performance/LatencyDistributionChart";
import SlowestAgentsTable from "./performance/SlowestAgentsTable";
import FailureHotspotsMatrix from "./performance/FailureHotspotsMatrix";

export default function Performance() {
  return (
    <>
      <Header title="Performance & Reliability" />

      <div className="kpi-row">
        <SuccessRateKpiCard />
        <P50LatencyKpiCard />
        <P95LatencyKpiCard />
        <P99LatencyKpiCard />
      </div>

      <SuccessFailureChart />

      <div className="grid-2">
        <ErrorTaxonomyPie />
        <LatencyDistributionChart />
      </div>

      <div className="grid-2">
        <SlowestAgentsTable />
        <FailureHotspotsMatrix />
      </div>
    </>
  );
}
