import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import TasksLight from "../pages/TasksPage";
import TasksDark from "../dark/TasksPage";

export default function TasksWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <TasksDark /> : <TasksLight />;
}
