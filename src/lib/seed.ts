import { db } from "./db";
import { matchmakers, profiles } from "./schema";
import bcrypt from "bcryptjs";

const femaleNames = [
  ["Priya","Sharma"],["Ananya","Gupta"],["Kavya","Patel"],["Sneha","Iyer"],["Riya","Mehta"],
  ["Pooja","Nair"],["Deepika","Reddy"],["Shreya","Joshi"],["Neha","Singh"],["Aisha","Khan"],
  ["Swathi","Rao"],["Pallavi","Desai"],["Meghna","Verma"],["Divya","Pillai"],["Kritika","Agarwal"],
  ["Ankita","Bose"],["Simran","Kaur"],["Nandita","Menon"],["Tanvi","Bhatt"],["Isha","Kapoor"],
  ["Aditi","Tiwari"],["Shruti","Kulkarni"],["Radhika","Chakraborty"],["Varsha","Shetty"],["Mansi","Shah"],
  ["Preeti","Malhotra"],["Sonali","Saxena"],["Kriti","Bansal"],["Lavanya","Narayan"],["Bhavna","Tripathi"],
  ["Archana","Choudhary"],["Nisha","Pandey"],["Sandhya","Srivastava"],["Usha","Mishra"],["Rekha","Ghosh"],
  ["Sunita","Jain"],["Geeta","Mathur"],["Meena","Dubey"],["Lalita","Bajaj"],["Hema","Mittal"],
  ["Priyanka","Goyal"],["Sonal","Rastogi"],["Vandana","Khanna"],["Amrita","Lal"],["Richa","Garg"],
  ["Shweta","Yadav"],["Nidhi","Thakur"],["Monika","Arora"],["Garima","Bhatia"],["Renu","Sharma"],
  ["Prerna","Gupta"],["Sweta","Patel"],["Charu","Iyer"],["Poonam","Mehta"],["Megha","Nair"],
];

const maleNames = [
  ["Arjun","Sharma"],["Vikram","Gupta"],["Rohit","Patel"],["Aditya","Iyer"],["Karan","Mehta"],
  ["Rahul","Nair"],["Siddharth","Reddy"],["Nikhil","Joshi"],["Amit","Singh"],["Zain","Khan"],
  ["Pranav","Rao"],["Harsh","Desai"],["Varun","Verma"],["Akash","Pillai"],["Rohan","Agarwal"],
  ["Suresh","Bose"],["Mandeep","Kaur"],["Vivek","Menon"],["Tarun","Bhatt"],["Ishaan","Kapoor"],
  ["Ankit","Tiwari"],["Shubham","Kulkarni"],["Rajat","Chakraborty"],["Vishal","Shetty"],["Mihir","Shah"],
  ["Preet","Malhotra"],["Soham","Saxena"],["Kartik","Bansal"],["Lavesh","Narayan"],["Bhavesh","Tripathi"],
  ["Archit","Choudhary"],["Nishant","Pandey"],["Sandeep","Srivastava"],["Uday","Mishra"],["Rishi","Ghosh"],
  ["Suneel","Jain"],["Gaurav","Mathur"],["Mayank","Dubey"],["Lalit","Bajaj"],["Hemant","Mittal"],
  ["Priyank","Goyal"],["Sonal","Rastogi"],["Vinay","Khanna"],["Amrit","Lal"],["Richie","Garg"],
  ["Shwetank","Yadav"],["Nikhil","Thakur"],["Mohan","Arora"],["Gagan","Bhatia"],["Renu","Sharma"],
];

const cities = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Chandigarh","Lucknow","Kochi","Indore","Bhopal","Nagpur","Surat","Coimbatore","Vadodara","Noida","Gurugram"];
const religions = ["Hindu","Hindu","Hindu","Hindu","Muslim","Christian","Sikh","Jain","Buddhist"];
const castes = ["Brahmin","Kshatriya","Vaishya","Kayastha","Rajput","Patel","Reddy","Nair","Iyer","Sharma","Gupta","Jat","Khatri","Bania","Maratha"];
const degrees = ["B.Tech","B.E.","MBA","M.Tech","B.Sc","BA","BCA","MCA","M.Sc","MBBS","LLB","B.Com","CA","B.Arch","B.Pharm"];
const colleges = ["IIT Bombay","IIT Delhi","IIT Madras","NIT Trichy","BITS Pilani","Delhi University","Mumbai University","Jadavpur University","Pune University","VIT Vellore","SRM University","Manipal University","Christ University","St. Stephen's College","Presidency College"];
const companies = ["TCS","Infosys","Wipro","HCL","Accenture","Deloitte","Amazon","Google","Microsoft","Flipkart","Zomato","Swiggy","Ola","Paytm","HDFC Bank","ICICI Bank","Reliance Industries","L&T","Tata Motors","Mahindra"];
const designations = ["Software Engineer","Senior Software Engineer","Product Manager","Data Analyst","Business Analyst","Marketing Manager","HR Manager","Finance Analyst","Operations Manager","Team Lead","Associate Consultant","Senior Analyst","Digital Marketing Manager","UX Designer","DevOps Engineer"];
const languages = [["Hindi","English"],["Tamil","English"],["Telugu","English","Hindi"],["Malayalam","English","Hindi"],["Kannada","English","Hindi"],["Bengali","English","Hindi"],["Gujarati","Hindi","English"],["Punjabi","Hindi","English"],["Marathi","Hindi","English"],["Odia","Hindi","English"]];
const motherTongues = ["Hindi","Tamil","Telugu","Malayalam","Kannada","Bengali","Gujarati","Punjabi","Marathi","Odia"];
const starSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const fatherOccupations = ["Businessman","Government Employee","Doctor","Engineer","Retired","Teacher","Farmer","Lawyer","Banker","Professor"];
const visaOptions = ["citizen","citizen","citizen","citizen","citizen","PR","work_visa"];
const familyTypes = ["nuclear","joint","nuclear","nuclear","extended"] as const;
const dietOptions = ["vegetarian","non_vegetarian","eggetarian","vegetarian","vegetarian"] as const;
const drinkingOptions = ["never","never","socially","never","socially"] as const;
const smokingOptions = ["never","never","never","occasionally","never"] as const;
const maritalOptions = ["never_married","never_married","never_married","divorced","never_married"] as const;
const kidsOptions = ["yes","no","maybe","yes","maybe"] as const;
const relocateOptions = ["yes","no","maybe","yes","maybe"] as const;
const petsOptions = ["yes","no","maybe","yes","no"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDOB(minAge: number, maxAge: number): string {
  const year = new Date().getFullYear() - randInt(minAge, maxAge);
  const month = String(randInt(1, 12)).padStart(2, "0");
  const day = String(randInt(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function seed() {
  console.log("Seeding matchmakers...");
  const hash1 = await bcrypt.hash("password123", 10);
  const hash2 = await bcrypt.hash("password123", 10);
  const hash3 = await bcrypt.hash("password123", 10);

  const [mm1, mm2, mm3] = await db
    .insert(matchmakers)
    .values([
      { name: "Priya Matchmaker", email: "priya@tdc.com", passwordHash: hash1 },
      { name: "Ravi Sharma", email: "ravi@tdc.com", passwordHash: hash2 },
      { name: "Sunita Agarwal", email: "sunita@tdc.com", passwordHash: hash3 },
    ])
    .returning();

  console.log("Seeding client profiles...");

  // 10 male clients + 10 female clients = 20 clients
  const clientProfiles = [
    // Male clients
    { firstName:"Arjun", lastName:"Malhotra", gender:"male" as const, dateOfBirth:"1993-05-15", city:"Mumbai", height:178, email:"arjun@email.com", phone:"9876543210", degree:"MBA", undergradCollege:"IIT Bombay", income:35, currentCompany:"McKinsey", designation:"Senior Consultant", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Marathi"], siblings:1, caste:"Brahmin", religion:"Hindu", gotra:"Bharadwaj", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"maybe" as const, diet:"vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Taurus", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id },
    { firstName:"Rohit", lastName:"Kapoor", gender:"male" as const, dateOfBirth:"1991-08-22", city:"Delhi", height:175, email:"rohit@email.com", phone:"9876543211", degree:"B.Tech", undergradCollege:"IIT Delhi", income:28, currentCompany:"Google", designation:"Software Engineer", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Punjabi"], siblings:0, caste:"Khatri", religion:"Hindu", gotra:"Koundilya", motherTongue:"Hindi", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Leo", mangalik:false, fatherOccupation:"Engineer", motherOccupation:"Doctor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id },
    { firstName:"Vikram", lastName:"Reddy", gender:"male" as const, dateOfBirth:"1989-03-10", city:"Hyderabad", height:180, email:"vikram@email.com", phone:"9876543212", degree:"M.Tech", undergradCollege:"NIT Warangal", income:22, currentCompany:"Amazon", designation:"Senior SDE", maritalStatus:"divorced" as const, languagesKnown:["Telugu","Hindi","English"], siblings:2, caste:"Reddy", religion:"Hindu", motherTongue:"Telugu", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"no" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"occasionally" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Pisces", mangalik:false, fatherOccupation:"Farmer", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Aditya", lastName:"Nair", gender:"male" as const, dateOfBirth:"1995-11-05", city:"Bangalore", height:172, email:"aditya@email.com", phone:"9876543213", degree:"B.Tech", undergradCollege:"BITS Pilani", income:18, currentCompany:"Flipkart", designation:"Product Manager", maritalStatus:"never_married" as const, languagesKnown:["Malayalam","English","Hindi"], siblings:1, caste:"Nair", religion:"Hindu", motherTongue:"Malayalam", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Scorpio", mangalik:false, fatherOccupation:"Government Employee", motherOccupation:"Nurse", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Karan", lastName:"Mehta", gender:"male" as const, dateOfBirth:"1992-07-18", city:"Pune", height:176, email:"karan@email.com", phone:"9876543214", degree:"CA", undergradCollege:"Mumbai University", income:30, currentCompany:"Deloitte", designation:"Manager", maritalStatus:"never_married" as const, languagesKnown:["Gujarati","Hindi","English"], siblings:1, caste:"Bania", religion:"Jain", motherTongue:"Gujarati", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"no" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"fair", starSign:"Cancer", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"paused" as const, matchmakerId: mm1.id },
    { firstName:"Rahul", lastName:"Sharma", gender:"male" as const, dateOfBirth:"1990-12-01", city:"Mumbai", height:174, email:"rahul@email.com", phone:"9876543215", degree:"MBA", undergradCollege:"XLRI Jamshedpur", income:45, currentCompany:"HDFC Bank", designation:"VP", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English"], siblings:0, caste:"Brahmin", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"maybe" as const, diet:"vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Sagittarius", mangalik:true, fatherOccupation:"Retired", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },
    { firstName:"Siddharth", lastName:"Iyer", gender:"male" as const, dateOfBirth:"1994-04-25", city:"Chennai", height:170, email:"siddharth@email.com", phone:"9876543216", degree:"MBBS", undergradCollege:"AIIMS Delhi", income:20, currentCompany:"Apollo Hospitals", designation:"Resident Doctor", maritalStatus:"never_married" as const, languagesKnown:["Tamil","English","Hindi"], siblings:1, caste:"Iyer", religion:"Hindu", motherTongue:"Tamil", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Aries", mangalik:false, fatherOccupation:"Doctor", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },
    { firstName:"Nikhil", lastName:"Singh", gender:"male" as const, dateOfBirth:"1988-09-14", city:"Kolkata", height:182, email:"nikhil@email.com", phone:"9876543217", degree:"LLB", undergradCollege:"Calcutta University", income:25, currentCompany:"Khaitan & Co.", designation:"Senior Associate", maritalStatus:"divorced" as const, languagesKnown:["Bengali","Hindi","English"], siblings:2, caste:"Kayastha", religion:"Hindu", motherTongue:"Bengali", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"maybe" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"occasionally" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Virgo", mangalik:false, fatherOccupation:"Lawyer", motherOccupation:"Professor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Manish", lastName:"Patel", gender:"male" as const, dateOfBirth:"1993-01-30", city:"Ahmedabad", height:173, email:"manish@email.com", phone:"9876543218", degree:"B.Tech", undergradCollege:"SVNIT Surat", income:16, currentCompany:"Zomato", designation:"Data Analyst", maritalStatus:"never_married" as const, languagesKnown:["Gujarati","Hindi","English"], siblings:1, caste:"Patel", religion:"Hindu", motherTongue:"Gujarati", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Aquarius", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"matched" as const, matchmakerId: mm1.id },
    { firstName:"Tarun", lastName:"Verma", gender:"male" as const, dateOfBirth:"1996-06-08", city:"Jaipur", height:168, email:"tarun@email.com", phone:"9876543219", degree:"B.Com", undergradCollege:"Rajasthan University", income:12, currentCompany:"Reliance Retail", designation:"Area Manager", maritalStatus:"never_married" as const, languagesKnown:["Hindi","Rajasthani","English"], siblings:3, caste:"Sharma", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"no" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"fair", starSign:"Gemini", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },

    // Female clients
    { firstName:"Priya", lastName:"Sharma", gender:"female" as const, dateOfBirth:"1995-02-14", city:"Mumbai", height:163, email:"priya.s@email.com", phone:"9876543220", degree:"MBA", undergradCollege:"IIM Bangalore", income:32, currentCompany:"BCG", designation:"Consultant", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Marathi"], siblings:1, caste:"Brahmin", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Aquarius", mangalik:false, fatherOccupation:"Doctor", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id },
    { firstName:"Ananya", lastName:"Gupta", gender:"female" as const, dateOfBirth:"1994-09-20", city:"Delhi", height:158, email:"ananya@email.com", phone:"9876543221", degree:"B.Tech", undergradCollege:"IIT Delhi", income:22, currentCompany:"Microsoft", designation:"SDE-2", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Punjabi"], siblings:0, caste:"Vaishya", religion:"Hindu", motherTongue:"Hindi", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Virgo", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Doctor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id },
    { firstName:"Kavya", lastName:"Nair", gender:"female" as const, dateOfBirth:"1996-04-05", city:"Bangalore", height:160, email:"kavya@email.com", phone:"9876543222", degree:"M.Tech", undergradCollege:"NIT Calicut", income:18, currentCompany:"Infosys", designation:"Technology Analyst", maritalStatus:"never_married" as const, languagesKnown:["Malayalam","English","Hindi","Kannada"], siblings:1, caste:"Nair", religion:"Hindu", motherTongue:"Malayalam", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Aries", mangalik:false, fatherOccupation:"Engineer", motherOccupation:"Nurse", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Sneha", lastName:"Iyer", gender:"female" as const, dateOfBirth:"1993-07-12", city:"Chennai", height:155, email:"sneha@email.com", phone:"9876543223", degree:"MBBS", undergradCollege:"Madras Medical College", income:15, currentCompany:"Fortis", designation:"Junior Doctor", maritalStatus:"never_married" as const, languagesKnown:["Tamil","English","Hindi"], siblings:2, caste:"Iyer", religion:"Hindu", motherTongue:"Tamil", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"maybe" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Cancer", mangalik:false, fatherOccupation:"Doctor", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Riya", lastName:"Mehta", gender:"female" as const, dateOfBirth:"1997-11-28", city:"Pune", height:162, email:"riya@email.com", phone:"9876543224", degree:"B.Com", undergradCollege:"Symbiosis Pune", income:10, currentCompany:"Deloitte", designation:"Analyst", maritalStatus:"never_married" as const, languagesKnown:["Gujarati","Hindi","English","Marathi"], siblings:1, caste:"Bania", religion:"Jain", motherTongue:"Gujarati", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"no" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"fair", starSign:"Sagittarius", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },
    { firstName:"Deepika", lastName:"Reddy", gender:"female" as const, dateOfBirth:"1992-03-17", city:"Hyderabad", height:165, email:"deepika@email.com", phone:"9876543225", degree:"MBA", undergradCollege:"XLRI", income:28, currentCompany:"Amazon", designation:"Product Manager", maritalStatus:"never_married" as const, languagesKnown:["Telugu","English","Hindi"], siblings:0, caste:"Reddy", religion:"Hindu", motherTongue:"Telugu", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Pisces", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },
    { firstName:"Shreya", lastName:"Kapoor", gender:"female" as const, dateOfBirth:"1994-08-03", city:"Mumbai", height:157, email:"shreya@email.com", phone:"9876543226", degree:"BA", undergradCollege:"Lady Shri Ram College", income:14, currentCompany:"Condé Nast", designation:"Content Editor", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Punjabi"], siblings:2, caste:"Khatri", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Leo", mangalik:false, fatherOccupation:"Banker", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"paused" as const, matchmakerId: mm1.id },
    { firstName:"Neha", lastName:"Singh", gender:"female" as const, dateOfBirth:"1995-12-22", city:"Lucknow", height:161, email:"neha@email.com", phone:"9876543227", degree:"LLB", undergradCollege:"Lucknow University", income:12, currentCompany:"High Court Lucknow", designation:"Advocate", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Urdu"], siblings:1, caste:"Rajput", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"no" as const, diet:"non_vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"fair", starSign:"Capricorn", mangalik:false, fatherOccupation:"Government Employee", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
    { firstName:"Aisha", lastName:"Khan", gender:"female" as const, dateOfBirth:"1996-05-09", city:"Kolkata", height:159, email:"aisha@email.com", phone:"9876543228", degree:"B.Sc", undergradCollege:"Jadavpur University", income:8, currentCompany:"Wipro", designation:"Software Tester", maritalStatus:"never_married" as const, languagesKnown:["Bengali","Hindi","English","Urdu"], siblings:3, caste:"Sheikh", religion:"Muslim", motherTongue:"Bengali", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"no" as const, diet:"non_vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Taurus", mangalik:false, fatherOccupation:"Businessman", motherOccupation:"Homemaker", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id },
    { firstName:"Pooja", lastName:"Joshi", gender:"female" as const, dateOfBirth:"1998-10-15", city:"Ahmedabad", height:156, email:"pooja@email.com", phone:"9876543229", degree:"B.Tech", undergradCollege:"DAIICT", income:9, currentCompany:"Paytm", designation:"Junior SDE", maritalStatus:"never_married" as const, languagesKnown:["Gujarati","Hindi","English"], siblings:0, caste:"Brahmin", religion:"Hindu", motherTongue:"Gujarati", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Libra", mangalik:false, fatherOccupation:"Engineer", motherOccupation:"Teacher", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id },
  ];

  await db.insert(profiles).values(clientProfiles);
  console.log(`Seeded ${clientProfiles.length} client profiles`);

  // --- 110 pool profiles (55 female, 55 male) ---
  console.log("Seeding pool profiles...");
  const poolData = [];

  for (let i = 0; i < 55; i++) {
    const [fn, ln] = femaleNames[i] ?? [`FName${i}`, `LName${i}`];
    const rel = pick(religions);
    poolData.push({
      firstName: fn, lastName: ln, gender: "female" as const,
      dateOfBirth: randomDOB(22, 32), city: pick(cities),
      height: randInt(150, 170), email: `${fn.toLowerCase()}${i}@pool.com`,
      phone: `98765${String(i).padStart(5, "0")}`,
      degree: pick(degrees), undergradCollege: pick(colleges),
      income: randInt(5, 35), currentCompany: pick(companies),
      designation: pick(designations),
      maritalStatus: pick(maritalOptions),
      languagesKnown: pick(languages),
      siblings: randInt(0, 3), caste: pick(castes), religion: rel,
      gotra: rel === "Hindu" ? pick(["Bharadwaj","Kashyap","Vasishtha","Atri","Gautam"]) : undefined,
      motherTongue: pick(motherTongues),
      wantKids: pick(kidsOptions), openToRelocate: pick(relocateOptions),
      openToPets: pick(petsOptions), diet: pick(dietOptions),
      drinking: pick(drinkingOptions), smoking: pick(smokingOptions),
      familyType: pick(familyTypes),
      complexion: pick(["fair","wheatish","wheatish","dark"]),
      starSign: pick(starSigns), mangalik: Math.random() < 0.2,
      fatherOccupation: pick(fatherOccupations), motherOccupation: pick(["Homemaker","Teacher","Doctor","Nurse","Businesswoman"]),
      hasDisability: false, visaStatus: pick(visaOptions),
      isPoolProfile: true, statusTag: "active" as const,
    });
  }

  for (let i = 0; i < 55; i++) {
    const [fn, ln] = maleNames[i] ?? [`MName${i}`, `LName${i}`];
    const rel = pick(religions);
    poolData.push({
      firstName: fn, lastName: ln, gender: "male" as const,
      dateOfBirth: randomDOB(24, 38), city: pick(cities),
      height: randInt(163, 185), email: `${fn.toLowerCase()}m${i}@pool.com`,
      phone: `87654${String(i).padStart(5, "0")}`,
      degree: pick(degrees), undergradCollege: pick(colleges),
      income: randInt(8, 60), currentCompany: pick(companies),
      designation: pick(designations),
      maritalStatus: pick(maritalOptions),
      languagesKnown: pick(languages),
      siblings: randInt(0, 3), caste: pick(castes), religion: rel,
      gotra: rel === "Hindu" ? pick(["Bharadwaj","Kashyap","Vasishtha","Atri","Gautam"]) : undefined,
      motherTongue: pick(motherTongues),
      wantKids: pick(kidsOptions), openToRelocate: pick(relocateOptions),
      openToPets: pick(petsOptions), diet: pick(dietOptions),
      drinking: pick(drinkingOptions), smoking: pick(smokingOptions),
      familyType: pick(familyTypes),
      complexion: pick(["fair","wheatish","wheatish","dark"]),
      starSign: pick(starSigns), mangalik: Math.random() < 0.2,
      fatherOccupation: pick(fatherOccupations), motherOccupation: pick(["Homemaker","Teacher","Doctor","Nurse","Businesswoman"]),
      hasDisability: false, visaStatus: pick(visaOptions),
      isPoolProfile: true, statusTag: "active" as const,
    });
  }

  await db.insert(profiles).values(poolData);
  console.log(`Seeded ${poolData.length} pool profiles`);
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
