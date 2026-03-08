import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import Mockup from '../../assets/mockups.png';
import { Link } from "react-router-dom";

import toast from "react-hot-toast";
import {
    Flame,
    Ban,
    CalendarDays,
    Shield
} from "lucide-react";

import CubeGreen from '../../assets/cube-logo-green.png';
import CubeGreenTop from '../../assets/cube-logo-green-top.png';
import CubeGreenRight from '../../assets/cube-logo-green-right.png';
import CubeRed from '../../assets/cube-logo-red.png';
import CubeRedTop from '../../assets/cube-logo-red-top.png';

// Streak Assets
import FieryGreen from '../../assets/fiery-cube-green.png';
import FieryRed from '../../assets/fiery-cube-red.png';
import GreenLogs from "../../assets/green-logs.png";
import RedLogs from "../../assets/red-logs.png";
import GloveCursor from "../../assets/glove-cursor.png";


// ── Cursor Glove  ────────────────────────────────────────────────────────────────

const cursorHintIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.92) rotate(-10deg);
  }

  20% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(-6deg);
  }

  75% {
    opacity: 1;
    transform: translateY(-2px) scale(1.02) rotate(-4deg);
  }

  100% {
    opacity: 0;
    transform: translateY(-8px) scale(0.96) rotate(-2deg);
  }
`;

const cursorNudge = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(-6deg);
  }

  50% {
    transform: translateY(-3px) rotate(-2deg);
  }
`;

const CursorHint = styled.img`
  position: absolute;
  width: 56px;
  height: auto;
  right: -40px;
  top: 78px;
  z-index: 8;
  pointer-events: none;
  user-select: none;
  opacity: 0;
  animation:
    ${cursorHintIn} 1.8s ease-out forwards,
    ${cursorNudge} 0.7s ease-in-out 0.15s 2;

  filter:
    drop-shadow(0 8px 12px rgba(0, 0, 0, 0.28))
    drop-shadow(0 0 10px rgba(255, 220, 120, 0.18));

  @media (max-width: 720px) {
    width: 48px;
    right: -4px;
    top: 62px;
  }
`;

// ── Typewriter Effect  ────────────────────────────────────────────────────────────────
const caretBlink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const rainbowShift = keyframes`
  0%   { color: #2dca8e; }
  20%  { color: #42e6a4; }
  40%  { color: #7cf29f; }
  60%  { color: #ffd166; }
  80%  { color: #ff7b72; }
  100% { color: #2dca8e; }
`;

const TypewriterWrap = styled.span`
  display: inline;
  white-space: pre-wrap;
`;

const TypeChar = styled.span<{ $index: number }>`
  display: inline-block;
  animation: ${rainbowShift} 1.8s linear infinite;
  animation-delay: ${p => p.$index * 0.035}s;
`;

const Caret = styled.span`
  display: inline-block;
  margin-left: 0.08em;
  color: #42e6a4;
  animation: ${caretBlink} 0.9s step-end infinite;
`;

const HeroTitleStaticLine = styled.span`
  display: inline;
`;

const HeroTitleBreak = styled.br``;

// ── Screen Glow ────────────────────────────────────────────────────────────────

const screenGlowPulse = keyframes`
  0% {
    opacity: 0;
  }

  18% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`;

const ScreenGlow = styled.div<{ $color: "green" | "red"; $active: boolean }>`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  opacity: 0;

  background:
    radial-gradient(circle at center,
      rgba(0, 0, 0, 0) 58%,
      ${p =>
        p.$color === "green"
            ? "rgba(45, 202, 142, 0.12) 78%, rgba(45, 202, 142, 0.22) 100%"
            : "rgba(255, 90, 60, 0.12) 78%, rgba(255, 90, 60, 0.22) 100%"});

  ${p =>
        p.$active &&
        css`
      animation: ${screenGlowPulse} 700ms ease-out forwards;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

// ── Animations ────────────────────────────────────────────────────────────────


const logDrop = keyframes`
  0% {
    transform: translate3d(-50%, -28px, 0) scale(0.97) rotate(-1deg);
    opacity: 0;
  }

  20% {
    transform: translate3d(-50%, 4px, 0) scale(1) rotate(1deg);
    opacity: 1;
  }

  65% {
    transform: translate3d(-50%, 42px, 0) scale(1) rotate(3deg);
    opacity: 1;
  }

  100% {
    transform: translate3d(-50%, 84px, 0) scale(0.82) rotate(4deg);
    opacity: 0;
  }
`;

const fireSurge = keyframes`
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.18);
  }

  70% {
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
  }
`;

const floatUp = keyframes`
    0%   { transform: translateY(0px) rotate(-2deg); }
    50%  { transform: translateY(-6px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(-2deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const flameRise = keyframes`
  0% {
    transform: translate3d(0, 0px, 0) scale(1);
  }

  25% {
    transform: translate3d(0, -2px, 0) scale(1.01);
  }

  50% {
    transform: translate3d(0, -4px, 0) scale(1.02);
  }

  75% {
    transform: translate3d(0, -2px, 0) scale(1.01);
  }

  100% {
    transform: translate3d(0, 0px, 0) scale(1);
  }
`;

const flameFlicker = keyframes`
  0% {
    opacity: 0.96;
    filter: brightness(0.98) saturate(1);
  }

  25% {
    opacity: 1;
    filter: brightness(1.04) saturate(1.03);
  }

  50% {
    opacity: 0.98;
    filter: brightness(1.08) saturate(1.06);
  }

  75% {
    opacity: 1;
    filter: brightness(1.03) saturate(1.02);
  }

  100% {
    opacity: 0.96;
    filter: brightness(0.98) saturate(1);
  }
`;

const emberFade = keyframes`
  0% {
    transform: translateX(-50%) translateY(8px) scale(0.9);
    opacity: 0;
    filter: brightness(1.2) blur(0px);
  }

  40% {
    opacity: 0.45;
    filter: brightness(1.4) blur(0.5px);
  }

  100% {
    transform: translateX(-50%) translateY(-8px) scale(1.1);
    opacity: 0;
    filter: brightness(1.8) blur(2px);
  }
`;

const emberRise1 = keyframes`
  0% {
    transform: translateX(-50%) translateY(70px) scale(0.8);
    opacity: 0;
  }

  15% {
    opacity: 1;
  }

  100% {
    transform: translateX(-85%) translateY(-40px) scale(0.3);
    opacity: 0;
  }
`;

const emberRise2 = keyframes`
  0% {
    transform: translateX(-50%) translateY(70px) scale(0.9);
    opacity: 0;
  }

  15% {
    opacity: 1;
  }

  100% {
    transform: translateX(-50%) translateY(-55px) scale(0.3);
    opacity: 0;
  }
`;

const emberRise3 = keyframes`
  0% {
    transform: translateX(-50%) translateY(70px) scale(0.85);
    opacity: 0;
  }

  15% {
    opacity: 1;
  }

  100% {
    transform: translateX(-15%) translateY(-35px) scale(0.3);
    opacity: 0;
  }
`;

const emberRise4 = keyframes`
  0% {
    transform: translateX(-50%) translateY(80px) scale(1);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    transform: translateX(-120%) translateY(-70px) scale(0.25);
    opacity: 0;
  }
`;

const emberRise5 = keyframes`
  0% {
    transform: translateX(-50%) translateY(80px) scale(1);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    transform: translateX(30%) translateY(-90px) scale(0.25);
    opacity: 0;
  }
`;
// ── Fiery Cubes - Streak  ─────────────────────────────────────────────────────────────────────

const EmberParticle = styled.span<{ $variant: 1 | 2 | 3 | 4 | 5; $color: "green" | "red" }>`
  position: absolute;
  left: 50%;
  top: 0;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  pointer-events: none;
  z-index: 3;

  background: ${p =>
        p.$color === "green"
            ? "radial-gradient(circle, rgba(200,255,230,1) 0%, rgba(45,202,142,1) 40%, rgba(45,202,142,0) 100%)"
            : "radial-gradient(circle, rgba(255,220,170,1) 0%, rgba(255,90,60,1) 40%, rgba(255,90,60,0) 100%)"};
  animation-duration: ${() => 0.7 + Math.random() * 0.3}s;
  filter:
    blur(1px)
    brightness(1.5)
    drop-shadow(0 0 12px rgba(255,140,60,0.9))
    drop-shadow(0 0 26px rgba(255,140,60,0.65))
    drop-shadow(0 0 42px rgba(255,140,60,0.4));
  animation: ${p =>
        p.$variant === 1
            ? emberRise1
            : p.$variant === 2
                ? emberRise2
                : p.$variant === 3
                    ? emberRise3
                    : p.$variant === 4
                        ? emberRise4
                        : emberRise5}
    0.8s ease-out forwards;
`;

const EmberBurst = styled.div`
  position: absolute;
  z-index: 5;
  inset: 0;
  pointer-events: none;
`;

const LogDrop = styled.img`
  position: absolute;
  width: 70px;
  left: 50%;
  top: -40px;
  z-index: 5;
  pointer-events: none;
  filter: drop-shadow(0 0 12px rgba(255,120,40,0.22));
  animation: ${logDrop} 0.95s cubic-bezier(0.22, 0.8, 0.2, 1) forwards;
  will-change: transform, opacity;
  backface-visibility: hidden;
`;

const FlameContainer = styled.div`
  position: relative;
  display: inline-block;
  transform: translateZ(0);
`;

const FireSurgeWrap = styled.div<{ $surge?: boolean }>`
  display: inline-block;
  transform-origin: 50% 85%;

  ${p =>
        p.$surge &&
        css`
      animation: ${fireSurge} 0.45s ease-out;
    `}
`;

const FlamingCube = styled.img`
  position: relative;
  z-index: 0;
  width: 110px;
  height: auto;
  margin-bottom: 1rem;
  object-fit: contain;
  transform-origin: 50% 85%;
  transition: width 0.2s ease, filter 0.2s ease;
  animation:
    ${flameRise} 1.9s ease-in-out infinite,
    ${flameFlicker} 0.75s ease-in-out infinite;
`;

const StreakSection = styled.section`
    margin-top: 1rem;
`;

const StreakGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const StreakCard = styled.div`
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;

    &:hover ${FlamingCube} {
        width: 124px;
        filter:
            brightness(1.18)
            saturate(1.18)
            drop-shadow(0 0 14px rgba(255, 120, 40, 0.28));
        animation:
            ${flameRise} 1.05s ease-in-out infinite,
            ${flameFlicker} 0.42s ease-in-out infinite;
    }
`;

const StreakTitle = styled.h3`
    color: white;
    margin: 0 0 0.5rem;
`;

const StreakText = styled.p`
    color: #aaa;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0;
`;

const SectionSub = styled.p`
    text-align: center;
    color: #aaa;
    font-size: 1rem;
    max-width: 520px;
    margin: 0 auto 2rem;
    line-height: 1.6;
`;

// ── Tower ─────────────────────────────────────────────────────────────────────

const TowerRow = styled.div`
    display: flex;
    justify-content: center;
    line-height: 0;
    margin-top: -1.0rem;
`;

const TowerWrap = styled.div`
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    margin: 0 auto 0.5rem;
    line-height: 0;
`;

const TowerCube = styled.img<{ $delay: number }>`
    width: clamp(2.5rem, 6vw, 3.5rem);
    height: clamp(2.5rem, 6vw, 3.5rem);
    object-fit: contain;
    display: block;
    animation: ${floatUp} 3s ease-in-out ${p => p.$delay}s infinite;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
`;

const TOWER_ROWS = [
    [
        { src: CubeGreen, delay: 0, offset: 0 },
        { src: CubeRed, delay: 0.5, offset: 0 },
        { src: CubeGreen, delay: 0.2, offset: 0 },
    ],
    [
        { src: CubeGreenRight, delay: 0.25, offset: 0 },
        { src: CubeRedTop, delay: 1.0, offset: 0 },
    ],
    [
        { src: CubeGreenTop, delay: 0.75, offset: 0 },
    ]
];

function CubeTower() {
    return (
        <TowerWrap>
            {TOWER_ROWS.map((row, rowIndex) => (
                <TowerRow key={rowIndex}>
                    {row.map((cube, i) => (
                        <TowerCube
                            key={i}
                            src={cube.src}
                            alt=""
                            $delay={cube.delay}
                        />
                    ))}
                </TowerRow>
            ))}
        </TowerWrap>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

const Reveal = styled.div<{ $visible: boolean }>`
  opacity: ${p => (p.$visible ? 1 : 0)};
  transform: translateY(${p => (p.$visible ? "0" : "24px")});
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`;

const SectionHeadline = styled.h2`
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 800;
    text-align: center;
    margin: 0 0 0.5rem;
    letter-spacing: -0.02em;
    text-shadow: 0 0 12px rgba(45,202,142,0.25);

    background: linear-gradient(
        90deg,
        #2dca8e,
        #42e6a4,
        #7cf29f,
        #ffd166,
        #ff7b72,
        #ffd166,
        #7cf29f,
        #42e6a4,
        #2dca8e
    );

    background-size: 300% 100%;
    animation: ${gradientShift} 10s linear infinite;

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const LazySectionWrap = styled.div<{ $visible: boolean }>`
  width: 100%;
  opacity: ${p => (p.$visible ? 1 : 0)};
  transform: translateY(${p => (p.$visible ? "0" : "24px")});
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`;

function LazySection({
    children,
    threshold = 0.15,
    rootMargin = "0px 0px -10% 0px",
    onReveal,
}: {
    children: ReactNode;
    threshold?: number;
    rootMargin?: string;
    onReveal?: () => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const hasRevealedRef = useRef(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            entries => {
                const entry = entries[0];
                if (entry?.isIntersecting && !hasRevealedRef.current) {
                    hasRevealedRef.current = true;
                    setVisible(true);
                    onReveal?.();
                    observer.unobserve(node);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [threshold, rootMargin, onReveal]);

    return (
        <LazySectionWrap ref={ref} $visible={visible}>
            {children}
        </LazySectionWrap>
    );
}

const Page = styled.div`
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 3rem;
`;

const Hero = styled.section`
    text-align: center;
    padding: 3rem 1rem 1rem;
`;

const Highlight = styled.span`
  background: linear-gradient(
    90deg,
    #2dca8e,
    #42e6a4,
    #2dca8e
  );
  background-size: 200% auto;
  animation: ${gradientShift} 4s linear infinite;
  text-shadow: 0 0 10px rgba(45,202,142,0.35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroTitle = styled.h1`
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 800;
    color: white;
    margin: 0 0 1rem;
    line-height: 1.2;
    min-height: 2.5em;
`;

const HeroSub = styled.p`
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    color: #aaa;
    max-width: 560px;
    margin: 0 auto 2rem;
    line-height: 1.6;
`;

const HeroActions = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 1.5rem;
`;

const PrimaryBtn = styled(Link)`
    background: #2dca8e;
    color: #111;
    font-weight: 700;
    padding: 0.8rem 2rem;
    border-radius: 10px;
    text-decoration: none;
    font-size: 1rem;
    transition: background 0.2s;
    &:hover { background: #25b07b; color: #111; }
`;

const SecondaryBtn = styled(Link)`
    background: #2a2a2a;
    color: white;
    border: 1px solid #444;
    font-weight: 600;
    padding: 0.8rem 2rem;
    border-radius: 10px;
    text-decoration: none;
    font-size: 1rem;
    transition: background 0.2s;
    &:hover { background: #333; color: white; }
`;

const TwoCol = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const Card = styled.div`
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
    padding: 2rem;
    transition: transform 0.2s ease;
    &:hover {
    transform: scale(1.05);
    }
`;

const MockupImage = styled.img`
    width: 100%;
    border-radius: 12px;
    display: block;
`;

const CardTitle = styled.h2`
    font-size: 1.4rem;
    color: white;
    margin: 0 0 1rem;
`;

const CardText = styled.p`
    color: #bbb;
    line-height: 1.7;
    margin: 0 0 1.5rem;
`;

const BookLink = styled.a`
    color: #2dca8e;
    font-weight: 600;
    text-decoration: none;
    &:hover { text-decoration: underline; color: #2dca8e; }
`;

const FeaturesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
`;

const FeatureCard = styled.div`
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 1.5rem;
    transition: transform 0.2s ease;
    &:hover {
    transform: scale(1.05);
    }
`;

const FeatureIcon = styled.div`
  margin-bottom: 0.75rem;

  svg {
    width: 28px;
    height: 28px;
    stroke-width: 2.2;
  }
`;

const FeatureTitle = styled.h3`
    font-size: 1rem;
    color: white;
    margin: 0 0 0.5rem;
`;

const FeatureText = styled.p`
    color: #999;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
`;

// ── Component ─────────────────────────────────────────────────────────────────

const HERO_LINE_1 = "Queue Your Habits,";
const HERO_LINE_2 = "Cue Your Habits";
const HERO_FULL_TEXT = `${HERO_LINE_1}\n${HERO_LINE_2}`;

export default function Landing() {
    const [greenLogs, setGreenLogs] = useState<{ id: number }[]>([]);
    const [redLogs, setRedLogs] = useState<{ id: number }[]>([]);
    const [greenSurge, setGreenSurge] = useState(false);
    const [redSurge, setRedSurge] = useState(false);

    const greenLogCooldownRef = useRef(false);
    const redLogCooldownRef = useRef(false);

    // FOr cursor glove
    const [showGreenHint, setShowGreenHint] = useState(false);
    const [showRedHint, setShowRedHint] = useState(false);

    // For Screen glow on logs added:
    const [greenScreenGlow, setGreenScreenGlow] = useState(false);
    const [redScreenGlow, setRedScreenGlow] = useState(false);

    function triggerScreenGlow(color: "green" | "red") {
        const setGlow = color === "green" ? setGreenScreenGlow : setRedScreenGlow;

        setGlow(false);

        requestAnimationFrame(() => {
            setGlow(true);
        });

        setTimeout(() => {
            setGlow(false);
        }, 700);
    }

    const LOG_DURATION = 900;

    function addLog(type: "green" | "red", withGlow = true) {
        const setLogs = type === "green" ? setGreenLogs : setRedLogs;
        const setSurge = type === "green" ? setGreenSurge : setRedSurge;

        const id = Date.now() + Math.random();

        setLogs(prev => {
            if (prev.length >= 2) return prev;
            return [...prev, { id }];
        });

        setSurge(true);

        if (withGlow) {
            triggerScreenGlow(type);
            toast("Momentum Stoked. Sign in or Get Started for free to make it count.", {
                id: "streak-toast",
                icon: "🔥"
            });
        }

        setTimeout(() => {
            setSurge(false);
        }, 400);

        setTimeout(() => {
            setLogs(prev => prev.filter(log => log.id !== id));
        }, LOG_DURATION);
    }

    // Typewriter

    const [typedCount, setTypedCount] = useState(0);
    const [heroSettled, setHeroSettled] = useState(false);

    const typingSpeed = 55;
    const settleDelay = 450;

    useEffect(() => {
        if (heroSettled) return;

        if (typedCount < HERO_FULL_TEXT.length) {
            const timeout = setTimeout(() => {
                setTypedCount(prev => prev + 1);
            }, typingSpeed);

            return () => clearTimeout(timeout);
        }

        const settleTimeout = setTimeout(() => {
            setHeroSettled(true);
        }, settleDelay);

        return () => clearTimeout(settleTimeout);
    }, [typedCount, heroSettled]);

    const typedHeroText = useMemo(
        () => HERO_FULL_TEXT.slice(0, typedCount),
        [typedCount]
    );

    return (
        <>
            <ScreenGlow $color="green" $active={greenScreenGlow} />
            <ScreenGlow $color="red" $active={redScreenGlow} />

            <Page>
                <Hero>
                    <HeroTitle aria-label="Queue Your Habits, Cue Your Habits">
                        {!heroSettled ? (
                            <TypewriterWrap>
                                {typedHeroText.split("").map((char, index) => {
                                    if (char === "\n") {
                                        return <HeroTitleBreak key={`br-${index}`} />;
                                    }

                                    return (
                                        <TypeChar key={`${char}-${index}`} $index={index}>
                                            {char === " " ? "\u00A0" : char}
                                        </TypeChar>
                                    );
                                })}
                                {typedCount < HERO_FULL_TEXT.length && <Caret>|</Caret>}
                            </TypewriterWrap>
                        ) : (
                            <>
                                <HeroTitleStaticLine>
                                    <Highlight>Queue</Highlight> Your Habits,
                                </HeroTitleStaticLine>
                                <HeroTitleBreak />
                                <HeroTitleStaticLine>
                                    <Highlight>Cue</Highlight> Your Habits
                                </HeroTitleStaticLine>
                            </>
                        )}
                    </HeroTitle>
                    <HeroSub>
                        A simple, privacy-first habit tracker. Build better habits, curb the bad ones — your data stays yours.
                    </HeroSub>
                    <CubeTower />
                    <HeroActions>
                        <PrimaryBtn to="/register">Get Started — It's Free</PrimaryBtn>
                        <SecondaryBtn to="/login">Sign In</SecondaryBtn>
                    </HeroActions>
                </Hero>

                <LazySection>
                    <TwoCol>
                        <Card>
                            <CardTitle>Inspired by Atomic Habits</CardTitle>
                            <CardText>
                                After reading <BookLink href="https://jamesclear.com/atomic-habits" target="_blank" rel="noopener noreferrer">Atomic Habits</BookLink> by James Clear, I built this tracker to put the book's principles into practice. Over 40–50% of daily actions are habitual — so tracking them matters.
                            </CardText>
                            <CardText>
                                No ads. No data selling. Just a clean tracker for building the life you want.
                            </CardText>
                        </Card>
                        <Card style={{ padding: "1rem" }}>
                            <MockupImage src={Mockup} alt="KuHabit app mockup" loading="lazy" />
                        </Card>
                    </TwoCol>
                </LazySection>

                <LazySection
                    onReveal={() => {
                        setTimeout(() => setShowGreenHint(true), 180);
                        setTimeout(() => addLog("green", false), 350);
                        setTimeout(() => setShowGreenHint(false), 1700);

                        setTimeout(() => setShowRedHint(true), 420);
                        setTimeout(() => addLog("red", false), 650);
                        setTimeout(() => setShowRedHint(false), 1950);
                    }}
                >
                    <StreakSection>
                        <SectionHeadline>
                            Build Streaks. Stoke Your Momentum.
                        </SectionHeadline>
                        <SectionSub>
                            Feed your streak with daily actions and watch your motivation grow.
                        </SectionSub>

                        <StreakGrid>
                            <StreakCard>
                                <FlameContainer onClick={() => addLog("green")}>
                                    {showGreenHint && <CursorHint src={GloveCursor} alt="" aria-hidden="true" />}
                                    {greenLogs.map(log => (
                                        <React.Fragment key={log.id}>
                                            <LogDrop src={GreenLogs} alt="" />
                                            <EmberBurst>
                                                <EmberParticle $variant={1} $color="green" />
                                                <EmberParticle $variant={2} $color="green" />
                                                <EmberParticle $variant={3} $color="green" />
                                                <EmberParticle $variant={4} $color="green" />
                                                <EmberParticle $variant={5} $color="green" />
                                                <EmberParticle $variant={2} $color="green" />
                                                <EmberParticle $variant={3} $color="green" />
                                            </EmberBurst>
                                        </React.Fragment>
                                    ))}
                                    <FireSurgeWrap $surge={greenSurge}>
                                        <FlamingCube src={FieryGreen} alt="" />
                                    </FireSurgeWrap>
                                </FlameContainer>
                                <StreakTitle>Positive Habit Streaks</StreakTitle>
                                <StreakText>
                                    Every time you complete a good habit, your streak grows.
                                    Keep the green cube burning by showing up consistently.
                                </StreakText>
                            </StreakCard>

                            <StreakCard>
                                <FlameContainer onClick={() => addLog("red")}>
                                    {showRedHint && <CursorHint src={GloveCursor} alt="" aria-hidden="true" />}
                                    {redLogs.map(log => (
                                        <React.Fragment key={log.id}>
                                            <LogDrop src={RedLogs} alt="" />
                                            <EmberBurst>
                                                <EmberParticle $variant={1} $color="red" />
                                                <EmberParticle $variant={2} $color="red" />
                                                <EmberParticle $variant={3} $color="red" />
                                                <EmberParticle $variant={4} $color="red" />
                                                <EmberParticle $variant={5} $color="red" />
                                                <EmberParticle $variant={2} $color="red" />
                                                <EmberParticle $variant={3} $color="red" />
                                            </EmberBurst>
                                        </React.Fragment>
                                    ))}
                                    <FireSurgeWrap $surge={redSurge}>
                                        <FlamingCube src={FieryRed} alt="" />
                                    </FireSurgeWrap>
                                </FlameContainer>
                                <StreakTitle>Breaking Bad Habits</StreakTitle>
                                <StreakText>
                                    The longer you avoid a bad habit, the hotter your streak gets.
                                    Keep the red cube blazing by staying disciplined.
                                </StreakText>
                            </StreakCard>
                        </StreakGrid>
                    </StreakSection>
                </LazySection>

                <LazySection>
                    <FeaturesGrid>
                        <FeatureCard>
                            <FeatureIcon>
                                <Flame color="#cac72d" />
                            </FeatureIcon>
                            <FeatureTitle>Build Habits</FeatureTitle>
                            <FeatureText>Track positive habits you want to reinforce daily or on a custom schedule.</FeatureText>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>
                                <Ban color="#ff6b6b" />
                            </FeatureIcon>
                            <FeatureTitle>Curb Habits</FeatureTitle>
                            <FeatureText>Mark negative habits you're working to eliminate and celebrate your wins.</FeatureText>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>
                                 <CalendarDays color="#ffffff" />
                            </FeatureIcon>
                            <FeatureTitle>Flexible Recurrence</FeatureTitle>
                            <FeatureText>Set habits to repeat daily, weekdays, weekends, or any custom combination.</FeatureText>
                        </FeatureCard>
                        <FeatureCard>
                            <FeatureIcon>
                                <Shield color="#5da8ff" />
                            </FeatureIcon>
                            <FeatureTitle>Private by Design</FeatureTitle>
                            <FeatureText>Your habits are personal. No tracking, no ads, no third-party data sharing.</FeatureText>
                        </FeatureCard>
                    </FeaturesGrid>
                </LazySection>
            </Page>
        </>
    );
}
