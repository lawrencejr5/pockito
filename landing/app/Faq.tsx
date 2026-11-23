"use client";

import { useState } from "react";
import styles from "./page.module.css";

export type FaqItem = {
  question: string;
  answer: string;
};

export default function Faq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={styles.faqList}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}
          >
            <button
              type="button"
              className={styles.faqTrigger}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span className={styles.faqIcon} aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && <p className={styles.faqAnswer}>{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
