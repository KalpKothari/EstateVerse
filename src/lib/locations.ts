// Indian States & Cities
export const INDIA_STATES_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bilaspur"],
  "Delhi": ["New Delhi", "Delhi"],
  "Goa": ["Panaji", "Margao", "Goa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  "Maharashtra": ["Mumbai", "Pune", "Thane", "Navi Mumbai", "Nagpur", "Nashik", "Aurangabad"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Puri"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Mohali"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Agra", "Varanasi"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
};

export const INDIA_STATES = Object.keys(INDIA_STATES_CITIES).sort();
export function citiesForState(state: string): string[] {
  return INDIA_STATES_CITIES[state] ?? [];
}
