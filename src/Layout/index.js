import React, { Suspense, useState, useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Home from "../Pages/Home/index.js";
import Rpl from "../Pages/Rpl/indes.js";
import Ak from "../Pages/Ak/index.js";
import Br from "../Pages/Br/index.js";
import Dkv from "../Pages/Dkv/index.js";
import Loader from "../components/loader.js";
import SmoothScroll from "../components/smoothScroll.js";

function Layout() {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<BrowserRouter basename="/astrawiraguna">
			{isLoading && <Loader onComplete={() => setIsLoading(false)} />}
			<Suspense fallback={null}>
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
