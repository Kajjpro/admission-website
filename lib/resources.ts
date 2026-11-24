export interface ExternalResource {
  title: string;
  url: string;
  source: string;
  note: string;
}

export interface ResourceSection {
  id: string;
  title: string;
  description: string;
  /** Guide categories from our own library to show in this section. */
  guideCategories?: string[];
  /** Specific guide slugs to show, in order (takes priority over categories). */
  guideSlugs?: string[];
  links: ExternalResource[];
}

// Every link below was checked to load (or confirmed through search) on 2026-11-24.
export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    id: "profile",
    title: "Your profile: spike, edge and activities",
    description: "What makes an activity strong or weak, why one deep spike beats ten shallow clubs, and how to build yours.",
    guideSlugs: [
      "good-vs-bad-activities",
      "spike-why-colleges-want-one",
      "spike-test",
      "finding-your-spike",
      "double-edge",
      "spike-worked-samples",
      "spike-on-paper",
      "activity-weight",
      "activity-list",
    ],
    links: [
      { title: "What Yale Looks For", url: "https://admissions.yale.edu/what-yale-looks-for", source: "Yale Admissions", note: "Yale's two questions: who will make the most of Yale, and who will contribute most." },
      { title: "SFFA v. Harvard (2023) opinion", url: "https://www.supremecourt.gov/opinions/22pdf/20-1199_hgdj.pdf", source: "U.S. Supreme Court", note: "Describes Harvard's 1–6 reader ratings, including extracurriculars." },
      { title: "What admissions criteria do you use?", url: "https://college.harvard.edu/resources/faq/what-admissions-criteria-do-you-use", source: "Harvard College", note: "Harvard on academics, activities, personal qualities and context." },
      { title: "Helpful tips for applicants", url: "https://admission.princeton.edu/how-apply/helpful-tips", source: "Princeton Admission", note: "Intellectual curiosity, rigor, and what Princeton reviews." },
    ],
  },
  {
    id: "essays",
    title: "Essays",
    description: "Brainstorming, structure and examples for the personal statement, supplements and study plans.",
    guideCategories: ["ps", "supplemental", "study_plan"],
    links: [
      { title: "The Free Guide to Writing the Personal Statement", url: "https://www.collegeessayguy.com/get-the-free-guide-to-writing-the-personal-statement", source: "College Essay Guy", note: "Brainstorming exercises, narrative vs. montage, sample essays with breakdowns." },
      { title: "How to Write a College Essay: step-by-step", url: "https://www.collegeessayguy.com/blog/how-to-write-a-college-essay", source: "College Essay Guy", note: "The full process from topic to final draft." },
      { title: "How to Write a Personal Statement", url: "https://www.collegeessayguy.com/blog/personal-statement", source: "College Essay Guy", note: "Tips and annotated examples." },
      { title: "12 Personal Statement Examples + Analysis", url: "https://www.collegeessayguy.com/blog/personal-statement-examples", source: "College Essay Guy", note: "Strong essays with commentary on why they work." },
      { title: "27 College Essay Examples from Top Universities", url: "https://www.collegeessayguy.com/blog/college-essay-examples", source: "College Essay Guy", note: "Essays from admitted students." },
      { title: "Essence Objects Exercise", url: "https://www.collegeessayguy.com/guides/the-free-guide/essence-objects-exercise", source: "College Essay Guy", note: "A 12-minute brainstorm for montage essays." },
      { title: "How to Format Your Personal Statement", url: "https://www.collegeessayguy.com/blog/personal-statement-format", source: "College Essay Guy", note: "Paragraphing, length and layout." },
      { title: "The Treasure Trove", url: "https://www.collegeessayguy.com/treasuretrove", source: "College Essay Guy", note: "Index of free guides, worksheets and examples." },
      { title: "University of California essay resources", url: "https://www.collegeessayguy.com/uc-essays", source: "College Essay Guy", note: "The UC Personal Insight Questions." },
      { title: "Common App essay prompts", url: "https://www.commonapp.org/apply/essay-prompts", source: "Common App", note: "This year's official prompts and word limit." },
      { title: "How to write a UCAS personal statement", url: "https://www.ucas.com/undergraduate/applying-university/how-write-ucas-undergraduate-personal-statement", source: "UCAS", note: "For UK applications: the current question format and limits." },
    ],
  },
  {
    id: "letters",
    title: "Recommendation letters",
    description: "Who to ask, how to create the moments a teacher can describe, and how to ask well.",
    guideSlugs: ["recommendation-letters", "asking-for-recommendations"],
    links: [
      { title: "MIT first-year application", url: "https://mitadmissions.org/apply/firstyear/", source: "MIT Admissions", note: "MIT's letter requirements: one STEM and one humanities teacher." },
      { title: "MIT Admissions blogs", url: "https://mitadmissions.org/blogs/", source: "MIT Admissions", note: "Admissions officers and students on every part of the application." },
    ],
  },
  {
    id: "testing",
    title: "Testing",
    description: "Official SAT, IELTS and TOEFL preparation.",
    guideCategories: ["sat", "ielts"],
    links: [
      { title: "What's on the SAT", url: "https://satsuite.collegeboard.org/sat/whats-on-the-test", source: "College Board", note: "Sections, timing and skills tested." },
      { title: "Official SAT practice", url: "https://satsuite.collegeboard.org/practice", source: "College Board", note: "Practice tests, question bank and score guides." },
      { title: "Bluebook practice tests", url: "https://bluebook.collegeboard.org/", source: "College Board", note: "Full-length adaptive practice in the real testing app." },
      { title: "Khan Academy Digital SAT", url: "https://www.khanacademy.org/digital-sat", source: "Khan Academy", note: "Free official course built with College Board." },
      { title: "IELTS preparation resources", url: "https://ielts.org/take-a-test/preparation-resources", source: "IELTS", note: "Official practice materials and band descriptors." },
      { title: "TOEFL iBT preparation", url: "https://www.ets.org/toefl/test-takers/ibt/prepare.html", source: "ETS", note: "Official TOEFL practice." },
    ],
  },
  {
    id: "applying",
    title: "Applying and paying for it",
    description: "Finding colleges, applying through Common App, and financial aid for international students.",
    links: [
      { title: "Common App: first-year students", url: "https://www.commonapp.org/apply/first-time-students", source: "Common App", note: "How the application is organized." },
      { title: "BigFuture", url: "https://bigfuture.collegeboard.org/", source: "College Board", note: "Search colleges, majors and scholarships." },
      { title: "CSS Profile", url: "https://cssprofile.collegeboard.org/", source: "College Board", note: "The financial aid form many private U.S. colleges require." },
      { title: "EducationUSA", url: "https://educationusa.state.gov/", source: "U.S. Department of State", note: "Free advising for studying in the U.S., including centers in Mongolia." },
      { title: "Federal Student Aid", url: "https://studentaid.gov/", source: "U.S. Department of Education", note: "U.S. federal aid (mainly for citizens and eligible non-citizens)." },
    ],
  },
];
