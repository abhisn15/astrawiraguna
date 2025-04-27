import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useState,
	useMemo,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
	OrbitControls,
	useGLTF,
	Environment,
	useProgress,
	Html,
} from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
const ElegantPreloader = () => {
	const { progress } = useProgress();
	const containerRef = useRef(null);
	const progressBarRef = useRef(null);
	const progressTextRef = useRef(null);
	const loaderTextRef = useRef(null);
	const tl = useRef(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// Initial reveal animation
		gsap.fromTo(
			containerRef.current,
			{
				opacity: 0,
				scale: 0.9,
				filter: "blur(10px)",
			},
			{
				opacity: 1,
				scale: 1,
				filter: "blur(0px)",
				duration: 1.5,
				ease: "power3.out",
			},
		);

		// Gradient animation for logo
		gsap.to(".logo-gradient", {
			backgroundPosition: "200% 50%",
			repeat: -1,
			duration: 4,
			ease: "linear",
		});

		// Wavy text animation
		if (loaderTextRef.current) {
			const chars = Array.from(loaderTextRef.current.children);
			tl.current = gsap.timeline({ repeat: -1 });
			tl.current
				.to(chars, {
					y: -8,
					stagger: 0.1,
					duration: 0.4,
					ease: "power1.inOut",
				})
				.to(chars, {
					y: 0,
					stagger: 0.1,
					duration: 0.4,
					ease: "power1.inOut",
				});
		}

		return () => tl.current?.kill();
	}, []);

	useEffect(() => {
		if (!progressBarRef.current || !progressTextRef.current) return;

		// Smooth progress animation
		gsap.to(progressBarRef.current, {
			width: `${progress}%`,
			duration: 1,
			ease: "circ.out",
		});

		// Number counter animation
		gsap.to(progressTextRef.current, {
			innerText: Math.round(progress),
			duration: 0.8,
			snap: { innerText: 1 },
			ease: "power3.out",
		});

		// Completion animation
		if (progress === 100) {
			gsap.to(containerRef.current, {
				opacity: 0,
				y: -50,
				duration: 1,
				delay: 0.5,
				ease: "power3.inOut",
				onComplete: () => {
					if (containerRef.current) {
						containerRef.current.style.display = "none";
					}
				},
			});
		}
	}, [progress]);

	return (
		<Html fullscreen>
			<div
				ref={containerRef}
				className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
				{/* Animated Logo */}
				<div className="relative mb-12">
					<div className="w-24 h-24 rounded-full bg-logo-gradient filter blur-md animate-pulse"></div>
					<div className="absolute inset-0 m-auto w-20 h-20 rounded-full border-4 border-white/30 shadow-lg">
						<div className="absolute inset-2 rounded-full border-4 border-transparent border-t-white/80 animate-spin-slow"></div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-80 relative mb-8">
					<div className="h-4 bg-white/10 rounded-full overflow-hidden">
						<div
							ref={progressBarRef}
							className="h-full w-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
							style={{
								backgroundImage:
									"linear-gradient(90deg, #6366f1 0%, #ec4899 100%)",
							}}
						/>
					</div>
					<div className="absolute inset-0 flex items-center justify-between px-2">
						<span
							ref={progressTextRef}
							className="text-white text-xl font-bold">
							0
						</span>
						<span className="text-white/60 text-sm">Loading...</span>
					</div>
				</div>

				{/* Animated Text */}
				<div
					ref={loaderTextRef}
					className="flex space-x-2 text-white/80 text-lg font-medium">
					{[..."Memuat Konten"].map((char, index) => (
						<span
							key={index}
							className="inline-block"
							style={{ animationDelay: `${index * 0.1}s` }}>
							{char}
						</span>
					))}
				</div>
			</div>
		</Html>
	);
};

// Custom gradient animation
gsap.to(".logo-gradient", {
	backgroundPosition: "200% 50%",
	repeat: -1,
	duration: 4,
	ease: "linear",
});

const checkWebGLSupport = () => {
	try {
		const canvas = document.createElement("canvas");
		return !!(
			window.WebGLRenderingContext &&
			(canvas.getContext("webgl2") || canvas.getContext("webgl"))
		);
	} catch (e) {
		return false;
	}
};

// Komponen untuk menampilkan petunjuk aktivasi hardware acceleration
const WebGLWarning = () => (
	<Html fullscreen>
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: "#191919",
				color: "white",
				padding: "20px",
				zIndex: 1000,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
			}}>
			<h2>⚠️ Diperlukan Hardware Acceleration ⚠️</h2>
			<p>
				Browser Kamu memerlukan Hardware Acceleration yang harus diaktifkan
				untuk melihat konten ini.
			</p>
			<div style={{ textAlign: "left", margin: "20px" }}>
				<p>Untuk Browser Chrome/Edge:</p>
				<ol>
					<li>Buka pengaturan browser di titik tiga di pojok kanan atas</li>
					<li>Cari di search settings dengan menuliskan "acceleration"</li>
					<li>Enable "Use hardware acceleration when available"</li>
					<li>Mulai ulang browser kamur</li>
				</ol>
			</div>
			<button
				onClick={() => window.location.reload()}
				style={{
					padding: "10px 20px",
					fontSize: "1.2em",
					background: "#007bff",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
				}}>
				Mulai ulang jika sudah enable hardware acceleration
			</button>
		</div>
	</Html>
);

// Context Recovery untuk handle webgl lost
const ContextRecovery = () => {
	const { gl } = useThree();
	useEffect(() => {
		const handleContextLost = (event) => {
			event.preventDefault();
			console.log("WebGL Context Lost. Attempting recovery...");
			setTimeout(() => {
				try {
					if (gl.forceContextRestore) gl.forceContextRestore();
				} catch (e) {
					console.error("Context restoration failed:", e);
				}
			}, 500);
		};

		gl.domElement.addEventListener("webglcontextlost", handleContextLost);
		return () =>
			gl.domElement.removeEventListener("webglcontextlost", handleContextLost);
	}, [gl]);

	return null;
};

const ClassroomScene = forwardRef((props, ref) => {
	const { camera, gl, scene } = useThree();
	const controls = useRef();
	const navigate = useNavigate();
	const { scene: model } = useGLTF("/assets/3D/kelas3D.gltf");
	const komputerRef = useRef();
	const textures = useRef([]);
	const currentFrame = useRef(0);
	const gifObject = useRef(null);
	const intervalRef = useRef(null);
	const neckRef = useRef();
	const stringsRef = useRef();

	// Audio handling
	const audioContext = useMemo(
		() => new (window.AudioContext || window.webkitAudioContext)(),
		[],
	);
	const [audioBuffer, setAudioBuffer] = useState(null);
	const currentTimeRef = useRef(0);

	// Referensi jarum jam
	const jamRef = useRef(null);
	const jarumJamRef = useRef(null);
	const jarumMenitRef = useRef(null);
	const jarumDetikRef = useRef(null);

	// Frame animasi coding
	const frameCount = 195;
	const framePath = "/assets/frames/coding/frame_";

	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const mouse = useMemo(() => new THREE.Vector2(), []);

	useEffect(() => {
		// Load audio buffer
		const loader = new THREE.AudioLoader();
		console.log(
			"Attempting to load audio from:",
			"/assets/sounds/guitar-pluck.mp3",
		);
		loader.load(
			"/assets/sounds/guitar-pluck.mp3",
			(buffer) => {
				console.log("Audio loaded successfully");
				setAudioBuffer(buffer);
			},
			(progress) => {
				console.log("Loading progress:", progress);
			},
			(error) => {
				console.error("Failed to load audio:", error);
			},
		);

		// Find Neck and Strings mesh
		neckRef.current = model.getObjectByName("Neck");
		stringsRef.current = model.getObjectByName("Strings");

		if (!neckRef.current) {
			console.warn("Mesh 'Neck' tidak ditemukan dalam model!");
		}
		if (!stringsRef.current) {
			console.warn("Mesh 'Strings' tidak ditemukan dalam model!");
		}

		// Enable shadows and env map
		model.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.animations = true;
				child.receiveShadow = true;
				if (child.material?.isMeshStandardMaterial) {
					child.material.envMapIntensity = 0.75;
					child.material.needsUpdate = true;
				}
			}
		});

		// Click handler for Neck
		const handleClick = (event) => {
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);
			const intersects = neckRef.current
				? raycaster.intersectObject(neckRef.current, true)
				: [];
			console.log("Intersects found:", intersects);

			if (intersects.length > 0) {
				playOneSecond();
			}
		};

		gl.domElement.addEventListener("click", handleClick);
		return () => gl.domElement.removeEventListener("click", handleClick);
	}, );
	
	const playOneSecond = () => {
		if (!audioBuffer) return;

		const source = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(audioContext.destination);

		const startTime = currentTimeRef.current;
		const duration = Math.min(2, audioBuffer.duration - startTime);

		source.start(0, startTime, duration);
		source.onended = () => {
			currentTimeRef.current = (startTime + 1) % audioBuffer.duration;
		};

		// Animate strings
		if (stringsRef.current) {
			gsap.to(stringsRef.current.position, {
				y: "+=0.05",
				duration: 0.1,
				yoyo: true,
				repeat: 5,
				ease: "sine.inOut",
			});
		}
	};

	// Function to play one second of audio and animate strings

	useEffect(() => {
		const loader = new THREE.TextureLoader();
		for (let i = 1; i <= frameCount; i++) {
			const texture = loader.load(
				`${framePath}${i.toString().padStart(3, "0")}.png`,
			);
			texture.flipY = false;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			textures.current.push(texture);
		}

		// Cari layar coding
		gifObject.current = model.getObjectByName("GIF_NGODING");
		if (!gifObject.current) {
			console.error('Objek "GIF_NGODING" tidak ditemukan!');
		} else {
			intervalRef.current = setInterval(() => {
				if (textures.current.length > 0) {
					currentFrame.current = (currentFrame.current + 1) % frameCount;
					gifObject.current.material.map =
						textures.current[currentFrame.current];
					gifObject.current.material.needsUpdate = true;
				}
			}, 100);
		}

		// Cari jam dinding & jarumnya
		jamRef.current = model.getObjectByName("JAM_DINDING");
		if (jamRef.current) {
			// Tambahkan defensive check sebelum mengakses children
			if (jamRef.current.children && jamRef.current.children.length > 0) {
				jarumJamRef.current = jamRef.current.children.find(
					(child) => child.name === "JARUM_JAM",
				);
				jarumMenitRef.current = jamRef.current.children.find(
					(child) => child.name === "JARUM_MENIT",
				);
				jarumDetikRef.current = jamRef.current.children.find(
					(child) => child.name === "JARUM_DETIK",
				);

				// Log warning jika jarum jam tidak ditemukan
				if (!jarumJamRef.current) console.warn("JARUM_JAM tidak ditemukan!");
				if (!jarumMenitRef.current)
					console.warn("JARUM_MENIT tidak ditemukan!");
				if (!jarumDetikRef.current)
					console.warn("JARUM_DETIK tidak ditemukan!");
			} else {
				console.warn("JAM_DINDING ditemukan tetapi tidak memiliki children!");
			}
		} else {
			console.warn("JAM_DINDING tidak ditemukan dalam model!");
		}

		model.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (child.material && child.material.isMeshStandardMaterial) {
					child.material.envMapIntensity = 0.75;
					child.material.needsUpdate = true;
				}
			}
		});

		return () => {
			clearInterval(intervalRef.current);
		};
	}, [model]);

	useFrame(() => {
		// Tambahkan defensive checks untuk memastikan semua referensi jarum ada
		if (jarumJamRef.current && jarumMenitRef.current && jarumDetikRef.current) {
			const now = new Date();
			let jam = now.getHours() + 2.8;
			const menit = now.getMinutes() + 13.8;
			const detik = now.getSeconds() + 26.5;
			const milidetik = now.getMilliseconds();

			if (jam >= 12) jam = jam % 12;

			const arahJam = ((jam % 12) * 30 + menit * 0.5) * (Math.PI / 180);
			const arahMenit = (menit * 6 + detik * 0.1) * (Math.PI / 180);
			const arahDetik = (detik * 6 + milidetik * 0.006) * (Math.PI / 180);

			jarumJamRef.current.rotation.set(0, -arahJam, 0);
			jarumMenitRef.current.rotation.set(0, -arahMenit, 0);
			jarumDetikRef.current.rotation.set(0, -arahDetik, 0);
		}
	});

	useEffect(() => {
		komputerRef.current = model.getObjectByName("KOMPUTER_RPL");
		if (!komputerRef.current) return;

		const handleClick = (event) => {
			const mouse = new THREE.Vector2(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
			);
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObject(komputerRef.current, true);

			if (intersects.length > 0) {
				controls.current.enabled = false;

				const targetPosition = new THREE.Vector3();
				komputerRef.current.getWorldPosition(targetPosition);

				const offset = new THREE.Vector3(0, 0, 0.5);
				const newCameraPos = targetPosition.clone().add(offset);

				const tl = gsap.timeline();
				tl.to(camera.position, {
					x: newCameraPos.x,
					y: newCameraPos.y,
					z: newCameraPos.z,
					duration: 2,
					ease: "power2.inOut",
					onUpdate: () => {
						camera.lookAt(targetPosition);
					},
				}).to(
					gl.domElement,
					{
						opacity: 0,
						duration: 1.5,
						ease: "power2.inOut",
						onComplete: () => navigate("/rekayasa-perangkat-lunak"),
					},
					">",
				);
			}
		};

		const handleMouseMove = (event) => {
			const mouse = new THREE.Vector2(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
			);
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObject(komputerRef.current, true);

			gl.domElement.style.cursor = intersects.length > 0 ? "pointer" : "auto";
		};

		gl.domElement.addEventListener("click", handleClick);
		gl.domElement.addEventListener("mousemove", handleMouseMove);

		return () => {
			gl.domElement.removeEventListener("click", handleClick);
			gl.domElement.removeEventListener("mousemove", handleMouseMove);
		};
	}, [model, camera, gl, navigate]);

	useImperativeHandle(ref, () => ({
		camera,
		controls: controls.current,
	}));

	return (
    <>
      <ContextRecovery />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <primitive object={model} />
      <OrbitControls
        ref={controls}
        enableZoom
        maxDistance={5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 5}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
});

const Classroom3D = forwardRef((props, ref) => {
	const [webglSupported, setWebglSupported] = useState(true);
	const canvasRef = useRef();

	useEffect(() => {
		if (!checkWebGLSupport()) {
			setWebglSupported(false);
			return;
		}

		// Fallback untuk browser yang support tapi context gagal
		const handleContextCreationError = (event) => {
			event.preventDefault();
			setWebglSupported(false);
		};

		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
		if (gl) {
			gl.canvas.addEventListener(
				"webglcontextcreationerror",
				handleContextCreationError,
			);

			return () => {
				gl.canvas.removeEventListener(
					"webglcontextcreationerror",
					handleContextCreationError,
				);
			};
		}
	}, []);

	if (!webglSupported) return <WebGLWarning />;

	return (
		<Canvas
			ref={ref || canvasRef}
			shadows
			gl={{
				context: undefined, // biar pakai WebGL2 otomatis
				preserveDrawingBuffer: true, // ini penting biar nggak hilang
				powerPreference: "high-performance",
				failIfMajorPerformanceCaveat: false,
				outputColorSpace: THREE.SRGBColorSpace,
				toneMapping: THREE.ACESFilmicToneMapping,
				toneMappingExposure: Math.pow(2, .5),
				antialias: true,
			}}
			onCreated={({ gl }) => {
				gl.getContext(); // Paksa akses WebGLContext
				gl.domElement.addEventListener("webglcontextlost", (e) => {
					e.preventDefault();
					console.warn("WebGL Context Lost! Trying to recover...");
					setTimeout(() => {
						if (gl.forceContextRestore) {
							gl.forceContextRestore();
							console.warn("Attempted to restore WebGL context.");
						}
					}, 500);
				});
			}}
			dpr={Math.min(window.devicePixelRatio, 1.5)}
			camera={{
				fov: 45,
				near: 0.1,
				far: 1000,
				position: [-3, 2, 8],
			}}
			style={{
				width: "100%",
				height: "100dvh",
				backgroundColor: "#191919",
				opacity: 1,
				transition: "opacity 0.5s",
			}}>
			<Suspense fallback={<ElegantPreloader />}>
				{/* <Environment preset="warehouse" background /> */}
				<ClassroomScene ref={ref} />
			</Suspense>
		</Canvas>
	);
});

useGLTF.preload("/assets/3D/kelas3D.gltf");
export default Classroom3D;