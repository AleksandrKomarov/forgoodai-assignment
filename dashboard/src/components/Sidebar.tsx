import { Link, useMatchRoute } from "@tanstack/react-router";
import { navItems } from "../navItems";

export default function Sidebar() {
  const matchRoute = useMatchRoute();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span>Agent</span> Analytics
      </div>
      <nav>
        {navItems.map((item) => {
          const isActive = matchRoute({ to: item.to, fuzzy: true });
          return (
            <Link
              key={item.to}
              to={item.to}
              className={isActive ? "active" : undefined}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">Tenant: Acme Corp</div>
    </div>
  );
}
