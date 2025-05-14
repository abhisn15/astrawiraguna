import React, { useEffect, useRef, useMemo, useState, Suspense } from "react";
import { useDetectGPU, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { a, useSpring, config as springConfig } from "@react-spring/three";
import { useFrame, useThree } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { viewportResolution } from "three/tsl";

// Konfigurasi nama node dengan koreksi pada bagian 'lights'
const Decorations = React.lazy(() => import("./decorations"));
const useMobileDetector = () => {
	return useMemo(() => {
		if (typeof window === "undefined") return false;
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
	}, []);
};

// Konfigurasi adaptif berdasarkan perangkat
const ADAPTIVE_CONFIG = {
	shadows: {
		mobile: false,
		desktop: true
	},
	viewportResolution: {
		mobile: 0.5,
		desktop: 0.5,
	},
	lights: {
		intensity: {
			mobile: 0.8,
			desktop: 0.8
		},
		distance: {
			mobile: 2,
			desktop: 2
		}
	}
};
const NODE_NAMES_CONFIG = {
	mainVerticalPole: "PAPAN_PENYANGGA_NAMA",
	horizontalBeam: "PAPAN_ATAS",
	signs: [
		{
			key: "osis",
			boardName: "OSIS",
			textName: "OSIS_Text",
			path: "/organisasi/osis",
		},
		{
			key: "rpl",
			boardName: "RPL",
			textName: "RPL_Text",
			path: "/jurusan/rpl",
		},
		{
			key: "dkv",
			boardName: "PAPAN_DKV",
			textName: "DKV_TXT",
			path: "/jurusan/dkv",
		},
		{
			key: "mp",
			boardName: "PAPAN_MP",
			textName: "MP_TXT",
			path: "/jurusan/mp",
		},
		{ key: "ak", boardName: "AK", textName: "AK_Text", path: "/jurusan/ak" },
		{
			key: "br",
			boardName: "PAPAN_BR",
			textName: "BR_TXT",
			path: "/jurusan/br",
		},
	],
	interactiveMeshes: [
		{
			key: "piala",
			meshName: "Piala",
			path: "/prestasi",
			hoverScaleFactor: 1.15,
		},
		{
			key: "instagram",
			meshName: "Instagram",
			path: "https://www.instagram.com/astrawiraguna25",
			hoverScaleFactor: 1.2,
		},
		{
			key: "piano001",
			meshName: "Piano001",
			hoverScaleFactor: 1.05,
			isPiano: true,
		},
	],
	fansGroup1: ["KIPAS", "KIPAS001", "KIPAS002"],
	fansGroup2: ["KIPAS003", "KIPAS004"],
	clock: {
		face: "JAM_DINDING",
		hourHand: "JARUM_JAM",
		minuteHand: "JARUM_MENIT",
		secondHand: "JARUM_DETIK",
	},
	kursi: "Chair_Top",
	lights: [
		"BOHLAM",
		"BOHLAM002",
		"BOHLAM003",
		"BOHLAM004",
		"BOHLAM005",
		"BOHLAM006",
		"BOHLAM007",
		"BOHLAM008",
		"BOHLAM009",
		"Lamp",
	],
};

export const isMobile = () => { useMobileDetector() };
// Komponen AnimatedSignBoard (Tidak berubah dari kode asli Anda)
const AnimatedSignBoard = ({
	node,
	delay,
	visible,
	overshootFactor = 1.15,
	path,
}) => {
	const navigate = useNavigate();
	const primitiveRef = useRef();
	const initialScale = useMemo(
		() => node?.userData.initialScale || new THREE.Vector3(1, 1, 1),
		[node],
	);
	const initialRotation = useMemo(
		() => node?.userData.initialRotation || new THREE.Euler(),
		[node],
	);
	const finalRotationY = initialRotation.y;
	const hiddenRotationY = finalRotationY + Math.PI / 2;
	const optimizedOvershoot = isMobile ? 1.05 : 1.15

	const { scale: entryScale, rotation: entryRotation } = useSpring({
		overshootFactor: optimizedOvershoot,
		from: {
			scale: [initialScale.x, 0.001, initialScale.z],
			rotation: [initialRotation.x, hiddenRotationY, initialRotation.z],
		},
		to: async (next) => {
			if (visible && node?.userData.wasFound) {
				await next({
					scale: [initialScale.x, initialScale.y, initialScale.z],
					rotation: [initialRotation.x, finalRotationY, initialRotation.z],
					config: { ...springConfig.wobbly, duration: 400 },
				});
				await next({
					scale: [
						initialScale.x * overshootFactor,
						initialScale.y * overshootFactor,
						initialScale.z * overshootFactor,
					],
					config: { ...springConfig.wobbly, duration: 150, mass: 0.7 },
				});
				await next({
					scale: initialScale.toArray(),
					config: { ...springConfig.gentle, duration: 250 },
				});
			} else if (!visible && node?.userData.wasFound) {
				await next({
					scale: [initialScale.x, 0.001, initialScale.z],
					rotation: [initialRotation.x, hiddenRotationY, initialRotation.z],
					config: springConfig.gentle,
					immediate: true,
				});
			}
		},
		delay: delay,
		config: springConfig.stiff,
	});
	const hoverScale = isMobile ? 1.1 : 1.2;

	useEffect(() => {
		const currentRef = primitiveRef.current;
		return () => {
			if (currentRef && currentRef.scale) gsap.killTweensOf(currentRef.scale);
			document.body.style.cursor = "default";
		};
	}, []);

	const handlePointerOver = (e) => {
		if (isMobile) return;
		e.stopPropagation();
		document.body.style.cursor = "pointer";
		if (primitiveRef.current && node?.userData.wasFound && visible) {
			gsap.to(primitiveRef.current.scale, {
				x: initialScale.x * 1.2,
				y: initialScale.y * 1.2,
				z: initialScale.z * 1.2,
				duration: 0.3,
				ease: "power1.out",
			});
		}
	};

	const handlePointerOut = () => {
		document.body.style.cursor = "default";
		if (primitiveRef.current && node?.userData.wasFound) {
			const targetScale = entryScale.get();
			gsap.to(primitiveRef.current.scale, {
				x: targetScale[0] / (visible ? overshootFactor : 1),
				y: targetScale[1] / (visible ? overshootFactor : 1),
				z: targetScale[2] / (visible ? overshootFactor : 1),
				duration: 0.3,
				ease: "power1.out",
			});
		}
	};

	const handleClick = (e) => {
		e.stopPropagation();
		if (path) {
			if (path.startsWith("http"))
				window.open(path, "_blank", "noopener,noreferrer");
			else navigate(path);
		} else console.warn("No path defined for this sign:", node?.name);
	};

	if (!node?.userData.wasFound) return null;
	return (
		<a.primitive
			ref={primitiveRef}
			object={node}
			scale={entryScale}
			rotation={entryRotation}
			onPointerOver={handlePointerOver}
			onPointerOut={handlePointerOut}
			onClick={handleClick}
		/>
	);
};

// Komponen AnimatedInteractiveMesh (Tidak berubah dari kode asli Anda)
const AnimatedInteractiveMesh = ({
	node,
	path,
	visible,
	delay,
	hoverScaleFactor = 1.1,
	isPiano = false,
	meshKey,
	pianoSoundsRef,
	pianoKeyMap,
	fadeOutBackgroundMusic,
	fadeInBackgroundMusic,
}) => {
	const isMobile = useMobileDetector();
	const { gl } = useThree();
	const navigate = useNavigate();
	const primitiveRef = useRef();
	const [isAnimatingClick, setIsAnimatingClick] = useState(false);
	const [isHovering, setIsHovering] = useState(false);
	const lastPianoSoundTimeRef = useRef(null);
	const timeoutRef = useRef(null);
	// Tambahkan state untuk melacak urutan suara piano
	const [pianoSoundIndex, setPianoSoundIndex] = useState(0);
	const animationDuration = isMobile ? 0.4 : 0.6;
	const pressAnimationDistance = isMobile ? 0.02 : 0.03;

	const initialScale = useMemo(
		() => node?.userData.initialScale || new THREE.Vector3(1, 1, 1),
		[node],
	);
	const initialRotation = useMemo(
		() => node?.userData.initialRotation || new THREE.Euler(),
		[node],
	);
	const initialPosition = useMemo(
		() => node?.userData.initialPosition || new THREE.Vector3(0, 0, 0),
		[node],
	);

	useEffect(() => {
		const currentPrimitive = primitiveRef.current;
		if (currentPrimitive) {
			gsap.set(currentPrimitive.scale, { x: 0.001, y: 0.001, z: 0.001 });
			gsap.set(currentPrimitive.rotation, {
				x: initialRotation.x,
				y: initialRotation.y,
				z: initialRotation.z,
			});
			gsap.set(currentPrimitive.position, {
				x: initialPosition.x,
				y: initialPosition.y,
				z: initialPosition.z,
			});
			if (visible && node?.userData.wasFound) {
				gsap.to(currentPrimitive.scale, {
					x: initialScale.x,
					y: initialScale.y,
					z: initialScale.z,
					duration: 0.6,
					delay: delay / 1000,
					ease: "back.out(1.7)",
				});
			}
		}
		return () => {
			if (currentPrimitive) {
				gsap.killTweensOf(currentPrimitive.scale);
				gsap.killTweensOf(currentPrimitive.position);
			}
			document.body.style.cursor = "default";
			if (timeoutRef.current) clearTimeout(timeoutRef.current); // Bersihkan timeout saat unmount
		};
	}, [node, visible, delay, initialScale, initialRotation, initialPosition]);

	const handlePointerOver = (e) => {
		e.stopPropagation();
		if (isAnimatingClick) return;
		setIsHovering(true);
		document.body.style.cursor = "pointer";
		if (primitiveRef.current && node?.userData.wasFound && visible) {
			gsap.to(primitiveRef.current.scale, {
				x: initialScale.x * hoverScaleFactor,
				y: initialScale.y * hoverScaleFactor,
				z: initialScale.z * hoverScaleFactor,
				duration: 0.3,
				ease: "power1.out",
			});
		}
	};

	const handlePointerOut = () => {
		if (isAnimatingClick) return;
		setIsHovering(false);
		document.body.style.cursor = "default";
		if (primitiveRef.current && node?.userData.wasFound) {
			gsap.to(primitiveRef.current.scale, {
				x: initialScale.x,
				y: initialScale.y,
				z: initialScale.z,
				duration: 0.3,
				ease: "power1.out",
			});
		}
	};

	const handleClick = (e) => {
		if (isMobile) {
			e.stopPropagation();
			const touch = e.touches ? e.touches[0] : e;
			// Implementasi logika touch
		}
		e.stopPropagation();
		if (isPiano && node?.userData.wasFound && !isAnimatingClick) {
			console.log(`Piano "${node.name}" (key: ${meshKey}) diklik.`);
			setIsAnimatingClick(true);

			// Animasi efek "ditekan" untuk semua tuts piano
			const tl = gsap.timeline({
				onComplete: () => {
					setIsAnimatingClick(false);
					if (isHovering) {
						gsap.to(primitiveRef.current.scale, {
							x: initialScale.x * hoverScaleFactor,
							y: initialScale.y * hoverScaleFactor,
							z: initialScale.z * hoverScaleFactor,
							duration: 0.2,
							ease: "power1.out",
						});
					} else {
						gsap.to(primitiveRef.current.scale, {
							x: initialScale.x,
							y: initialScale.y,
							z: initialScale.z,
							duration: 0.2,
							ease: "power1.out",
						});
					}
				},
			});
			tl.to(primitiveRef.current.position, {
				y: initialPosition.y - 0.03,
				duration: 0.1,
				ease: "power1.in",
			}).to(primitiveRef.current.position, {
				y: initialPosition.y,
				duration: 0.3,
				ease: "bounce.out",
			});

			// Putar suara piano secara berurutan (Key_1 sampai Key_24)
			const soundKey = `Key_${pianoSoundIndex + 1}`; // Index dimulai dari 0, suara dari 1
			const sound = pianoSoundsRef.current[soundKey];
			if (sound) {
				// stop dulu semua suara piano lain yang belum selesai
				Object.values(pianoSoundsRef.current)
					.filter(s => !s.paused)
					.forEach(s => {
						s.pause();
						s.currentTime = 0;
					});
				sound.play();
				fadeOutBackgroundMusic(); // Redupkan backsound
				lastPianoSoundTimeRef.current = Date.now();

				// Update index suara, ulang ke 0 setelah mencapai 23 (Key_24)
				setPianoSoundIndex((prev) => (prev >= 23 ? 0 : prev + 1));

				// Hapus timeout sebelumnya jika ada
				if (timeoutRef.current) clearTimeout(timeoutRef.current);

				// Set timeout untuk mengembalikan backsound setelah 1 detik
				timeoutRef.current = setTimeout(() => {
					if (Date.now() - lastPianoSoundTimeRef.current >= 1000) {
						fadeInBackgroundMusic();
					}
				}, 1000);
			} else {
				console.warn(`Suara untuk ${soundKey} tidak ditemukan.`);
			}
		} else if (path) {
			if (path.startsWith("http"))
				window.open(path, "_blank", "noopener,noreferrer");
			else navigate(path);
		} else {
			console.warn("No path/action defined for this interactive mesh:", node?.name);
		}
	};

	if (!node?.userData.wasFound || !visible) return null;
	return (
		<primitive
			ref={primitiveRef}
			object={node}
			onPointerOver={handlePointerOver}
			onPointerOut={handlePointerOut}
			onClick={handleClick}
		/>
	);
};
// Komponen AnimatedChairTop (Tidak berubah dari kode asli Anda)
const AnimatedChairTop = ({ node, isReadyToAnimate }) => {
	const initialRotation = useMemo(
		() => node?.userData.initialRotation || new THREE.Euler(),
		[node],
	);
	const initialPosition = useMemo(
		() => node?.userData.initialPosition || new THREE.Vector3(),
		[node],
	);
	const initialScale = useMemo(
		() => node?.userData.initialScale || new THREE.Vector3(1, 1, 1),
		[node],
	);
	const [animationCycle, setAnimationCycle] = useState(0);
	const verySmoothSlowConfig = { tension: 100, friction: 60 };

	const { rotationY } = useSpring({
		key: animationCycle,
		from: { rotationY: initialRotation.y },
		to: async (next) => {
			if (isReadyToAnimate && node?.userData.wasFound) {
				await next({
					rotationY: initialRotation.y + THREE.MathUtils.degToRad(60),
					config: { ...verySmoothSlowConfig, duration: 2000 },
				});
				await next({
					rotationY: initialRotation.y + THREE.MathUtils.degToRad(50),
					config: { ...verySmoothSlowConfig, duration: 1000 },
				});
				await next({
					rotationY: initialRotation.y,
					config: { ...verySmoothSlowConfig, duration: 1500 },
				});
			}
		},
		immediate: !isReadyToAnimate || !node?.userData.wasFound,
	});

	useEffect(() => {
		let intervalId;
		const animationTotalDuration = 4500;
		const repeatInterval = animationTotalDuration + 500;
		if (isReadyToAnimate && node?.userData.wasFound) {
			intervalId = setInterval(
				() => setAnimationCycle((prevCycle) => prevCycle + 1),
				repeatInterval,
			);
		}
		return () => clearInterval(intervalId);
	}, [isReadyToAnimate, node]);

	if (!node?.userData.wasFound) return null;
	return (
		<a.primitive
			object={node}
			rotation-y={rotationY}
			position={initialPosition}
			scale={initialScale}
			rotation-x={initialRotation.x}
			rotation-z={initialRotation.z}
		/>
	);
};

const Model = ({
	pianoSoundsRef,
	pianoKeyMap,
	isNightMode,
	fadeOutBackgroundMusic, // Terima prop dari Home
	fadeInBackgroundMusic, // Terima prop dari Home
	onPianoPress,
	startIntroAnimation, // Prop ini tampaknya tidak digunakan, bisa dipertimbangkan untuk dihapus jika memang tidak perlu
}) => {
	const isMobile = useMobileDetector();
	const { gl,size } = useThree();
	const gpuTier = useDetectGPU();
	const { scene, nodes: allNodesFromGLTF } = useGLTF("/assets/models/Room.glb");
	const fanRefs = useRef({});
	const clockPartsRef = useRef({
		face: null,
		hourHand: null,
		minuteHand: null,
		secondHand: null,
	});

	useEffect(() => {
		const targetDpr = isMobile
			? ADAPTIVE_CONFIG.viewportResolution.mobile
			: ADAPTIVE_CONFIG.viewportResolution.desktop;
		gl.setPixelRatio(Math.min(window.devicePixelRatio, targetDpr * window.devicePixelRatio));
	}, [gl, isMobile]);

	// Menyimpan referensi ke mesh bohlam dan PointLight terkait
	const isFirstModeRender = useRef(true);
	const lampPointLightAssetsRef = useRef([]);

	// Fungsi utilitas untuk mencari node dan menyimpan properti awal
	const findAndSetupNode = (
		name,
		isContinuouslyAnimated = false,
		startsVisible = false,
		parent = scene,
	) => {
		let node = allNodesFromGLTF[name] || parent.getObjectByName(name);
		if (node) {
			node.userData.initialPosition = node.position.clone();
			node.userData.initialRotation = node.rotation.clone();
			node.userData.initialScale = node.scale.clone();
			node.userData.wasFound = true;
			node.visible = startsVisible;
			if (node.material && !node.material.userData) {
				node.material.userData = {};
			} else if (Array.isArray(node.material)) {
				node.material.forEach((mat) => {
					if (!mat.userData) mat.userData = {};
				});
			}
		} else {
			if (!window[`warned_missing_node_${name}`]) {
				console.warn(`PERINGATAN: Node "${name}" TIDAK DITEMUKAN.`);
				window[`warned_missing_node_${name}`] = true;
			}
			return {
				name: name,
				userData: {
					wasFound: false,
					initialPosition: new THREE.Vector3(),
					initialRotation: new THREE.Euler(),
					initialScale: new THREE.Vector3(1, 1, 1),
				},
				visible: false,
			};
		}
		return node;
	};
	if (onPianoPress) {
		onPianoPress();
	}
	// Menginisialisasi semua node yang akan dianimasikan atau interaktif
	const animatedRefs = useMemo(() => {
		const refs = {
			mainVerticalPole: null,
			horizontalBeam: null,
			signs: {},
			fans: {},
			chairTop: null,
			interactiveMeshes: {},
			lights: {}, // Untuk menyimpan referensi ke mesh lampu/bohlam
		};
		if (scene && allNodesFromGLTF) {
			refs.horizontalBeam = findAndSetupNode(
				NODE_NAMES_CONFIG.horizontalBeam,
				false,
				false,
			);
			refs.mainVerticalPole = findAndSetupNode(
				NODE_NAMES_CONFIG.mainVerticalPole,
				false,
				false,
			);
			NODE_NAMES_CONFIG.signs.forEach((signConf) => {
				const boardNode = findAndSetupNode(signConf.boardName, false, false);
				const textNode =
					allNodesFromGLTF[signConf.textName] ||
					scene.getObjectByName(signConf.textName);
				if (textNode && textNode.userData.wasFound) textNode.visible = false;
				refs.signs[signConf.key] = { board: boardNode, text: textNode };
			});
			NODE_NAMES_CONFIG.interactiveMeshes.forEach((meshConf) => {
				const meshNode = findAndSetupNode(meshConf.meshName, false, false);
				refs.interactiveMeshes[meshConf.key] = meshNode;
			});
			[
				...NODE_NAMES_CONFIG.fansGroup1,
				...NODE_NAMES_CONFIG.fansGroup2,
			].forEach((fanName) => {
				const fanNodeInstance = findAndSetupNode(fanName, true, true);
				refs.fans[fanName] = fanNodeInstance;
				if (fanNodeInstance?.userData.wasFound)
					fanRefs.current[fanName] = fanNodeInstance;
			});
			// Inisialisasi node untuk lampu/bohlam
			NODE_NAMES_CONFIG.lights.forEach((lightName) => {
				// Lampu dibuat visible true agar bisa diambil world positionnya dan efek emisif terlihat
				refs.lights[lightName] = findAndSetupNode(lightName, false, true);
			});
			refs.chairTop = findAndSetupNode(NODE_NAMES_CONFIG.kursi, false, false);

			const clockFaceNode = findAndSetupNode(
				NODE_NAMES_CONFIG.clock.face,
				false,
				true,
			);
			if (clockFaceNode && clockFaceNode.userData.wasFound) {
				clockPartsRef.current.face = clockFaceNode;
				clockPartsRef.current.hourHand = findAndSetupNode(
					NODE_NAMES_CONFIG.clock.hourHand,
					true,
					true,
					clockFaceNode,
				);
				clockPartsRef.current.minuteHand = findAndSetupNode(
					NODE_NAMES_CONFIG.clock.minuteHand,
					true,
					true,
					clockFaceNode,
				);
				clockPartsRef.current.secondHand = findAndSetupNode(
					NODE_NAMES_CONFIG.clock.secondHand,
					true,
					true,
					clockFaceNode,
				);
			} else {
				if (!window[`warned_missing_clock_face`]) {
					console.error(
						`Node jam "${NODE_NAMES_CONFIG.clock.face}" tidak ditemukan.`,
					);
					window[`warned_missing_clock_face`] = true;
				}
			}
		}
		return refs;
	}, [scene, allNodesFromGLTF]);

	// useEffect untuk membuat dan memposisikan PointLight pada setiap bohlam
	useEffect(() => {
		if (scene && animatedRefs.lights) {
			// Bersihkan point light lama sebelum membuat yang baru
			lampPointLightAssetsRef.current.forEach((asset) => {
				if (asset.pointLight) {
					scene.remove(asset.pointLight);
					asset.pointLight.dispose();
				}
			});
			lampPointLightAssetsRef.current = []; // Reset array

			NODE_NAMES_CONFIG.lights.forEach((lightName) => {
				const lampMeshNode = animatedRefs.lights[lightName];

				if (
					lampMeshNode &&
					lampMeshNode.userData?.wasFound &&
					lampMeshNode.isMesh
				) {
					// *** PENYESUAIAN CONTOH: Warna cahaya lebih hangat dan decay realistis ***
					const lightColor = 0xffe0b3; // Warna kuning hangat (sebelumnya 0xffffff)
					const lightDistance = 7; // Jarak jangkauan cahaya
					const lightDecay = 2; // Redaman realistis (sebelumnya 1.8)

					const initIntensity = 0;
					const pointLight = new THREE.PointLight(lightColor, initIntensity, lightDistance, lightDecay);

					const worldPosition = new THREE.Vector3();
					lampMeshNode.getWorldPosition(worldPosition);
					pointLight.position.copy(worldPosition);
					scene.add(pointLight);
					if (!isNightMode) {
						const mats = Array.isArray(lampMeshNode.material)
							? lampMeshNode.material
							: [lampMeshNode.material];
						mats.forEach((mat) => {
							if (mat.userData.originalEmissiveIntensity === undefined) {
								mat.userData.originalEmissiveIntensity = mat.emissiveIntensity;
								mat.userData.originalEmissiveColorHex = mat.emissive.getHex();
								mat.userData.originalToneMapped = mat.toneMapped;
							}
						});
					}
					lampPointLightAssetsRef.current.push({
						meshName: lightName,
						meshNode: lampMeshNode,
						pointLight,
					});
				} else {
					if (!lampMeshNode || !lampMeshNode.userData?.wasFound) {
						// console.warn(`Mesh lampu "${lightName}" tidak ditemukan.`); // Uncomment untuk debugging jika perlu
					} else if (lampMeshNode && !lampMeshNode.isMesh) {
						// console.warn(`Node lampu "${lightName}" ditemukan tetapi bukan mesh.`); // Uncomment untuk debugging jika perlu
					}
				}
			});
		}

		return () => {
			// Cleanup saat komponen unmount atau dependensi berubah
			lampPointLightAssetsRef.current.forEach((asset) => {
				if (asset.pointLight) {
					scene?.remove(asset.pointLight); // Gunakan optional chaining untuk safety
					asset.pointLight.dispose();
				}
			});
			lampPointLightAssetsRef.current = [];
		};
	}, [scene, animatedRefs.lights]); // Re-run jika scene atau referensi mesh lampu berubah

	// useEffect untuk menganimasikan intensitas cahaya dan material emisif berdasarkan isNightMode
	useEffect(() => {
		if (!scene || lampPointLightAssetsRef.current.length === 0) return;
		if (lampPointLightAssetsRef.current.length === 0) return;

		// Abaikan render pertama (mount)
		if (isFirstModeRender.current) {
			isFirstModeRender.current = false;
			return;
		}

		// *** PENYESUAIAN CONTOH: Intensitas cahaya dan emisif sedikit dinaikkan ***
		const nightPointLightIntensity = 1.2;
		const nightEmissiveIntensity = 2.5; // Intensitas emisif bohlam saat malam (sebelumnya 2.0)
		const nightEmissiveColor = 0xffe0b3; // Warna emisif bohlam saat menyala (konsisten dengan PointLight)

		lampPointLightAssetsRef.current.forEach((asset) => {
			const { meshNode, pointLight } = asset;

			if (meshNode && meshNode.isMesh && meshNode.material && pointLight) {
				const materialToUpdate = meshNode.material;

				const updateSingleMaterial = (mat) => {
					// Simpan nilai original jika belum ada
					if (mat.userData.originalEmissiveColorHex === undefined) {
						// Cek undefined karena 0 adalah nilai hex yang valid
						mat.userData.originalEmissiveColorHex = mat.emissive.getHex();
					}
					if (mat.userData.originalEmissiveIntensity === undefined) {
						mat.userData.originalEmissiveIntensity = mat.emissiveIntensity;
					}
					if (mat.userData.originalToneMapped === undefined) {
						mat.userData.originalToneMapped = mat.toneMapped;
					}

					// Animasi material emisif
					gsap.to(mat, {
						emissiveIntensity: isNightMode
							? nightEmissiveIntensity
							: 0, // fallback jika originalIntensity 0 atau undefined
						duration: 0.6,
						ease: "sine.inOut",
						onStart: () => {
							if (isNightMode) {
								mat.emissive.setHex(nightEmissiveColor);
								mat.toneMapped = false;
							}
						},
						onComplete: () => {
							if (!isNightMode) {
								mat.emissive.setHex(mat.userData.originalEmissiveColorHex);
								mat.toneMapped = mat.userData.originalToneMapped;
							}
							mat.needsUpdate = true;
						},
					});
				};

				if (Array.isArray(materialToUpdate)) {
					materialToUpdate.forEach(updateSingleMaterial);
				} else {
					updateSingleMaterial(materialToUpdate);
				}

				// Animasi intensitas PointLight
				const target = !isNightMode ? nightPointLightIntensity : 0;
				gsap.to(pointLight, {
					intensity: target,
					duration: 0.6,
					ease: "sine.inOut",
				});
			}
		});
	}, [isNightMode]); // Re-run jika isNightMode atau scene berubah

	// State dan useEffect untuk animasi intro (Tidak berubah dari kode asli Anda)
	const [introVisible, setIntroVisible] = useState(false);
	useEffect(() => {
		const mainEntryDelay = 250;
		const timer = setTimeout(() => {
			setIntroVisible(true);
			if (animatedRefs.horizontalBeam?.userData.wasFound)
				animatedRefs.horizontalBeam.visible = true;
			if (animatedRefs.mainVerticalPole?.userData.wasFound)
				animatedRefs.mainVerticalPole.visible = true;
			NODE_NAMES_CONFIG.signs.forEach((signConf) => {
				const signData = animatedRefs.signs[signConf.key];
				if (signData?.board?.userData.wasFound) {
					signData.board.visible = true;
					if (signData.text && signData.text.userData.wasFound)
						signData.text.visible = true;
				}
			});
			NODE_NAMES_CONFIG.interactiveMeshes.forEach((meshConf) => {
				const meshNode = animatedRefs.interactiveMeshes[meshConf.key];
				if (meshNode?.userData.wasFound) meshNode.visible = true;
			});
			if (animatedRefs.chairTop?.userData.wasFound)
				animatedRefs.chairTop.visible = true;
			// Membuat lampu/bohlam visible dari awal agar world position bisa diambil dengan benar
			// dan efek emisifnya juga langsung terlihat jika isNightMode true dari awal.
			// Visibility PointLight diatur oleh intensitasnya.
			NODE_NAMES_CONFIG.lights.forEach((lightName) => {
				if (animatedRefs.lights[lightName]?.userData.wasFound) {
					animatedRefs.lights[lightName].visible = true;
				}
			});
		}, mainEntryDelay);
		return () => clearTimeout(timer);
	}, [animatedRefs]);

	// Konfigurasi animasi untuk struktur (Tidak berubah dari kode asli Anda)
	const structureAppearDuration = 500;
	const structureBaseDelay = 0;
	const beamNode = animatedRefs.horizontalBeam;
	const { scale: beamScale } = useSpring({
		from: {
			scale: beamNode?.userData.wasFound
				? [
					0.001,
					beamNode.userData.initialScale.y,
					beamNode.userData.initialScale.z,
				]
				: [0.001, 1, 1],
		},
		to: {
			scale: beamNode?.userData.wasFound
				? beamNode.userData.initialScale.toArray()
				: [1, 1, 1],
		},
		config: { ...springConfig.gentle, duration: structureAppearDuration },
		delay: structureBaseDelay,
		immediate: !introVisible || !beamNode?.userData.wasFound,
		reset: !introVisible && beamNode?.userData.wasFound,
	});
	const poleNode = animatedRefs.mainVerticalPole;
	const { scale: poleScale } = useSpring({
		from: {
			scale: poleNode?.userData.wasFound
				? [
					poleNode.userData.initialScale.x,
					0.001,
					poleNode.userData.initialScale.z,
				]
				: [1, 0.001, 1],
		},
		to: {
			scale: poleNode?.userData.wasFound
				? poleNode.userData.initialScale.toArray()
				: [1, 1, 1],
		},
		config: { ...springConfig.gentle, duration: structureAppearDuration },
		delay: structureBaseDelay + 100,
		immediate: !introVisible || !poleNode?.userData.wasFound,
		reset: !introVisible && poleNode?.userData.wasFound,
	});

	// Konfigurasi animasi untuk papan nama (Tidak berubah dari kode asli Anda)
	const signBaseDelay = structureBaseDelay + structureAppearDuration + 50;
	const signStaggerInterval = 150;
	const boardAnimationsConfig = useMemo(
		() =>
			NODE_NAMES_CONFIG.signs.map((signConf, index) => ({
				key: signConf.key,
				node: animatedRefs.signs[signConf.key]?.board,
				delay: signBaseDelay + index * signStaggerInterval,
				path: signConf.path,
			})),
		[animatedRefs.signs, signBaseDelay, signStaggerInterval],
	);

	// Konfigurasi animasi untuk mesh interaktif (Tidak berubah dari kode asli Anda)
	const interactiveMeshBaseDelay =
		signBaseDelay + NODE_NAMES_CONFIG.signs.length * signStaggerInterval + 100;
	const interactiveMeshStaggerInterval = 250;
	const interactiveMeshesConfig = useMemo(
		() =>
			NODE_NAMES_CONFIG.interactiveMeshes.map((meshConf, index) => ({
				key: meshConf.key,
				node: animatedRefs.interactiveMeshes[meshConf.key],
				path: meshConf.path,
				delay:
					interactiveMeshBaseDelay + index * interactiveMeshStaggerInterval,
				hoverScaleFactor: meshConf.hoverScaleFactor,
				isPiano: meshConf.isPiano || false,
			})),
		[
			animatedRefs.interactiveMeshes,
			interactiveMeshBaseDelay,
			interactiveMeshStaggerInterval,
		],
	);

	// State dan useEffect untuk animasi kursi (Tidak berubah dari kode asli Anda)
	const chairAnimationStartDelay =
		interactiveMeshBaseDelay +
		NODE_NAMES_CONFIG.interactiveMeshes.length *
		interactiveMeshStaggerInterval +
		200;
	const [isChairReadyToAnimate, setIsChairReadyToAnimate] = useState(false);
	useEffect(() => {
		if (introVisible) {
			const timer = setTimeout(
				() => setIsChairReadyToAnimate(true),
				chairAnimationStartDelay,
			);
			return () => clearTimeout(timer);
		}
	}, [introVisible, chairAnimationStartDelay]);

	// useFrame untuk animasi kipas dan jam (Tidak berubah dari kode asli Anda, namun pastikan offset jam sesuai)
	useFrame((state, delta) => {
		const fanRotationSpeed = isMobile ? 1.2 : 2.0;
		NODE_NAMES_CONFIG.fansGroup1.forEach((fanName) => {
			if (fanRefs.current[fanName]?.userData.wasFound)
				fanRefs.current[fanName].rotateY(fanRotationSpeed * delta);
		});
		NODE_NAMES_CONFIG.fansGroup2.forEach((fanName) => {
			if (fanRefs.current[fanName]?.userData.wasFound)
				fanRefs.current[fanName].rotateY(fanRotationSpeed * delta);
		});

		// Animasi Jam
		const { face, hourHand, minuteHand, secondHand } = clockPartsRef.current;
		if (face && hourHand && minuteHand && secondHand) {
			const now = new Date();
			// Dapatkan waktu saat ini, tambahkan offset jika model 3D tidak menunjuk ke 12:00:00 secara default
			// Offset ini mungkin perlu disesuaikan berdasarkan orientasi awal jarum di model GLTF Anda
			let jam = now.getHours() + 2.8; // Contoh offset, sesuaikan!
			const menit = now.getMinutes() + 13.8; // Contoh offset, sesuaikan!
			const detik = now.getSeconds() + 26.5; // Contoh offset, sesuaikan!
			const milidetik = now.getMilliseconds();

			// Konversi ke format 12 jam jika perlu
			if (jam >= 12) jam = jam % 12;

			// Hitung sudut rotasi untuk setiap jarum (dalam radian)
			// Ingat: 360 derajat = 2 * PI radian
			// Jarum jam: Bergerak 360 derajat dalam 12 jam (30 derajat per jam) + pergerakan kecil berdasarkan menit
			// Jarum menit: Bergerak 360 derajat dalam 60 menit (6 derajat per menit) + pergerakan kecil berdasarkan detik
			// Jarum detik: Bergerak 360 derajat dalam 60 detik (6 derajat per detik) + pergerakan kecil berdasarkan milidetik

			// Arah rotasi mungkin perlu dinegatifkan (-) tergantung orientasi sumbu Y model Anda
			// Jika jam berputar searah jarum jam saat nilai rotasi Y positif, gunakan nilai positif.
			// Jika jam berputar berlawanan arah jarum jam saat nilai rotasi Y positif, gunakan nilai negatif.
			const arahJam = ((jam % 12) * 30 + menit * 0.5) * (Math.PI / 180);
			const arahMenit = (menit * 6 + detik * 0.1) * (Math.PI / 180);
			const arahDetik = (detik * 6 + milidetik * 0.006) * (Math.PI / 180);

			// Atur rotasi pada sumbu Y
			// Pastikan objek jarum memiliki properti 'rotation' (seharusnya jika itu Object3D/Mesh)
			if (hourHand.rotation) hourHand.rotation.set(0, -arahJam, 0); // Rotasi Y negatif untuk arah jarum jam standar
			if (minuteHand.rotation) minuteHand.rotation.set(0, -arahMenit, 0); // Rotasi Y negatif
			if (secondHand.rotation) secondHand.rotation.set(0, -arahDetik, 0); // Rotasi Y negatif
		}
	});
	const shouldRenderDecorations = !isMobile || gpuTier.tier > 1;
	// state untuk tunda mount dekorasi
	const [decorationsReady, setDecorationsReady] = useState(false);
	useEffect(() => {
		let id = window.requestIdleCallback
			? requestIdleCallback(() => setDecorationsReady(true))
			: setTimeout(() => setDecorationsReady(true), 500);
		return () => {
			window.cancelIdleCallback
				? cancelIdleCallback(id)
				: clearTimeout(id);
		};
	}, []);

	// Nama node yang dianimasikan secara eksplisit (Tidak berubah dari kode asli Anda)
	const explicitlyAnimatedNodeNames = useMemo(() => {
		const names = new Set();
		if (NODE_NAMES_CONFIG.horizontalBeam)
			names.add(NODE_NAMES_CONFIG.horizontalBeam);
		if (NODE_NAMES_CONFIG.mainVerticalPole)
			names.add(NODE_NAMES_CONFIG.mainVerticalPole);
		NODE_NAMES_CONFIG.signs.forEach((s) => {
			if (s.boardName) names.add(s.boardName);
		});
		if (NODE_NAMES_CONFIG.kursi && animatedRefs.chairTop?.userData.wasFound)
			names.add(NODE_NAMES_CONFIG.kursi);
		NODE_NAMES_CONFIG.interactiveMeshes.forEach((meshConf) => {
			if (meshConf.meshName) names.add(meshConf.meshName);
		});
		return names;
	}, [animatedRefs.chairTop]);

	// useEffect untuk cleanup (Tidak berubah dari kode asli Anda, tapi penting)
	useEffect(() => {
		return () => {
			if (scene) {
				scene.traverse((object) => {
					if (object.isMesh) {
						if (object.geometry) object.geometry.dispose();
						if (object.material) {
							if (Array.isArray(object.material)) {
								object.material.forEach((material) => {
									if (material.map) material.map.dispose();
									material.dispose();
								});
							} else {
								if (object.material.map) object.material.map.dispose();
								object.material.dispose();
							}
						}
					}
				});
				// Cleanup PointLights yang sudah ditambahkan secara manual
				lampPointLightAssetsRef.current.forEach((asset) => {
					if (asset.pointLight) {
						if (asset.pointLight.parent)
							asset.pointLight.parent.remove(asset.pointLight);
						asset.pointLight.dispose();
					}
				});
				lampPointLightAssetsRef.current = [];
			}
			gsap.globalTimeline.getChildren().forEach((tween) => tween.kill());
		};
	}, [scene]);

	return (
		<group dispose={null}>
			{/* Render static children */}
			{shouldRenderDecorations && decorationsReady && (
				<Suspense fallback={null}>
					<Decorations
						scene={scene}
						gpuTier={gpuTier}
						isNightMode={isNightMode}
					/>
				</Suspense>
			)}
			{scene &&
				scene.children
					.filter(
						(childNode) =>
							!(
								(
									explicitlyAnimatedNodeNames.has(childNode.name) ||
									NODE_NAMES_CONFIG.fansGroup1.includes(childNode.name) ||
									NODE_NAMES_CONFIG.fansGroup2.includes(childNode.name) ||
									childNode.name === NODE_NAMES_CONFIG.clock.face ||
									NODE_NAMES_CONFIG.lights.includes(childNode.name)
								) // Mesh lampu/bohlam dirender di bawah
							),
					)
					.map((childNode) => (
						<primitive key={childNode.uuid} object={childNode.clone(true)} />
					))}

			{/* Render jam dan jarumnya jika ditemukan */}
			{clockPartsRef.current.face?.userData.wasFound && (
				<primitive object={clockPartsRef.current.face}>
					{clockPartsRef.current.hourHand?.userData.wasFound && (
						<primitive object={clockPartsRef.current.hourHand} />
					)}
					{clockPartsRef.current.minuteHand?.userData.wasFound && (
						<primitive object={clockPartsRef.current.minuteHand} />
					)}
					{clockPartsRef.current.secondHand?.userData.wasFound && (
						<primitive object={clockPartsRef.current.secondHand} />
					)}
				</primitive>
			)}

			{/* Render elemen-elemen yang dianimasikan */}
			{beamNode?.userData.wasFound && (
				<a.primitive
					object={beamNode}
					scale={beamScale}
					position={beamNode.userData.initialPosition}
					rotation={beamNode.userData.initialRotation}
				/>
			)}
			{poleNode?.userData.wasFound && (
				<a.primitive
					object={poleNode}
					scale={poleScale}
					position={poleNode.userData.initialPosition}
					rotation={poleNode.userData.initialRotation}
				/>
			)}

			{boardAnimationsConfig.map((animProps) => (
				<AnimatedSignBoard
					key={animProps.key}
					node={animProps.node}
					delay={animProps.delay}
					visible={introVisible}
					overshootFactor={1.15}
					path={animProps.path}
				/>
			))}

			{/* Render kipas */}
			{NODE_NAMES_CONFIG.fansGroup1.map(
				(fanName) =>
					animatedRefs.fans?.[fanName]?.userData.wasFound && (
						<primitive
							key={animatedRefs.fans[fanName].uuid}
							object={animatedRefs.fans[fanName]}
						/>
					),
			)}
			{NODE_NAMES_CONFIG.fansGroup2.map(
				(fanName) =>
					animatedRefs.fans?.[fanName]?.userData.wasFound && (
						<primitive
							key={animatedRefs.fans[fanName].uuid}
							object={animatedRefs.fans[fanName]}
						/>
					),
			)}

			{/* Render mesh lampu/bohlam (mereka sudah visible dan efek emisif/cahaya diatur oleh useEffect) */}
			{NODE_NAMES_CONFIG.lights.map(
				(lightName) =>
					animatedRefs.lights?.[lightName]?.userData.wasFound && (
						<primitive
							key={animatedRefs.lights[lightName].uuid}
							object={animatedRefs.lights[lightName]}
						/>
					),
			)}

			{/* Render mesh interaktif */}
			{interactiveMeshesConfig.map((meshProps) => (
				<AnimatedInteractiveMesh
					key={meshProps.key}
					node={meshProps.node}
					path={meshProps.path}
					visible={introVisible}
					delay={meshProps.delay}
					hoverScaleFactor={meshProps.hoverScaleFactor}
					isPiano={meshProps.isPiano}
					meshKey={meshProps.key}
					pianoSoundsRef={meshProps.isPiano ? pianoSoundsRef : undefined}
					pianoKeyMap={meshProps.isPiano ? pianoKeyMap : undefined}
					fadeOutBackgroundMusic={fadeOutBackgroundMusic} // Teruskan prop
					fadeInBackgroundMusic={fadeInBackgroundMusic} // Teruskan prop
				/>
			))}

			{/* Render kursi */}
			{animatedRefs.chairTop?.userData.wasFound && (
				<AnimatedChairTop
					node={animatedRefs.chairTop}
					isReadyToAnimate={isChairReadyToAnimate}
				/>
			)}
		</group>
	);
};

export default Model;
useGLTF.preload("/assets/models/Room.glb");
