import { useState } from "react";
import styled from "styled-components";
import './NewHabitModal.css'

import CurbCube from '../../assets/cube-logo-red.png';
import BuildCube from '../../assets/cube-logo-green.png';
import { HabitType } from "../../types/habit";

const HabitModal = styled.div`
    height: 75vh;
    width: 50vw;
    border-radius: 1em;
    padding: 1em;
    position: absolute;
    top: 10%;
    left: 25%;
    background-color: rgba(10, 10, 10, 0.90);
    box-shadow: black;
    transition: all ease-in-out;
    overflow: auto;
`;

const CloseModalButton = styled.button`  
    position: absolute;
    right: 1em;
    background-color: rgb(255, 80, 80);
`;

interface NewHabitModalProps {
    showModal: boolean,
    toggleModal: () => void,
    createHabit: (habit: HabitType) => void 
}

const NewHabitModal = (props: NewHabitModalProps) => {
    const [habitName, setHabitName] = useState("");
    const [positiveType, setPositiveType] = useState(false);
    const [selection, setSelection] = useState<string>('Daily');
    const [customDays, setCustomDays] = useState<{ [key: string]: boolean }>({
        Su: false,
        Mo: false,
        Tu: false,
        We: false,
        Th: false,
        Fr: false,
        Sa: false,
    });

    const togglePositiveType = () => {
        setPositiveType((prevType) => {
            return!prevType
        })
    }

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelection(event.target.value);
      };
    
      const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomDays({
          ...customDays,
          [event.target.name]: event.target.checked,
        });
      };

      const dayLabels: { [key: string]: string } = {
        Su: 'Sunday',
        Mo: 'Monday',
        Tu: 'Tuesday',
        We: 'Wednesday',
        Th: 'Thursday',
        Fr: 'Friday',
        Sa: 'Saturday',
      };

      const generateRecurrenceString = () => {
        return Object.keys(customDays)
          .filter((day) => customDays[day])
          .join('-');
      };

      const addHabit = (e: React.FormEvent) => {
        e.preventDefault();
        let recurrence = "Su-Mo-Tu-We-Th-Fr-Sa";
        if (selection === "Weekdays") {
            recurrence = "Mo-Tu-We-Th-Fr";
        } else if (selection === "Weekends") {
            recurrence = "Su-Sa";
        } else if (selection === "Custom") {
            recurrence = generateRecurrenceString();

        }
        const newHabit: HabitType = {
            id: 0,
            name: habitName,
            complete: false,
            positiveType: positiveType,
            recurrence: recurrence
        }
        props.createHabit(newHabit);
        console.log("clicked");
        setHabitName("");
        props.toggleModal();
      }

    

    return props.showModal ? (
        <HabitModal>
            <CloseModalButton onClick={props.toggleModal}>Close</CloseModalButton>
            <form onSubmit={addHabit}>
            <h1>Add a new habit</h1>
            <h2>Habit Name</h2>
            <input
                className="habit-name"
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                required
            />
            <h2>Is this a habit you're trying to curb or build?</h2>
            <div className="curb-build-switch-container">
                <img className="cube-toggle-logo" src={CurbCube}></img>
                <h4>Curb</h4>
                <label className="switch">
                    <input type="checkbox" 
                        checked={positiveType}
                        onChange={() => {togglePositiveType()}}
                    />
                    <span className="slider round"></span>
                </label>
                <h4>Build</h4>
                <img src={BuildCube} className="cube-toggle-logo"></img>
            </div>
            <h2>Recurrence</h2>
                <label className="select-schedule">
                    Select Schedule:
                </label>
                <select className="select-schedule-options" value={selection} onChange={handleSelectChange}>
                        <option value="Daily">Daily</option>
                        <option value="Weekdays">Weekdays</option>
                        <option value="Weekends">Weekends</option>
                        <option value="Custom">Custom</option>
                    </select>
                {selection === 'Custom' && (
                    <div>
                        <h3>Select Days:</h3>
                        {Object.keys(dayLabels).map((day) => (
                            <div className="days-selected">
                                <label key={day}>
                                    {dayLabels[day]}
                                </label>
                                <input
                                    type="checkbox"
                                    name={day}
                                    key={day}
                                    checked={customDays[day]}
                                    onChange={handleCheckboxChange}
                                />
                            </div>
                        ))}
                    </div>
                )}
                <button className="create-habit-button" type="submit">Queue Habit</button>
            </form>
        </HabitModal>
    ) : null;
}

export default NewHabitModal;