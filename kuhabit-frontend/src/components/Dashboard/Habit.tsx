import { HabitType } from '../../types/habit';
import './Habit.css';

interface HabitProps {
    habitData: HabitType,
    imgSrc: string,
    deleteHabit: (id: number) => void,
    completeDailyHabit: (id: number) => void,
}

function Habit(props: HabitProps) {

    const { habitData, deleteHabit, imgSrc, completeDailyHabit} = props;

    function deleteHabitBackend() {
        deleteHabit(habitData.id);
    }

    function markHabitComplete() {
        if (habitData.complete) return;
        completeDailyHabit(habitData.id);
    }

    return (
        <div className='habit-outer'>
            <img className={`cube-logo ${habitData.complete ? "" : "jiggle-on-hover"}`} src={imgSrc} alt='Cube logo indicating habit completeness'
                onClick={markHabitComplete}>

            </img>
            <h2 className='habit-text'>{habitData.name}</h2>
            {/* Recurrences */}
            <div className='recurring-frequency-container'>
                <h3>Recurring:</h3>
                <div className='recurring-days'>
                    {habitData.recurrence.split('-').map((day: string) => {
                        if (new Date().toLocaleDateString('en-US', {weekday: 'long'}).startsWith(day)) {
                            const markActiveDay = habitData.complete ? 'day active-day' : 'day active-day-complete'
                            return <h4 className={markActiveDay}>{day}</h4>
                        }
                        return (<h4 className='day'>{day}</h4>)
                    })}
                </div>
            </div>
            <div className='habit-edit-actions'>
                <button className='edit-habit'>Modify</button>
                <button className='remove-habit' onClick={deleteHabitBackend}>Remove</button>
            </div>
        </div>
    );
}

export default Habit;