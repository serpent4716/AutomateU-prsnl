import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import AttendanceLight from "../pages/AttendancePage";
import AttendanceDark from "../dark/AttendancePage";

export default function AttendanceWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <AttendanceDark /> : <AttendanceLight />;
}
