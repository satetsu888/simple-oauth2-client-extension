import React from "react";
import { createRoot } from "react-dom/client";
import Panel from "./components/Panel";

window.onload = () => {
  const domContainer = document.getElementById("root") as HTMLElement;
  const root = createRoot(domContainer);
  root.render(
    <Panel />
  );
};
