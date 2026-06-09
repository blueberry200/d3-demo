import { useLayoutEffect } from "react";
import "./App.css";
import AppRoutes from "./routes";

export default function App() {
  useLayoutEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return <AppRoutes />;
}
