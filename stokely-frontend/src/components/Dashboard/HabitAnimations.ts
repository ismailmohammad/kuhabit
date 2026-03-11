import styled, { css, keyframes } from 'styled-components';

export const screenGlowPulse = keyframes`
  0%   { opacity: 0; }
  18%  { opacity: 1; }
  100% { opacity: 0; }
`;

export const fireSurge = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.18); }
  70%  { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

export const flameRise = keyframes`
  0%   { transform: translate3d(0, 0px, 0) scale(1); }
  25%  { transform: translate3d(0, -2px, 0) scale(1.01); }
  50%  { transform: translate3d(0, -4px, 0) scale(1.02); }
  75%  { transform: translate3d(0, -2px, 0) scale(1.01); }
  100% { transform: translate3d(0, 0px, 0) scale(1); }
`;

export const flameFlicker = keyframes`
  0%   { opacity: 0.96; filter: brightness(0.98) saturate(1); }
  25%  { opacity: 1;    filter: brightness(1.04) saturate(1.03); }
  50%  { opacity: 0.98; filter: brightness(1.08) saturate(1.06); }
  75%  { opacity: 1;    filter: brightness(1.03) saturate(1.02); }
  100% { opacity: 0.96; filter: brightness(0.98) saturate(1); }
`;

const emberRise1 = keyframes`
  0%   { transform: translateX(-50%) translateY(70px) scale(0.8); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translateX(-85%) translateY(-40px) scale(0.3); opacity: 0; }
`;
const emberRise2 = keyframes`
  0%   { transform: translateX(-50%) translateY(70px) scale(0.9); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translateX(-50%) translateY(-55px) scale(0.3); opacity: 0; }
`;
const emberRise3 = keyframes`
  0%   { transform: translateX(-50%) translateY(70px) scale(0.85); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translateX(-15%) translateY(-35px) scale(0.3); opacity: 0; }
`;
const emberRise4 = keyframes`
  0%   { transform: translateX(-50%) translateY(80px) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateX(-120%) translateY(-70px) scale(0.25); opacity: 0; }
`;
const emberRise5 = keyframes`
  0%   { transform: translateX(-50%) translateY(80px) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateX(30%) translateY(-90px) scale(0.25); opacity: 0; }
`;

export const ScreenGlow = styled.div<{ $color: 'green' | 'red'; $active: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  pointer-events: none;
  z-index: 999;
  opacity: 0;
  will-change: opacity;
  background: radial-gradient(circle at center,
    rgba(0,0,0,0) 58%,
    ${p => p.$color === 'green'
      ? 'rgba(45,202,142,0.12) 78%, rgba(45,202,142,0.22) 100%'
      : 'rgba(255,90,60,0.12) 78%, rgba(255,90,60,0.22) 100%'});
  ${p => p.$active && css`animation: ${screenGlowPulse} 700ms ease-out forwards;`}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: opacity 120ms linear;
    opacity: ${p => (p.$active ? 0.6 : 0)};
  }
`;

export const EmberBurst = styled.div`
  position: absolute;
  z-index: 5;
  inset: 0;
  pointer-events: none;
`;

export const EmberParticle = styled.span<{ $variant: 1 | 2 | 3 | 4 | 5; $color: 'green' | 'red' }>`
  position: absolute;
  left: 50%;
  top: 0;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  pointer-events: none;
  z-index: 3;
  background: ${p => p.$color === 'green'
    ? 'radial-gradient(circle, rgba(200,255,230,1) 0%, rgba(45,202,142,1) 40%, rgba(45,202,142,0) 100%)'
    : 'radial-gradient(circle, rgba(255,220,170,1) 0%, rgba(255,90,60,1) 40%, rgba(255,90,60,0) 100%)'};
  filter: blur(1px) brightness(1.5)
    drop-shadow(0 0 12px rgba(255,140,60,0.9))
    drop-shadow(0 0 26px rgba(255,140,60,0.65))
    drop-shadow(0 0 42px rgba(255,140,60,0.4));
  animation: ${p =>
    p.$variant === 1 ? emberRise1 :
    p.$variant === 2 ? emberRise2 :
    p.$variant === 3 ? emberRise3 :
    p.$variant === 4 ? emberRise4 : emberRise5}
    0.8s ease-out forwards;
`;

export const FireSurgeWrap = styled.div<{ $surge?: boolean }>`
  display: inline-block;
  transform-origin: 50% 85%;
  ${p => p.$surge && css`animation: ${fireSurge} 0.45s ease-out;`}
`;

export const FlameWrap = styled.div`
  position: relative;
  display: inline-block;
  transform: translateZ(0);
`;
