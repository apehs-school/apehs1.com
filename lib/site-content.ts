export type SitePageDefault = {
  slug: string;
  title: string;
  group: "about" | "academics" | "activities" | "contact";
  body: string;
};

export const sitePageDefaults: SitePageDefault[] = [
  {
    slug: "about",
    title: "About Us",
    group: "about",
    body: "Use the links on this page to read the principal's message, staff list, history, mission, vision, values, goals, motto, and school song.",
  },
  {
    slug: "principal",
    title: "Message from the Principal",
    group: "about",
    body: `Mrs. Dorothy Britton-McKenzie
BSc (Hons), MSc

Welcome to Ardenne Preparatory and Extension High School — a vibrant learning community grounded in strong Christian values and a commitment to excellence.

As Principal, I am deeply honoured to lead an institution that nurtures academic achievement, emotional growth, spiritual development, and social responsibility. Our vision is to cultivate a community that treasures excellence, mutual respect, emotional empowerment, and meaningful opportunities for every child to thrive.

Our dedicated and passionate staff work tirelessly to equip students with the knowledge, character, and life skills necessary for success in an ever-evolving world.

Together, let us partner in shaping bright futures. At Ardenne, every child is valued, supported, and inspired to reach their fullest potential.`,
  },
  {
    slug: "staff",
    title: "Academic Staff",
    group: "about",
    body: `- Mrs. Dorothy Britton-McKenzie — Principal
- Mr. Richard Brown — Vice Principal
- Ms. Alicia Grant — Grade 6 Teacher
- Mr. Kevin Johnson — Physical Education`,
  },
  {
    slug: "history",
    title: "History & Milestones",
    group: "about",
    body: `The merged Ardenne Preparatory and Extension High School came into existence on September 1, 2000. Before that date the Preparatory School and the Extension High School were separate institutions under the same Board of Governors. They shared one campus, with the Preparatory School in session from 7:30 a.m. to 12:30 p.m. and the Extension High School from 12:30 p.m. to 5:05 p.m. Neither school met the Ministry of Education's required contact hours, so the schools merged.

## The Preparatory School
Ardenne Preparatory School was established in 1974. Rev. Rupert Lawrence received permission from the Ardenne High School Board and the Executive Council of the Church to start a private feeder school. The premises at 37 Hope Road, which had housed the Jamaica Bible Institute, became the school's home. Mrs. Daphnie Bailey was the first Principal. Mrs. Lily Brown developed the motto, Nil Nisi Optimum Hic Est Agendum.

## The Extension High School
The Extension High School grew from the evening programme and now offers placement from Grade 7 through Grade 11 on the same campus.

## Christian Foundation
The school remains a Church of God institution. Worship, character, and service sit alongside academic work.`,
  },
  {
    slug: "mission",
    title: "Our Mission",
    group: "about",
    body: "Ardenne Preparatory and Extension High School seeks to provide quality education within a Christian environment where all stakeholders — the church, Board of Governors, staff, students, and parents — work together harmoniously to enable students to achieve their maximum potential. This is done within the ideals of community and in preparation for the next stage of their development.",
  },
  {
    slug: "vision",
    title: "Our Vision",
    group: "about",
    body: `To be a benchmark for schools in Jamaica and the Caribbean in equipping students for effective living.

- We envision students developing an awareness and acceptance of God as Creator and Jesus Christ as Saviour.
- We envision Ardenne Preparatory and Extension High School becoming an institution that defines quality Christian education.
- We envision a school of excellence that produces students who are literate and numerate, with a strong work ethic and well-developed analytical, problem-solving, decision-making, social, and communication technology skills.
- We envision graduates who are citizens of integrity, capable of making meaningful contributions to nation-building.
- We envision graduates developing a love for knowledge, recognizing that learning is a lifelong process.`,
  },
  {
    slug: "core",
    title: "Core Values",
    group: "about",
    body: `We value:

- Our children are gifts from God
- Diversity
- Effective communication
- Equity
- Excellence
- Honesty
- Prayerfulness
- Respect
- Team work
- Trust`,
  },
  {
    slug: "goals",
    title: "Our Goals",
    group: "about",
    body: `We aim to:

- Provide a challenging broad-based education for all our students.
- Provide leadership and support for a student-centred, results-driven curriculum, instruction, and assessment.
- Provide opportunities which will enable each child to achieve his or her potential.
- Provide learning opportunities which focus on knowledge, skills, values, and attitudes.
- Provide opportunities for the development of all staff.
- Provide a secure, clean, aesthetically pleasing environment.
- Strengthen the relationship among all stakeholders.
- Maintain a student/teacher ratio of 20:1 in Pre-Kindergarten and Kindergarten, and 30:1 in the primary grades.`,
  },
  {
    slug: "motto",
    title: "Our Motto",
    group: "about",
    body: `Nil nisi Optimum Hic Est Agendum

Meaning: Nothing but the Best is to be done Here.

This motto reflects our commitment to excellence in academics, character, and service. At Ardenne Preparatory and Extension High School, we believe that every student is capable of greatness and should always strive to give their very best.`,
  },
  {
    slug: "song",
    title: "School Song",
    group: "about",
    body: `## Verse 1
Let us arise and give God thanks
For our school, our founders and our teachers
Let us say a prayer for all who labour here
Let us arise and give God thanks

## Chorus
Let us arise, Ardenne arise
Let us arise and take a stand
Let us arise, Ardenne arise
Let us arise and give God thanks

## Verse 2
Let us arise and pursue our goals
Increase our knowledge, faith and wisdom
Let the truth be told and
To God's love we'll hold
Let us arise and pursue our goals

## Verse 3
Let us arise and give God thanks
We'll build our school, our nation and our world
With love, truth and grace we'll win this race
Let us arise and give God thanks!

Words by Mrs. Carol Wilson (2001). Music by Karen Cyrus.`,
  },
  {
    slug: "academics",
    title: "Our Academic Program",
    group: "academics",
    body: `- Mathematics and numeracy development
- Language arts and reading
- Science and discovery learning
- Spanish
- French
- Social studies and citizenship
- Information technology
- Music, drama, and visual arts
- Physical education
- Character education`,
  },
  {
    slug: "awards",
    title: "Awards and Achievements",
    group: "academics",
    body: `## Preparatory Division – PEP Results
- PEP Results 2021: 94%
- PEP Results 2022: 98%
- PEP Results 2023: 98%
- PEP Results 2024: 96%
- PEP Results 2025: 95%
- Average over a 5-year period: 96.2%

## Grade Diagnostic and Performance Tasks
- Grade 3 (2024-2025 Diagnostic Test): 100%
- Grade 4 PEP – Literacy and Numeracy: 100%
- Grade 5 PEP Performance Tasks: Language Arts, Mathematics, Science, and Social Studies 100%

## JCDC – Performing Arts 2023–2024
- Dance: winners of the trophy for Most Outstanding School and Community (Classes 2 and 3)
- Music: trophy for Best Vocal Solo – Jamaica Folklore
- Drumming: Lightning Drummers – National Gold Medal and World Champions`,
  },
  {
    slug: "admissions",
    title: "Admissions Information",
    group: "academics",
    body: `We welcome applications from students who are eager to learn and grow in a supportive, disciplined, and nurturing environment.

## Enrollment steps
- Immunization card (passport)
- Complete the application form
- Submit the birth certificate and previous school records
- Attend the student assessment and interview
- Receive the acceptance letter

The Preparatory Department enrolls students aged 3 to 11 years. The Extension High School offers placement for students in Grade 7 through Grade 11.`,
  },
  {
    slug: "scholarship",
    title: "Scholarship Awarded",
    group: "academics",
    body: "Add each scholarship on its own line, starting with a dash. Example: - 2026 — Student name — Award name.",
  },
  {
    slug: "extra",
    title: "Extracurricular Activities",
    group: "activities",
    body: "Christmas Term 2025–2026. Our extracurricular programme helps students build skills, confidence, and teamwork beyond the classroom. Add or change each activity from the Activities section of the admin dashboard.",
  },
  {
    slug: "contact",
    title: "Contact Us",
    group: "contact",
    body: `Location: 37 Hope Road, Kingston, Jamaica
Phone: 876-927-8874 | 876-486-9611
Email: ardenne.prep.saw@moeschools.edu.jm
Hours: 7:30 AM – 5:05 PM`,
  },
];

export const activityDefaults = [
  {
    name: "Swimming",
    schedule: "Thurs 3:00–4:00 PM\nFri 2:30–3:30 PM\nWed 2:45–3:45 PM (UWI Pool)",
    venue: "YMCA / UWI Pool",
    lead: "Ms. Reid",
    cost: "$11,000 (YMCA) | $14,000 (UWI)",
    attire: "Full bathing suit, swim cap, towel, slippers",
    note: "Parents must pick up students from YMCA. The UWI trip includes bus transportation.",
  },
  {
    name: "Dancing",
    schedule: "Mon Grades 1–2, 2:30–3:30 PM\nMon Grades 3–6, 3:30–4:30 PM\nTues Pre-K–K2, 1:45–2:45 PM\nThurs Grades 7–11, 2:45–3:45 PM",
    venue: "School Grounds",
    lead: "Mrs. Jones",
    cost: "$8,000",
    attire: "Leotard, tights, dance skirt",
    note: "",
  },
  {
    name: "Football",
    schedule: "Tuesday and Thursday\nPre-K–K2: 1:30–2:30 PM\nGrades 1–3: 2:30–3:30 PM\nGrades 4–9: 3:30–5:00 PM",
    venue: "Ardenne High School",
    lead: "Peter Grant",
    cost: "$6,500",
    attire: "Shorts, T-shirt, socks, sneakers",
    note: "",
  },
  {
    name: "Basketball",
    schedule: "Monday and Wednesday, 2:30–4:30 PM",
    venue: "School Grounds",
    lead: "S. Williams",
    cost: "$6,500",
    attire: "Shorts, T-shirt, sneakers",
    note: "",
  },
  {
    name: "Netball",
    schedule: "Thursday, 3:00–4:30 PM",
    venue: "School Grounds",
    lead: "S. Williams",
    cost: "$4,500",
    attire: "Shorts, T-shirt, sneakers",
    note: "",
  },
  {
    name: "Drumming",
    schedule: "Wednesday\nPre-K–Grade 2: 2:00–3:00 PM\nGrades 3–11: 3:00–4:00 PM",
    venue: "Music Room",
    lead: "Coach S. Williams / Mrs. James-Josephs",
    cost: "$3,500 (Junior) | $5,000 (Senior)",
    attire: "School uniform",
    note: "",
  },
  {
    name: "Chess",
    schedule: "Mon 3:00–4:00 PM or Tues 7:15–8:15 AM\nSat Advanced: 11:30–1:00 PM or 1:30–3:00 PM",
    venue: "School Grounds",
    lead: "C. Pryce",
    cost: "$8,000 (General) | $15,000 (Advanced)",
    attire: "Comfortable clothing",
    note: "New students start in the General group, except Grade 6.",
  },
];

export function pageDefault(slug: string) {
  return sitePageDefaults.find((page) => page.slug === slug) ?? null;
}

export function pagesInGroup(group: SitePageDefault["group"]) {
  return sitePageDefaults.filter((page) => page.group === group);
}
