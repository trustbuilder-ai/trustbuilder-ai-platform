import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isCollapsed, isMobile }) => {
  const navItems = [
    { path: "/console/dashboard", name: "Dashboard", icon: "📊" },
    { path: "/console/tournaments", name: "Tournaments", icon: "🏆" },
    { path: "/console/wargames", name: "Wargames", icon: "🎯" },
    { path: "/console/models", name: "Models", icon: "🤖" },
    { path: "/console/redteaming", name: "RedTeaming", icon: "🛡️" },
    { path: "/console/challenge-debug", name: "Debug", icon: "🔍" },
  ];

  return (
    <>
      {isMobile && !isCollapsed && <div className="sidebar-backdrop" />}
      <aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}
      >
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="sidebar-text">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
