import { useEffect, useMemo, useState } from "react"

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

const formatDate = (date: Date) =>
  date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

export default function Clock() {
  const [now, setNow] = useState(() => new Date())
  const timeLabel = useMemo(() => formatTime(now), [now])
  const dateLabel = useMemo(() => formatDate(now), [now])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="nt-clock" aria-label="Current time">
      <div className="nt-time">{timeLabel}</div>
      <div className="nt-date">{dateLabel}</div>
    </div>
  )
}
