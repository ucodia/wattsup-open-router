"use client";

import React, { createContext, useContext, useState } from "react";

const PeriodContext = createContext();

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState("day");

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
