import React from "react";
import { NavLink } from "react-router-dom";
import { Box, Flex, Text } from "@radix-ui/themes";
import {
  DashboardIcon,
  RocketIcon,
  TargetIcon,
  CubeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
}

const Sidebar = ({ isCollapsed, isMobile }: SidebarProps) => {
  const navItems = [
    { path: "/console/dashboard", name: "Dashboard", Icon: DashboardIcon },
    { path: "/console/tournaments", name: "Tournaments", Icon: RocketIcon },
    { path: "/console/wargames-dashboard", name: "Wargames", Icon: TargetIcon },
    { path: "/console/models", name: "Models", Icon: CubeIcon },
    { path: "/console/redteaming", name: "RedTeaming", Icon: LockClosedIcon },
    { path: "/console/challenge-debug", name: "Debug", Icon: MagnifyingGlassIcon },
  ];

  return (
    <>
      {isMobile && !isCollapsed && (
        <Box
          position="fixed"
          inset="0"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 80,
          }}
        />
      )}
      <Box
        position="fixed"
        style={{
          top: "60px",
          left: 0,
          bottom: 0,
          width: isCollapsed ? "60px" : "250px",
          backgroundColor: "var(--color-background)",
          borderRight: "1px solid var(--gray-5)",
          transition: "width 0.3s ease, transform 0.3s ease",
          zIndex: isMobile ? 90 : 50,
          transform: isMobile && isCollapsed ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <Flex direction="column" py="4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={{ textDecoration: "none" }}
            >
              {({ isActive }) => (
                <Flex
                  align="center"
                  px={isCollapsed ? "3" : "4"}
                  py="3"
                  gap="3"
                  style={{
                    color: isActive ? "var(--accent-11)" : "var(--gray-11)",
                    backgroundColor: isActive ? "var(--accent-3)" : "transparent",
                    borderLeft: isActive ? "3px solid var(--accent-9)" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                  }}
                  className="sidebar-link"
                >
                  <item.Icon width="20" height="20" />
                  {!isCollapsed && (
                    <Text size="2" weight="medium">
                      {item.name}
                    </Text>
                  )}
                </Flex>
              )}
            </NavLink>
          ))}
        </Flex>
      </Box>
    </>
  );
};

export default Sidebar;
