import { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  formatter: (value: number) => string;
};

export function AnimatedNumber({ value, formatter }: AnimatedNumberProps) {
  const previousValue = useRef(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const from = previousValue.current;
    const delta = value - from;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 720, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + delta * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previousValue.current = value;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{formatter(displayValue)}</span>;
}
