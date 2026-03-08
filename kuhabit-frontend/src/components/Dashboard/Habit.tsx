import { HabitType } from '../../types/habit';
import './Habit.css';

interface HabitProps {
    habitData: HabitType;
    imgSrc: string;
    onToggleComplete: (habit: HabitType) => void;
    onDelete: (id: number) => void;
    onEdit: (habit: HabitType) => void;
}

const DAY_FULL: Record<string, string> = {
    Su: 'Sun', Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat',
};

function Habit({ habitData, imgSrc, onToggleComplete, onDelete, onEdit }: HabitProps) {
    // Sunday → Su, Monday → Mo, etc.
    const todayKey = (() => {
        const d = new Date().getDay(); // 0=Sun
        const keys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return keys[d];
    })();

    const days = habitData.recurrence.split('-');

    return (
        <div className={`habit-card ${habitData.complete ? 'habit-card--complete' : ''}`}>
            <button
                className={`habit-cube-btn ${habitData.complete ? '' : 'jiggle-on-hover'}`}
                onClick={() => onToggleComplete(habitData)}
                title={habitData.complete ? 'Mark incomplete' : 'Mark complete'}
                aria-label={habitData.complete ? 'Mark incomplete' : 'Mark complete'}
            >
                <img className="cube-logo" src={imgSrc} alt="" />
            </button>

            <div className="habit-body">
                <p className="habit-name">{habitData.name}</p>
                <div className="habit-days">
                    {days.map(day => (
                        <span
                            key={day}
                            className={`day-chip ${day === todayKey ? (habitData.complete ? 'day-chip--today-done' : 'day-chip--today') : ''}`}
                            title={DAY_FULL[day] ?? day}
                        >
                            {day}
                        </span>
                    ))}
                </div>
            </div>

            <div className="habit-actions">
                <button className="btn-edit" onClick={() => onEdit(habitData)}>Edit</button>
                <button className="btn-remove" onClick={() => onDelete(habitData.id)}>Remove</button>
            </div>
        </div>
    );
}

export default Habit;
