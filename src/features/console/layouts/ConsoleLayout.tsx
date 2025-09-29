import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Flex, Box } from "@radix-ui/themes";
import Sidebar from "../components/Sidebar";
import Breadcrumbs from "../components/Breadcrumbs";

const ConsoleLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Pass the toggle function to the parent through a custom event
  useEffect(() => {
    const handleToggleRequest = () => {
      toggleSidebar();
    };

    window.addEventListener("toggle-sidebar", handleToggleRequest);
    return () => window.removeEventListener("toggle-sidebar", handleToggleRequest);
  }, [sidebarCollapsed]);

  return (
    <Flex style={{ minHeight: "calc(100vh - 60px)", marginTop: "60px" }}>
      <Sidebar isCollapsed={sidebarCollapsed} isMobile={isMobile} />
      <Box
        flexGrow="1"
        style={{
          marginLeft: sidebarCollapsed ? "60px" : "250px",
          transition: "margin-left 0.3s ease",
          backgroundColor: "var(--color-background)",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        <Breadcrumbs />
        <Outlet />
      </Box>
    </Flex>
  );
};

export default ConsoleLayout;
