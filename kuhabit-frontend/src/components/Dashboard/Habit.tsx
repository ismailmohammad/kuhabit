import './Habit.css';

function Habit({ habitData, imgSrc }) {
    return(
        <div className='habit-outer'>
            <img className='cube-logo' src={imgSrc} alt='White cube logo with 3 faces, the top being red'></img>
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
                <button className='remove-habit'>Remove</button>
            </div>
        </div>        
    );
}

export default Habit;