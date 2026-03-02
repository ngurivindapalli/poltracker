import { NextResponse } from "next/server"

export async function GET() {
  const schedule = [
    // ---- SENATE SESSIONS ----
    {
      date: "2026-03-03",
      time: "10:00 AM",
      title: "U.S. Senate Floor Session",
      channel: "C-SPAN2",
      type: "Senate"
    },
    {
      date: "2026-03-05",
      time: "10:00 AM",
      title: "U.S. Senate Legislative Session",
      channel: "C-SPAN2",
      type: "Senate"
    },
    {
      date: "2026-03-10",
      time: "10:00 AM",
      title: "U.S. Senate Floor Debate",
      channel: "C-SPAN2",
      type: "Senate"
    },

    // ---- HOUSE SESSIONS ----
    {
      date: "2026-03-04",
      time: "9:00 AM",
      title: "U.S. House of Representatives Floor Session",
      channel: "C-SPAN",
      type: "House"
    },
    {
      date: "2026-03-06",
      time: "9:00 AM",
      title: "U.S. House Legislative Session",
      channel: "C-SPAN",
      type: "House"
    },
    {
      date: "2026-03-11",
      time: "9:00 AM",
      title: "U.S. House Floor Debate",
      channel: "C-SPAN",
      type: "House"
    },

    // ---- HEARINGS ----
    {
      date: "2026-03-12",
      time: "10:00 AM",
      title: "Senate Committee Hearing",
      channel: "C-SPAN3",
      type: "Hearing"
    },
    {
      date: "2026-03-18",
      time: "10:00 AM",
      title: "House Committee Oversight Hearing",
      channel: "C-SPAN3",
      type: "Hearing"
    },

    // ---- SPECIAL EVENTS ----
    {
      date: "2026-07-04",
      time: "8:00 PM",
      title: "Independence Day National Celebration",
      channel: "C-SPAN",
      type: "Event"
    },
    {
      date: "2026-09-01",
      time: "7:00 PM",
      title: "Congressional Town Hall Broadcast",
      channel: "C-SPAN",
      type: "Event"
    },

    // ---- FALL SESSION ----
    {
      date: "2026-10-06",
      time: "10:00 AM",
      title: "Senate Floor Session",
      channel: "C-SPAN2",
      type: "Senate"
    },
    {
      date: "2026-10-07",
      time: "9:00 AM",
      title: "House Floor Session",
      channel: "C-SPAN",
      type: "House"
    },

    // ---- WINTER SESSION ----
    {
      date: "2026-12-01",
      time: "10:00 AM",
      title: "Senate Year-End Session",
      channel: "C-SPAN2",
      type: "Senate"
    },
    {
      date: "2026-12-02",
      time: "9:00 AM",
      title: "House Year-End Session",
      channel: "C-SPAN",
      type: "House"
    }
  ]

  return NextResponse.json(schedule)
}
