import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";

const { SRGBColorSpace, LinearToneMapping } = THREE;

// Context Recovery (tetap sama)
const ContextRecovery = () => {
	const { gl } = useThree();

	useEffect(() => {
		const handleContextLost = (event) => {
			event.preventDefault();
			console.warn("WebGL context lost — attempting to restore.");
			setTimeout(() => gl.forceContextRestore(), 500);
		};
		gl.domElement.addEventListener("webglcontextlost", handleContextLost);
		return () =>
			gl.domElement.removeEventListener("webglcontextlost", handleContextLost);
	}, [gl]);

	return null;
};

// Model Scene dengan Animasi Tekstur
const ClassroomScene = forwardRef((props, ref) => {
	const { camera } = useThree();
	const controls = useRef();
	const { scene: model } = useGLTF("/assets/3D/kelas3D.gltf");

	// Referensi untuk animasi
	const textures = useRef([]);
	const currentFrame = useRef(0);
	const gifObject = useRef(null);
	const intervalRef = useRef(null);

	// Jumlah frame dan path ke frame
	const frameCount = 195; // Sesuai dengan jumlah frame yang diekstrak
	const framePath = "/assets/frames/coding/frame_"; // Path diperbarui ke lokasi frame yang benar

	useEffect(() => {
		// Muat tekstur dari frame
		const loader = new THREE.TextureLoader();
		for (let i = 1; i <= frameCount; i++) {
			// Mulai dari 1 karena frame dimulai dari 001
			const texture = loader.load(
				`${framePath}${i.toString().padStart(3, "0")}.png`,
			);
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			textures.current.push(texture);
		}

		// Temukan objek "GIF NGODING"
		gifObject.current = model.getObjectByName("GIF_NGODING");
		if (!gifObject.current) {
			console.error('Objek "GIF NGODING" tidak ditemukan!');
			return;
		}

		// Atur interval untuk mengganti tekstur (10 fps = 100ms per frame)
		intervalRef.current = setInterval(() => {
			if (textures.current.length > 0) {
				currentFrame.current = (currentFrame.current + 1) % frameCount;
				gifObject.current.material.map = textures.current[currentFrame.current];
				gifObject.current.material.needsUpdate = true;
			}
		}, 100);

		// Terapkan pengaturan awal pada model
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

		// Bersihkan interval saat komponen di-unmount
		return () => {
			clearInterval(intervalRef.current);
		};
	}, [model]);

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
				maxPolarAngle={Math.PI / 2}
				minPolarAngle={Math.PI / 3}
			/>
		</>
	);
});

// Canvas Wrapper (tetap sama)
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
				preserveDrawingBuffer: true,
			}}
			dpr={Math.min(window.devicePixelRatio, 1.5)}
			camera={{
				fov: 45,
				near: 0.1,
				far: 1000,
				position: [-3, 2, 8],
			}}
			style={{ width: "100%", height: "100dvh", backgroundColor: "#191919" }}>
			<Suspense fallback={<Html center>Loading Model...</Html>}>
				<Environment preset="warehouse" background />
				<ClassroomScene ref={ref} />
			</Suspense>
		</Canvas>
	);
});

// Preload model
useGLTF.preload("/assets/3D/kelas3D.gltf");

export default Classroom3D;
