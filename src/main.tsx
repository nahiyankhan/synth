import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Expose database debug utilities in development
if (import.meta.env.DEV) {
  import("./utils/dbDebug").then((dbDebug) => {
    (window as any).dbDebug = dbDebug;
    console.log(
      "🔍 Database debug utilities available! Type dbDebug.help() for commands"
    );
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
