"use client";

import dynamic from "next/dynamic";

// The visible week, today marker and now-line depend on the viewer's clock and timezone,
// so the calendar never renders on the server.
export const CalendarLoader = dynamic(() => import("./CalendarApp").then((m) => m.CalendarApp), { ssr: false });
