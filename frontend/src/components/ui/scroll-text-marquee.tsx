"use client";

import React, { useRef, useEffect, useState } from "react";
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useVelocity,
    useAnimationFrame,
} from "framer-motion";
import { wrap } from "@popmotion/popcorn";

interface ScrollBaseAnimationProps {
    children: string;
    baseVelocity?: number;
    clasname?: string;
    delay?: number;
    scrollDependent?: boolean;
}

export default function ScrollBaseAnimation({
    children,
    baseVelocity = 3,
    clasname = "",
    delay = 0,
    scrollDependent = false,
}: ScrollBaseAnimationProps) {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400,
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
        clamp: false,
    });

    const [repetitions, setRepetitions] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const calculateRepetitions = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const textWidth = textRef.current.offsetWidth;
                const needed = Math.ceil(containerWidth / textWidth) + 2;
                setRepetitions(needed);
            }
        };

        calculateRepetitions();
        window.addEventListener("resize", calculateRepetitions);
        return () => window.removeEventListener("resize", calculateRepetitions);
    }, [children]);

    const x = useTransform(baseX, (v) => `${wrap(-100 / repetitions, 0, v)}%`);

    const directionFactor = useRef<number>(1);
    useAnimationFrame((t, delta) => {
        if (delay && t < delay) return;

        let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

        if (scrollDependent && velocityFactor.get() < 0) {
            directionFactor.current = -1;
        } else if (scrollDependent && velocityFactor.get() > 0) {
            directionFactor.current = 1;
        }

        moveBy += directionFactor.current * moveBy * velocityFactor.get();

        baseX.set(baseX.get() + moveBy);
    });

    return (
        <div
            ref={containerRef}
            className="overflow-hidden whitespace-nowrap flex flex-nowrap"
        >
            <motion.div className="flex flex-nowrap gap-8" style={{ x }}>
                {Array.from({ length: repetitions }).map((_, i) => (
                    <span
                        key={i}
                        ref={i === 0 ? textRef : null}
                        className={`block ${clasname}`}
                    >
                        {children}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
