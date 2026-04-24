import { SectionCard } from "@/components/SectionCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DAILY_MESSAGES = [
  "Small progress is still progress.",
  "You are building strength one step at a time.",
  "Your effort today creates a calmer tomorrow.",
  "You are supported and never alone in care.",
  "Consistency beats intensity in recovery.",
  "Each healthy choice matters.",
  "You are doing better than you think."
] as const;

const MONTHLY_THEMES = [
  { month: "January", message: "Fresh start, steady habits." },
  { month: "February", message: "Care grows with connection." },
  { month: "March", message: "Momentum builds through routine." },
  { month: "April", message: "Recovery blooms with patience." },
  { month: "May", message: "Celebrate every small win." },
  { month: "June", message: "Stay consistent and stay kind to yourself." },
  { month: "July", message: "Rest well, recover well." },
  { month: "August", message: "Strength comes from daily follow-through." },
  { month: "September", message: "Refocus with calm and clarity." },
  { month: "October", message: "Healthy routines create confidence." },
  { month: "November", message: "Gratitude supports healing." },
  { month: "December", message: "Finish strong with steady care." }
] as const;

type CalendarCell =
  | { type: "empty"; key: string }
  | { type: "day"; key: string; day: number; message: string; isToday: boolean };

function buildCalendar(date: Date): { monthLabel: string; cells: CalendarCell[] } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ type: "empty", key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      message: DAILY_MESSAGES[(day - 1) % DAILY_MESSAGES.length],
      isToday: isCurrentMonth && today.getDate() === day
    });
  }

  return { monthLabel, cells };
}

export function DailyBites() {
  const { monthLabel, cells } = buildCalendar(new Date());
  const activeMonth = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="positivity-layout">
      <SectionCard title={`Daily Bites: ${monthLabel}`} accent="success">
        <div className="calendar-grid">
          {WEEKDAYS.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
          {cells.map((cell) =>
            cell.type === "empty" ? (
              <div key={cell.key} className="calendar-day calendar-day-empty" aria-hidden="true" />
            ) : (
              <div key={cell.key} className={`calendar-day ${cell.isToday ? "today" : ""}`}>
                <div className="calendar-day-num">{cell.day}</div>
                <p className="calendar-day-msg">{cell.message}</p>
              </div>
            )
          )}
        </div>
      </SectionCard>

      <SectionCard title="Daily Bites: Month-wise themes" accent="neutral">
        <ul className="list month-theme-list">
          {MONTHLY_THEMES.map((item) => (
            <li key={item.month} className={item.month === activeMonth ? "month-theme-active" : ""}>
              <span className="month-theme-title">{item.month}</span>
              <span className="month-theme-msg">{item.message}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
