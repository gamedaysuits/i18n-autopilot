import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './WordFlipper.module.css';

export default function WordFlipper({
  words = [],
  interval = 2200,
  className = '',
  wordClassName = '',
  onChange = null,
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      // Step 1: Trigger transition-out
      setVisible(false);
      
      // Step 2: Swap content midpoint during transition
      const changeTimer = setTimeout(() => {
        setIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % words.length;
          if (onChange) {
            onChange(words[nextIndex], nextIndex);
          }
          return nextIndex;
        });
        
        // Step 3: Trigger transition-in
        setVisible(true);
      }, 250); // half of CSS transition duration (300ms) or similar

      return () => clearTimeout(changeTimer);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval, onChange]);

  if (words.length === 0) return null;

  return (
    <span className={clsx(styles.flipperContainer, className)}>
      <span
        className={clsx(
          styles.flipperWrapper,
          visible && styles.flipperWrapperVisible,
          wordClassName
        )}
      >
        {words[index]}
      </span>
    </span>
  );
}
