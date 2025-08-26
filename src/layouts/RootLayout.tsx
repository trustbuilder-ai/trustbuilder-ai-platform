import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../shared/components/Header";

const RootLayout = () => {
  const handleToggleSidebar = () => {
    // Dispatch custom event that ConsoleLayout can listen to
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  return (
    <>
      <Header onToggleSidebar={handleToggleSidebar} />
      <Outlet />
    </>
  );
};

export default RootLayout;
