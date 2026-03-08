import styled, { keyframes } from "styled-components";
import Mockup from '../../assets/mockups.png';
import { Link } from "react-router-dom";

import CubeGreen from '../../assets/cube-logo-green.png';
import CubeGreenTop from '../../assets/cube-logo-green-top.png';
import CubeGreenRight from '../../assets/cube-logo-green-right.png';
import CubeRed from '../../assets/cube-logo-red.png';
import CubeRedTop from '../../assets/cube-logo-red-top.png';
import FieryGreen from '../../assets/fiery-cube-green.png';
import FieryRed from '../../assets/fiery-cube-red.png';

// ── Animations ────────────────────────────────────────────────────────────────

const floatUp = keyframes`
    0%   { transform: translateY(0px) rotate(-2deg); }
    50%  { transform: translateY(-6px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(-2deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

// ── Fiery Cubes - Streak  ─────────────────────────────────────────────────────────────────────

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
`;

const StreakCube = styled.img`
    width: 110px;
    height: auto;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: transform 0.2s ease;
    &:hover {
    transform: scale(1.05);
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
                            $offset={0}
                        />
                    ))}
                </TowerRow>
            ))}
        </TowerWrap>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────

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
`;

const FeatureIcon = styled.div`
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
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

export default function Landing() {
    return (
        <Page>
            <Hero>
                <HeroTitle>
                    <Highlight>Queue</Highlight> Your Habits,<br />
                    <Highlight>Cue</Highlight> Your Habits
                </HeroTitle>
                <HeroSub>
                    A simple, privacy-first habit tracker. Build better habits, curb the bad ones — your data stays yours.
                </HeroSub>
                <CubeTower />
                <HeroActions>
                    <PrimaryBtn to="/register">Get Started — It's Free</PrimaryBtn>
                    <SecondaryBtn to="/login">Log in</SecondaryBtn>
                </HeroActions>     
            </Hero>

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
                    <MockupImage src={Mockup} alt="KuHabit app mockup" />
                </Card>
            </TwoCol>

            <StreakSection>
                <CardTitle style={{ textAlign: "center" }}>
                    Build Streaks. Keep the Fire Alive.
                </CardTitle>

                <StreakGrid>
                    <StreakCard>
                        <StreakCube src={FieryGreen} alt="Positive habit streak" />
                        <StreakTitle>Positive Habit Streaks</StreakTitle>
                        <StreakText>
                            Every time you complete a good habit, your streak grows.
                            Keep the green cube burning by showing up consistently.
                        </StreakText>
                    </StreakCard>

                    <StreakCard>
                        <StreakCube src={FieryRed} alt="Negative habit streak" />
                        <StreakTitle>Breaking Bad Habits</StreakTitle>
                        <StreakText>
                            The longer you avoid a bad habit, the hotter your streak gets.
                            Keep the red cube blazing by staying disciplined.
                        </StreakText>
                    </StreakCard>
                </StreakGrid>
            </StreakSection>

            <FeaturesGrid>
                <FeatureCard>
                    <FeatureIcon>🟢</FeatureIcon>
                    <FeatureTitle>Build Habits</FeatureTitle>
                    <FeatureText>Track positive habits you want to reinforce daily or on a custom schedule.</FeatureText>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>🔴</FeatureIcon>
                    <FeatureTitle>Curb Habits</FeatureTitle>
                    <FeatureText>Mark negative habits you're working to eliminate and celebrate your wins.</FeatureText>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>📅</FeatureIcon>
                    <FeatureTitle>Flexible Recurrence</FeatureTitle>
                    <FeatureText>Set habits to repeat daily, weekdays, weekends, or any custom combination.</FeatureText>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>🔒</FeatureIcon>
                    <FeatureTitle>Private by Design</FeatureTitle>
                    <FeatureText>Your habits are personal. No tracking, no ads, no third-party data sharing.</FeatureText>
                </FeatureCard>
            </FeaturesGrid>
        </Page>
    );
}
