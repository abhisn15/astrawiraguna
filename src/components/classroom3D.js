import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useState,
	useMemo,
	useCallback, // Import useCallback
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
	OrbitControls,
	useGLTF, // Digunakan untuk memuat model
	Environment,
	useProgress, // Digunakan oleh ElegantPreloader
	Html, // Digunakan oleh ElegantPreloader dan WebGLWarning
	// Draco, // Komponen ini tidak ada di kode dasar Anda, tidak ditambahkan
} from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react"; // Digunakan untuk loading
import gsap from "gsap";
import { useNavigate } from "react-router-dom"; // Digunakan untuk navigasi
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

// Loader spesifik tidak perlu diimpor di sini saat menggunakan useGLTF dan <Draco> (jika dipakai)
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// --- Komponen Preloader ---
const ElegantPreloader = () => {
	const { progress } = useProgress(); // Melacak progress useGLTF, useLoader
	const containerRef = useRef(null);
	const progressBarRef = useRef(null);
	const progressTextRef = useRef(null); // Ref untuk teks angka progress (jika dipakai)
	const loaderTextRef = useRef(null);
	const tl = useRef(null);

	useEffect(() => {
		if (!containerRef.current) return;
		gsap.fromTo(
			containerRef.current,
			{ opacity: 0, scale: 0.9, filter: "blur(10px)" },
			{
				opacity: 1,
				scale: 1,
				filter: "blur(0px)",
				duration: 1.5,
				ease: "power3.out",
			},
		);
		gsap.to(".logo-gradient", {
			backgroundPosition: "200% 50%",
			repeat: -1,
			duration: 4,
			ease: "linear",
		});
		if (loaderTextRef.current) {
			const chars = Array.from(loaderTextRef.current.children);
			tl.current = gsap.timeline({ repeat: -1 });
			tl.current
				.to(chars, { y: -8, stagger: 0.1, duration: 0.4, ease: "power1.inOut" })
				.to(chars, { y: 0, stagger: 0.1, duration: 0.4, ease: "power1.inOut" });
		}
		return () => tl.current?.kill();
	}, []);

	useEffect(() => {
		if (!progressBarRef.current || !progressTextRef.current) return; // Gunakan progressTextRef
		gsap.to(progressBarRef.current, {
			width: `${progress}%`,
			duration: 1,
			ease: "circ.out",
		});
		// Animasi teks angka progress
		gsap.to(progressTextRef.current, {
			innerText: Math.round(progress),
			duration: 0.8,
			snap: { innerText: 1 },
			ease: "power3.out",
		});

		if (progress === 100) {
			gsap.to(containerRef.current, {
				opacity: 0,
				y: -50,
				duration: 1,
				delay: 0.5,
				ease: "power3.inOut",
				onComplete: () => {
					if (containerRef.current) containerRef.current.style.display = "none";
				},
			});
		}
	}, [progress]); // Tambah progressTextRef jika digunakan di atas

	return (
		<Html fullscreen>
			<div
				ref={containerRef}
				className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
				<div className="relative mb-12">
					<div className="w-24 h-24 rounded-full bg-logo-gradient filter blur-md animate-pulse"></div>
					<div className="absolute inset-0 m-auto w-20 h-20 rounded-full border-4 border-white/30 shadow-lg">
						<div className="absolute inset-2 rounded-full border-4 border-transparent border-t-white/80 animate-spin-slow"></div>
					</div>
				</div>
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
					{/* Progress text */}
					<div className="absolute inset-0 flex items-center justify-between px-2">
						<span
							ref={progressTextRef}
							className="text-white text-xl font-bold">
							0
						</span>{" "}
						{/* Gunakan ref jika ada */}
						<span className="text-white/60 text-sm">Loading...</span>
					</div>
				</div>
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

// Custom gradient animation (Tetap Sama)
gsap.to(".logo-gradient", {
	backgroundPosition: "200% 50%",
	repeat: -1,
	duration: 4,
	ease: "linear",
});

// Check WebGL Support (Tetap Sama)
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

// Context Recovery Component (Tetap Sama)
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
	// *** Model dimuat menggunakan useGLTF (dilacak Suspense/useProgress) ***
	// useGLTF menangani loading model GLTF dan basic material
	// Inside your ClassroomScene component
	useGLTF.preload("/assets/3D/kelas3D.gltf");
	const { scene: model } = useGLTF(
		"/assets/3D/kelas3D.gltf",
		null,
		(loader) => {
			const draco = new DRACOLoader();
			draco.setDecoderPath(
				"https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
			);
			loader.setDRACOLoader(draco);
		},
	);

	// Refs untuk objek model (akan dicari SETELAH model dimuat)
	const komputerRef = useRef();
	const textures = useRef([]); // Ref untuk tekstur frame monitor (diisi manual)
	const currentFrame = useRef(0); // Ref untuk indeks frame monitor
	const gifObject = useRef(null); // Mesh objek monitor coding
	const intervalRef = useRef(null); // Ref untuk interval animasi monitor

	const neckRef = useRef(null); // Ref untuk objek Neck gitar
	const stringsRef = useRef(null); // Ref untuk objek Strings gitar

	// Referensi jam dinding
	const jamRef = useRef(null);
	const jarumJamRef = useRef(null);
	const jarumMenitRef = useRef(null);
	const jarumDetikRef = useRef(null);

	// *** Ref untuk menyimpan posisi original strings ***
	const stringsOriginalY = useRef(null);

	// *** Ref untuk mengontrol apakah klik gitar diaktifkan (cooldown) ***
	const isClickEnabled = useRef(true);

	// Audio handling
	const audioContext = useMemo(
		() => new (window.AudioContext || window.webkitAudioContext)(),
		[],
	);
	// *** Buffer audio dimuat manual dan disimpan di state ***
	const [audioBuffer, setAudioBuffer] = useState(null); // State untuk buffer audio
	const currentTimeRef = useRef(0); // Waktu mulai playback segmen berikutnya
	const isAudioContextResumed = useRef(false); // Flag untuk AudioContext resume

	// Frame animasi coding monitor
	const frameCount = 195; // Jumlah frame animasi
	const framePath = "/assets/frames/coding/frame_";

	// Refs untuk Raycasting
	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const mouse = useMemo(() => new THREE.Vector2(), []);

	// Effect: Pengaturan global GL (Shadows, Tone Mapping, Color Space)
	useEffect(() => {
		gl.shadowMap.enabled = true;
		gl.shadowMap.type = THREE.PCFSoftShadowMap;
		gl.toneMapping = THREE.ACESFilmicToneMapping;
		gl.toneMappingExposure = 1.0;
		gl.outputColorSpace = THREE.SRGBColorSpace;
	}, [gl]);

	// *** Fungsi Play Sound & Animate Strings (menggunakan useCallback) ***
	// Menggunakan audioBuffer (dari state) dan textures (dari ref) seperti kode asli
	const playGuitarPluck = useCallback(() => {
		// *** NONAKTIFKAN KLIK saat animasi berjalan (Start Cooldown) ***
		if (!isClickEnabled.current) {
			return; // Keluar jika klik sedang dinonaktifkan
		}
		isClickEnabled.current = false; // Setel nonaktif saat animasi/sound baru dimulai
		// console.log("Click enabled -> disabled"); // Debug

		// --- Perbaikan Bug Suara (AudioContext Resume) ---
		if (audioContext.state === "suspended" && !isAudioContextResumed.current) {
			audioContext
				.resume()
				.then(() => {
					console.log("AudioContext resumed successfully.");
					isAudioContextResumed.current = true;
				})
				.catch((e) => console.error("AudioContext resume failed:", e));

			if (audioContext.state !== "running") {
				console.warn("AudioContext is suspended, attempting resume...");
				// Jika context masih suspended, suara tidak akan play saat ini.
				// Klik tetap dinonaktifkan sementara sampai animasi string selesai.
				// Saat klik berikutnya terjadi (setelah cooldown), AudioContext mungkin sudah running.
				// Kita biarkan cooldown selesai untuk memberi waktu resume.
			}
		}
		// --- Akhir Perbaikan AudioContext Resume ---

		// Pastikan buffer audio sudah dimuat sebelum mencoba memutar
		if (!audioBuffer) {
			// Menggunakan state audioBuffer
			console.warn("Audio buffer not loaded or not ready.");
			// Meskipun tidak ada suara, animasi strings tetap berjalan.
			// Cooldown tetap aktif.
		} else {
			const segmentDuration = 1.5; // Durasi per "petikan" dalam detik (bisa disesuaikan 1 sampai 2)
			let startTime = currentTimeRef.current; // Waktu mulai playback untuk *klik ini*
			const totalDuration = audioBuffer.duration; // Menggunakan state audioBuffer

			// --- Perbaikan Logika Segmen Audio ---
			if (startTime >= totalDuration - 0.05) {
				startTime = 0; // Loop back to beginning
				console.log("Reached near end, looping audio.");
			}
			const remainingDuration = totalDuration - startTime;
			const actualDuration = Math.min(segmentDuration, remainingDuration);
			const minPlayDuration = 0.05;

			if (actualDuration < minPlayDuration && totalDuration > minPlayDuration) {
				console.warn(
					`Calculated segment duration (${actualDuration.toFixed(
						2,
					)}s) is too short. Not playing.`,
				);
			} else if (totalDuration <= minPlayDuration) {
				console.warn("Audio buffer has zero or extremely short duration.");
			} else {
				// ** PUTAR SUARA **
				const nextStartTime = (startTime + actualDuration) % totalDuration;
				currentTimeRef.current = nextStartTime; // Update ref UNTUK KLIK BERIKUTNYA

				const source = audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(audioContext.destination);
				source.start(0, startTime, actualDuration);

				console.log(
					`Playing audio from ${startTime.toFixed(
						2,
					)}s for ${actualDuration.toFixed(
						2,
					)}s. Next start planned for ${currentTimeRef.current.toFixed(2)}s`,
				);
			}
		}

		// *** Animate strings (perbaikan bug melayang + posisi original + cooldown) ***
		// Pastikan stringsRef.current dan stringsOriginalY.current sudah diinisialisasi
		if (stringsRef.current && stringsOriginalY.current !== null) {
			// Menggunakan fromTo dengan overwrite untuk stabilitas animasi
			gsap.fromTo(
				stringsRef.current.position,
				{ y: stringsOriginalY.current }, // Mulai dari posisi original Y
				{
					y: stringsOriginalY.current + 0.05, // Target puncak relatif ke original
					duration: 0.1, // Durasi pergerakan ke puncak
					ease: "sine.out", // Ease ke puncak
					yoyo: true, // Bolak-balik
					repeat: 2, // Repeat dikurangi
					ease: "power1.inOut", // Ease untuk seluruh siklus yoyo
					overwrite: true, // Hentikan tween sebelumnya
					onComplete: () => {
						// Tween tambahan untuk memastikan kembali ke posisi original setelah yoyo selesai
						// Ini penting karena repeat:1 hanya yoyo sekali (Original -> Target -> Original)
						gsap.to(stringsRef.current.position, {
							y: stringsOriginalY.current,
							duration: 0.1, // Durasi kembali ke original
							onComplete: () => {
								// *** AKTIFKAN KEMBALI KLIK saat animasi SELESAI ***
								if (isClickEnabled) {
									// Cek jika ref ada (defensif)
									isClickEnabled.current = true;
									console.log("Animation complete, click enabled."); // Debug
								}
							},
						});
					},
				},
			);
		} else {
			console.warn(
				"stringsRef.current or stringsOriginalY.current is null, cannot animate strings.",
			);
			// Jika tidak bisa animasi, pastikan klik tetap diaktifkan (tidak terjebak cooldown)
			isClickEnabled.current = true; // Aktifkan kembali jika animasi tidak bisa dimulai
			console.log("Animation skipped, click enabled."); // Debug
		}
	}, [
		audioContext,
		audioBuffer, // audioBuffer adalah state
		stringsRef,
		stringsOriginalY,
		currentTimeRef,
		isAudioContextResumed,
		isClickEnabled,
	]); // Dependencies useCallback playGuitarPluck (ditambah stringsOriginalY dan isClickEnabled)

	// *** Efek Besar untuk Muat Aset, Cari Objek, Atur Scene, Animasi Monitor ***
	// Efek ini dipanggil sekali saat model dimuat
	useEffect(() => {
		if (!model) return;

		// --- Load Audio Buffer (Tetap di sini seperti kode asli Anda) ---
		// Ini akan dijalankan SETELAH model dimuat oleh useGLTF
		const audioLoader = new THREE.AudioLoader();
		audioLoader.load(
			"/assets/sounds/guitar-pluck.mp3",
			(buffer) => {
				console.log("Audio loaded successfully.");
				setAudioBuffer(buffer); // Update state
			},
			undefined,
			(error) => {
				console.error("Failed to load audio:", error);
			},
		);
		// --- Akhir Load Audio Buffer ---

		// Muat tekstur frame coding (Tetap di sini seperti kode asli Anda)
		const textureLoader = new THREE.TextureLoader();
		for (let i = 1; i <= frameCount; i++) {
			const texture = textureLoader.load(
				`${framePath}${i.toString().padStart(3, "0")}.png`,
			);
			texture.flipY = false;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			textures.current.push(texture);
		}

		// *** Cari objek-objek penting berdasarkan nama menggunakan traverse ***
		// Ini mencari di SELURUH hierarki model
		let foundNeck, foundStrings, foundKomputer, foundJam, foundGif;

		model.traverse((child) => {
			if (child.name === "Neck") foundNeck = child;
			if (child.name === "Strings") foundStrings = child;
			if (child.name === "KOMPUTER_RPL") foundKomputer = child;
			if (child.name === "JAM_DINDING") foundJam = child;
			if (child.name === "GIF_NGODING") foundGif = child;

			// Pengaturan umum shadows & env map untuk SEMUA mesh (Tetap di sini)
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				if (child.material?.isMeshStandardMaterial) {
					// Atur material spesifik monitor di LUAR traverse
					if (child.name !== "GIF_NGODING") {
						child.material.envMapIntensity = 1;
					}
					child.material.needsUpdate = true;
				}
			}
		});

		// Setelah traverse, update refs utama
		neckRef.current = foundNeck;
		stringsRef.current = foundStrings;
		komputerRef.current = foundKomputer;
		jamRef.current = foundJam;
		gifObject.current = foundGif;

		// *** Simpan posisi Y original strings setelah ditemukan ***
		// Lakukan ini HANYA jika ini adalah pertama kali Strings ditemukan DAN itu adalah Mesh
		if (
			stringsRef.current &&
			stringsRef.current.isMesh &&
			stringsOriginalY.current === null
		) {
			stringsOriginalY.current = stringsRef.current.position.y;
			console.log(
				"Strings object found, storing original Y position:",
				stringsOriginalY.current,
			);
		}

		// Log warning jika objek utama tidak ditemukan
		if (!neckRef.current) console.warn("Objek 'Neck' tidak ditemukan!");
		if (!stringsRef.current) console.warn("Objek 'Strings' tidak ditemukan!");
		if (!komputerRef.current)
			console.warn("Objek 'KOMPUTER_RPL' tidak ditemukan!");
		if (!jamRef.current) console.warn("Objek 'JAM_DINDING' tidak ditemukan!");
		if (!gifObject.current)
			console.warn("Objek 'GIF_NGODING' tidak ditemukan!");

		// *** Cari Jarum Jam di dalam children JAM_DINDING (Seteleh JAM_DINDING ditemukan) ***
		if (jamRef.current) {
			// Gunakan getObjectByName untuk mencari jarum jam di dalam hierarki jamRef.current
			// getObjectByName juga mencari secara rekursif di children
			jarumJamRef.current = jamRef.current.getObjectByName("JARUM_JAM");
			jarumMenitRef.current = jamRef.current.getObjectByName("JARUM_MENIT");
			jarumDetikRef.current = jamRef.current.getObjectByName("JARUM_DETIK");

			// Log warning jika jarum jam tidak ditemukan
			if (!jarumJamRef.current)
				console.warn("Objek 'JARUM_JAM' tidak ditemukan di dalam JAM_DINDING!");
			if (!jarumMenitRef.current)
				console.warn(
					"Objek 'JARUM_MENIT' tidak ditemukan di dalam JAM_DINDING!",
				);
			if (!jarumDetikRef.current)
				console.warn(
					"Objek 'JARUM_DETIK' tidak ditemukan di dalam JAM_DINDING!",
				);
		}

		// *** Atur Material Spesifik untuk Monitor (GIF_NGODING) di LUAR traverse ***
		// Lakukan ini setelah gifObject.current diisi
		if (
			gifObject.current &&
			gifObject.current.isMesh &&
			textures.current.length > 0
		) {
			// Pastikan gifObject adalah Mesh dan tekstur sudah dimuat
			if (
				gifObject.current.material &&
				gifObject.current.material.isMeshStandardMaterial
			) {
				gifObject.current.material.color.set(0x999999); // Gelapkan konten PNG
				gifObject.current.material.envMapIntensity = 0.5; // Kurangi pantulan
				gifObject.current.material.map = textures.current[0]; // Set frame pertama
				gifObject.current.material.needsUpdate = true;
				console.log("Material GIF_NGODING disesuaikan.");
			} else {
				console.warn(
					"GIF_NGODING ditemukan tapi materialnya tidak cocok, tidak bisa disesuaikan.",
				);
			}
		} else if (!gifObject.current) {
			console.warn("GIF_NGODING object not found, cannot adjust material.");
		} else if (textures.current.length === 0) {
			console.warn("Monitor textures not loaded yet, cannot adjust material.");
		}

		// *** Memulai Loop Interval untuk memperbarui MAP (TEKSTUR FRAME) Monitor ***
		// Dimulai setelah gifObject dan tekstur siap
		if (
			gifObject.current &&
			gifObject.current.isMesh &&
			textures.current.length > 0
		) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			intervalRef.current = setInterval(() => {
				if (
					gifObject.current &&
					gifObject.current.material &&
					textures.current.length > 0 &&
					gifObject.current.isMesh &&
					gifObject.current.material.isMeshStandardMaterial // Cek lagi sebelum update map
				) {
					currentFrame.current = (currentFrame.current + 1) % frameCount;
					gifObject.current.material.map =
						textures.current[currentFrame.current];
					gifObject.current.material.needsUpdate = true;
				}
			}, 100);
		} else if (!gifObject.current || !gifObject.current.isMesh) {
			console.warn(
				"Cannot start monitor animation interval, GIF_NGODING object not found or not a Mesh.",
			);
		} else if (textures.current.length === 0) {
			console.warn(
				"Cannot start monitor animation interval, frame textures not loaded.",
			);
		}

		// Tambahkan Directional Light (jika belum ada di scene)
		const existingLight = scene.getObjectByName("mainDirectionalLight");
		if (!existingLight) {
			const isMobile =
				/Mobi|Android|Tablet/.test(navigator.userAgent) ||
				window.innerWidth < 768;
			const intensity = isMobile ? 8 : 2;
			const shadowMap = isMobile ? 1024 : 2086;
			const sunLight = new THREE.DirectionalLight(0xffffff, intensity);
			sunLight.position.set(7, 15, 10);
			sunLight.castShadow = true;
			sunLight.shadow.mapSize.width = shadowMap;
			sunLight.shadow.mapSize.height = shadowMap;
			sunLight.shadow.camera.left = -20;
			sunLight.shadow.camera.right = 20;
			sunLight.shadow.camera.top = 20;
			sunLight.shadow.camera.bottom = -20;
			sunLight.shadow.camera.near = 0.1;
			sunLight.shadow.camera.far = 100;
			sunLight.shadow.bias = -0.0001;
			sunLight.shadow.normalBias = 0.05;
			sunLight.name = "mainDirectionalLight";
			scene.add(sunLight);
			console.log("Directional Light ditambahkan.");
		}

		// Cleanup function for this effect
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};

		// Dependensi untuk efek besar
	}, [
		model, // useGLTF result
		scene,
		frameCount,
		framePath,
		textures, // textures ref
		currentFrame, // currentFrame ref
		intervalRef, // intervalRef ref
		neckRef, // neckRef ref
		stringsRef, // stringsRef ref
		komputerRef, // komputerRef ref
		jamRef, // jamRef ref
		jarumJamRef, // jarumJamRef ref
		jarumMenitRef, // jarumMenitRef ref
		jarumDetikRef, // jarumDetikRef ref
		gifObject, // gifObject ref
		setAudioBuffer, // setAudioBuffer state setter
		stringsOriginalY, // stringsOriginalY ref
	]);

	// *** useFrame untuk animasi jam dinding (tetap di sini) ***
	// Ini akan berjalan setiap frame, cek ref jam di dalamnya
	useFrame(() => {
		// Tambahkan defensive checks untuk memastikan semua ref jam ada
		if (
			jamRef.current &&
			jarumJamRef.current &&
			jarumMenitRef.current &&
			jarumDetikRef.current
		) {
			const now = new Date();
			let jam = now.getHours() + 2.8; // Sesuaikan offset jika perlu
			const menit = now.getMinutes() + 13.8; // Sesuaikan offset jika perlu
			const detik = now.getSeconds() + 26.5; // Sesuaikan offset jika perlu
			const milidetik = now.getMilliseconds();

			if (jam >= 12) jam = jam % 12;

			// Rotasi jarum jam (sumbu Y di Three.js)
			// Arah jam berlawanan arah jarum jam pada sumbu Y
			const arahJam = ((jam % 12) * 30 + menit * 0.5) * (Math.PI / 180);
			const arahMenit = (menit * 6 + detik * 0.1) * (Math.PI / 180);
			const arahDetik = (detik * 6 + milidetik * 0.006) * (Math.PI / 180);

			// Periksa apakah jarum jam memiliki properti rotation (seharusnya jika itu Object3D/Mesh)
			if (jarumJamRef.current.rotation)
				jarumJamRef.current.rotation.set(0, -arahJam, 0);
			if (jarumMenitRef.current.rotation)
				jarumMenitRef.current.rotation.set(0, -arahMenit, 0);
			if (jarumDetikRef.current.rotation)
				jarumDetikRef.current.rotation.set(0, -arahDetik, 0);
		}
	});

	// *** Fungsi Play Sound & Animate Strings (menggunakan useCallback) ***
	// (Definisi fungsi ini di atas useEffect besar)
	// ... kode playGuitarPluck ...

	// *** Effect untuk Menambah/Menghapus Event Listener Klik Gitar (Neck/Strings) ***
	// Dipindahkan ke efek terpisah untuk manajemen listener yang lebih baik
	const handleGuitarClick = useCallback(
		(event) => {
			// *** Cek apakah klik diaktifkan sebelum melanjutkan (Cooldown) ***
			if (!isClickEnabled.current) {
				// console.log("Guitar click ignored (cooldown)."); // Optional debug
				return; // Keluar jika klik sedang dinonaktifkan
			}

			// Pastikan neck/strings object sudah ditemukan (defensif)
			if (!neckRef.current && !stringsRef.current) {
				// console.warn("Guitar objects (Neck/Strings) not found, cannot process guitar click.");
				return;
			}

			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);

			// Cek intersect dengan Neck ATAU Strings (termasuk children jika Strings punya children mesh)
			const objectsToIntersect = [];
			// Gunakan ref objects yang *sudah dicari*
			if (neckRef.current) objectsToIntersect.push(neckRef.current);
			if (stringsRef.current) {
				objectsToIntersect.push(stringsRef.current);
				// Tambahkan children jika mesh yang bisa diklik ada di dalam Strings
				if (stringsRef.current.children) {
					objectsToIntersect.push(...stringsRef.current.children);
				}
			}

			// Raycast hanya jika ada objek untuk di-intersect
			const intersects =
				objectsToIntersect.length > 0
					? raycaster.intersectObjects(objectsToIntersect, true)
					: [];

			if (intersects.length > 0) {
				playGuitarPluck(); // Panggil fungsi play sound/animate strings yang sudah di-memoize
			}
		},
		[
			mouse,
			raycaster,
			camera,
			neckRef, // Dependensi ref gitar
			stringsRef, // Dependensi ref gitar
			playGuitarPluck, // Dependensi fungsi callback
			isClickEnabled, // Dependensi ref cooldown
		],
	); // Dependencies useCallback handleGuitarClick

	useEffect(() => {
		// Pastikan gl domElement sudah tersedia dan objek gitar (setidaknya Neck/Strings) ditemukan
		// Listener ini hanya perlu ditambahkan sekali setelah objek dan gl siap.
		if (!gl || !gl.domElement || (!neckRef.current && !stringsRef.current)) {
			// console.log("Skipping guitar listener useEffect: gl or guitar objects not ready."); // Debugging
			return;
		}
		console.log("Adding guitar click listener.");

		const domElement = gl.domElement;
		domElement.addEventListener("click", handleGuitarClick);

		return () => {
			console.log("Removing guitar click listener.");
			domElement.removeEventListener("click", handleGuitarClick);
		};
		// Dependensi: gl (untuk domElement), handleGuitarClick (handler itu sendiri).
		// Juga sertakan ref gitar agar listener di-re-add jika ref tersebut berubah
	}, [gl, handleGuitarClick, neckRef, stringsRef]);

	// *** Effect untuk Menambah/Menghapus Event Listener Klik Komputer ***
	// Dipindahkan ke efek terpisah
	const handleComputerClick = useCallback(
		(event) => {
			if (!komputerRef.current) {
				return;
			}
			const mouse = new THREE.Vector2(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
			);
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObject(komputerRef.current, true);

			if (intersects.length > 0) {
				if (controls.current) controls.current.enabled = false;
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
						if (targetPosition) camera.lookAt(targetPosition);
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
		},
		[camera, gl, navigate, controls, komputerRef],
	);

	const handleComputerMouseMove = useCallback(
		(event) => {
			if (!komputerRef.current) return;
			const mouse = new THREE.Vector2(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
			);
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObject(komputerRef.current, true);
			gl.domElement.style.cursor = intersects.length > 0 ? "pointer" : "auto";
		},
		[camera, gl, komputerRef],
	);

	useEffect(() => {
		if (!gl || !gl.domElement || !komputerRef.current) {
			return;
		}
		console.log("Adding computer listeners.");
		const domElement = gl.domElement;
		domElement.addEventListener("click", handleComputerClick);
		domElement.addEventListener("mousemove", handleComputerMouseMove);
		return () => {
			console.log("Removing computer listeners.");
			domElement.removeEventListener("click", handleComputerClick);
			domElement.removeEventListener("mousemove", handleComputerMouseMove);
		};
	}, [gl, handleComputerClick, handleComputerMouseMove, komputerRef]);

	useImperativeHandle(ref, () => ({
		camera,
		controls: controls.current,
	}));

	// Render JSX
	return (
		<>
			<ContextRecovery />
			<ambientLight intensity={0.8} />
			
			<primitive object={model} /> {/* Tampilkan model 3D */}
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
	const isMobile =
		/Mobi|Android|Tablet/.test(navigator.userAgent) || window.innerWidth < 768;

	useEffect(() => {
		if (!checkWebGLSupport()) {
			setWebglSupported(false);
			return;
		}
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
			return () =>
				gl.canvas.removeEventListener(
					"webglcontextcreationerror",
					handleContextCreationError,
				);
		}
	}, []);

	if (!webglSupported) return <WebGLWarning />;

	return (
		<Canvas
			shadows
			camera={{ fov: 45, near: 0.1, far: 1000, position: [-3, 2, 8] }}
			gl={{ antialias: true, preserveDrawingBuffer: true }}
			dpr={Math.min(window.devicePixelRatio, 1.5)}
			style={{ width: "100%", height: "100vh", background: "#191919" }}>
			<Suspense fallback={<ElegantPreloader />}>
				{!isMobile && <Environment preset="sunset" background />}
				<ClassroomScene ref={ref} />
			</Suspense>
		</Canvas>
	);
});

// --- Preload GLTF Model & Export Komponen Utama ---
useGLTF.preload("/assets/3D/kelas3D.gltf"); // Preload model agar cepat tersedia
export default Classroom3D;
