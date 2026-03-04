import { useState } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { navItems } from "../navItems";

export default function Sidebar() {
  const matchRoute = useMatchRoute();
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          className="sidebar-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          &#9776;
        </button>
      )}
      {open && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setOpen(false)}
        />
      )}
      <div className={`sidebar${open ? " open" : ""}`}>
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
                onClick={() => setOpen(false)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">Tenant: Acme Corp</div>
      </div>
    </>
  );
}
