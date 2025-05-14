// Decorations.jsx
import React, { useMemo } from 'react';
import { InstancedMesh, Object3D, LOD } from 'three';
import { useThree } from '@react-three/fiber';

export default function Decorations({ scene, gpuTier, isNightMode }) {
    // Kumpulkan semua mesh dekoratif di scene
    const decoMeshes = useMemo(() => {
        return scene.children.filter(child =>
            /* sesuaikan filter dengan nama atau tag dekoratif */
            child.name.startsWith('Deco') && child.isMesh
        );
    }, [scene]);

    // Contoh instancing: jika ada banyak kursi dengan pola “Chair”
    const chairMesh = decoMeshes.find(m => m.name === 'Chair_Base');
    const chairCount = 20;
    const dummy = new Object3D();

    return (
        <group>
            {/* InstancedMesh untuk kursi */}
            {chairMesh && (
                <instancedMesh
                    args={[chairMesh.geometry, chairMesh.material, chairCount]}
                    onUpdate={mesh => {
                        for (let i = 0; i < chairCount; i++) {
                            dummy.position.set(
                                // contoh random atau grid
                                (i % 5) * 1.5 - 3,
                                0,
                                Math.floor(i / 5) * 1.5 - 3
                            );
                            dummy.updateMatrix();
                            mesh.setMatrixAt(i, dummy.matrix);
                        }
                        mesh.instanceMatrix.needsUpdate = true;
                    }}
                />
            )}

            {/* LOD contoh: untuk mesh besar */}
            {decoMeshes
                .filter(m => m.name.startsWith('BigDeco'))
                .map((mesh, i) => (
                    <LOD key={i}>
                        {/* high-detail */}
                        <primitive object={mesh.clone()} position={mesh.position} />
                        {/* low-detail */}
                        <primitive
                            object={mesh.clone().geometry.clone().scale(0.5, 0.5, 0.5)}
                            position={mesh.position}
                        />
                    </LOD>
                ))}

            {/* Jika masih ada dekorasi lain, render sebagai <primitive> biasa */}
            {decoMeshes
                .filter(m => !m.name.startsWith('Chair') && !m.name.startsWith('BigDeco'))
                .map(mesh => (
                    <primitive key={mesh.uuid} object={mesh.clone(true)} />
                ))}
        </group>
    );
}
