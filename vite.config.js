import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
	plugins: [
		react(),
		// Kompresi Gzip
		viteCompression({
			verbose: true,
			disable: false,
			threshold: 10240, // 10 KB
			algorithm: "gzip",
			ext: ".gz",
		}),
		// Kompresi Brotli
		viteCompression({
			verbose: true,
			disable: false,
			threshold: 10240,
			algorithm: "brotliCompress",
			ext: ".br",
		}),
		// Visualizer bundle analyzer (akan membuka browser setelah build)
		visualizer({
			open: true,
			gzipSize: true,
			brotliSize: true,
			filename: "stats.html",
		}),
	],
	resolve: {
		alias: {
			"@": new URL("./src", import.meta.url).pathname,
		},
	},
	build: {
		sourcemap: false,
		chunkSizeWarningLimit: 1500, // Tambahan untuk toleransi proyek 3D besar
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},

				// Bisa aktifkan kalau mau kontrol lebih detail file output:
				// chunkFileNames: 'assets/js/[name]-[hash].js',
				// entryFileNames: 'assets/js/[name]-[hash].js',
				// assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
			},
		},
	}
});
