import ExecutiveSummary from "./pages/ExecutiveSummary";
import CostExplorer from "./pages/CostExplorer";
import Performance from "./pages/Performance";
import UsageCapacity from "./pages/UsageCapacity";
import TeamDrillDown from "./pages/TeamDrillDown";

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  component: () => React.JSX.Element;
}

export const defaultRoute = "/executive-summary" as const;

export const navItems: NavItem[] = [
  { to: defaultRoute, label: "Executive Summary", icon: "\u25C7", component: ExecutiveSummary },
  { to: "/cost-explorer", label: "Cost Explorer", icon: "$", component: CostExplorer },
  { to: "/performance", label: "Performance", icon: "\u26A1", component: Performance },
  { to: "/usage", label: "Usage & Capacity", icon: "\u25A0", component: UsageCapacity },
  { to: "/team", label: "Team Drill-Down", icon: "\u2637", component: TeamDrillDown },
];
