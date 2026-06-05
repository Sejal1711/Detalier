import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matchmakers, profiles } from "@/lib/schema";
import bcrypt from "bcryptjs";

// POST /api/seed — seeds initial data (only call once / in dev)
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

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
    ["Shweta","Yadav"],["Nidhi","Thakur"],["Monika","Arora"],["Garima","Bhatia"],["Renu","Patel"],
    ["Prerna","Gupta"],["Sweta","Kumar"],["Charu","Iyer"],["Poonam","Mehta"],["Megha","Nair"],
  ];
  const maleNames = [
    ["Arjun","Sharma"],["Vikram","Gupta"],["Rohit","Patel"],["Aditya","Iyer"],["Karan","Mehta"],
    ["Rahul","Nair"],["Siddharth","Reddy"],["Nikhil","Joshi"],["Amit","Singh"],["Zain","Khan"],
    ["Pranav","Rao"],["Harsh","Desai"],["Varun","Verma"],["Akash","Pillai"],["Rohan","Agarwal"],
    ["Suresh","Bose"],["Mandeep","Singh"],["Vivek","Menon"],["Tarun","Bhatt"],["Ishaan","Kapoor"],
    ["Ankit","Tiwari"],["Shubham","Kulkarni"],["Rajat","Chakraborty"],["Vishal","Shetty"],["Mihir","Shah"],
    ["Preet","Malhotra"],["Soham","Saxena"],["Kartik","Bansal"],["Lavesh","Narayan"],["Bhavesh","Tripathi"],
    ["Archit","Choudhary"],["Nishant","Pandey"],["Sandeep","Srivastava"],["Uday","Mishra"],["Rishi","Ghosh"],
    ["Suneel","Jain"],["Gaurav","Mathur"],["Mayank","Dubey"],["Lalit","Bajaj"],["Hemant","Mittal"],
    ["Priyank","Goyal"],["Sohan","Rastogi"],["Vinay","Khanna"],["Amrit","Lal"],["Richie","Garg"],
    ["Shwetank","Yadav"],["Nikhil","Thakur"],["Mohan","Arora"],["Gagan","Bhatia"],["Rajan","Patel"],
    ["Akshay","Kumar"],["Sonu","Nigam"],["Chetan","Bhagat"],["Pavan","Kalyan"],["Manas","Roy"],
  ];

  const cities = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Chandigarh","Lucknow","Kochi","Indore","Noida","Gurugram"];
  const religions = ["Hindu","Hindu","Hindu","Hindu","Muslim","Christian","Sikh","Jain","Buddhist"];
  const castes = ["Brahmin","Kshatriya","Vaishya","Kayastha","Rajput","Patel","Reddy","Nair","Iyer","Sharma","Gupta","Jat","Khatri","Bania","Maratha"];
  const degrees = ["B.Tech","B.E.","MBA","M.Tech","B.Sc","BA","BCA","MCA","M.Sc","MBBS","LLB","B.Com","CA"];
  const colleges = ["IIT Bombay","IIT Delhi","IIT Madras","NIT Trichy","BITS Pilani","Delhi University","Mumbai University","Pune University","VIT Vellore","SRM University"];
  const companies = ["TCS","Infosys","Wipro","HCL","Accenture","Deloitte","Amazon","Google","Microsoft","Flipkart","Zomato","Paytm","HDFC Bank","ICICI Bank"];
  const designations = ["Software Engineer","Senior Software Engineer","Product Manager","Data Analyst","Business Analyst","Marketing Manager","Finance Analyst","Team Lead","Senior Analyst","DevOps Engineer"];
  const langs = [["Hindi","English"],["Tamil","English"],["Telugu","English","Hindi"],["Malayalam","English","Hindi"],["Kannada","English","Hindi"],["Bengali","English","Hindi"],["Gujarati","Hindi","English"],["Punjabi","Hindi","English"],["Marathi","Hindi","English"]];
  const starSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const familyTypes = ["nuclear","joint","nuclear","nuclear","extended"] as const;
  const dietOpts = ["vegetarian","non_vegetarian","eggetarian","vegetarian","vegetarian"] as const;
  const drinkOpts = ["never","never","socially","never","socially"] as const;
  const smokeOpts = ["never","never","never","occasionally","never"] as const;
  const maritalOpts = ["never_married","never_married","never_married","divorced","never_married"] as const;
  const kidsOpts = ["yes","no","maybe","yes","maybe"] as const;
  const relOpts = ["yes","no","maybe","yes","maybe"] as const;
  const petsOpts = ["yes","no","maybe","yes","no"] as const;

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
  const dob = (minAge: number, maxAge: number) => {
    const y = new Date().getFullYear() - ri(minAge, maxAge);
    return `${y}-${String(ri(1,12)).padStart(2,"0")}-${String(ri(1,28)).padStart(2,"0")}`;
  };

  try {
    const hash = await bcrypt.hash("password123", 10);
    const [mm1, mm2, mm3] = await db.insert(matchmakers).values([
      { name: "Priya Matchmaker", email: "priya@tdc.com", passwordHash: hash },
      { name: "Ravi Sharma", email: "ravi@tdc.com", passwordHash: hash },
      { name: "Sunita Agarwal", email: "sunita@tdc.com", passwordHash: hash },
    ]).returning();

    const clientProfiles = [
      { firstName:"Arjun", lastName:"Malhotra", gender:"male" as const, dateOfBirth:"1993-05-15", city:"Mumbai", height:178, email:"arjun@email.com", phone:"9876543210", degree:"MBA", undergradCollege:"IIT Bombay", income:35, currentCompany:"McKinsey", designation:"Senior Consultant", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Marathi"], siblings:1, caste:"Brahmin", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"maybe" as const, diet:"vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Taurus", mangalik:false, fatherOccupation:"Businessman", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id, isPoolProfile: false },
      { firstName:"Rohit", lastName:"Kapoor", gender:"male" as const, dateOfBirth:"1991-08-22", city:"Delhi", height:175, email:"rohit@email.com", phone:"9876543211", degree:"B.Tech", undergradCollege:"IIT Delhi", income:28, currentCompany:"Google", designation:"Software Engineer", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Punjabi"], siblings:0, caste:"Khatri", religion:"Hindu", motherTongue:"Hindi", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Leo", mangalik:false, fatherOccupation:"Engineer", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id, isPoolProfile: false },
      { firstName:"Vikram", lastName:"Reddy", gender:"male" as const, dateOfBirth:"1989-03-10", city:"Hyderabad", height:180, email:"vikram@email.com", phone:"9876543212", degree:"M.Tech", undergradCollege:"NIT Warangal", income:22, currentCompany:"Amazon", designation:"Senior SDE", maritalStatus:"divorced" as const, languagesKnown:["Telugu","Hindi","English"], siblings:2, caste:"Reddy", religion:"Hindu", motherTongue:"Telugu", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"no" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"occasionally" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Pisces", mangalik:false, fatherOccupation:"Farmer", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id, isPoolProfile: false },
      { firstName:"Priya", lastName:"Sharma", gender:"female" as const, dateOfBirth:"1995-02-14", city:"Mumbai", height:163, email:"priya.s@email.com", phone:"9876543220", degree:"MBA", undergradCollege:"IIM Bangalore", income:32, currentCompany:"BCG", designation:"Consultant", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Marathi"], siblings:1, caste:"Brahmin", religion:"Hindu", motherTongue:"Hindi", wantKids:"yes" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Aquarius", mangalik:false, fatherOccupation:"Doctor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id, isPoolProfile: false },
      { firstName:"Ananya", lastName:"Gupta", gender:"female" as const, dateOfBirth:"1994-09-20", city:"Delhi", height:158, email:"ananya@email.com", phone:"9876543221", degree:"B.Tech", undergradCollege:"IIT Delhi", income:22, currentCompany:"Microsoft", designation:"SDE-2", maritalStatus:"never_married" as const, languagesKnown:["Hindi","English","Punjabi"], siblings:0, caste:"Vaishya", religion:"Hindu", motherTongue:"Hindi", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"fair", starSign:"Virgo", mangalik:false, fatherOccupation:"Businessman", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm1.id, isPoolProfile: false },
      { firstName:"Kavya", lastName:"Nair", gender:"female" as const, dateOfBirth:"1996-04-05", city:"Bangalore", height:160, email:"kavya@email.com", phone:"9876543222", degree:"M.Tech", undergradCollege:"NIT Calicut", income:18, currentCompany:"Infosys", designation:"Technology Analyst", maritalStatus:"never_married" as const, languagesKnown:["Malayalam","English","Hindi","Kannada"], siblings:1, caste:"Nair", religion:"Hindu", motherTongue:"Malayalam", wantKids:"yes" as const, openToRelocate:"maybe" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Aries", mangalik:false, fatherOccupation:"Engineer", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id, isPoolProfile: false },
      { firstName:"Deepika", lastName:"Reddy", gender:"female" as const, dateOfBirth:"1992-03-17", city:"Hyderabad", height:165, email:"deepika@email.com", phone:"9876543225", degree:"MBA", undergradCollege:"XLRI", income:28, currentCompany:"Amazon", designation:"Product Manager", maritalStatus:"never_married" as const, languagesKnown:["Telugu","English","Hindi"], siblings:0, caste:"Reddy", religion:"Hindu", motherTongue:"Telugu", wantKids:"maybe" as const, openToRelocate:"yes" as const, openToPets:"yes" as const, diet:"non_vegetarian" as const, drinking:"socially" as const, smoking:"never" as const, familyType:"nuclear" as const, complexion:"wheatish", starSign:"Pisces", mangalik:false, fatherOccupation:"Businessman", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id, isPoolProfile: false },
      { firstName:"Sneha", lastName:"Iyer", gender:"female" as const, dateOfBirth:"1993-07-12", city:"Chennai", height:155, email:"sneha@email.com", phone:"9876543223", degree:"MBBS", undergradCollege:"Madras Medical College", income:15, currentCompany:"Fortis", designation:"Junior Doctor", maritalStatus:"never_married" as const, languagesKnown:["Tamil","English","Hindi"], siblings:2, caste:"Iyer", religion:"Hindu", motherTongue:"Tamil", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"maybe" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Cancer", mangalik:false, fatherOccupation:"Doctor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm2.id, isPoolProfile: false },
      { firstName:"Karan", lastName:"Mehta", gender:"male" as const, dateOfBirth:"1992-07-18", city:"Pune", height:176, email:"karan@email.com", phone:"9876543214", degree:"CA", undergradCollege:"Mumbai University", income:30, currentCompany:"Deloitte", designation:"Manager", maritalStatus:"never_married" as const, languagesKnown:["Gujarati","Hindi","English"], siblings:1, caste:"Bania", religion:"Jain", motherTongue:"Gujarati", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"no" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"fair", starSign:"Cancer", mangalik:false, fatherOccupation:"Businessman", hasDisability:false, visaStatus:"citizen", statusTag:"paused" as const, matchmakerId: mm1.id, isPoolProfile: false },
      { firstName:"Siddharth", lastName:"Iyer", gender:"male" as const, dateOfBirth:"1994-04-25", city:"Chennai", height:170, email:"siddharth@email.com", phone:"9876543216", degree:"MBBS", undergradCollege:"AIIMS Delhi", income:20, currentCompany:"Apollo Hospitals", designation:"Resident Doctor", maritalStatus:"never_married" as const, languagesKnown:["Tamil","English","Hindi"], siblings:1, caste:"Iyer", religion:"Hindu", motherTongue:"Tamil", wantKids:"yes" as const, openToRelocate:"no" as const, openToPets:"yes" as const, diet:"vegetarian" as const, drinking:"never" as const, smoking:"never" as const, familyType:"joint" as const, complexion:"wheatish", starSign:"Aries", mangalik:false, fatherOccupation:"Doctor", hasDisability:false, visaStatus:"citizen", statusTag:"active" as const, matchmakerId: mm3.id, isPoolProfile: false },
    ];

    await db.insert(profiles).values(clientProfiles);

    // Pool profiles
    const poolData = [];
    for (let i = 0; i < 55; i++) {
      const [fn, ln] = femaleNames[i] ?? [`FName${i}`, `LName${i}`];
      const rel = pick(religions);
      poolData.push({ firstName:fn, lastName:ln, gender:"female" as const, dateOfBirth:dob(22,32), city:pick(cities), height:ri(150,170), email:`${fn.toLowerCase()}${i}@pool.com`, phone:`98765${String(i).padStart(5,"0")}`, degree:pick(degrees), undergradCollege:pick(colleges), income:ri(5,35), currentCompany:pick(companies), designation:pick(designations), maritalStatus:pick(maritalOpts), languagesKnown:pick(langs), siblings:ri(0,3), caste:pick(castes), religion:rel, motherTongue:pick(["Hindi","Tamil","Telugu","Malayalam","Kannada","Bengali","Gujarati","Punjabi","Marathi"]), wantKids:pick(kidsOpts), openToRelocate:pick(relOpts), openToPets:pick(petsOpts), diet:pick(dietOpts), drinking:pick(drinkOpts), smoking:pick(smokeOpts), familyType:pick(familyTypes), complexion:pick(["fair","wheatish","wheatish","dark"]), starSign:pick(starSigns), mangalik:Math.random()<0.2, hasDisability:false, visaStatus:"citizen", isPoolProfile:true, statusTag:"active" as const });
    }
    for (let i = 0; i < 55; i++) {
      const [fn, ln] = maleNames[i] ?? [`MName${i}`, `LName${i}`];
      const rel = pick(religions);
      poolData.push({ firstName:fn, lastName:ln, gender:"male" as const, dateOfBirth:dob(24,38), city:pick(cities), height:ri(163,185), email:`${fn.toLowerCase()}m${i}@pool.com`, phone:`87654${String(i).padStart(5,"0")}`, degree:pick(degrees), undergradCollege:pick(colleges), income:ri(8,60), currentCompany:pick(companies), designation:pick(designations), maritalStatus:pick(maritalOpts), languagesKnown:pick(langs), siblings:ri(0,3), caste:pick(castes), religion:rel, motherTongue:pick(["Hindi","Tamil","Telugu","Malayalam","Kannada","Bengali","Gujarati","Punjabi","Marathi"]), wantKids:pick(kidsOpts), openToRelocate:pick(relOpts), openToPets:pick(petsOpts), diet:pick(dietOpts), drinking:pick(drinkOpts), smoking:pick(smokeOpts), familyType:pick(familyTypes), complexion:pick(["fair","wheatish","wheatish","dark"]), starSign:pick(starSigns), mangalik:Math.random()<0.2, hasDisability:false, visaStatus:"citizen", isPoolProfile:true, statusTag:"active" as const });
    }

    await db.insert(profiles).values(poolData);
    return NextResponse.json({ success: true, message: `Seeded 3 matchmakers, ${clientProfiles.length} clients, ${poolData.length} pool profiles` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
