import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import  SidebarNavigation  from "../dark/SidebarNavigation";
import  SidebarLight  from "../pages/SidebarNavigation";


export default function SidebarWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <SidebarDark /> : <SidebarLight />;
}
