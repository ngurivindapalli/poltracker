export const STATE_LOCATIONS: Record<string, {
  cities: string[]
  counties: string[]
}> = {
  AL: {
    cities: ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
    counties: ["Jefferson County", "Mobile County", "Madison County", "Montgomery County", "Baldwin County"]
  },
  AK: {
    cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
    counties: ["Anchorage Municipality", "Fairbanks North Star Borough", "Juneau City and Borough", "Matanuska-Susitna Borough"]
  },
  AZ: {
    cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale"],
    counties: ["Maricopa County", "Pima County", "Pinal County", "Yavapai County", "Yuma County"]
  },
  AR: {
    cities: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
    counties: ["Pulaski County", "Benton County", "Washington County", "Sebastian County", "Craighead County"]
  },
  CA: {
    cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"],
    counties: ["Los Angeles County", "San Diego County", "Orange County", "Riverside County", "San Bernardino County", "Santa Clara County", "Alameda County", "Sacramento County", "Contra Costa County", "Fresno County"]
  },
  CO: {
    cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"],
    counties: ["Denver County", "El Paso County", "Arapahoe County", "Jefferson County", "Adams County"]
  },
  CT: {
    cities: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury"],
    counties: ["Fairfield County", "Hartford County", "New Haven County", "Litchfield County", "Middlesex County"]
  },
  DE: {
    cities: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"],
    counties: ["New Castle County", "Kent County", "Sussex County"]
  },
  FL: {
    cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"],
    counties: ["Miami-Dade County", "Broward County", "Palm Beach County", "Hillsborough County", "Orange County", "Pinellas County", "Duval County", "Polk County", "Brevard County", "Lee County"]
  },
  GA: {
    cities: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Roswell", "Macon", "Johns Creek", "Albany"],
    counties: ["Fulton County", "Gwinnett County", "Cobb County", "DeKalb County", "Clayton County", "Chatham County", "Cherokee County", "Forsyth County", "Henry County", "Richmond County"]
  },
  HI: {
    cities: ["Honolulu", "Hilo", "Kailua", "Kaneohe", "Pearl City"],
    counties: ["Honolulu County", "Hawaii County", "Maui County", "Kauai County"]
  },
  ID: {
    cities: ["Boise", "Nampa", "Meridian", "Idaho Falls", "Pocatello"],
    counties: ["Ada County", "Canyon County", "Kootenai County", "Bonneville County", "Bannock County"]
  },
  IL: {
    cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Elgin", "Springfield", "Peoria", "Champaign", "Waukegan"],
    counties: ["Cook County", "DuPage County", "Lake County", "Will County", "Kane County", "McHenry County", "Winnebago County", "Madison County", "St. Clair County", "Sangamon County"]
  },
  IN: {
    cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],
    counties: ["Marion County", "Lake County", "Allen County", "Hamilton County", "St. Joseph County"]
  },
  IA: {
    cities: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
    counties: ["Polk County", "Linn County", "Scott County", "Johnson County", "Black Hawk County"]
  },
  KS: {
    cities: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
    counties: ["Sedgwick County", "Johnson County", "Wyandotte County", "Shawnee County", "Douglas County"]
  },
  KY: {
    cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
    counties: ["Jefferson County", "Fayette County", "Kenton County", "Boone County", "Warren County"]
  },
  LA: {
    cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
    counties: ["Orleans Parish", "Jefferson Parish", "East Baton Rouge Parish", "Caddo Parish", "Calcasieu Parish"]
  },
  ME: {
    cities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
    counties: ["Cumberland County", "York County", "Penobscot County", "Kennebec County", "Androscoggin County"]
  },
  MD: {
    cities: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie"],
    counties: ["Montgomery County", "Prince George's County", "Baltimore County", "Anne Arundel County", "Howard County"]
  },
  MA: {
    cities: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge"],
    counties: ["Middlesex County", "Worcester County", "Essex County", "Suffolk County", "Norfolk County"]
  },
  MI: {
    cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Troy"],
    counties: ["Wayne County", "Oakland County", "Macomb County", "Kent County", "Genesee County", "Washtenaw County", "Ingham County", "Ottawa County", "Kalamazoo County", "Saginaw County"]
  },
  MN: {
    cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"],
    counties: ["Hennepin County", "Ramsey County", "Dakota County", "Anoka County", "Olmsted County"]
  },
  MS: {
    cities: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
    counties: ["Hinds County", "Harrison County", "DeSoto County", "Rankin County", "Madison County"]
  },
  MO: {
    cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters"],
    counties: ["St. Louis County", "Jackson County", "St. Charles County", "Greene County", "Clay County", "Platte County", "Jefferson County", "Boone County", "Cass County", "Franklin County"]
  },
  MT: {
    cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte"],
    counties: ["Yellowstone County", "Missoula County", "Cascade County", "Gallatin County", "Flathead County"]
  },
  NE: {
    cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
    counties: ["Douglas County", "Lancaster County", "Sarpy County", "Hall County", "Buffalo County"]
  },
  NV: {
    cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
    counties: ["Clark County", "Washoe County", "Carson City", "Douglas County", "Elko County"]
  },
  NH: {
    cities: ["Manchester", "Nashua", "Concord", "Derry", "Rochester"],
    counties: ["Hillsborough County", "Rockingham County", "Merrimack County", "Strafford County", "Grafton County"]
  },
  NJ: {
    cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison"],
    counties: ["Bergen County", "Middlesex County", "Essex County", "Hudson County", "Monmouth County"]
  },
  NM: {
    cities: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
    counties: ["Bernalillo County", "Dona Ana County", "Sandoval County", "Santa Fe County", "Chaves County"]
  },
  NY: {
    cities: ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
    counties: ["Kings County", "Queens County", "New York County", "Suffolk County", "Bronx County", "Nassau County", "Westchester County", "Erie County", "Monroe County", "Richmond County"]
  },
  NC: {
    cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"],
    counties: ["Mecklenburg County", "Wake County", "Guilford County", "Forsyth County", "Cumberland County", "Durham County", "Buncombe County", "Gaston County", "Union County", "Cabarrus County"]
  },
  ND: {
    cities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
    counties: ["Cass County", "Burleigh County", "Grand Forks County", "Ward County", "Williams County"]
  },
  OH: {
    cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"],
    counties: ["Cuyahoga County", "Franklin County", "Hamilton County", "Summit County", "Montgomery County", "Lucas County", "Stark County", "Butler County", "Lorain County", "Mahoning County"]
  },
  OK: {
    cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"],
    counties: ["Oklahoma County", "Tulsa County", "Cleveland County", "Canadian County", "Comanche County"]
  },
  OR: {
    cities: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro"],
    counties: ["Multnomah County", "Washington County", "Clackamas County", "Lane County", "Marion County"]
  },
  PA: {
    cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Lancaster", "York", "State College", "Bethlehem"],
    counties: ["Allegheny County", "Philadelphia County", "Montgomery County", "Bucks County", "Delaware County", "Chester County", "Lancaster County", "York County", "Dauphin County", "Lehigh County"]
  },
  RI: {
    cities: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence"],
    counties: ["Providence County", "Kent County", "Washington County", "Bristol County", "Newport County"]
  },
  SC: {
    cities: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill"],
    counties: ["Greenville County", "Richland County", "Charleston County", "Spartanburg County", "Horry County"]
  },
  SD: {
    cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown"],
    counties: ["Minnehaha County", "Pennington County", "Brown County", "Lincoln County", "Codington County"]
  },
  TN: {
    cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Murfreesboro"],
    counties: ["Davidson County", "Shelby County", "Knox County", "Hamilton County", "Rutherford County"]
  },
  TX: {
    cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
    counties: ["Harris County", "Dallas County", "Tarrant County", "Bexar County", "Travis County", "Collin County", "Fort Bend County", "Montgomery County", "Williamson County", "Denton County"]
  },
  UT: {
    cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"],
    counties: ["Salt Lake County", "Utah County", "Davis County", "Weber County", "Washington County"]
  },
  VT: {
    cities: ["Burlington", "Essex", "South Burlington", "Colchester", "Rutland"],
    counties: ["Chittenden County", "Rutland County", "Washington County", "Windham County", "Franklin County"]
  },
  VA: {
    cities: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Portsmouth", "Suffolk", "Roanoke"],
    counties: ["Fairfax County", "Prince William County", "Loudoun County", "Chesterfield County", "Henrico County", "Arlington County", "Virginia Beach County", "Norfolk County", "Richmond County", "Alexandria County"]
  },
  WA: {
    cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
    counties: ["King County", "Pierce County", "Snohomish County", "Spokane County", "Clark County"]
  },
  WV: {
    cities: ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling"],
    counties: ["Kanawha County", "Cabell County", "Wood County", "Monongalia County", "Ohio County"]
  },
  WI: {
    cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
    counties: ["Milwaukee County", "Dane County", "Waukesha County", "Brown County", "Racine County"]
  },
  WY: {
    cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"],
    counties: ["Laramie County", "Natrona County", "Campbell County", "Sweetwater County", "Fremont County"]
  },
  DC: {
    cities: ["Washington"],
    counties: ["District of Columbia"]
  }
}
