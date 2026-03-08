import { useState } from 'react';
import styled from 'styled-components';
import { AchievementType } from '../../types/habit';
import { EmberBurst, EmberParticle } from './HabitAnimations';

const Wrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
`;

const Intro = styled.p`
    margin: 0;
    color: #888;
    font-size: 0.88rem;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.9rem;
`;

const BadgeCard = styled.div<{ $unlocked: boolean }>`
    position: relative;
    background: #1a1a1a;
    border: 1px solid ${p => p.$unlocked ? '#2dca8e55' : '#2a2a2a'};
    border-radius: 12px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    cursor: pointer;
`;

const BadgeVisualWrap = styled.div`
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
`;

const BadgeImg = styled.img<{ $unlocked: boolean }>`
    width: 100%;
    max-width: 132px;
    height: auto;
    object-fit: contain;
    filter: ${p => p.$unlocked ? 'none' : 'grayscale(1) brightness(0.72)'};
    transition: transform 0.18s ease;

    ${BadgeCard}:hover & {
        transform: ${p => p.$unlocked ? 'scale(1.05)' : 'scale(1)'};
    }
`;

const BadgeEmberBurst = styled(EmberBurst)``;

const BadgeTitle = styled.p`
    margin: 0;
    color: #f1f1f1;
    font-size: 0.85rem;
    font-weight: 700;
    text-align: center;
`;

const BadgeState = styled.p<{ $unlocked: boolean }>`
    margin: 0;
    color: ${p => p.$unlocked ? '#67daa9' : '#777'};
    font-size: 0.74rem;
    font-weight: 600;
`;

const Tooltip = styled.div`
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 20, 0.9);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 10px;
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.35;
    text-align: center;
    padding: 0.35rem 0.48rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease;
    z-index: 12;

    ${BadgeCard}:hover & {
        opacity: 1;
    }
`;

type AchievementsViewProps = {
    achievements: AchievementType[];
    getBadgeSrc: (key: string) => string;
};

export default function AchievementsView({ achievements, getBadgeSrc }: AchievementsViewProps) {
    const [activeBurstKey, setActiveBurstKey] = useState<string | null>(null);
    const [burstNonce, setBurstNonce] = useState(0);

    return (
        <Wrap>
            <Intro>Milestones are cumulative across all your habits.</Intro>
            <Grid>
                {achievements.map(achievement => (
                    <BadgeCard
                        key={achievement.key}
                        $unlocked={achievement.unlocked}
                        onMouseEnter={() => {
                            if (!achievement.unlocked) return;
                            setBurstNonce(n => n + 1);
                            setActiveBurstKey(achievement.key);
                        }}
                        onClick={() => {
                            if (!achievement.unlocked) return;
                            setBurstNonce(n => n + 1);
                            setActiveBurstKey(achievement.key);
                        }}
                    >
                        <Tooltip>
                            {achievement.unlocked
                                ? `Congratulations! You unlocked ${achievement.title}.`
                                : achievement.description}
                        </Tooltip>
                        <BadgeVisualWrap>
                            <BadgeImg
                                src={getBadgeSrc(achievement.key)}
                                alt={achievement.title}
                                $unlocked={achievement.unlocked}
                            />
                            {achievement.unlocked && activeBurstKey === achievement.key && (
                                <BadgeEmberBurst key={`${achievement.key}-${burstNonce}`}>
                                    {([1, 2, 3, 4, 5] as const).map(v => (
                                        <EmberParticle key={v} $variant={v} $color="red" />
                                    ))}
                                </BadgeEmberBurst>
                            )}
                        </BadgeVisualWrap>
                        <BadgeTitle>{achievement.title}</BadgeTitle>
                        <BadgeState $unlocked={achievement.unlocked}>
                            {achievement.unlocked ? 'Unlocked' : 'Locked'}
                        </BadgeState>
                    </BadgeCard>
                ))}
            </Grid>
        </Wrap>
    );
}
