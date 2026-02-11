import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import LF_Light from "../pages/LostFoundPage";
import LF_Dark from "../dark/LostFoundPage";

export default function LostFoundWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <LF_Dark /> : <LF_Light />;
}
