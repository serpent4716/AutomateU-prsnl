import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import SignupLight from "../pages/SignupPage";
import SignupDark from "../dark/SignupPage";

export default function SignupWrapper() {
  const { theme } = useContext(ThemeContext);
  return theme === "dark" ? <SignupDark /> : <SignupLight />;
}
