import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const cursorSize = 120;

interface Point {
    x: number;
    y: number;
}

const getDis = (p1: Point, p2: Point) => {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
};

const getAngle = (p1: Point, p2: Point) => {
    const dy = p2.y - p1.y;
    const dx = p2.x - p1.x;
    let theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta;
};

export const Cursor = () => {
    const CursorWrapperRef = useRef<HTMLDivElement>(null);
    const CursorInnerRef = useRef<HTMLDivElement>(null);
    const stepsBack = 4;
    let pos = { x: 0, y: 0 };
    let lastPos: { x: number; y: number }[] = Array.from(
        { length: stepsBack },
        () => ({ x: 0, y: 0 })
    );
    let lastAngle = 0;
    let isAnimating = false;

    const animate = () => {
        if (!isAnimating) return;
        requestAnimationFrame(animate);
        let dis = getDis(pos, lastPos[stepsBack - 1]);
        let angle = getAngle(pos, lastPos[stepsBack - 1]) + 360 * 10;
        if (angle && dis > 5) {
            lastAngle = angle;
        }
        if (CursorWrapperRef.current && CursorInnerRef.current) {
            if (dis > 5) {
                CursorInnerRef.current.style.width = `${
                    cursorSize - 5 + dis * 1.05
                }px`;
            } else {
                CursorInnerRef.current.style.width = `${cursorSize}px`;
            }
            CursorWrapperRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${lastAngle}deg)`;
        }
        lastPos.pop();
        lastPos.unshift(pos);
    };

    const handleMouseMove = (mouseEvent: MouseEvent) => {
        pos = {
            x: mouseEvent.pageX - window.scrollX,
            y: mouseEvent.pageY - window.scrollY
        };
        if (!isAnimating) {
            isAnimating = true;
            animate();
        }
    };
    const handleTouchstart = () => {
        if (CursorInnerRef.current) {
            CursorInnerRef.current.style.opacity = '0';
            CursorInnerRef.current.style.width = `${cursorSize}px`;
        }
    };

    useEffect(() => {
        document.body.addEventListener('mousemove', handleMouseMove);
        document.body.addEventListener('touchstart', handleTouchstart);
        return () => {
            [
                document.body.removeEventListener('mousemove', handleMouseMove),
                document.body.removeEventListener(
                    'touchstart',
                    handleTouchstart
                )
            ];
        };
    }, []);

    return (
        <CursorWrapper ref={CursorWrapperRef}>
            <CursorInner
                ref={CursorInnerRef}
                className="cursor-inner"

                // style={{ width: `${30 + getDis(pos, lastPos) * 1.2}px` }}
            />
        </CursorWrapper>
    );
};

const CursorWrapper = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    width: ${cursorSize}px;
    height: ${cursorSize}px;
    pointer-events: none;
    margin: ${cursorSize / -2 + 3}px 0 0 ${cursorSize / -2 + 3}px;
    z-index: 99999999;
`;

const CursorInner = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid#00d3d1;

    background: linear-gradient(
        90deg,
        rgba(0, 163, 255, 0.4),
        rgba(0, 163, 255, 0.2),
        rgba(0, 255, 163, 0.2),
        rgba(0, 255, 163, 0.3)
    );
    border-radius: ${cursorSize - 2}px;
    box-shadow: 0 0 20px -2px rgba(0, 163, 255, 1),
        0 0 10px -2px rgba(0, 163, 255, 1) inset;
    box-sizing: border-box;
    transition: transform 1.3s cubic-bezier(0.17, 1.58, 0.6, 1.01),
        opacity 1.3s cubic-bezier(0.17, 1.58, 0.6, 1.01);
    /* opacity 1s ease; */
    transform: scale(0);
    opacity: 0;
    backdrop-filter: sepia(1) saturate(15) hue-rotate(280deg);

    body:hover & {
        transform: scale(0.75);
        opacity: 0.6;
    }
    body:has(#Hero:hover) :is(&) {
        transform: scale(1);
        opacity: 1;
    }
    body:has(a:hover) :is(&) {
        transform: scale(1.5) !important;
        backdrop-filter: invert(1);
        opacity: 1;
    }
    body:active & {
        transform: scale(0.85) !important;
        backdrop-filter: invert(1) sepia(1) saturate(5) hue-rotate(280deg);
        opacity: 1;
        animation: 10s GravityActive infinite
            cubic-bezier(0.17, 1.58, 0.6, 1.01);
        transition: transform 0.3s cubic-bezier(0.17, 1.58, 0.6, 1.01),
            opacity 0.3s cubic-bezier(0.17, 1.58, 0.6, 1.01);
        opacity: 1;
    }
    body:has(a:active) :is(&) {
        transform: scale(0.35) !important;
        backdrop-filter: invert(1) sepia(1) saturate(5) hue-rotate(280deg);
        opacity: 1;
        animation: 10s GravityActive infinite
            cubic-bezier(0.17, 1.58, 0.6, 1.01);
        transition: transform 0.3s cubic-bezier(0.17, 1.58, 0.6, 1.01),
            opacity 0.3s cubic-bezier(0.17, 1.58, 0.6, 1.01);
        opacity: 1;
    }
`;
