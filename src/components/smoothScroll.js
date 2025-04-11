// smoothScroll.js (Versi alternatif tanpa ScrollSmoother)
import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
	const mainRef = useRef();

	useLayoutEffect(() => {
		// Smooth scroll polyfill
		gsap.to(mainRef.current, {
			y: 0,
			ease: "none",
			scrollTrigger: {
				start: 0,
				end: "max",
				scrub: true,
			},
		});

		return () => ScrollTrigger.getAll().forEach((t) => t.kill());
	}, []);

	return <div ref={mainRef}>{children}</div>;
};

export default SmoothScroll;
