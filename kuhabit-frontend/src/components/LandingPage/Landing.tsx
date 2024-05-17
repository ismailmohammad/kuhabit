import styled from "styled-components";

const Page = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Slogan = styled.h1`
    text-align: center;
`;

const LandingContainer = styled.div`
    width: 50%;
    height: 50vh;
    margin: 1%;
    background: #363333;
    border-radius: 50px;
    padding: 1%;
    transition: ease-in-out filter;
    color: white;
    &:hover {
        filter: drop-shadow(0 0 2em #585858aa);
    }
`;

const LandingTextContainer = styled(LandingContainer)`
    filter: drop-shadow(0 0 2em #585858aa);
    background: #b8adad;
    display: flex;
`;

export default function Landing() {
    return (
        <><Slogan>Queue Your Habits, Cue Your Habits</Slogan>
        <Page>
            <LandingTextContainer>
                <a href="https://jamesclear.com/atomic-habits"><img src="https://jamesclear.com/wp-content/uploads/2023/05/atomic-habits-dots.png"></img></a>
                <h2>After reading Atomic Habits by James Clear, I decided to create this simple Habit Tracker app. The book highlights the profound impact of habit building to build better habits and curb bad ones. Over 40-50% of our daily actions are supposedly out of habit, so creating a tracker that will never sell your data was the goal here. You can grab the book on Amazon if it interests you.</h2>
            </LandingTextContainer>
            <LandingContainer>
            </LandingContainer>
        </Page>
        </>
    );
}