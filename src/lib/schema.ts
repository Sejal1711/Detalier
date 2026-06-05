import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "never_married",
  "divorced",
  "widowed",
  "separated",
]);
export const kidsEnum = pgEnum("kids_pref", ["yes", "no", "maybe"]);
export const relocateEnum = pgEnum("relocate_pref", ["yes", "no", "maybe"]);
export const petsEnum = pgEnum("pets_pref", ["yes", "no", "maybe"]);
export const dietEnum = pgEnum("diet", ["vegetarian", "non_vegetarian", "eggetarian", "vegan"]);
export const familyTypeEnum = pgEnum("family_type", ["nuclear", "joint", "extended"]);
export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "paused",
  "matched",
  "on_hold",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "suggested",
  "sent",
  "accepted",
  "rejected",
]);
export const drinkingEnum = pgEnum("drinking", ["never", "socially", "regularly"]);
export const smokingEnum = pgEnum("smoking", ["never", "occasionally", "regularly"]);

export const matchmakers = pgTable("matchmakers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  matchmakerId: integer("matchmaker_id").references(() => matchmakers.id),
  isPoolProfile: boolean("is_pool_profile").default(false).notNull(),

  // Basic Info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // stored as YYYY-MM-DD string
  country: text("country").default("India"),
  city: text("city").notNull(),
  height: integer("height").notNull(), // in cm

  // Contact
  email: text("email"),
  phone: text("phone"),

  // Education & Career
  undergradCollege: text("undergrad_college"),
  degree: text("degree"),
  income: integer("income"), // annual in INR lakhs
  currentCompany: text("current_company"),
  designation: text("designation"),

  // Personal
  maritalStatus: maritalStatusEnum("marital_status").notNull(),
  languagesKnown: text("languages_known").array(), // ["Hindi","English","Tamil"]
  siblings: integer("siblings").default(0),

  // Cultural
  caste: text("caste"),
  religion: text("religion"),
  gotra: text("gotra"),
  motherTongue: text("mother_tongue"),

  // Preferences
  wantKids: kidsEnum("want_kids").default("maybe"),
  openToRelocate: relocateEnum("open_to_relocate").default("maybe"),
  openToPets: petsEnum("open_to_pets").default("maybe"),

  // Lifestyle
  diet: dietEnum("diet").default("vegetarian"),
  drinking: drinkingEnum("drinking").default("never"),
  smoking: smokingEnum("smoking").default("never"),
  familyType: familyTypeEnum("family_type").default("nuclear"),

  // Additional Indian Matrimonial Fields
  complexion: text("complexion"), // fair, wheatish, dark
  starSign: text("star_sign"),
  mangalik: boolean("mangalik").default(false),
  fatherOccupation: text("father_occupation"),
  motherOccupation: text("mother_occupation"),
  hasDisability: boolean("has_disability").default(false),
  visaStatus: text("visa_status"), // citizen, PR, work visa, student

  // Dashboard status (only for non-pool profiles / clients)
  statusTag: customerStatusEnum("status_tag").default("active"),
  profileSummary: text("profile_summary"), // AI-generated

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => profiles.id),
  poolProfileId: integer("pool_profile_id")
    .notNull()
    .references(() => profiles.id),
  algorithmScore: real("algorithm_score"),
  aiScore: text("ai_score"), // "High Potential" | "Good Match" | "Moderate" | "Low"
  aiExplanation: text("ai_explanation"),
  introEmail: text("intro_email"),
  status: matchStatusEnum("status").default("suggested"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => profiles.id),
  matchmakerId: integer("matchmaker_id")
    .notNull()
    .references(() => matchmakers.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Matchmaker = typeof matchmakers.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type NewMatch = typeof matches.$inferInsert;
export type NewNote = typeof notes.$inferInsert;
