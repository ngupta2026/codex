"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const CORE_MESSAGES = [
  "Healing is a journey, and you are moving forward.",
  "You are stronger than this moment feels.",
  "Every healthy routine counts.",
  "You are supported by your care team.",
  "Small steps today build confidence tomorrow.",
  "Your consistency is creating progress.",
  "You are doing meaningful work for your health.",
  "One good choice can shape the whole day."
] as const;

const MONTH_MOODS = [
  "Fresh-start energy.",
  "Kindness and connection.",
  "Steady momentum.",
  "Growth and patience.",
  "Celebrate small wins.",
  "Consistency in care.",
  "Balanced rest and recovery.",
  "Daily strength building.",
  "Clear focus and routine.",
  "Confident healthy habits.",
  "Gratitude and calm.",
  "Finish strong and hopeful."
] as const;

type Panel = "date" | "time" | null;

function buildMonthCells(date: Date): Array<number | null> {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  return cells;
}

export function DailyBitesDock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [openPanel, setOpenPanel] = useState<Panel>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const month = now?.getMonth() ?? 0;
  const day = now?.getDate() ?? 1;
  const messageIndex = (month * 31 + day) % CORE_MESSAGES.length;
  const dailyMessage = mounted ? `${MONTH_MOODS[month]} ${CORE_MESSAGES[messageIndex]}` : "A positive moment is loading.";

  const monthLabel = now ? now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Calendar";
  const dateLabel = now ? now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Date loading...";
  const timeLabel = now ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const monthCells = now ? buildMonthCells(now) : [];

  function togglePanel(panel: Exclude<Panel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <>
      <div className="daily-bites-spacer" aria-hidden="true" />

      <section className="daily-bites-ticker" aria-live="polite">
        <div className="daily-bites-track">
          <span>{`Daily Bites: "${dailyMessage}"`}</span>
          <span>{`Daily Bites: "${dailyMessage}"`}</span>
        </div>
      </section>

      <aside className="daily-bites-dock">
        <div className="daily-bites-chip-row">
          <button type="button" className={`daily-chip ${openPanel === "date" ? "active" : ""}`} onClick={() => togglePanel("date")}>
            {`Date: ${dateLabel}`}
          </button>
          <button type="button" className={`daily-chip ${openPanel === "time" ? "active" : ""}`} onClick={() => togglePanel("time")}>
            {`Time: ${timeLabel}`}
          </button>
        </div>

        {openPanel ? (
          <div className="daily-bites-panel">
            {openPanel === "date" ? (
              <div className="daily-panel-stack">
                <p className="daily-panel-title">{monthLabel}</p>
                <div className="daily-calendar-grid">
                  {WEEKDAYS.map((item) => (
                    <div key={item} className="daily-calendar-weekday">
                      {item}
                    </div>
                  ))}
                  {monthCells.map((value, idx) => (
                    <div key={`cell-${idx}`} className={`daily-calendar-cell ${value === day ? "today" : ""} ${value ? "" : "empty"}`}>
                      {value ?? ""}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {openPanel === "time" ? (
              <div className="daily-panel-stack">
                <p className="daily-panel-title">Current Time</p>
                <p className="daily-clock-time">{timeLabel}</p>
                <p className="daily-clock-date">{dateLabel}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  );
}
