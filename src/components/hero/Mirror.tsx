import { Reflector } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { Gradient } from './Gradinet';

export const Mirror = ({ elementRef }: { elementRef?: RefObject<HTMLDivElement> }) => {
    const floor = useRef<Group>(null!);
    const point = useMemo(() => new Vector3(), []);
    useFrame(({ camera, size }) => {
        if (!floor.current || !elementRef?.current) return;
        const box = elementRef.current.getBoundingClientRect();
        const x = (box.left + box.width / 2) / size.width * 2 - 1;
        const y = -(box.top + box.height * .88) / size.height * 2 + 1;
        point.set(x, y, 0).unproject(camera).sub(camera.position).normalize();
        point.multiplyScalar((10 - camera.position.z) / point.z).add(camera.position);
        floor.current.position.y = point.y + 13;
        floor.current.visible = box.bottom > 0 && box.top < size.height;
    });
    return <group ref={floor}>
        <Reflector blur={[512, 512]} mixBlur={1} mixStrength={elementRef ? .65 : .3}
            resolution={512} args={[512, 512]} rotation={[-Math.PI / 2, 0, 0]}
            mirror={1} minDepthThreshold={.1} maxDepthThreshold={3} depthScale={3}
            position={[0, -13, -170]}>
            {(Material, props) => <Material metalness={1} roughness={1} {...props} />}
        </Reflector>
        <mesh position={[0, -13.5, -170]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[512, 512]} /><meshPhysicalMaterial color={0x090f0e} />
        </mesh>
        {elementRef && <Gradient />}
    </group>;
};
