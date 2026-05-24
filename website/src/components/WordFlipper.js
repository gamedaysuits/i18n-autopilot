import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './WordFlipper.module.css';

/**
 * WordFlipper — reusable flip-animation component.
 *
 * Each entry in `words` can be:
 *   - A plain string: rendered as-is
 *   - An object { text, script }: `text` is rendered inside a
 *     <span data-script="..."> so PUA @font-face rules activate
 *
 * The `onChange` callback receives the raw word entry (string or object)
 * so the parent can inspect it (e.g., to check if it's a number).
 */
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
      }, 250);

      return () => clearTimeout(changeTimer);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval, onChange]);

  if (words.length === 0) return null;

  const currentWord = words[index];

  // Determine what to render: plain string vs. script-wrapped object
  const renderContent = () => {
    if (typeof currentWord === 'object' && currentWord.script) {
      return (
        <span data-script={currentWord.script}>
          {currentWord.text}
        </span>
      );
    }
    return currentWord;
  };

  return (
    <span className={clsx(styles.flipperContainer, className)}>
      <span
        className={clsx(
          styles.flipperWrapper,
          visible && styles.flipperWrapperVisible,
          wordClassName
        )}
      >
        {renderContent()}
      </span>
    </span>
  );
}
