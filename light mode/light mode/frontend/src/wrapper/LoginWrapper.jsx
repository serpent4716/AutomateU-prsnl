import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import LoginLight from "../pages/LoginPage";
import LoginDark from "../dark/LoginPage";

export default function LoginWrapper(props) {
    const { theme } = useContext(ThemeContext);
    return theme === "dark"
        ? <LoginDark {...props} />
        : <LoginLight {...props} />;
}
