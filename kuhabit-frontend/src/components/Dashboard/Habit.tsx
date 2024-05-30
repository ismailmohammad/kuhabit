import './Habit.css';

function Habit({ habitData, imgSrc, deleteHabit, completeDailyHabit }) {

    function deleteHabitBackend() {
        deleteHabit(habitData.id);
    }

    function markHabitComplete() {
        if (habitData.complete) return;
        completeDailyHabit(habitData.id);
    }

    return (
        <div className='habit-outer'>
            <img className={`cube-logo ${habitData.complete ? "" : "jiggle-on-hover"}`} src={imgSrc} alt='White cube logo with 3 faces, the top being red'
                onClick={markHabitComplete}>

            </img>
            <h2 className='habit-text'>{habitData.name}</h2>
            {/* Recurrences */}
            <div className='recurring-frequency-container'>
                <h3>Recurring:</h3>
                {/* {habitData.recurring.map(string => {
                    console.log(string);
                })} */}
                <div className='recurring-days'>
                    {habitData.recurrence.split('-').map((day: string) => {
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