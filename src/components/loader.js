import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

const Loader = ({ onComplete }) => {
	const loaderRef = useRef();
	const textRef = useRef();

	useLayoutEffect(() => {
		const tl = gsap.timeline({
			defaults: { duration: 1.5, ease: "power4.inOut" },
			onComplete: onComplete,
		});

		tl.fromTo(textRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0 }).to(
			loaderRef.current,
			{
				clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
				duration: 1.2,
				ease: "power4.inOut",
			},
			"-=1",
		);

		return () => tl.kill();
	}, [onComplete]);

	return (
		<div
			ref={loaderRef}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100vh",
				background:
					"linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96c93d)",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				zIndex: 9999,
				clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
			}}>
			<h1
				ref={textRef}
				style={{
					color: "white",
					fontSize: "3rem",
					fontFamily: "Arial, sans-serif",
					opacity: 0,
				}}>
				Astra Wiraguna
			</h1>
		</div>
	);
};

export default Loader;
