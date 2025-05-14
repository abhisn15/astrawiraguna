import React, {
	useLayoutEffect,
	useRef,
	useState,
	useEffect,
	Suspense,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
	OrbitControls,
	Html,
	useProgress,
	Environment,
} from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Howl, Howler } from "howler";
import Model, { isMobile } from "../../components/model"; // Pastikan path ini benar

gsap.registerPlugin(ScrollTrigger);

// --- Komponen UI Tambahan (Modal, Overlay, LoadingScreenContent) ---
const Modal = ({ title, children, isOpen, onClose, id }) => {
	const modalRef = useRef();

	useEffect(() => {
		if (isOpen) {
			gsap.set(modalRef.current, { opacity: 0, scale: 0 });
			gsap.to(modalRef.current, {
				opacity: 1,
				scale: 1,
				duration: 0.5,
				ease: "back.out(2)",
			});
		}
	}, [isOpen]);

	const handleClose = () => {
		gsap.to(modalRef.current, {
			opacity: 0,
			scale: 0,
			duration: 0.5,
			ease: "back.in(2)",
			onComplete: onClose,
		});
	};

	if (!isOpen && (!modalRef.current || modalRef.current.style.opacity === "0"))
		return null;

	return (
		<div
			ref={modalRef}
			className={`modal ${id}`}
			style={{
				display: isOpen ? "block" : "none",
				position: "fixed",
				zIndex: 1002,
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				background: "white",
				padding: "20px",
				borderRadius: "8px",
				boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
			}}>
			<h2>{title}</h2>
			{children}
			<button
				onClick={handleClose}
				className="modal-exit-button"
				style={{ position: "absolute", top: "10px", right: "10px" }}>
				X
			</button>
		</div>
	);
};

const Overlay = ({ isOpen, onClick }) => {
	const overlayRef = useRef();
	useEffect(() => {
		if (isOpen) {
			gsap.set(overlayRef.current, { opacity: 0, display: "block" });
			gsap.to(overlayRef.current, { opacity: 1, duration: 0.5 });
		} else if (overlayRef.current && overlayRef.current.style.opacity !== "0") {
			gsap.to(overlayRef.current, {
				opacity: 0,
				duration: 0.5,
				onComplete: () => {
					if (overlayRef.current) overlayRef.current.style.display = "none";
				},
			});
		}
	}, [isOpen]);

	if (
		!isOpen &&
		(!overlayRef.current || overlayRef.current.style.opacity === "0")
	)
		return null;

	return (
		<div
			ref={overlayRef}
			className="overlay"
			style={{
				display: isOpen ? "block" : "none",
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				background: "rgba(0,0,0,0.5)",
				zIndex: 1001,
			}}
			onClick={onClick}></div>
	);
};

const LoadingScreenContent = ({ onEnter, isLoadingComplete, progress }) => {
	const buttonRef = useRef();
	// const [isHovered, setIsHovered] = useState(false); // Tidak digunakan di versi ini

	useEffect(() => {
		if (isLoadingComplete && buttonRef.current) {
			gsap.to(buttonRef.current, {
				borderColor: "#2a0f4e",
				backgroundColor: "#401d49",
				color: "#e6dede",
				boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
				cursor: "pointer",
				duration: 0.3,
			});
		}
	}, [isLoadingComplete]);

	const handleMouseEnter = () => {
		if (isLoadingComplete) {
			// setIsHovered(true);
			gsap.to(buttonRef.current, {
				scale: 1.3,
				duration: 0.4,
				ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
			});
		}
	};
	const handleMouseLeave = () => {
		if (isLoadingComplete) {
			// setIsHovered(false);
			gsap.to(buttonRef.current, {
				scale: 1,
				duration: 0.4,
				ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
			});
		}
	};

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				background: "#ead7ef",
				color: "#401d49",
			}}>
			<button
				ref={buttonRef}
				onClick={isLoadingComplete ? onEnter : undefined}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={{
					padding: "15px 30px",
					fontSize: "1.5rem",
					borderRadius: "8px",
					border: "8px solid #6e5e9c",
					background: "#ead7ef",
					color: "#6e5e9c",
					transition: "none",
				}}>
				{isLoadingComplete ? "Enter!" : `Loading... ${Math.round(progress)}%`}
			</button>
		</div>
	);
};

// Data Piano
const pianoKeyMap = {
	C1_Key: "Key_24",
	"C#1_Key": "Key_23",
	D1_Key: "Key_22",
	"D#1_Key": "Key_21",
	E1_Key: "Key_20",
	F1_Key: "Key_19",
	"F#1_Key": "Key_18",
	G1_Key: "Key_17",
	"G#1_Key": "Key_16",
	A1_Key: "Key_15",
	"A#1_Key": "Key_14",
	B1_Key: "Key_13",
	C2_Key: "Key_12",
	"C#2_Key": "Key_11",
	D2_Key: "Key_10",
	"D#2_Key": "Key_9",
	E2_Key: "Key_8",
	F2_Key: "Key_7",
	"F#2_Key": "Key_6",
	G2_Key: "Key_5",
	"G#2_Key": "Key_4",
	A2_Key: "Key_3",
	"A#2_Key": "Key_2",
	B2_Key: "Key_1",
};
const BACKGROUND_MUSIC_VOLUME = 0.5;
const FADED_VOLUME = 0.05; // Sedikit volume agar tidak benar-benar hening saat fade
const MUSIC_FADE_TIME = 500; // dalam milidetik

const Home = () => {
	const sectionRef = useRef();
	const headingRef = useRef();
	const sceneContainerRef = useRef();
	const loadingScreenDOMRef = useRef();

	const [isLoadingComplete, setIsLoadingComplete] = useState(false);
	const [isEntered, setIsEntered] = useState(false);
	const [startSceneIntro, setStartSceneIntro] = useState(false);

	const [isMuted, setIsMuted] = useState(false);
	const [isNightMode, setIsNightMode] = useState(false);
	const [currentModal, setCurrentModal] = useState(null);

	const backgroundMusicRef = useRef(null);
	const pianoSoundsRef = useRef({});
	const buttonSoundsRef = useRef({});
	const [isMusicFaded, setIsMusicFaded] = useState(false);

	const { progress } = useProgress();

	useEffect(() => {
		backgroundMusicRef.current = new Howl({
			src: ["/assets/audio/music/cjr_terhebat.ogg"],
			loop: true,
			volume: BACKGROUND_MUSIC_VOLUME,
			html5: true,
		});
		// Muat semua suara piano dari Key_1 sampai Key_24
		for (let i = 1; i <= 24; i++) {
			const soundKey = `Key_${i}`;
			pianoSoundsRef.current[soundKey] = new Howl({
				src: [`/assets/audio/sfx/piano/Key_${i}.ogg`], // Pastikan file ada
				preload: true,
				volume: 1,
			});
		}
		buttonSoundsRef.current.click = new Howl({
			src: ["/assets/audio/sfx/click/bubble.ogg"],
			preload: true,
			volume: 1,
		});

		Howler.mute(isMuted);

		return () => {
			if (backgroundMusicRef.current) backgroundMusicRef.current.unload();
			Object.values(pianoSoundsRef.current).forEach((s) => s.unload());
			if (buttonSoundsRef.current.click) buttonSoundsRef.current.click.unload();
		};
	}, []);

	useEffect(() => {
		Howler.mute(isMuted);
		// Tidak perlu mute individual jika Howler.mute global sudah diatur
		// Object.values(pianoSoundsRef.current).forEach((sound) => sound.mute(isMuted));
		// if (buttonSoundsRef.current.click) buttonSoundsRef.current.click.mute(isMuted);

		if (backgroundMusicRef.current) {
			const targetVolume = isMuted
				? 0
				: isMusicFaded
					? FADED_VOLUME
					: BACKGROUND_MUSIC_VOLUME;
			// Jika musik sedang dimainkan atau akan dimainkan, sesuaikan volume
			if (backgroundMusicRef.current.playing() || !isMuted) {
				backgroundMusicRef.current.volume(targetVolume);
			}
			// Jika dimute dan sedang bermain, pause. Jika di-unmute dan tidak bermain (dan sudah entered), play.
			if (isMuted && backgroundMusicRef.current.playing()) {
				// backgroundMusicRef.current.pause(); // Atau biarkan volume 0 saja
			} else if (
				!isMuted &&
				!backgroundMusicRef.current.playing() &&
				isEntered
			) {
				backgroundMusicRef.current.play(); // Dimainkan saat handleEnter
			}
		}

		
	}, [isMuted, isMusicFaded, isEntered]);

	const fadeOutBackgroundMusic = () => {
		if (
			!isMusicFaded &&
			backgroundMusicRef.current &&
			backgroundMusicRef.current.playing()
		) {
			backgroundMusicRef.current.fade(
				isMuted ? 0 : BACKGROUND_MUSIC_VOLUME,
				isMuted ? 0 : FADED_VOLUME,
				MUSIC_FADE_TIME,
			);
			setIsMusicFaded(true);
		}
	};

	const fadeInBackgroundMusic = () => {
		if (isMusicFaded && backgroundMusicRef.current) {
			backgroundMusicRef.current.fade(
				isMuted ? 0 : FADED_VOLUME,
				isMuted ? 0 : BACKGROUND_MUSIC_VOLUME,
				MUSIC_FADE_TIME,
			);
			setIsMusicFaded(false);
		}
	};

	useEffect(() => {
		if (progress === 100) {
			const timer = setTimeout(() => setIsLoadingComplete(true), 500);
			return () => clearTimeout(timer);
		}
	}, [progress]);

	const handleEnter = () => {
		if (!isLoadingComplete || isEntered) return;
		setIsEntered(true);
		if (buttonSoundsRef.current.click) buttonSoundsRef.current.click.play();

		// Pastikan audio context diaktifkan oleh interaksi pengguna
		if (Howler.ctx && Howler.ctx.state && Howler.ctx.state === "suspended") {
			Howler.ctx.resume();
		}

		if (backgroundMusicRef.current && !isMuted) {
			backgroundMusicRef.current.volume(BACKGROUND_MUSIC_VOLUME); // Set volume sebelum play
			backgroundMusicRef.current.play();
		}

		gsap
			.timeline({
				onComplete: () => {
					if (loadingScreenDOMRef.current)
						loadingScreenDOMRef.current.style.display = "none";
					setStartSceneIntro(true);
				},
			})
			.to(loadingScreenDOMRef.current.querySelector("button"), {
				cursor: "default",
				border: "8px solid #6e5e9c",
				background: "#ead7ef",
				color: "#6e5e9c",
				boxShadow: "none",
				innerHTML: "~ 안녕하세요 ~",
				duration: 0.1,
			})
			.to(
				loadingScreenDOMRef.current,
				{ background: "#ead7ef", duration: 0.1 },
				"<",
			)
			.to(loadingScreenDOMRef.current, {
				scale: 0.5,
				duration: 1.2,
				delay: 0.25,
				ease: "back.in(1.8)",
			})
			.to(
				loadingScreenDOMRef.current,
				{
					y: "200vh",
					transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
					duration: 1.2,
					ease: "back.in(1.8)",
				},
				"-=0.1",
			);
	};

	const handleMuteToggle = (e) => {
		e.preventDefault();
		if (buttonSoundsRef.current.click) buttonSoundsRef.current.click.play();
		setIsMuted((prev) => !prev);
		gsap.to(e.currentTarget, {
			rotate: isMuted ? 0 : -30, // Sedikit rotasi
			scale: 1.1,
			duration: 0.2,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		});
	};

	const handleThemeToggle = (e) => {
		e.preventDefault();
		if (buttonSoundsRef.current.click) buttonSoundsRef.current.click.play();
		setIsNightMode((prev) => !prev);
		gsap.to(e.currentTarget, {
			rotate: isNightMode ? 0 : 30, // Sedikit rotasi
			scale: 1.1,
			duration: 0.2,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		});
	};

	const handleModalClose = () => {
		setCurrentModal(null);
		fadeInBackgroundMusic(); // Kembalikan musik jika sedang fade out karena modal
	};

	const openModal = (modalType) => {
		setCurrentModal(modalType);
		fadeOutBackgroundMusic(); // Redupkan musik saat modal terbuka
	};

	useLayoutEffect(() => {
		// Tidak ada headingRef di layout yang Anda berikan, jadi saya hapus.
		// Jika Anda ingin menambahkannya kembali, pastikan elemen dengan ref 'headingRef' ada.
		// const ctx = gsap.context(() => {
		//   if (headingRef.current) {
		//     gsap.from(headingRef.current, {
		//       scrollTrigger: {
		//         trigger: headingRef.current,
		//         start: "top center+=100",
		//         toggleActions: "play none none reverse",
		//       },
		//       duration: 1,
		//       opacity: 0,
		//       y: 50,
		//       ease: "power4.out",
		//     });
		//   }
		// }, sectionRef);
		// return () => ctx.revert();
	}, []);

	return (
		<section ref={sectionRef} className="relative">
			{!isEntered && (
				<div
					ref={loadingScreenDOMRef}
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						zIndex: 2000,
						background: "#ead7ef",
					}}>
					<LoadingScreenContent
						onEnter={handleEnter}
						isLoadingComplete={isLoadingComplete}
						progress={progress}
					/>
				</div>
			)}

			{isEntered && ( // Hanya tampilkan tombol setelah masuk
				<div
					style={{
						position: "fixed",
						top: "20px",
						right: "20px",
						zIndex: 1010,
						display: "flex",
						gap: "10px",
					}}>
					<button
						onClick={handleMuteToggle}
						className="mute-toggle-button"
						style={{
							padding: "10px 15px",
							background: isNightMode ? "#333" : "#fff",
							color: isNightMode ? "#fff" : "#333",
							border: `2px solid ${isNightMode ? "#555" : "#ccc"}`,
							borderRadius: "50%", // Membuatnya bulat
							width: "50px", // Ukuran tetap
							height: "50px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							cursor: "pointer",
							boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
						}}>
						{/* Ganti dengan ikon SVG mute/unmute akan lebih baik */}
						{isMuted ? "UNMUTE" : "MUTE"}
					</button>
					<button
						onClick={handleThemeToggle}
						className="theme-toggle-button"
						style={{
							padding: "10px 15px",
							background: isNightMode ? "#333" : "#fff",
							color: isNightMode ? "#fff" : "#333",
							border: `2px solid ${isNightMode ? "#555" : "#ccc"}`,
							borderRadius: "50%",
							width: "50px",
							height: "50px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							cursor: "pointer",
							boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
						}}>
						{/* Ganti dengan ikon SVG tema akan lebih baik */}
						{isNightMode ? "DAY" : "NIGHT"}
					</button>
				</div>
			)}

			{/* Daftar Modal (Contoh) */}
			<Overlay isOpen={!!currentModal} onClick={handleModalClose} />
			<Modal
				title="Work Experience"
				isOpen={currentModal === "work"}
				onClose={handleModalClose}
				id="work-modal">
				<p>Detail pengalaman kerja di sini...</p>
			</Modal>
			<Modal
				title="About Me"
				isOpen={currentModal === "about"}
				onClose={handleModalClose}
				id="about-modal">
				<p>Informasi tentang saya...</p>
			</Modal>
			<Modal
				title="Contact"
				isOpen={currentModal === "contact"}
				onClose={handleModalClose}
				id="contact-modal">
				<p>Cara menghubungi saya...</p>
			</Modal>

			<div
				ref={sceneContainerRef}
				className="relative w-full h-screen overflow-hidden">
				<Canvas
					shadows
					frameloop={isMobile ? 'demand' : 'always'}
					dpr={isMobile ? 1 :1}
					gl={{
						antialias: false,                    // matikan antialias
						powerPreference: isMobile ? 'low-power' : 'high-performance',
						preserveDrawingBuffer: false,
						failIfMajorPerformanceCaveat: true,  // paksa fallback jika GPU jelek
						majorVersion: 1,                     // paksa WebGL1
						minorVersion: 0,
					}}
					camera={{
						fov: 35,
						near: 0.1,
						far: 200,
						position:
							typeof window !== "undefined" && window.innerWidth < 768
								? [29.56, 14.01, 31.37]
								: [17.49, 9.1, 17.85],
					}}
					style={{ background: isNightMode ? "#1a111f" : "#D9CAD1" }}
					onCreated={({ gl }) => {
						gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
					}}>
					<Suspense
						fallback={
							<Html center>
								<p style={{ color: isNightMode ? "white" : "black" }}>
									Initializing 3D Experience...
								</p>
							</Html>
						}>
						<Model
							isNightMode={isNightMode}
							pianoSoundsRef={pianoSoundsRef}
							pianoKeyMap={pianoKeyMap}
							startIntroAnimation={startSceneIntro}
							fadeOutBackgroundMusic={fadeOutBackgroundMusic}
							fadeInBackgroundMusic={fadeInBackgroundMusic}
						/>
						<OrbitControls
							enableDamping
							dampingFactor={0.05}
							minDistance={5}
							maxDistance={45}
							minPolarAngle={0}
							maxPolarAngle={Math.PI / 2}
							minAzimuthAngle={0}
							maxAzimuthAngle={Math.PI / 2}
							target={
								window.innerWidth < 768
									? [-0.082, 3.311, -0.743]
									: [0.462, 1.971, -0.83]
							}
							enabled={!currentModal}
						/>
						<Environment
							preset={isNightMode ? "night" : "sunset"}
							background={isNightMode}
							blur={isNightMode ? 0.2 : 0.5}
						/>
					</Suspense>
				</Canvas>
			</div>
		</section>
	);
};

export default Home;
