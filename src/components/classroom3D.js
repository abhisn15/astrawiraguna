import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";

const ContextRecovery = () => {
	const { gl } = useThree();
	useEffect(() => {
		const handleContextLost = (event) => {
			event.preventDefault();
			setTimeout(() => gl.forceContextRestore(), 500);
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

	// Referensi untuk jarum jam
	const jamRef = useRef(null);
	const jarumJamRef = useRef(null);
	const jarumMenitRef = useRef(null);
	const jarumDetikRef = useRef(null);

	// Jumlah frame dan path ke frame
	const frameCount = 195;
	const framePath = "/assets/frames/coding/frame_";

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

		gifObject.current = model.getObjectByName("GIF_NGODING");
		if (!gifObject.current) {
			console.error('Objek "GIF NGODING" tidak ditemukan!');
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

		// Temukan objek jam dinding dan jarum-jarumnya
		jamRef.current = model.getObjectByName("JAM_DINDING");

		if (jamRef.current) {
			// Cari dan simpan referensi ke jarum-jarum jam
			jarumJamRef.current = jamRef.current.children.find(
				(child) => child.name === "JARUM_JAM",
			);
			jarumMenitRef.current = jamRef.current.children.find(
				(child) => child.name === "JARUM_MENIT",
			);
			jarumDetikRef.current = jamRef.current.children.find(
				(child) => child.name === "JARUM_DETIK",
			);

			if (!jarumJamRef.current) console.error("JARUM_JAM tidak ditemukan");
			if (!jarumMenitRef.current) console.error("JARUM_MENIT tidak ditemukan");
			if (!jarumDetikRef.current) console.error("JARUM_DETIK tidak ditemukan");
		} else {
			console.error("JAM_DINDING tidak ditemukan dalam model");
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
		if (jarumJamRef.current && jarumMenitRef.current && jarumDetikRef.current) {
			const skrng = new Date();
			let jam = skrng.getHours() + 3;
			const menit = skrng.getMinutes() + 14;
			const detik = skrng.getSeconds() + 26.5;
			const milidetik = skrng.getMilliseconds();

			if (jam >= 12) {
				jam = jam % 12;
			}

			const arahJam = ((jam % 12) * 30 + menit * 0.5) * (Math.PI / 180); 
			const arahMenit = (menit * 6 + detik * 0.1) * (Math.PI / 180); 
			const arahDetik =
				(detik * 6 + milidetik * 0.006) * (Math.PI / 180);
			
			jarumJamRef.current.rotation.set(0, -arahJam, 0);
			jarumMenitRef.current.rotation.set(0, -arahMenit, 0);
			jarumDetikRef.current.rotation.set(0, -arahDetik, 0);
			// console.log("Detik jarum:", seconds);
		}
	});

	useEffect(() => {
		model.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (child.material) child.material.envMapIntensity = 0.75;
			}
		});

		// Temukan model komputer
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

				const currentPos = camera.position.clone();

				const offset = new THREE.Vector3(0, 0, 0.5); // offset biar nggak nabrak objek
				const newCameraPos = targetPosition.clone().add(offset);

				// Tweening elegan pakai timeline
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
					">", // Start immediately after previous tween
				);
			}
		};

		const onMouseMove = (event) => {
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
		gl.domElement.addEventListener("mousemove", onMouseMove);

		return () => {
			gl.domElement.removeEventListener("click", handleClick);
			gl.domElement.removeEventListener("mousemove", onMouseMove);
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
			/>
		</>
	);
});

const Classroom3D = forwardRef((props, ref) => {
	const canvasRef = useRef();
	return (
		<Canvas
			ref={ref || canvasRef}
			shadows
			gl={{
				outputColorSpace: THREE.SRGBColorSpace,
				toneMapping: THREE.ACESFilmicToneMapping,
				toneMappingExposure: Math.pow(2, -10),
				antialias: true,
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
			<Suspense fallback={<Html center>Loading Model...</Html>}>
				<Environment preset="warehouse" background />
				<ClassroomScene ref={ref} />
			</Suspense>
		</Canvas>
	);
});

useGLTF.preload("/assets/3D/kelas3D.gltf");
export default Classroom3D;
