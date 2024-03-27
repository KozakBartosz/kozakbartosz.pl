import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';

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

    useEffect(() => {
        let lastPos1 = { x: 0, y: 0 };
        let lastPos2 = { x: 0, y: 0 };
        let pos = { x: 0, y: 0 };
        let fade = 0;

        let lastAngle = 0;

        const handleMouseMove = (mouseEvent: MouseEvent) => {
            // standard
            Move(mouseEvent.pageX, mouseEvent.pageY);
        };
        const Move = (x = 0, y = 0) => {
            pos = {
                x: x - window.scrollX,
                y: y - window.scrollY
            };

            let lastPos = {
                x: (lastPos1.x + lastPos2.x) / 2,
                y: (lastPos1.y + lastPos2.y) / 2
            };
            // let lastPos = lastPos1;

            // requestAnimationFrame(animate);
            let dis = getDis(pos, lastPos);

            let angle = getAngle(pos, lastPos) + 360 * 10;
            if (angle) {
                lastAngle = angle;
            }
            if (CursorWrapperRef.current && CursorInnerRef.current) {
                if (dis > 5) {
                    CursorWrapperRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(${lastAngle}deg)`;
                    CursorInnerRef.current.style.width = `${50 + dis * 1.1}px`;
                } else {
                    CursorWrapperRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) rotate(45deg)`;
                    CursorInnerRef.current.style.width = `${50}px`;
                }
            }
            lastPos2 = lastPos1;
            lastPos1 = pos;
        };

        document.body.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
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
    width: 50px;
    height: 50px;
    pointer-events: none;
    margin: -22px 0 0 -22px;
    z-index: 99999999;
`;

const CursorInner = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid#00d3d1;

    background: linear-gradient(
        90deg,
        rgba(0, 163, 255, 0.7),
        rgba(0, 163, 255, 0.2),
        rgba(0, 255, 163, 0.2),
        rgba(0, 255, 163, 0.5)
    );
    border-radius: 25px;
    box-shadow: 0 0 20px -2px rgba(0, 163, 255, 1),
        0 0 10px -2px rgba(0, 163, 255, 1) inset;
    box-sizing: border-box;
    transition: transform 1.3s cubic-bezier(0.17, 1.58, 0.6, 1.01),
        backdrop-filter 1.3s cubic-bezier(0.17, 1.58, 0.6, 1.01);
    transform: scale(0);
    opacity: 0;
    backdrop-filter: sepia(1) saturate(15) hue-rotate(280deg);

    body:hover & {
        transform: scale(1);
        opacity: 1;
    }
    body:has(a:hover) :is(&) {
        transform: scale(3) !important;
        backdrop-filter: invert(1) !important;
    }
    body:active &,
    body:has(a:active) :is(&) {
        transform: scale(3);
        backdrop-filter: invert(1) sepia(1) saturate(5) hue-rotate(280deg);
        opacity: 1;
    }
`;