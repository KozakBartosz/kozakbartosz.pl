import { Reflector } from '@react-three/drei';

export const Mirror = () => {
    return (
        <Reflector
            blur={[512, 512]} // Blur ground reflections (width, heigt), 0 skips blur
            mixBlur={1} // How much blur mixes with surface roughness
            mixStrength={0.3} // Strength of the reflections
            resolution={512} // Off-buffer resolution, lower=faster, higher=better quality
            args={[512, 512]} // PlaneBufferGeometry arguments
            rotation={[-Math.PI / 2, 0, 0]}
            mirror={1} // Mirror environment, 0 = texture colors, 1 = pick up env colors
            minDepthThreshold={0.1}
            maxDepthThreshold={3}
            depthScale={3}
            position={[0, -13, -200 + 100]}
        >
            {(Material, props) => (
                <Material
                    // color={0x090f0e}
                    metalness={1}
                    roughness={1}
                    {...props}
                />
            )}
        </Reflector>
    );
};
