import React, { Suspense, useState } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Loader from "../components/loader.jsx";
import SmoothScroll from "../components/smoothScroll.jsx";
import "../index.css";

// Ganti import statis jadi lazy
const Home = React.lazy(() => import("../Pages/Home/index.jsx"));
const Rpl  = React.lazy(() => import("../Pages/Rpl/index.jsx"));
const Ak   = React.lazy(() => import("../Pages/Ak/index.jsx"));
const Br   = React.lazy(() => import("../Pages/Br/index.jsx"));
const Dkv  = React.lazy(() => import("../Pages/Dkv/index.jsx"));

function Layout() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <BrowserRouter>
      {isLoading && <Loader onComplete={() => setIsLoading(false)} />}

      {/* Suspense untuk menunggu lazy-loaded components */}
      <Suspense fallback={<div className="text-center p-4">Loading page...</div>}>
        {!isLoading && (
          <SmoothScroll>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rekayasa-perangkat-lunak" element={<Rpl />} />
              <Route path="/akutansi" element={<Ak />} />
              <Route path="/bisnis-ritail" element={<Br />} />
              <Route path="/desain-komunikasi-visual" element={<Dkv />} />
            </Routes>
          </SmoothScroll>
        )}
      </Suspense>
    </BrowserRouter>
  );
}

export default Layout;
