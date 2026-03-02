export interface LocalEvent {
  title: string;
  date: string;
  location: string;
  description?: string;
  type?: string;
}

export const LOCAL_EVENTS: Record<string, Record<string, LocalEvent[]>> = {
  Massachusetts: {
    "Worcester County": [
      {
        title: "Town Budget Meeting",
        date: "2026-04-12",
        location: "Worcester City Hall",
        description: "Annual municipal budget review and public comment session",
        type: "Budget"
      },
      {
        title: "Planning Board Public Hearing",
        date: "2026-03-15",
        location: "Worcester Planning Office",
        description: "Public hearing on proposed zoning changes",
        type: "Planning"
      },
      {
        title: "County Commissioner Meeting",
        date: "2026-03-20",
        location: "Worcester County Courthouse",
        description: "Monthly county commissioner public meeting",
        type: "Government"
      }
    ],
    "Suffolk County": [
      {
        title: "Boston City Council Hearing",
        date: "2026-03-18",
        location: "Boston City Hall",
        description: "Public hearing on housing policy",
        type: "Government"
      }
    ],
    "Middlesex County": [
      {
        title: "Cambridge Town Meeting",
        date: "2026-04-08",
        location: "Cambridge City Hall",
        description: "Annual town meeting for budget approval",
        type: "Town Meeting"
      }
    ]
  },
  California: {
    "Los Angeles County": [
      {
        title: "LA County Board Meeting",
        date: "2026-03-12",
        location: "Kenneth Hahn Hall of Administration",
        description: "Regular meeting of the Board of Supervisors",
        type: "Government"
      },
      {
        title: "Community Budget Forum",
        date: "2026-04-05",
        location: "Los Angeles Convention Center",
        description: "Public forum on county budget priorities",
        type: "Budget"
      }
    ],
    "San Francisco County": [
      {
        title: "SF Planning Commission",
        date: "2026-03-21",
        location: "San Francisco City Hall",
        description: "Planning commission public hearing",
        type: "Planning"
      }
    ]
  },
  "New York": {
    "New York County": [
      {
        title: "Manhattan Community Board Meeting",
        date: "2026-03-14",
        location: "Manhattan Municipal Building",
        description: "Monthly community board public meeting",
        type: "Community"
      }
    ],
    "Kings County": [
      {
        title: "Brooklyn Borough Board",
        date: "2026-03-19",
        location: "Brooklyn Borough Hall",
        description: "Borough board public session",
        type: "Government"
      }
    ]
  },
  Texas: {
    "Harris County": [
      {
        title: "Houston City Council Meeting",
        date: "2026-03-11",
        location: "Houston City Hall",
        description: "Regular city council session",
        type: "Government"
      }
    ],
    "Dallas County": [
      {
        title: "Dallas County Commissioners Court",
        date: "2026-03-17",
        location: "Dallas County Administration Building",
        description: "Weekly commissioners court meeting",
        type: "Government"
      }
    ]
  },
  Florida: {
    "Miami-Dade County": [
      {
        title: "Miami-Dade Commission Meeting",
        date: "2026-03-13",
        location: "Stephen P. Clark Center",
        description: "County commission regular meeting",
        type: "Government"
      }
    ]
  },
  Pennsylvania: {
    "Philadelphia County": [
      {
        title: "Philadelphia City Council Session",
        date: "2026-03-16",
        location: "Philadelphia City Hall",
        description: "Regular legislative session",
        type: "Government"
      }
    ]
  },
  Illinois: {
    "Cook County": [
      {
        title: "Chicago City Council Meeting",
        date: "2026-03-20",
        location: "Chicago City Hall",
        description: "Regular city council meeting",
        type: "Government"
      }
    ]
  },
  Ohio: {
    "Cuyahoga County": [
      {
        title: "Cleveland City Council",
        date: "2026-03-18",
        location: "Cleveland City Hall",
        description: "Regular council session",
        type: "Government"
      }
    ]
  },
  Georgia: {
    "Fulton County": [
      {
        title: "Atlanta City Council",
        date: "2026-03-17",
        location: "Atlanta City Hall",
        description: "Regular council meeting",
        type: "Government"
      }
    ]
  },
  Michigan: {
    "Wayne County": [
      {
        title: "Detroit City Council",
        date: "2026-03-19",
        location: "Coleman A. Young Municipal Center",
        description: "Regular council session",
        type: "Government"
      }
    ]
  }
};

export function getEventsForCounty(stateName: string, county: string): LocalEvent[] {
  return LOCAL_EVENTS[stateName]?.[county] || [];
}
