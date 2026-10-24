"use client";

import { useEffect } from "react";
import { visitorStepAction } from "@/app/actions/intake";

/** Notes on the opportunity that the customer opened the calendar (not that they booked). */
export function BookingOpened({ refId }: { refId: string }) {
  useEffect(() => {
    void visitorStepAction(refId, "booking_opened");
  }, [refId]);
  return null;
}
