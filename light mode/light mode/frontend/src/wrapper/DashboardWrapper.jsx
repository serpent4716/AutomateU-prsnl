import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import DashboardLight from "../pages/DashboardPage";
import DashboardDark from "../dark/DashboardPage";

export default function DashboardWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <DashboardDark /> : <DashboardLight />;
}
