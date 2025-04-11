import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";

const Classroom3D = () => {
	const containerRef = useRef(null);
	const scene = useRef(new THREE.Scene());
	const camera = useRef(
		new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		),
	);
	const renderer = useRef(null);
	const controls = useRef(null);
	const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
	const mouse = useRef({ x: 0, y: 0, isDown: false });
	const animationMixers = useRef([]);
	const loadingRef = useRef(null);

	// Fungsi animasi utama
	const animate = useCallback(() => {
		requestAnimationFrame(animate);

		// Gerakan kamera berdasarkan input keyboard
		const speed = 0.1;
		const direction = new THREE.Vector3();
		const cameraDirection = new THREE.Vector3();
		camera.current.getWorldDirection(cameraDirection);

		// Forward/backward movement
		if (keys.w)
			camera.current.position.add(
				cameraDirection.clone().multiplyScalar(speed),
			);
		if (keys.s)
			camera.current.position.add(
				cameraDirection.clone().multiplyScalar(-speed),
			);

		// Strafing
		if (keys.a || keys.d) {
			const right = new THREE.Vector3();
			camera.current.getWorldDirection(right);
			right.cross(camera.current.up);

			if (keys.a)
				camera.current.position.add(right.clone().multiplyScalar(-speed));
			if (keys.d)
				camera.current.position.add(right.clone().multiplyScalar(speed));
		}

		// Batasi ketinggian kamera
		camera.current.position.y = Math.max(camera.current.position.y, 1.7);

		// Update OrbitControls (jika diaktifkan)
		if (controls.current) controls.current.update();

		// Render scene
		if (renderer.current && scene.current && camera.current) {
			renderer.current.render(scene.current, camera.current);
		}
	}, [keys]);

	// Setup kontrol kamera (keyboard & mouse custom)
	const setupCameraControls = useCallback(() => {
		const handleKeyDown = (e) => {
			const key = e.key.toLowerCase();
			if (["w", "a", "s", "d"].includes(key)) {
				setKeys((prev) => ({ ...prev, [key]: true }));
			}
		};

		const handleKeyUp = (e) => {
			const key = e.key.toLowerCase();
			if (["w", "a", "s", "d"].includes(key)) {
				setKeys((prev) => ({ ...prev, [key]: false }));
			}
		};

		const handleMouseDown = () => {
			mouse.current.isDown = true;
		};

		const handleMouseUp = () => {
			mouse.current.isDown = false;
		};

		const handleMouseMove = (e) => {
			if (mouse.current.isDown) {
				const deltaX = e.movementX * 0.002;
				const deltaY = e.movementY * 0.002;

				camera.current.rotation.y -= deltaX;
				camera.current.rotation.x = THREE.MathUtils.clamp(
					camera.current.rotation.x - deltaY,
					-Math.PI / 2,
					Math.PI / 2,
				);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	// Fungsi pembantu untuk membuat label area
	const createAreaLabel = useCallback((text, parent) => {
		const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
		const labelMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.8,
		});
		const label = new THREE.Mesh(labelGeometry, labelMaterial);
		label.position.set(0, 3, 0);
		parent.add(label);
	}, []);

	// Fungsi pembantu untuk membuat meja
	const createTable = useCallback((x, y, z, color) => {
		const table = new THREE.Group();
		const tableTop = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 0.7, 0.8),
			new THREE.MeshStandardMaterial({ color }),
		);
		tableTop.position.set(0, 0.35, 0);

		const legGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
		const legs = [];
		for (let i = 0; i < 4; i++) {
			const leg = new THREE.Mesh(
				legGeometry,
				new THREE.MeshStandardMaterial({ color: 0x4a3520 }),
			);
			legs.push(leg);
		}
		legs[0].position.set(-0.7, -0.35, -0.35);
		legs[1].position.set(0.7, -0.35, -0.35);
		legs[2].position.set(-0.7, -0.35, 0.35);
		legs[3].position.set(0.7, -0.35, 0.35);

		table.add(tableTop, ...legs);
		table.position.set(x, y, z);
		return table;
	}, []);

	// Fungsi pembuatan ruangan kelas dasar
	const createBaseClassroom = useCallback(() => {
		const classroomGroup = new THREE.Group();

		// Lantai
		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(20, 15),
			new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 }),
		);
		floor.rotation.x = -Math.PI / 2;
		floor.receiveShadow = true;
		classroomGroup.add(floor);

		// Dinding
		const wallMaterial = new THREE.MeshStandardMaterial({
			color: 0xf5f5f5,
			roughness: 0.5,
		});

		// Dinding belakang
		const backWall = new THREE.Mesh(
			new THREE.PlaneGeometry(20, 4),
			wallMaterial,
		);
		backWall.position.set(0, 2, -7.5);
		classroomGroup.add(backWall);

		// Dinding depan
		const frontWallLeft = new THREE.Mesh(
			new THREE.PlaneGeometry(8, 4),
			wallMaterial,
		);
		frontWallLeft.position.set(-6, 2, 7.5);
		frontWallLeft.rotation.y = Math.PI;
		classroomGroup.add(frontWallLeft);

		const frontWallRight = new THREE.Mesh(
			new THREE.PlaneGeometry(8, 4),
			wallMaterial,
		);
		frontWallRight.position.set(6, 2, 7.5);
		frontWallRight.rotation.y = Math.PI;
		classroomGroup.add(frontWallRight);

		// Dinding samping
		const sideWalls = new THREE.Group();
		const leftWall = new THREE.Mesh(
			new THREE.PlaneGeometry(15, 4),
			wallMaterial,
		);
		leftWall.rotation.y = Math.PI / 2;
		leftWall.position.set(-10, 2, 0);
		sideWalls.add(leftWall);

		const rightWall = new THREE.Mesh(
			new THREE.PlaneGeometry(15, 4),
			wallMaterial,
		);
		rightWall.rotation.y = -Math.PI / 2;
		rightWall.position.set(10, 2, 0);
		sideWalls.add(rightWall);
		classroomGroup.add(sideWalls);

		scene.current.add(classroomGroup);
	}, []);

	// Fungsi pembuatan masing-masing area
	const createRPLArea = useCallback(() => {
		const rplGroup = new THREE.Group();
		rplGroup.position.set(-8, 0, -2);

		const loader = new GLTFLoader();
		loader.load(
			`${process.env.PUBLIC_URL}/assets/3D/ImageToStl.com_rpl.gltf`,
			(gltf) => {
				gltf.scene.scale.set(0.5, 0.5, 0.5);
				gltf.scene.position.set(0, 0.5, 0);
				rplGroup.add(gltf.scene);

				gsap.from(gltf.scene.position, {
					y: -2,
					duration: 2,
					ease: "power2.out",
				});
			},
			undefined,
			(error) => console.error("Error loading RPL model:", error),
		);

		createAreaLabel("AREA RPL", rplGroup);
		scene.current.add(rplGroup);
	}, [createAreaLabel]);

	const createAKLArea = useCallback(() => {
		const aklGroup = new THREE.Group();
		aklGroup.position.set(-4, 0, -2);

		const table = createTable(0, 0, 0, 0x996633);
		aklGroup.add(table);

		// Kalkulator
		const calculator = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 0.05, 0.2),
			new THREE.MeshStandardMaterial({ color: 0x333333 }),
		);
		calculator.position.set(0.4, 0.7, 0);
		aklGroup.add(calculator);

		// Buku akuntansi
		const books = new THREE.Group();
		for (let i = 0; i < 3; i++) {
			const book = new THREE.Mesh(
				new THREE.BoxGeometry(0.25, 0.05, 0.35),
				new THREE.MeshStandardMaterial({ color: 0x2266ff }),
			);
			book.position.set(-0.4, 0.7 + i * 0.05, 0);
			books.add(book);
		}
		aklGroup.add(books);

		createAreaLabel("AREA AKL", aklGroup);
		scene.current.add(aklGroup);
	}, [createTable, createAreaLabel]);

	const createBRArea = useCallback(() => {
		const brGroup = new THREE.Group();
		brGroup.position.set(0, 0, -2);

		// Etalase
		const showcase = new THREE.Mesh(
			new THREE.BoxGeometry(1.5, 0.8, 0.8),
			new THREE.MeshStandardMaterial({ color: 0xffffff }),
		);
		showcase.position.set(0, 0.4, 0);
		brGroup.add(showcase);

		// Produk
		const products = new THREE.Group();
		for (let i = 0; i < 5; i++) {
			const product = new THREE.Mesh(
				new THREE.BoxGeometry(0.2, 0.2, 0.2),
				new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }),
			);
			product.position.set(-0.6 + i * 0.3, 0.8, 0);
			products.add(product);
		}
		brGroup.add(products);

		createAreaLabel("AREA BR", brGroup);
		scene.current.add(brGroup);
	}, [createAreaLabel]);

	const createMPArea = useCallback(() => {
		const mpGroup = new THREE.Group();
		mpGroup.position.set(4, 0, -2);

		// Meja kantor
		const desk = createTable(0, 0, 0, 0x666666);
		mpGroup.add(desk);

		// Dokumen
		const documents = new THREE.Group();
		for (let i = 0; i < 3; i++) {
			const doc = new THREE.Mesh(
				new THREE.BoxGeometry(0.3, 0.05, 0.4),
				new THREE.MeshStandardMaterial({ color: 0xffffff }),
			);
			doc.position.set(-0.4, 0.7 + i * 0.05, 0);
			documents.add(doc);
		}
		mpGroup.add(documents);

		createAreaLabel("AREA MP", mpGroup);
		scene.current.add(mpGroup);
	}, [createTable, createAreaLabel]);

	const createDKVArea = useCallback(() => {
		const dkvGroup = new THREE.Group();
		dkvGroup.position.set(8, 0, -2);

		// Meja desainer
		const desk = createTable(0, 0, 0, 0x333333);
		dkvGroup.add(desk);

		// Kanvas
		const canvasMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(1.2, 0.8),
			new THREE.MeshStandardMaterial({ color: 0xffffff }),
		);
		canvasMesh.position.set(0, 0.7, 0.1);
		dkvGroup.add(canvasMesh);

		createAreaLabel("AREA DKV", dkvGroup);
		scene.current.add(dkvGroup);
	}, [createTable, createAreaLabel]);

	const createAllAreas = useCallback(() => {
		createRPLArea();
		createAKLArea();
		createBRArea();
		createMPArea();
		createDKVArea();
	}, [createRPLArea, createAKLArea, createBRArea, createMPArea, createDKVArea]);

	const setupLighting = useCallback(() => {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.current.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 10);
		directionalLight.castShadow = true;
		scene.current.add(directionalLight);
	}, []);

	// Fungsi navigasi ke jurusan
	const goToJurusan = useCallback((jurusan) => {
		const positions = {
			rpl: [-8, 1.7, 5],
			akl: [-4, 1.7, 5],
			br: [0, 1.7, 5],
			mp: [4, 1.7, 5],
			dkv: [8, 1.7, 5],
		};

		gsap.to(camera.current.position, {
			duration: 1.5,
			x: positions[jurusan][0],
			y: positions[jurusan][1],
			z: positions[jurusan][2],
			ease: "power2.inOut",
			onUpdate: () => {
				if (controls.current) controls.current.update();
			},
		});
	}, []);

	// Fungsi reset view
	const resetView = useCallback(() => {
		gsap.to(camera.current.position, {
			duration: 1.5,
			x: 0,
			y: 1.7,
			z: 10,
			ease: "power2.inOut",
			onUpdate: () => {
				if (controls.current) controls.current.update();
			},
		});
	}, []);

	useEffect(() => {
		// Simpan containerRef ke variabel lokal untuk cleanup
		const container = containerRef.current;
		// Inisialisasi scene
		const initScene = () => {
			renderer.current = new THREE.WebGLRenderer({ antialias: true });
			renderer.current.setSize(window.innerWidth, window.innerHeight);
			renderer.current.shadowMap.enabled = true;

			if (container) {
				container.appendChild(renderer.current.domElement);
			}

			camera.current.position.set(0, 1.7, 10);
			scene.current.background = new THREE.Color(0x87ceeb);

			// Setup OrbitControls
			controls.current = new OrbitControls(
				camera.current,
				renderer.current.domElement,
			);
			controls.current.enableDamping = true;
			controls.current.dampingFactor = 0.25;

			// Setup pencahayaan (opsional, juga bisa menggunakan setupLighting)
			const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
			scene.current.add(ambientLight);
			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(10, 10, 10);
			directionalLight.castShadow = true;
			scene.current.add(directionalLight);

			// Loading animation
			if (loadingRef.current) {
				gsap.to(loadingRef.current, {
					opacity: 0,
					delay: 3,
					duration: 1,
					onComplete: () => {
						if (loadingRef.current) {
							loadingRef.current.style.display = "none";
						}
					},
				});
			}
		};

		initScene();
		createBaseClassroom();
		createAllAreas();
		const cleanupControls = setupCameraControls();
		animate();

		// Handle window resize
		const handleResize = () => {
			camera.current.aspect = window.innerWidth / window.innerHeight;
			camera.current.updateProjectionMatrix();
			renderer.current.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener("resize", handleResize);

		return () => {
			cleanupControls();
			window.removeEventListener("resize", handleResize);
			if (container && renderer.current?.domElement) {
				container.removeChild(renderer.current.domElement);
			}
			gsap.killTweensOf(loadingRef.current);
		};
	}, [animate, createAllAreas, createBaseClassroom, setupCameraControls]);

	return (
		<div className="relative w-full h-screen">
			{/* 3D Container */}
			<div ref={containerRef} className="absolute top-0 left-0 w-full h-full" />

			{/* Loading Screen */}
			<div
				ref={loadingRef}
				className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl">
				Memuat Kelas Virtual...
			</div>

			{/* Control Panel */}
			<div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 p-4 rounded-lg shadow-lg">
				<h3 className="text-white text-lg mb-2 font-semibold">
					Navigasi Jurusan
				</h3>
				<button
					onClick={() => goToJurusan("rpl")}
					className="w-full mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
					RPL
				</button>
				<button
					onClick={() => goToJurusan("akl")}
					className="w-full mb-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors">
					AKL
				</button>
				<button
					onClick={() => goToJurusan("br")}
					className="w-full mb-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors">
					BR
				</button>
				<button
					onClick={() => goToJurusan("mp")}
					className="w-full mb-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors">
					MP
				</button>
				<button
					onClick={() => goToJurusan("dkv")}
					className="w-full mb-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded transition-colors">
					DKV
				</button>
				<button
					onClick={resetView}
					className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors">
					Reset View
				</button>
			</div>

			{/* Info Panel */}
			<div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 p-4 rounded-lg max-w-xs">
				<h3 className="text-white text-lg font-semibold mb-2">
					Selamat Datang!
				</h3>
				<p className="text-gray-300 text-sm">
					Gunakan mouse untuk melihat sekeliling dan klik tombol jurusan untuk
					berpindah area. Tekan WASD untuk bergerak.
				</p>
			</div>
		</div>
	);
};

export default Classroom3D;
