import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "./App.css";
import "./index.css"

import App from "./App";
import SmoothScroll from "./lib/SmoothScroll";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SmoothScroll />
    <App />
  </StrictMode>
);