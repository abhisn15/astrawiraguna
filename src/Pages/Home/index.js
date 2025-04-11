// Home.jsx
import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Classroom3D from "../../components/classroom3D";

// Registrasi plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
	const sectionRef = useRef();
	const headingRef = useRef();
	const sceneContainerRef = useRef();

	useLayoutEffect(() => {
		const ctx = gsap.context(() => {
			// Animasi untuk heading
			gsap.from(headingRef.current, {
				scrollTrigger: {
					trigger: headingRef.current,
					start: "top center+=100",
					toggleActions: "play none none reverse",
				},
				duration: 1,
				opacity: 0,
				y: 50,
				ease: "power4.out",
			});

			// Animasi scaling untuk container 3D berdasarkan scroll
			gsap.to(sceneContainerRef.current, {
				scrollTrigger: {
					trigger: sectionRef.current,
					start: "top top",
					end: "bottom top",
					scrub: true,
				},
				scale: 1.5, // Ubah nilai scale sesuai kebutuhan
				ease: "none",
			});
		}, sectionRef);

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={sectionRef}
			style={{ minHeight: "400vh", padding: "2rem" }}
			className="relative">
			<h1 ref={headingRef} style={{ fontSize: "4rem" }}>
				Welcome to Astra Wiraraga
			</h1>
			{/* Container 3D yang akan di-animate */}
			<div
				ref={sceneContainerRef}
				className="relative w-full h-screen overflow-hidden">
				<Classroom3D />
			</div>
			{/* Anda bisa menambahkan konten lain dengan atribut data-speed atau lainnya */}
			<div data-speed="0.9">{/* Konten tambahan */}</div>
		</section>
	);
};

export default Home;
