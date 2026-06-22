// City-specific iconic landmark thumbnails.
// URLs use Wikimedia Commons Special:FilePath which redirects to the live file
// at the requested width. If any URL ever 404s, the <img onError> chain in the
// consumer components falls back to the demo image, so the UI never breaks.

const wm = (file: string, width = 1200) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const CITY_LANDMARKS: Record<string, string> = {
  // Maharashtra
  "Mumbai": wm("Gateway of India 2018.jpg"),
  "Pune": wm("Shaniwarwada gate.jpg"),
  "Thane": wm("Upvan Lake Thane.jpg"),
  "Navi Mumbai": wm("Palm Beach Road, Navi Mumbai.jpg"),
  "Nagpur": wm("Deekshabhoomi Nagpur.jpg"),
  "Nashik": wm("Trimbakeshwar Shiva Temple.jpg"),
  "Aurangabad": wm("Bibi Ka Maqbara Aurangabad.jpg"),

  // Delhi NCR
  "Delhi": wm("India Gate in New Delhi 03-2016 img3.jpg"),
  "New Delhi": wm("India Gate in New Delhi 03-2016 img3.jpg"),
  "Gurgaon": wm("Cyber Hub Gurgaon at Night.jpg"),
  "Noida": wm("DLF Mall of India Noida.jpg"),
  "Ghaziabad": wm("Hindon River.jpg"),

  // Karnataka
  "Bengaluru": wm("Vidhana Soudha 11-2013.jpg"),
  "Mysuru": wm("Mysore Palace Morning.jpg"),
  "Mangaluru": wm("Panambur Beach Mangalore.jpg"),
  "Hubli": wm("Unkal Lake Hubli.jpg"),

  // Telangana
  "Hyderabad": wm("Charminar Pride of Hyderabad.jpg"),
  "Warangal": wm("Warangal fort 03.JPG"),

  // Tamil Nadu
  "Chennai": wm("Marina Beach Chennai.jpg"),
  "Coimbatore": wm("Marudhamalai Temple.jpg"),
  "Madurai": wm("Madurai Meenakshi Temple.jpg"),

  // West Bengal
  "Kolkata": wm("Howrah Bridge Kolkata 2.jpg"),
  "Howrah": wm("Howrah Bridge Kolkata 2.jpg"),

  // Gujarat
  "Ahmedabad": wm("Sabarmati Riverfront Ahmedabad.jpg"),
  "Surat": wm("Dumas Beach Surat.jpg"),
  "Vadodara": wm("Laxmi Vilas Palace Vadodara.jpg"),
  "Gandhinagar": wm("Akshardham Gandhinagar.jpg"),

  // Goa
  "Goa": wm("Baga Beach Goa.jpg"),
  "Panaji": wm("Our Lady of the Immaculate Conception Church Panjim.jpg"),
  "Margao": wm("Holy Spirit Church Margao.jpg"),

  // Rajasthan
  "Jaipur": wm("Hawa Mahal 2011.jpg"),
  "Jodhpur": wm("Mehrangarh Fort Jodhpur.jpg"),
  "Udaipur": wm("Lake Pichola Udaipur.jpg"),

  // Punjab / Chandigarh
  "Chandigarh": wm("Rock Garden of Chandigarh.jpg"),
  "Amritsar": wm("Golden Temple Amritsar.jpg"),
  "Ludhiana": wm("Punjab Agricultural University Gate.jpg"),

  // Kerala
  "Kochi": wm("Chinese fishing nets Kochi.jpg"),
  "Thiruvananthapuram": wm("Padmanabhaswamy Temple Trivandrum.jpg"),
  "Kozhikode": wm("Kozhikode Beach.jpg"),

  // Uttar Pradesh
  "Lucknow": wm("Rumi Darwaza Lucknow.jpg"),
  "Agra": wm("Taj Mahal in March 2004.jpg"),
  "Varanasi": wm("Dashashwamedh Ghat Varanasi.jpg"),
  "Kanpur": wm("JK Temple Kanpur.jpg"),

  // Madhya Pradesh
  "Bhopal": wm("Taj-ul-Masajid Bhopal.jpg"),
  "Indore": wm("Rajwada Indore.jpg"),
  "Gwalior": wm("Gwalior Fort.jpg"),

  // Misc
  "Patna": wm("Golghar Patna.jpg"),
  "Ranchi": wm("Hundru Falls Ranchi.jpg"),
  "Bhubaneswar": wm("Lingaraj Temple Bhubaneswar.jpg"),
  "Dehradun": wm("Robber's Cave Dehradun.jpg"),
  "Shimla": wm("The Ridge Shimla.jpg"),
  "Srinagar": wm("Dal Lake Srinagar.jpg"),
  "Guwahati": wm("Kamakhya Temple Guwahati.jpg"),
  "Visakhapatnam": wm("Ramakrishna Beach Visakhapatnam.jpg"),
};

export function landmarkFor(city: string): string | undefined {
  return CITY_LANDMARKS[city];
}
