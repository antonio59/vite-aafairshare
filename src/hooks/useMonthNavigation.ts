import { useState } from "react";
import { getCurrentMonth, getPreviousMonth, getNextMonth, formatMonthYear } from "@/lib/utils";

export default function useMonthNavigation(initialMonth?: string) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || getCurrentMonth());

  const previousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const nextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const formattedMonth = formatMonthYear(currentMonth);

  return {
    currentMonth,
    setCurrentMonth,
    previousMonth,
    nextMonth,
    formattedMonth
  };
}
