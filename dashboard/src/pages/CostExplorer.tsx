import { useState } from "react";
import Header from "../components/Header";
import FilterBar from "./cost-explorer/FilterBar";
import DailySpendChart from "./cost-explorer/DailySpendChart";
import SpendBreakdownDonut from "./cost-explorer/SpendBreakdownDonut";
import ForecastCard from "./cost-explorer/ForecastCard";
import BurnRateCard from "./cost-explorer/BurnRateCard";
import TeamCostSummaryTable from "./cost-explorer/TeamCostSummaryTable";

export default function CostExplorer() {
  const [dimension, setDimension] = useState<"team" | "agent_type">("team");
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <>
      <Header title="Cost Explorer" />
      <FilterBar
        dimension={dimension}
        granularity={granularity}
        onDimensionChange={setDimension}
        onGranularityChange={setGranularity}
      />
      <DailySpendChart dimension={dimension} granularity={granularity} />
      <div className="grid-2">
        <SpendBreakdownDonut />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ForecastCard />
          <BurnRateCard />
        </div>
      </div>
      <TeamCostSummaryTable />
    </>
  );
}
