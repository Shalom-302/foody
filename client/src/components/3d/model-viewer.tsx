"use client";

import { Bounds, Center, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

/** Interactive GLB viewer for products that have a `model_3d_url`. */
export default function ModelViewer({ url }: { url: string }) {
    return (
        <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.5, 4], fov: 40 }} className="bg-honey">
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 4]} intensity={1.5} />
            <Suspense fallback={null}>
                <Bounds fit clip observe margin={1.2}>
                    <Center>
                        <Model url={url} />
                    </Center>
                </Bounds>
                <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={6} blur={2.4} />
            </Suspense>
            <OrbitControls makeDefault enablePan={false} autoRotate autoRotateSpeed={1.2} minDistance={2} maxDistance={8} />
        </Canvas>
    );
}
