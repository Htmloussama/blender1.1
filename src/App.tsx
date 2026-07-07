import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import MyPurchases from "./pages/MyPurchases";
import AdminDashboard from "./pages/AdminDashboard";
import SimulatedCheckout from "./pages/SimulatedCheckout";
import CheckoutSuccess from "./pages/CheckoutSuccess";

export default function App() {
  const [currentView, setCurrentView] = useState<string>("marketplace");
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  // Clean HTML5 History Routing Parser
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const paramsObj: Record<string, string> = {};
      
      const searchParams = new URLSearchParams(search);
      searchParams.forEach((val, key) => {
        paramsObj[key] = val;
      });
      setQueryParams(paramsObj);

      if (path === "/" || path === "") {
        setCurrentView("marketplace");
      } else if (path.startsWith("/assets/")) {
        const assetId = path.split("/")[2];
        if (assetId) {
          setCurrentView(`product:${assetId}`);
        } else {
          setCurrentView("marketplace");
        }
      } else if (path === "/purchases") {
        setCurrentView("purchases");
      } else if (path === "/admin") {
        setCurrentView("admin");
      } else if (path.startsWith("/checkout/simulated")) {
        setCurrentView("checkout/simulated");
      } else if (path.startsWith("/checkout/success")) {
        setCurrentView("checkout/success");
      } else {
        setCurrentView("marketplace");
      }
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Custom navigation handler updating the URL dynamically to provide real routing behavior
  const handleNavigate = (targetView: string) => {
    let path = "/";
    if (targetView === "marketplace") {
      path = "/";
    } else if (targetView.startsWith("product:")) {
      const id = targetView.split(":")[1];
      path = `/assets/${id}`;
    } else if (targetView === "purchases") {
      path = "/purchases";
    } else if (targetView === "admin") {
      path = "/admin";
    } else if (targetView.startsWith("checkout/simulated")) {
      // Split simulated path and query
      path = "/" + targetView;
    } else if (targetView.startsWith("checkout/success")) {
      path = "/" + targetView;
    } else if (targetView === "login") {
      path = "/admin"; // Redirect login demands to the admin console sign-in portal
    } else {
      path = "/" + targetView;
    }

    window.history.pushState(null, "", path);
    // Dispatch popstate event to let the routing parser execute synchronously
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500/30 selection:text-white flex flex-col justify-between">
      {/* Dynamic blurred glass header */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main viewport area */}
      <main className="flex-grow">
        {currentView === "marketplace" && (
          <Home onNavigate={handleNavigate} />
        )}

        {currentView.startsWith("product:") && (
          <ProductDetail
            assetId={currentView.split(":")[1]}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === "purchases" && (
          <MyPurchases onNavigate={handleNavigate} />
        )}

        {currentView === "admin" && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === "checkout/simulated" && (
          <SimulatedCheckout
            onNavigate={handleNavigate}
            queryParams={queryParams}
          />
        )}

        {currentView === "checkout/success" && (
          <CheckoutSuccess
            onNavigate={handleNavigate}
            queryParams={queryParams}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 bg-zinc-950/40 py-8 px-6 text-center font-mono text-[10px] text-zinc-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} VERTEX STUDIO. ALL SPECIFICATIONS LICENSED.</span>
          <div className="flex gap-4">
            <button onClick={() => handleNavigate("marketplace")} className="hover:text-zinc-400 transition-colors cursor-pointer">MARKETPLACE</button>
            <button onClick={() => handleNavigate("purchases")} className="hover:text-zinc-400 transition-colors cursor-pointer">MY PURCHASES</button>
            <button onClick={() => handleNavigate("admin")} className="hover:text-zinc-400 transition-colors cursor-pointer">ADMIN CONSOLE</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
