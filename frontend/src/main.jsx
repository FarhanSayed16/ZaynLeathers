import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import { applyBrandToDocument } from "./brand.js";

applyBrandToDocument();

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </BrowserRouter>
  </HelmetProvider>
);
