import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

import ChatLight from "../pages/ChatPage";
import ChatDark from "../dark/ChatPage";

export default function ChatWrapper() {
    const { theme } = useContext(ThemeContext);
    return theme === "dark" ? <ChatDark /> : <ChatLight />;
}
