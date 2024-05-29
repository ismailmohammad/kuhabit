import styled from "styled-components";
import Header from "../Header";

const DashboardContainer = styled.div`
    display:flex;

    padding: 1em;
    flex-direction: column;
`;

const HabitsContainer = styled.div`
    display: flex;
    background: rgba(10, 10, 10, 0.274)    ;
    min-height: 50vh;
    border-radius: 2em;
`;

const AddHabitContainer = styled.div`
display: flex;
    justify-content: flex-end;
    width: 100%;
`;


const AddHabitButton = styled.button`
    max-width: 25%;
    margin: 1em;
    justify-self: flex-end;
    background: #d84e4eab
`;

export default function Dashboard() {
    return(
        <>
            <Header/>   
            <DashboardContainer>
                <h1>Welcome, [Username]</h1>
                <AddHabitContainer>
                    <AddHabitButton>Queue Habit</AddHabitButton>
                </AddHabitContainer>
                <HabitsContainer>
                </HabitsContainer>
            </DashboardContainer>
        </>
    );
}