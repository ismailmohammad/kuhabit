import styled from "styled-components";
import Header from "../Header";
import Habit from "./Habit";
import { HabitType } from "../../types/habit";
/**
 * Habit Curbing Logo Images
 */
import CubeRed from '../../assets/cube-logo-red.png';
import CubeRedTop from '../../assets/cube-logo-red-top.png';
import CubeRedRight from '../../assets/cube-logo-red-right.png';
import CubeRedLeft from '../../assets/cube-logo-red-left.png';

/**
 * Positive Habit Logo Images
 */
import CubeGreen from '../../assets/cube-logo-green.png';
import CubeGreenTop from '../../assets/cube-logo-green-top.png';
import CubeGreenRight from '../../assets/cube-logo-green-right.png';
import CubeGreenLeft from '../../assets/cube-logo-green-left.png';
import { useState } from "react";
import NewHabitModal from "./NewHabitModal";
import toast from "react-hot-toast";

const negativeHabitLogos = [CubeRedTop, CubeRedRight, CubeRedLeft];
const positiveHabitLogos = [CubeGreenLeft, CubeGreenRight, CubeGreenTop];

function getRandomCubeLogo(positive: boolean): string {
    const images: string[] = positive ? positiveHabitLogos : negativeHabitLogos;
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}

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
    flex-direction: column;
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
    background: #5ec48cab;
`;







export default function Dashboard() {

    const [mockHabits, setMockHabits] = useState({
        1: {
            id: 1,
            name: "Read a chapter from book",
            complete: false,
            recurrence: "Su-Mo-Tu-We-Th-Fr-Sa",
            positiveType: true
        },
        2: {
            id: 2,
            name: "Don't use phone more than an hour",
            complete: false,
            recurrence: "Mo-Tu-We-Th-Fr",
            positiveType: false
        },
        3: {
            id: 3,
            name: "Don't eat any sugary snacks.",
            complete: true,
            recurrence: "Su-Mo-Tu-We-Th-Fr-Sa",
            positiveType: false
        },
        4: {
            id: 4,
            name: "Have 20 grams of protein",
            complete: true,
            recurrence: "Su-Mo-Tu-We-Th-Fr-Sa",
            positiveType: true
        }
    });

    const deleteHabit = (id: number) => {
        const update: boolean = confirm("Confirm deletion of habit?");
        if (!update) return;
    
        const { [id]: deletedHabit, ...rest } = mockHabits;
        setMockHabits(rest);
    };

    const completeDailyHabit = (id: number) => {
        const update: boolean = confirm("Mark habit as complete for today?");
        if (!update) return;
    
        setMockHabits((prevHabits) => {
            const updatedHabits: any = { ...prevHabits };
            if (updatedHabits[id]) {
                updatedHabits[id].complete = true;
            }
            toast.success(`Marked '${updatedHabits[id].name}' as complete`)
            return updatedHabits;
        })
    };

    function formatDate(date: Date) {
        return date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
    }
    
    const date = formatDate(new Date());
    
    // New Habit Modal
    const [showModal, setShowModal] = useState(false);
    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const generateUniqueId = (): number => {
        let newId = Math.floor(Math.random() * 10000);
        while (mockHabits[newId]) {
          newId = Math.floor(Math.random() * 10000);
        }
        return newId;
      };

    const createHabit = (habit: HabitType) => {
        const newHabit: HabitType = {
            id: generateUniqueId(),
            complete: false,
            name: habit.name,
            recurrence: habit.recurrence,
            positiveType: habit.positiveType
        }
        setMockHabits((prevHabits) => {
            return { ...prevHabits, [newHabit.id]: newHabit };
        });
    }

    return(
        <>
            <Header staticHeader={true}/>   
            <DashboardContainer>
                <h1 style={{ color: "black"}}>Welcome [PlaceholderUsername],<br/><span>{date}</span></h1>
                <AddHabitContainer>
                    <AddHabitButton onClick={toggleModal}>Queue New Habit</AddHabitButton>
                </AddHabitContainer>
                <HabitsContainer>
                    {Object.values(mockHabits).map((habit: HabitType) => {
                        // Determine logo type (if habit is complete display filled in cube otherwise, grab a random logo)
                        let imgSrc = getRandomCubeLogo(habit.positiveType);
                        if (habit.complete) {
                            imgSrc = habit.positiveType ? CubeGreen : CubeRed;
                        }
                        return <Habit key={habit.id} habitData={habit} imgSrc={imgSrc} deleteHabit={deleteHabit} completeDailyHabit={completeDailyHabit}></Habit>
                    })}
                </HabitsContainer>
            </DashboardContainer>
            <NewHabitModal showModal={showModal} toggleModal={toggleModal} createHabit={createHabit}></NewHabitModal>
        </>
    );
}
