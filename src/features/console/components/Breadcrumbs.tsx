import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Flex, Text, Separator } from "@radix-ui/themes";
import { ChevronRightIcon } from "@radix-ui/react-icons";

const Breadcrumbs = () => {
  const location = useLocation();

  const getPageName = (path: string) => {
    // Remove /dashboard prefix for matching
    const cleanPath = path.replace(/^\/dashboard/, '') || '/';

    switch (cleanPath) {
      case "/":
        return "Home";
      case "/dashboard":
        return "Dashboard";
      case "/wargames":
        return "Wargames";
      case "/models":
        return "Models";
      case "/redteaming":
        return "RedTeaming";
      default:
        return "Page";
    }
  };

  const currentPage = getPageName(location.pathname);
  const isHome = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  return (
    <Flex
      py="3"
      px="5"
      align="center"
      gap="2"
      style={{
        backgroundColor: "var(--gray-2)",
        borderBottom: "1px solid var(--gray-5)",
      }}
    >
      <Link to="/dashboard" style={{ textDecoration: "none" }}>
        <Text size="2" weight="medium" style={{ color: "var(--accent-11)", cursor: "pointer" }}>
          Home
        </Text>
      </Link>
      {!isHome && (
        <>
          <ChevronRightIcon color="gray" />
          <Text size="2" color="gray">
            {currentPage}
          </Text>
        </>
      )}
    </Flex>
  );
};

export default Breadcrumbs;
