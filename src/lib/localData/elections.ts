export interface LocalElection {
  title: string;
  date: string;
  description: string;
  type?: string;
}

export const LOCAL_ELECTIONS: Record<string, Record<string, LocalElection[]>> = {
  Massachusetts: {
    "Worcester County": [
      {
        title: "Municipal Elections",
        date: "2026-11-03",
        description: "Local mayor and city council elections across Worcester County municipalities",
        type: "Municipal"
      },
      {
        title: "School Committee Elections",
        date: "2026-11-03",
        description: "School committee member elections for local districts",
        type: "School Board"
      }
    ],
    "Suffolk County": [
      {
        title: "Boston City Council Elections",
        date: "2026-11-03",
        description: "City council district and at-large seat elections",
        type: "Municipal"
      }
    ],
    "Middlesex County": [
      {
        title: "Town Meeting Elections",
        date: "2026-04-15",
        description: "Annual town meeting representative elections",
        type: "Town Meeting"
      }
    ]
  },
  California: {
    "Los Angeles County": [
      {
        title: "LA County Board of Supervisors",
        date: "2026-06-02",
        description: "Primary election for County Board of Supervisors District 3",
        type: "County"
      },
      {
        title: "Los Angeles Unified School District",
        date: "2026-03-03",
        description: "School board member elections for LAUSD",
        type: "School Board"
      }
    ],
    "San Francisco County": [
      {
        title: "San Francisco Mayoral Election",
        date: "2026-11-03",
        description: "Election for Mayor of San Francisco",
        type: "Municipal"
      }
    ]
  },
  "New York": {
    "New York County": [
      {
        title: "Manhattan Borough President",
        date: "2026-11-03",
        description: "Election for Manhattan Borough President",
        type: "Borough"
      }
    ],
    "Kings County": [
      {
        title: "Brooklyn District Attorney",
        date: "2026-11-03",
        description: "Election for Brooklyn District Attorney",
        type: "County"
      }
    ]
  },
  Texas: {
    "Harris County": [
      {
        title: "Houston City Council Elections",
        date: "2026-11-03",
        description: "City council district elections for Houston",
        type: "Municipal"
      }
    ],
    "Dallas County": [
      {
        title: "Dallas ISD School Board",
        date: "2026-05-05",
        description: "School board trustee elections",
        type: "School Board"
      }
    ]
  },
  Florida: {
    "Miami-Dade County": [
      {
        title: "Miami-Dade County Commission",
        date: "2026-08-25",
        description: "Primary election for County Commission seats",
        type: "County"
      }
    ],
    "Broward County": [
      {
        title: "Fort Lauderdale City Commission",
        date: "2026-03-10",
        description: "City commission elections",
        type: "Municipal"
      }
    ]
  },
  Pennsylvania: {
    "Philadelphia County": [
      {
        title: "Philadelphia City Council",
        date: "2026-11-03",
        description: "City council district and at-large elections",
        type: "Municipal"
      }
    ],
    "Allegheny County": [
      {
        title: "Pittsburgh City Council",
        date: "2026-11-03",
        description: "City council district elections",
        type: "Municipal"
      }
    ]
  },
  Illinois: {
    "Cook County": [
      {
        title: "Chicago Aldermanic Elections",
        date: "2026-02-24",
        description: "Ward alderman elections for Chicago",
        type: "Municipal"
      }
    ]
  },
  Ohio: {
    "Cuyahoga County": [
      {
        title: "Cleveland City Council",
        date: "2026-11-03",
        description: "City council ward elections",
        type: "Municipal"
      }
    ],
    "Franklin County": [
      {
        title: "Columbus City Council",
        date: "2026-11-03",
        description: "City council elections",
        type: "Municipal"
      }
    ]
  },
  Georgia: {
    "Fulton County": [
      {
        title: "Atlanta City Council",
        date: "2026-11-03",
        description: "City council district elections",
        type: "Municipal"
      }
    ]
  },
  Michigan: {
    "Wayne County": [
      {
        title: "Detroit City Council",
        date: "2026-11-03",
        description: "City council district and at-large elections",
        type: "Municipal"
      }
    ]
  }
};

export function getElectionsForCounty(stateName: string, county: string): LocalElection[] {
  return LOCAL_ELECTIONS[stateName]?.[county] || [];
}
