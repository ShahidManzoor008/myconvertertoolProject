import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_STEPS = [
  { message: "Preparing files...", progress: 12 },
  { message: "Uploading to converter...", progress: 34 },
  { message: "Processing document...", progress: 62 },
  { message: "Generating download...", progress: 86 },
];

export const useConversionProgress = (steps = DEFAULT_STEPS) => {
  const [state, setState] = useState({
    active: false,
    message: steps[0]?.message || "Preparing...",
    progress: 0,
    status: "idle",
  });
  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();
    // The conversion API does not report byte or job progress. Do not invent stages or percentages.
    setState({ active: true, message: "Uploading and processing your request…", progress: undefined, status: "running" });
  }, [clearTimers]);

  const complete = useCallback((message = "Conversion complete") => {
    clearTimers();
    setState({
      active: true,
      message,
      progress: 100,
      status: "complete",
    });

    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        active: false,
      }));
    }, 1200);

    timersRef.current.push(timer);
  }, [clearTimers]);

  const fail = useCallback((message = "Conversion failed") => {
    clearTimers();
    setState(() => ({
      active: true,
      message,
      progress: undefined,
      status: "error",
    }));
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setState({
      active: false,
      message: steps[0]?.message || "Preparing...",
      progress: 0,
      status: "idle",
    });
  }, [clearTimers, steps]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    ...state,
    start,
    complete,
    fail,
    reset,
  };
};
