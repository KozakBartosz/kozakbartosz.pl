import { useEffect, useRef, VideoHTMLAttributes } from 'react';

// Start only while the clip is being viewed; never keep offscreen clips running.
export function ViewportVideo(props: Omit<VideoHTMLAttributes<HTMLVideoElement>, 'controls' | 'autoPlay'>) {
    const video = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const player = video.current;
        if (!player) return;
        let inView = false;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => {
            if (inView && document.visibilityState === 'visible' && !motion.matches) {
                player.play().catch(() => undefined);
            } else player.pause();
        };
        const observer = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting && entry.intersectionRatio >= .45;
            update();
        }, { threshold: [0, .45] });
        observer.observe(player);
        document.addEventListener('visibilitychange', update);
        motion.addEventListener('change', update);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', update);
            motion.removeEventListener('change', update);
            player.pause();
        };
    }, [props.src]);
    return <video {...props} ref={video} data-viewport-video controls={false} muted loop playsInline preload="metadata" />;
}
