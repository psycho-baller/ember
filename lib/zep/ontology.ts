import { ZepClient, EntityType, EdgeType, entityFields } from "@getzep/zep-cloud";
import { EntityEdgeSourceTarget } from "@getzep/zep-cloud/serialization";
import client from "openai";
// Entity Interfaces

export interface Student {
  id: string;
  program_code: string;
  year: number;
  languages: string[];
  timezone: string;
  visibility: string;
}

export interface Program {
  code: string;
  name: string;
  faculty: string;
}

export interface Course {
  code: string;
  term: string;
  section: string;
  title: string;
}

export interface Club {
  slug: string;
  name: string;
  category: string;
}

export interface Topic {
  slug: string;
  name: string;
  facet: "hobby" | "convo" | "academic" | "activity";
  // Optionally: synonyms?: string[];
}

export interface Trait {
  slug: string;
  name: string;
}

export interface MeetupType {
  slug: string;
  name: string;
}

export interface Goal {
  slug: string;
  description: string;
}

export interface Event {
  id: string;
  description: string;
  start_ts: string; // ISO timestamp
  end_ts: string;   // ISO timestamp
}

export type Dorm = "KA" | "RU" | "IH" | "YA" | "CD" | "AU" | "GL" | "OL" | "CR" | "VC";

export interface Language {
  iso: string;
  name: string;
  proficiency: number; // 1–5
}

export interface Group {
  slug: string;
  name: string;
}

export interface Persona {
  id: string;
  name: string;
  type: "study_partner" | "mentor" | "friend" | "cofounder" | "life_partner";
  visibility: string;
}

// Edge Interfaces (all edges support these base properties)
interface EdgeBase {
  weight?: number;
  confidence?: number;
  valid_from?: string; // ISO timestamp
  valid_to?: string;   // ISO timestamp
  visibility?: string;
  source?: string;
}

// Academic & Affiliation
export interface EnrolledIn extends EdgeBase {
  code: string;
  term: string;
  section: string;
}
export interface StudiesIn extends EdgeBase { }
export interface MemberOf extends EdgeBase { }
export interface BelongsTo extends EdgeBase { }

// Interests & Social
export interface InterestedIn extends EdgeBase { }
export interface SeeksTrait extends EdgeBase { }
export interface PrefersMeetup extends EdgeBase { }
export interface HasGoal extends EdgeBase { }
export interface Attended extends EdgeBase { }
export interface ResidesIn extends EdgeBase { }
export interface Speaks extends EdgeBase { }

// Evaluations & Outcomes
export interface MatchRecommended extends EdgeBase {
  reason_vector: string[];
  created_ts: string;
}
export interface MatchAccepted extends EdgeBase {
  ts: string;
}
export interface MatchDeclined extends EdgeBase {
  ts: string;
}
export interface MetWith extends EdgeBase {
  ts: string;
  location?: string;
  duration?: number;
}
export interface GaveFeedback extends EdgeBase {
  rating: number;
  tags: string[];
}

// Persona-Based Matching
export interface WantsToMeet extends EdgeBase { }

export interface PersonaSeeksTrait extends EdgeBase { }
export interface PersonaSeeksTopic extends EdgeBase {
  modality: "talk" | "do";
}
export interface PersonaSeeksProgram extends EdgeBase { }
export interface PersonaSeeksCourse extends EdgeBase { }
export interface PersonaSeeksLanguage extends EdgeBase {
  min_proficiency?: number;
}
export interface PersonaPrefersMeetup extends EdgeBase { }
export interface PersonaSeeksYear extends EdgeBase {
  min?: number;
  max?: number;
}

// Entity Types Map
export const entity_types = {
  Student: {} as Student,
  Program: {} as Program,
  Course: {} as Course,
  Club: {} as Club,
  Topic: {} as Topic,
  Trait: {} as Trait,
  MeetupType: {} as MeetupType,
  Goal: {} as Goal,
  Event: {} as Event,
  Dorm: {} as Dorm,
  Language: {} as Language,
  Group: {} as Group,
  Persona: {} as Persona,
};

// Edge Types Map
export const edge_types = {
  ENROLLED_IN: {} as EnrolledIn,
  STUDIES_IN: {} as StudiesIn,
  MEMBER_OF: {} as MemberOf,
  BELONGS_TO: {} as BelongsTo,
  INTERESTED_IN: {} as InterestedIn,
  SEEKS_TRAIT: {} as SeeksTrait,
  PREFERS_MEETUP: {} as PrefersMeetup,
  HAS_GOAL: {} as HasGoal,
  ATTENDED: {} as Attended,
  RESIDES_IN: {} as ResidesIn,
  SPEAKS: {} as Speaks,
  MATCH_RECOMMENDED: {} as MatchRecommended,
  MATCH_ACCEPTED: {} as MatchAccepted,
  MATCH_DECLINED: {} as MatchDeclined,
  MET_WITH: {} as MetWith,
  GAVE_FEEDBACK: {} as GaveFeedback,
  WANTS_TO_MEET: {} as WantsToMeet,
  PERSONA_SEEKS_TRAIT: {} as PersonaSeeksTrait,
  PERSONA_SEEKS_TOPIC: {} as PersonaSeeksTopic,
  PERSONA_SEEKS_PROGRAM: {} as PersonaSeeksProgram,
  PERSONA_SEEKS_COURSE: {} as PersonaSeeksCourse,
  PERSONA_SEEKS_LANGUAGE: {} as PersonaSeeksLanguage,
  PERSONA_PREFERS_MEETUP: {} as PersonaPrefersMeetup,
  PERSONA_SEEKS_YEAR: {} as PersonaSeeksYear,
};

// Optionally, define edge_type_map for relationship constraints
export const edge_type_map = {
  // Example: [edge_types]: [source, target]
  ["ENROLLED_IN"]: ["Student", "Course"],
  ["STUDIES_IN"]: ["Student", "Program"],
  ["MEMBER_OF"]: ["Student", "Club"],
  ["BELONGS_TO"]: ["Course", "Program"],
  ["INTERESTED_IN"]: ["Student", "Topic"],
  ["SEEKS_TRAIT"]: ["Student", "Trait"],
  ["PREFERS_MEETUP"]: ["Student", "MeetupType"],
  ["HAS_GOAL"]: ["Student", "Goal"],
  ["ATTENDED"]: ["Student", "Event"],
  ["RESIDES_IN"]: ["Student", "Dorm"],
  ["SPEAKS"]: ["Student", "Language"],
  ["MATCH_RECOMMENDED"]: ["Student", "Student"],
  ["MATCH_ACCEPTED"]: ["Student", "Student"],
  ["MATCH_DECLINED"]: ["Student", "Student"],
  ["MET_WITH"]: ["Student", "Student"],
  ["GAVE_FEEDBACK"]: ["Student", "Student"],
  ["WANTS_TO_MEET"]: ["Student", "Persona"],
  ["PERSONA_SEEKS_TRAIT"]: ["Persona", "Trait"],
  ["PERSONA_SEEKS_TOPIC"]: ["Persona", "Topic"],
  ["PERSONA_SEEKS_PROGRAM"]: ["Persona", "Program"],
  ["PERSONA_SEEKS_COURSE"]: ["Persona", "Course"],
  ["PERSONA_SEEKS_LANGUAGE"]: ["Persona", "Language"],
  ["PERSONA_PREFERS_MEETUP"]: ["Persona", "MeetupType"],
  ["PERSONA_SEEKS_YEAR"]: ["Persona", "Year"],
  // Add more as needed...
};

// Optional: if you don’t already have a client
// const client = new ZepClient({ apiKey: process.env.ZEP_API_KEY! });

/** ---------- ENTITY TYPES (<=10 custom) ---------- **/

const Student: EntityType = {
  description: "University student profile used for matching.",
  fields: {
    program_code: entityFields.text("Program code, e.g., CPSC."),
    year: entityFields.integer("Academic year as integer, e.g., 1–5."),
    timezone: entityFields.text("IANA timezone, e.g., America/Edmonton."),
    visibility: entityFields.text("Profile visibility level, e.g., public|private|campus."),
  },
};

const Program: EntityType = {
  description: "Academic program or major.",
  fields: {
    code: entityFields.text("Program code, e.g., CPSC."),
    // name: entityFields.text("Program name, e.g., Computer Science."),
    faculty: entityFields.text("Faculty or school, e.g., Science."),
  },
};

const Course: EntityType = {
  description: "Specific course offering.",
  fields: {
    code: entityFields.text("Catalog code, e.g., CPSC 457."),
    term: entityFields.text("Term identifier, e.g., 2025F."),
    section: entityFields.text("Section identifier, e.g., LEC 01."),
    title: entityFields.text("Course title."),
  },
};

const Trait: EntityType = {
  description: "Personal trait relevant to matching.",
  fields: {
    category: entityFields.text("Trait category, e.g., personality, skill."),
    // name: entityFields.text("Trait name, e.g., introvert, leadership."),
  },
};

const MeetupType: EntityType = {
  description: "Preferred meetup format or context.",
  fields: {
    // name: entityFields.text("Meetup style, e.g., coffee chat, co-working."),
    description: entityFields.text("Short description."),
  },
};

const Goal: EntityType = {
  description: "User goal targeted by matching.",
  fields: {
    // name: entityFields.text("Goal name, e.g., improve writing."),
    timeframe: entityFields.text("Time horizon, e.g., short-term, this semester."),
  },
};

const Dorm: EntityType = {
  description: "Residence building.",
  fields: {
    // name: entityFields.text("Dorm name."),
    campus_area: entityFields.text("Area or quadrant on campus."),
  },
};

const Language: EntityType = {
  description: "Human language with ISO code.",
  fields: {
    iso_639_1: entityFields.text("Two-letter ISO 639-1 code, e.g., en, fr."),
    // name: entityFields.text("Display name, e.g., English."),
  },
};

const Persona: EntityType = {
  description: "User-defined matching persona with preferences.",
  fields: {
    label: entityFields.text("Short label for the persona."),
    description: entityFields.text("Narrative description of the persona."),
  },
};

const Year: EntityType = {
  description: "Academic year band for persona seeks.",
  fields: {
    value: entityFields.integer("Year value as integer, e.g., 1-5."),
  },
};

// Note: Using Zep defaults for Topic and Event. Also use default Organization for Club/Group. :contentReference[oaicite:1]{index=1}

/** ---------- EDGE TYPES (<=10 custom) ---------- **/

const baseEdgeFields = {
  weight: entityFields.integer("Relationship weight. Optional."),
  confidence: entityFields.integer("Extraction confidence 0-1. Optional."),
  valid_from: entityFields.text("Validity start (ISO 8601). Optional."),
  valid_to: entityFields.text("Validity end (ISO 8601). Optional."),
  visibility: entityFields.text("Visibility scope for this edge. Optional."),
  source: entityFields.text("Provenance or system source. Optional."),
};

const ENROLLED_IN: EdgeType = {
  description: "Student is enrolled in a specific course offering.",
  fields: {
    ...baseEdgeFields,
    code: entityFields.text("Course catalog code, e.g., CPSC 457."),
    term: entityFields.text("Term identifier, e.g., 2025F."),
    section: entityFields.text("Section identifier, e.g., LEC 01."),
  },
  sourceTargets: [{ source: "User", target: "Course" }],
};

const MATCH_RECOMMENDED: EdgeType = {
  description: "System recommended a match between users.",
  fields: {
    ...baseEdgeFields,
    reason_vector: entityFields.text("Stringified list of reasons or tags."),
    created_ts: entityFields.text("Recommendation timestamp (ISO 8601)."),
  },
  sourceTargets: [{ source: "User", target: "User" }],
};

const MATCH_ACCEPTED: EdgeType = {
  description: "Student accepted a recommended match.",
  fields: {
    ...baseEdgeFields,
    ts: entityFields.text("Acceptance timestamp (ISO 8601)."),
  },
  sourceTargets: [{ source: "User", target: "User" }],
};

const MATCH_DECLINED: EdgeType = {
  description: "Student declined a recommended match.",
  fields: {
    ...baseEdgeFields,
    ts: entityFields.text("Decline timestamp (ISO 8601)."),
  },
  sourceTargets: [{ source: "User", target: "User" }],
};

const MET_WITH: EdgeType = {
  description: "Two students met in real life or virtually.",
  fields: {
    ...baseEdgeFields,
    ts: entityFields.text("Meeting timestamp (ISO 8601)."),
    location: entityFields.text("Freeform location string. Optional."),
    duration: entityFields.integer("Duration in minutes. Optional."),
  },
  sourceTargets: [{ source: "User", target: "User" }],
};

const GAVE_FEEDBACK: EdgeType = {
  description: "Student gave feedback on another student after a meeting.",
  fields: {
    ...baseEdgeFields,
    rating: entityFields.integer("Numeric rating, e.g., 1-5."),
    tags: entityFields.text("Stringified list of tags, e.g., 'on-time,engaging'."),
  },
  sourceTargets: [{ source: "User", target: "User" }],
};

const WANTS_TO_MEET: EdgeType = {
  description: "Student wants to meet a specific persona.",
  fields: {
    ...baseEdgeFields,
  },
  sourceTargets: [{ source: "User", target: "Persona" }],
};

const PERSONA_SEEKS_TOPIC: EdgeType = {
  description: "Persona seeks others around a topic, with interaction modality.",
  fields: {
    ...baseEdgeFields,
    modality: entityFields.text('Interaction mode: "talk" or "do".'),
  },
  sourceTargets: [{ source: "Persona", target: "Topic" }], // Topic = default entity type
};

const PERSONA_SEEKS_LANGUAGE: EdgeType = {
  description: "Persona seeks partners by language and proficiency.",
  fields: {
    ...baseEdgeFields,
    min_proficiency: entityFields.integer("Minimum proficiency 0–5. Optional."),
  },
  sourceTargets: [{ source: "Persona", target: "Language" }],
};

const PERSONA_SEEKS_YEAR: EdgeType = {
  description: "Persona seeks partners within an academic year band.",
  fields: {
    ...baseEdgeFields,
    min: entityFields.integer("Minimum academic year inclusive. Optional."),
    max: entityFields.integer("Maximum academic year inclusive. Optional."),
  },
  sourceTargets: [{ source: "Persona", target: "Year" }],
};

// Register the ontology with Zep

async function createOntology() {
  const client = new ZepClient({
    apiKey: process.env.ZEP_API_KEY,
  });

  const ontology = await client.graph.setOntology(
    {
      // Student,
      Program,
      Course,
      // Club,
      // Topic,
      Trait,
      MeetupType,
      Goal,
      // Event,
      Dorm,
      Language,
      // Group,
      Persona,
      Year,
    },
    {
      ENROLLED_IN,
      MATCH_RECOMMENDED,
      MATCH_ACCEPTED,
      MATCH_DECLINED,
      MET_WITH,
      GAVE_FEEDBACK,
      WANTS_TO_MEET,
      PERSONA_SEEKS_TOPIC,
      PERSONA_SEEKS_LANGUAGE,
      PERSONA_SEEKS_YEAR,
    }
  );

  console.log("Ontology created:", ontology);
}

export default createOntology;

if (import.meta.main) {
  createOntology().catch(err => { console.error(err); process.exit(1); });
}
// ---------------------------
// Entity type definitions
// ---------------------------
// class Student extends EntityModel {
//   program_code?: EntityText;
//   year?: EntityInteger;
//   languages?: EntityText;        // store CSV or per-edge via SPEAKS
//   timezone?: EntityText;
//   visibility?: EntityText;
// }

// class Program extends EntityModel {
//   code?: EntityText;
//   name?: EntityText;
//   faculty?: EntityText;
// }

// class Course extends EntityModel {
//   code?: EntityText;
//   term?: EntityText;
//   section?: EntityText;
//   title?: EntityText;
// }

// class Club extends EntityModel {
//   slug?: EntityText;
//   name?: EntityText;
//   category?: EntityText;
// }

// class Topic extends EntityModel {
//   name?: EntityText;
// }

// class Trait extends EntityModel {
//   name?: EntityText;
// }

// class MeetupType extends EntityModel {
//   name?: EntityText;
// }

// class Goal extends EntityModel {
//   name?: EntityText;
// }

// class Event extends EntityModel {
//   name?: EntityText;
//   when?: EntityDatetime;
//   where?: EntityText;
// }

// class Dorm extends EntityModel {
//   name?: EntityText;
//   campus_area?: EntityText;
// }

// class Language extends EntityModel {
//   name?: EntityText;
//   iso?: EntityText;
// }

// class Group extends EntityModel {
//   name?: EntityText;
// }

// class Persona extends EntityModel {
//   label?: EntityText;
//   description?: EntityText;
// }

// // ---------------------------
// // Edge type definitions
// // ---------------------------
// class EnrolledIn extends EdgeModel {
//   code?: EntityText;
//   term?: EntityText;
//   section?: EntityText;

//   weight?: EntityFloat;
//   confidence?: EntityFloat;
//   valid_from?: EntityDatetime;
//   valid_to?: EntityDatetime;
//   visibility?: EntityText;
//   source?: EntityText;
// }
// class StudiesIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MemberOf extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class BelongsTo extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class InterestedIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class SeeksTrait extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PrefersMeetup extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class HasGoal extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class Attended extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class ResidesIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class Speaks extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class MatchRecommended extends EdgeModel {
//   reason_vector?: EntityText;       // store as CSV; or repeatable field if supported
//   created_ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MatchAccepted extends EdgeModel {
//   ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MatchDeclined extends EdgeModel {
//   ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MetWith extends EdgeModel {
//   ts?: EntityDatetime;
//   location?: EntityText;
//   duration?: EntityInteger;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class GaveFeedback extends EdgeModel {
//   rating?: EntityFloat;
//   tags?: EntityText;                // CSV if multi-valued

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class WantsToMeet extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class PersonaSeeksTrait extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksTopic extends EdgeModel {
//   modality?: EntityText; // "talk" | "do"
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksProgram extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksCourse extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksLanguage extends EdgeModel {
//   min_proficiency?: EntityInteger;
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaPrefersMeetup extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksYear extends EdgeModel {
//   min?: EntityInteger;
//   max?: EntityInteger;
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// // ---------------------------
// // Apply ontology
// // ---------------------------
// const client = new ZepClient({ apiKey: process.env.ZEP_API_KEY! });

// export const ontology = await client.graph.set_ontology({
//   // Scope these to specific graphs/users if needed:
//   // user_ids: ["user_123"], graph_ids: ["graph_abc"],

//   entities: {
//     Student,
//     Program,
//     Course,
//     Club,
//     Topic,
//     Trait,
//     MeetupType,
//     Goal,
//     Event,
//     Dorm,
//     Language,
//     Group,
//     Persona,
//   },
//   edges: {
//     ENROLLED_IN: [EnrolledIn, [new EntityEdgeSourceTarget({ source: "Student", target: "Course" })]],
//     STUDIES_IN: [StudiesIn, [new EntityEdgeSourceTarget({ source: "Student", target: "Program" })]],
//     MEMBER_OF: [MemberOf, [new EntityEdgeSourceTarget({ source: "Student", target: "Club" })]],
//     BELONGS_TO: [BelongsTo, [new EntityEdgeSourceTarget({ source: "Course", target: "Program" })]],
//     INTERESTED_IN: [InterestedIn, [new EntityEdgeSourceTarget({ source: "Student", target: "Topic" })]],
//     SEEKS_TRAIT: [SeeksTrait, [new EntityEdgeSourceTarget({ source: "Student", target: "Trait" })]],
//     PREFERS_MEETUP: [PrefersMeetup, [new EntityEdgeSourceTarget({ source: "Student", target: "MeetupType" })]],
//     HAS_GOAL: [HasGoal, [new EntityEdgeSourceTarget({ source: "Student", target: "Goal" })]],
//     ATTENDED: [Attended, [new EntityEdgeSourceTarget({ source: "Student", target: "Event" })]],
//     RESIDES_IN: [ResidesIn, [new EntityEdgeSourceTarget({ source: "Student", target: "Dorm" })]],
//     SPEAKS: [Speaks, [new EntityEdgeSourceTarget({ source: "Student", target: "Language" })]],
//     MATCH_RECOMMENDED: [MatchRecommended, [new EntityEdgeSourceTarget({ source: "Student", target: "Student" })]],
//     MATCH_ACCEPTED: [MatchAccepted, [new EntityEdgeSourceTarget({ source: "Student", target: "Student" })]],
//     MATCH_DECLINED: [MatchDeclined, [new EntityEdgeSourceTarget({ source: "Student", target: "Student" })]],
//     MET_WITH: [MetWith, [new EntityEdgeSourceTarget({ source: "Student", target: "Student" })]],
//     GAVE_FEEDBACK: [GaveFeedback, [new EntityEdgeSourceTarget({ source: "Student", target: "Student" })]],
//     WANTS_TO_MEET: [WantsToMeet, [new EntityEdgeSourceTarget({ source: "Student", target: "Persona" })]],

//     PERSONA_SEEKS_TRAIT: [PersonaSeeksTrait, [new EntityEdgeSourceTarget({ source: "Persona", target: "Trait" })]],
//     PERSONA_SEEKS_TOPIC: [PersonaSeeksTopic, [new EntityEdgeSourceTarget({ source: "Persona", target: "Topic" })]],
//     PERSONA_SEEKS_PROGRAM: [PersonaSeeksProgram, [new EntityEdgeSourceTarget({ source: "Persona", target: "Program" })]],
//     PERSONA_SEEKS_COURSE: [PersonaSeeksCourse, [new EntityEdgeSourceTarget({ source: "Persona", target: "Course" })]],
//     PERSONA_SEEKS_LANGUAGE: [PersonaSeeksLanguage, [new EntityEdgeSourceTarget({ source: "Persona", target: "Language" })]],
//     PERSONA_PREFERS_MEETUP: [PersonaPrefersMeetup, [new EntityEdgeSourceTarget({ source: "Persona", target: "MeetupType" })]],
//     PERSONA_SEEKS_YEAR: [PersonaSeeksYear, [new EntityEdgeSourceTarget({ source: "Persona", target: "Student" })]], // "Year" modeled on Student
//   },
// });
