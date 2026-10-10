import React, { useEffect, useRef, useState } from "react";

export function NepalAnalogClock() {
  const hourHandRef = useRef(null);
  const minuteHandRef = useRef(null);
  const secondHandRef = useRef(null);
  const digitalTimeRef = useRef(null);

  const [digitalTime, setDigitalTime] = useState(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kathmandu",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date());
    } catch {
      return "";
    }
  });

  useEffect(() => {
    let animId;
    let lastSecond = -1;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kathmandu",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const updateClock = () => {
      const nowMs = Date.now();
      // Nepal Standard Time (UTC + 05:45 = 20,700,000 ms)
      const nepalDate = new Date(nowMs + 20700000);

      const hours = nepalDate.getUTCHours();
      const minutes = nepalDate.getUTCMinutes();
      const seconds = nepalDate.getUTCSeconds();
      const millis = nepalDate.getUTCMilliseconds();

      // Continuous smooth calculations:
      // Second hand: 360° / 60s = 6° per second
      const secWithMs = seconds + millis / 1000;
      const secondDeg = secWithMs * 6;

      // Minute hand: 360° / 60m = 6° per minute
      const minWithSec = minutes + secWithMs / 60;
      const minuteDeg = minWithSec * 6;

      // Hour hand: 360° / 12h = 30° per hour
      const hourWithMin = (hours % 12) + minWithSec / 60;
      const hourDeg = hourWithMin * 30;

      // Hardware-accelerated continuous clockwise rotation using refs
      if (secondHandRef.current) {
        secondHandRef.current.style.transform = `rotate(${secondDeg}deg)`;
      }
      if (minuteHandRef.current) {
        minuteHandRef.current.style.transform = `rotate(${minuteDeg}deg)`;
      }
      if (hourHandRef.current) {
        hourHandRef.current.style.transform = `rotate(${hourDeg}deg)`;
      }

      // Synchronize digital time text every second
      if (seconds !== lastSecond) {
        lastSecond = seconds;
        const formatted = formatter.format(new Date(nowMs));
        if (digitalTimeRef.current) {
          digitalTimeRef.current.textContent = formatted;
        } else {
          setDigitalTime(formatted);
        }
      }

      animId = requestAnimationFrame(updateClock);
    };

    updateClock();

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, []);

  return (
    <div className="clock-section">
      <div className="clock-decoration">
        <div className="clock-face">
          <span className="clock-number number-12">12</span>
          <span className="clock-number number-3">3</span>
          <span className="clock-number number-6">6</span>
          <span className="clock-number number-9">9</span>
          <div className="clock-hand clock-hour" ref={hourHandRef}></div>
          <div className="clock-hand clock-minute" ref={minuteHandRef}></div>
          <div className="clock-hand clock-second" ref={secondHandRef}></div>
          <div className="clock-center"></div>
        </div>
      </div>

      <div className="clock-info">
        <span>NEPAL TIME</span>
        <strong ref={digitalTimeRef}>{digitalTime || "Loading..."}</strong>
        <small>Asia / Kathmandu</small>
      </div>
    </div>
  );
}
