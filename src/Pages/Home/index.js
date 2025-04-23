// Home.jsx
import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Classroom3D from "../../components/classroom3D";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
	const sectionRef = useRef();
	const headingRef = useRef();
	const sceneContainerRef = useRef();
	const classroomRef = useRef();

	useLayoutEffect(() => {
		const ctx = gsap.context(() => {
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

			// gsap.to(sceneContainerRef.current, {
			// 	scrollTrigger: {
			// 		trigger: sectionRef.current,
			// 		start: "top top",
			// 		end: "bottom top",
			// 		scrub: true,
			// 		pin: true,
			// 	},
			// 	scale: 0.8,
			// 	ease: "none",
			// 	onUpdate: () => {
			// 		if (classroomRef.current?.camera) {
			// 			// Update camera aspect ratio
			// 			classroomRef.current.camera.aspect =
			// 				window.innerWidth / window.innerHeight;
			// 			classroomRef.current.camera.updateProjectionMatrix();
			// 		}
			// 	},
			// });
		}, sectionRef);

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative">
			<h1 ref={headingRef} style={{ fontSize: "4rem" }}>
				Welcome to Astra Wiraraga
			</h1>
			<div
				ref={sceneContainerRef}
				className="relative w-full h-screen overflow-hidden">
				<Classroom3D />
			</div>
		</section>
	);
};

export default Home;
