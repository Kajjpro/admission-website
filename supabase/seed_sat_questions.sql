-- Starter SAT question bank: original questions written for this platform in the style of the
-- Digital SAT, covering every official domain. Not College Board material.
-- Each choice carries its own rationale so wrong-answer feedback needs no AI call.

insert into public.sat_questions
  (section, domain, skill, difficulty, passage, stem, answer_type, choices, correct_answer, accepted_answers, explanation, source, verified)
values

-- Reading & Writing: Information and Ideas --------------------------------
('rw', 'Information and Ideas', 'Central Ideas and Details', 'easy',
$q$Urban beekeeping has grown rapidly in many cities over the past decade. Hobbyists often assume that adding hives helps pollinators, but ecologist Marta Leal found that in neighborhoods with many hives, honeybees outcompeted wild bee species for a limited supply of flowers, and wild bee counts fell. Leal argues that cities should plant more flowering species before encouraging more hives.$q$,
$q$Which choice best states the main idea of the text?$q$, 'mcq',
$j$[{"key":"A","text":"Urban beekeeping has become less popular because hives are difficult to maintain.","rationale":"The text says urban beekeeping has grown rapidly, the opposite of becoming less popular, and never mentions maintenance."},{"key":"B","text":"Adding honeybee hives to cities may harm wild bees unless the supply of flowers is increased.","rationale":"Correct. Leal's finding (honeybees outcompete wild bees for limited flowers) and her recommendation (plant more flowers first) together form the main idea."},{"key":"C","text":"Wild bees are more effective pollinators than honeybees in every urban environment.","rationale":"The text compares competition for flowers, not pollination effectiveness, and \"every urban environment\" is far broader than anything stated."},{"key":"D","text":"Leal recommends that cities ban beekeeping in neighborhoods with many flowering plants.","rationale":"Leal recommends planting flowers before adding hives, not banning beekeeping."}]$j$,
'B', '{}',
$q$**Strategy:** The main idea combines the text's key finding with its conclusion.

1. The finding: in neighborhoods with many hives, honeybees outcompeted wild bees for limited flowers.
2. The conclusion: cities should plant more flowers *before* adding hives.

Choice B states both parts. Eliminate choices that contradict the text (A), overgeneralize (C), or distort the recommendation (D).$q$, 'original', true),

('rw', 'Information and Ideas', 'Command of Evidence', 'medium',
$q$In her study of 19th-century correspondence, historian Ayesha Rahman claims that railway expansion changed how ordinary people wrote to one another: once mail could arrive in days rather than weeks, letters became shorter and were sent more often.$q$,
$q$Which finding, if true, would most directly support Rahman's claim?$q$, 'mcq',
$j$[{"key":"A","text":"Letters written before railway expansion were more often written on expensive paper.","rationale":"Paper quality has nothing to do with letter length or how often letters were sent."},{"key":"B","text":"In a sample of family letters, the average letter length fell and the number of letters sent per year rose after nearby towns gained rail service.","rationale":"Correct. This shows both predicted changes (shorter, more frequent) and ties their timing to rail service."},{"key":"C","text":"Many railway companies employed clerks who wrote letters to customers.","rationale":"Business letters from railway clerks say nothing about how ordinary people's letter-writing changed."},{"key":"D","text":"Some letters written after railway expansion discussed train travel.","rationale":"The topic of letters isn't part of the claim; Rahman's claim is about length and frequency."}]$j$,
'B', '{}',
$q$**Strategy:** Break the claim into testable parts, then find the choice that confirms all of them.

Rahman's claim has three parts: (1) after railways, (2) letters got shorter, (3) letters were sent more often. Choice B matches all three. The others either address a different feature of letters (A, D) or a different group of writers (C).$q$, 'original', true),

('rw', 'Information and Ideas', 'Command of Evidence', 'medium',
$q$A student analyzed data from a farm trial comparing yields with and without a winter cover crop.

| Crop | Yield without cover crop (bushels/acre) | Yield with cover crop (bushels/acre) |
| --- | --- | --- |
| Corn | 162 | 171 |
| Soybeans | 51 | 50 |
| Wheat | 64 | 70 |

The student concludes that planting a cover crop was associated with higher yields for most, but not all, of the crops in the trial. ______$q$,
$q$Which choice most effectively uses data from the table to complete the statement?$q$, 'mcq',
$j$[{"key":"A","text":"For example, wheat yield rose from 64 to 70 bushels per acre with a cover crop, while soybean yield fell slightly from 51 to 50.","rationale":"Correct. It shows an increase (supporting \"most\") and the one decrease (supporting \"not all\")."},{"key":"B","text":"For example, corn had the highest yield of the three crops both with and without a cover crop.","rationale":"True, but it compares crops to each other instead of comparing each crop with and without a cover crop."},{"key":"C","text":"For example, soybean yield was 51 bushels per acre without a cover crop.","rationale":"One number can't show a change; it doesn't address the conclusion."},{"key":"D","text":"For example, every crop's yield increased by at least 5 bushels per acre with a cover crop.","rationale":"False: soybean yield decreased from 51 to 50."}]$j$,
'A', '{}',
$q$**Strategy:** Quantitative evidence questions reward the choice that matches *every* part of the claim and reads the table accurately.

The claim has two parts: higher yields for **most** crops, but **not all**. Corn (+9) and wheat (+6) increased; soybeans (−1) decreased. Only A cites both an increase and the exception.$q$, 'original', true),

('rw', 'Information and Ideas', 'Inferences', 'hard',
$q$Astronomers often estimate a star's age from how fast it rotates: young stars spin quickly, and stars gradually slow down as they age. However, a team studying the star cluster NGC 6811, whose stars are known from other methods to be about one billion years old, found that those stars spin at almost the same rate as stars in a cluster roughly 300 million years younger. This finding suggests that ______$q$,
$q$Which choice most logically completes the text?$q$, 'mcq',
$j$[{"key":"A","text":"the stars in NGC 6811 are actually much younger than astronomers had estimated.","rationale":"The text says the stars' age is known from other methods, so the finding doesn't cast doubt on it."},{"key":"B","text":"the slowing of a star's rotation may temporarily stall at some point in the star's life.","rationale":"Correct. Stars 300 million years apart in age spin at nearly the same rate, so the expected slowing seems to pause for a while."},{"key":"C","text":"a star's rotation rate cannot be used to estimate its age under any circumstances.","rationale":"Too extreme. One unexpected result suggests the method has a limitation, not that it never works."},{"key":"D","text":"younger stars generally rotate more slowly than older stars do.","rationale":"Contradicts the text, which says young stars spin quickly and slow as they age."}]$j$,
'B', '{}',
$q$**Strategy:** For inference questions, pick the choice that the evidence *requires*, not one that goes further.

- Expected: older stars spin more slowly.
- Observed: stars that differ in age by 300 million years spin at about the same rate.
- Fixed fact: NGC 6811's age is known independently, which rules out A.

The most reasonable explanation is that spin-down pauses for a period (B). C overreaches and D contradicts the passage.$q$, 'original', true),

-- Reading & Writing: Craft and Structure ----------------------------------
('rw', 'Craft and Structure', 'Words in Context', 'easy',
$q$The committee's report was intentionally ______: it summarized the findings in two pages and left out the technical appendices that most readers would skip.$q$,
$q$Which choice completes the text with the most logical and precise word or phrase?$q$, 'mcq',
$j$[{"key":"A","text":"exhaustive","rationale":"Exhaustive means covering everything, which contradicts a two-page summary that leaves material out."},{"key":"B","text":"concise","rationale":"Correct. Concise means brief and to the point, matching \"two pages\" and \"left out the technical appendices.\""},{"key":"C","text":"ambiguous","rationale":"Ambiguous means unclear. Nothing suggests the report was unclear, only short."},{"key":"D","text":"belated","rationale":"Belated means late. The text describes length, not timing."}]$j$,
'B', '{}',
$q$**Strategy:** Use the clue after the colon. A colon introduces an explanation of the blank.

"Summarized the findings in two pages" and "left out the technical appendices" both describe something brief. *Concise* fits exactly.$q$, 'original', true),

('rw', 'Craft and Structure', 'Words in Context', 'medium',
$q$Although critics at first dismissed the novelist's spare, unadorned prose as ______, later readers came to see its simplicity as a deliberate choice that heightened the story's emotional force.$q$,
$q$Which choice completes the text with the most logical and precise word or phrase?$q$, 'mcq',
$j$[{"key":"A","text":"artless","rationale":"Correct. Artless means lacking skill or sophistication, a dismissive reading of simple prose that later readers reversed by calling the simplicity deliberate."},{"key":"B","text":"ornate","rationale":"Ornate means elaborately decorated, the opposite of \"spare, unadorned.\""},{"key":"C","text":"deceptive","rationale":"Nothing in the text suggests critics thought the prose was misleading."},{"key":"D","text":"prolific","rationale":"Prolific describes producing a lot of work; it doesn't describe a style of prose."}]$j$,
'A', '{}',
$q$**Strategy:** "Although" signals a contrast between what critics thought at first and what later readers thought.

Later readers saw the simplicity as **deliberate** and effective. So the early critics must have seen it as simple *by accident*, or unskilled. *Artless* captures that criticism.$q$, 'original', true),

('rw', 'Craft and Structure', 'Text Structure and Purpose', 'medium',
$q$For decades, the conventional view held that octopuses, being solitary animals, had little need for complex social behavior. Then researchers off the coast of Australia observed a site where dozens of octopuses lived close together and signaled to one another with changes in skin color and posture. The observation has prompted biologists to reconsider how much social behavior supposedly solitary species may be capable of.$q$,
$q$Which choice best describes the overall structure of the text?$q$, 'mcq',
$j$[{"key":"A","text":"It presents a long-held assumption, describes an observation that challenges it, and notes the observation's effect on researchers' thinking.","rationale":"Correct. Sentence 1 is the assumption, sentence 2 the challenging observation, sentence 3 the effect on biologists."},{"key":"B","text":"It describes an experiment, reports its results, and explains why the results were rejected.","rationale":"The text describes an observation, not an experiment, and nothing was rejected."},{"key":"C","text":"It compares two species of octopus and argues that one is more social than the other.","rationale":"Only one group of octopuses is discussed; there is no comparison of species."},{"key":"D","text":"It lists several theories about octopus behavior and identifies the most widely accepted one.","rationale":"Only one view is presented, and the text questions it rather than endorsing it."}]$j$,
'A', '{}',
$q$**Strategy:** Label each sentence's job, then match the sequence.

1. "For decades, the conventional view held..." → long-held assumption
2. "Then researchers... observed..." → evidence against it
3. "The observation has prompted biologists to reconsider..." → consequence

Choice A matches all three in order.$q$, 'original', true),

('rw', 'Craft and Structure', 'Cross-Text Connections', 'hard',
$q$**Text 1**
Many economists argue that raising the minimum wage reduces employment, because employers respond to higher labor costs by hiring fewer workers. Studies of small, targeted increases, they contend, can hide these effects by measuring outcomes over only short periods, before employers have had time to adjust.

**Text 2**
Economist Lena Ortiz compared pairs of neighboring counties on opposite sides of a state border, where one state had raised its minimum wage and the other had not. Over the following eighteen months, she found no significant difference in employment among restaurant workers, the group most likely to be affected by the change.$q$,
$q$Based on the texts, how would the economists in Text 1 most likely respond to Ortiz's findings?$q$, 'mcq',
$j$[{"key":"A","text":"They would question whether eighteen months is long enough to detect the employment effects they expect.","rationale":"Correct. Text 1 says short study periods can hide effects \"before employers have had time to adjust,\" which applies directly to an eighteen-month window."},{"key":"B","text":"They would agree that her findings show minimum wage increases have no effect on employment.","rationale":"Text 1's economists believe increases do reduce employment, so they wouldn't simply accept a finding of no effect."},{"key":"C","text":"They would point out that restaurant workers are unlikely to be affected by minimum wage changes.","rationale":"Text 2 says restaurant workers are the group most likely to be affected, and Text 1 never disputes this."},{"key":"D","text":"They would argue that comparing neighboring counties exaggerates the employment losses caused by wage increases.","rationale":"Ortiz found no losses, so there is nothing to exaggerate, and Text 1 doesn't discuss this method."}]$j$,
'A', '{}',
$q$**Strategy:** Find the specific objection Text 1 raises, then check whether Text 2's study is open to it.

Text 1's objection: short studies can hide effects. Text 2's study lasted eighteen months, a short period by that standard. So Text 1's economists would likely say the study ended too soon (A).$q$, 'original', true),

-- Reading & Writing: Expression of Ideas ----------------------------------
('rw', 'Expression of Ideas', 'Transitions', 'easy',
$q$The Atacama Desert in Chile is one of the driest places on Earth; some of its weather stations have never recorded rain. ______ the desert is home to more than 500 species of flowering plants, many of which bloom only after rare rainfall events.$q$,
$q$Which choice completes the text with the most logical transition?$q$, 'mcq',
$j$[{"key":"A","text":"Similarly,","rationale":"Similarly signals a comparable idea, but abundant plant life contrasts with extreme dryness."},{"key":"B","text":"Nevertheless,","rationale":"Correct. Nevertheless signals a surprising contrast: despite almost no rain, many plant species live there."},{"key":"C","text":"Therefore,","rationale":"Therefore signals a result, but extreme dryness doesn't cause a large number of flowering plants."},{"key":"D","text":"For instance,","rationale":"For instance introduces an example of the previous idea; 500 plant species is not an example of dryness."}]$j$,
'B', '{}',
$q$**Strategy:** Decide the relationship between the two sentences before reading the choices.

Sentence 1: extremely dry. Sentence 2: lots of flowering plants. That is a **contrast**, so you need a contrast transition: *Nevertheless*.$q$, 'original', true),

('rw', 'Expression of Ideas', 'Transitions', 'medium',
$q$Early bicycles had an enormous front wheel that made them fast but dangerous to ride. In the 1880s, the "safety bicycle" introduced two wheels of equal size and a chain drive. ______ cycling quickly became popular among people who had found the older design too risky.$q$,
$q$Which choice completes the text with the most logical transition?$q$, 'mcq',
$j$[{"key":"A","text":"As a result,","rationale":"Correct. The safer design caused cycling to spread to people who had avoided the dangerous older bicycles."},{"key":"B","text":"In contrast,","rationale":"Nothing is being contrasted; the last sentence follows from the one before it."},{"key":"C","text":"Likewise,","rationale":"Likewise signals a parallel idea, not a consequence."},{"key":"D","text":"Even so,","rationale":"Even so signals that something happened despite the previous point, but the safer design helped popularity rather than working against it."}]$j$,
'A', '{}',
$q$**Strategy:** Ask "why did the third sentence happen?" If the previous sentence is the reason, use a cause-and-effect transition.

The safety bicycle removed the danger → people who feared the old design started cycling. That's cause → effect: *As a result*.$q$, 'original', true),

('rw', 'Expression of Ideas', 'Rhetorical Synthesis', 'medium',
$q$While researching a topic, a student has taken the following notes:

- The Great Green Wall is an initiative to restore land across Africa's Sahel region.
- It was launched in 2007 by the African Union.
- Its goal is to restore 100 million hectares of degraded land by 2030.
- Participating countries plant trees and adopt new farming practices.$q$,
$q$The student wants to emphasize the scale of the initiative's goal. Which choice most effectively uses relevant information from the notes to accomplish this goal?$q$, 'mcq',
$j$[{"key":"A","text":"The Great Green Wall, launched by the African Union in 2007, is an initiative in Africa's Sahel region.","rationale":"Gives the launch date and location but says nothing about the size of the goal."},{"key":"B","text":"The Great Green Wall aims to restore 100 million hectares of degraded land across Africa's Sahel region by 2030.","rationale":"Correct. \"100 million hectares\" across a whole region conveys the scale of the goal."},{"key":"C","text":"Countries participating in the Great Green Wall plant trees and adopt new farming practices.","rationale":"Describes methods, not the scale of the goal."},{"key":"D","text":"In 2007, the African Union launched an initiative involving trees.","rationale":"Vague and omits the goal entirely."}]$j$,
'B', '{}',
$q$**Strategy:** Rhetorical synthesis questions are about the stated goal, not about which sentence is most informative.

The goal is to emphasize **scale**. The only note that shows scale is "100 million hectares... by 2030," and only B uses it.$q$, 'original', true),

('rw', 'Expression of Ideas', 'Rhetorical Synthesis', 'hard',
$q$While researching a topic, a student has taken the following notes:

- Mary Anning (1799–1847) was a fossil collector in Lyme Regis, England.
- At age 12, she and her brother found the first ichthyosaur skeleton to be correctly identified.
- She later discovered the first complete plesiosaur skeleton.
- Because she was a woman, she was not allowed to join the Geological Society of London.
- Scientists frequently published descriptions of her finds without crediting her.$q$,
$q$The student wants to explain why Anning's contributions were underrecognized during her lifetime. Which choice most effectively uses relevant information from the notes to accomplish this goal?$q$, 'mcq',
$j$[{"key":"A","text":"Mary Anning discovered both the first correctly identified ichthyosaur and the first complete plesiosaur skeleton.","rationale":"Shows her contributions were important but doesn't explain why they went unrecognized."},{"key":"B","text":"Mary Anning, a fossil collector from Lyme Regis, England, lived from 1799 to 1847.","rationale":"Background only; it gives no reason for a lack of recognition."},{"key":"C","text":"Excluded from the Geological Society of London because she was a woman, Mary Anning often saw scientists publish descriptions of her discoveries without crediting her.","rationale":"Correct. It gives both reasons: exclusion from the scientific society and uncredited publication of her finds."},{"key":"D","text":"At age 12, Mary Anning and her brother found an ichthyosaur skeleton in Lyme Regis.","rationale":"Describes a discovery, not why she lacked recognition."}]$j$,
'C', '{}',
$q$**Strategy:** The goal asks *why*, so the answer must contain causes.

The notes give two causes: she couldn't join the Geological Society, and others published her finds without credit. Only C includes them. A is tempting because it shows her importance, but importance isn't the same as a reason for being overlooked.$q$, 'original', true),

-- Reading & Writing: Standard English Conventions -------------------------
('rw', 'Standard English Conventions', 'Boundaries', 'easy',
$q$The museum's newest exhibit features more than 200 ______ some of which have never before been displayed to the public.$q$,
$q$Which choice completes the text so that it conforms to the conventions of Standard English?$q$, 'mcq',
$j$[{"key":"A","text":"photographs,","rationale":"Correct. A comma correctly sets off the nonessential clause \"some of which have never before been displayed.\""},{"key":"B","text":"photographs;","rationale":"A semicolon must join two independent clauses, and \"some of which have never before been displayed\" can't stand alone."},{"key":"C","text":"photographs.","rationale":"A period leaves \"Some of which have never before been displayed to the public\" as a sentence fragment."},{"key":"D","text":"photographs","rationale":"A \"some of which\" clause adds extra information and must be set off with a comma."}]$j$,
'A', '{}',
$q$**Rule:** "Some of which," "many of whom," "most of which," and similar phrases start dependent clauses. They attach to the main clause with a **comma**, never a semicolon or period.$q$, 'original', true),

('rw', 'Standard English Conventions', 'Boundaries', 'medium',
$q$In 1952, Rosalind Franklin's X-ray images helped reveal the double-helix structure of ______ her contribution was not widely acknowledged until years after her death.$q$,
$q$Which choice completes the text so that it conforms to the conventions of Standard English?$q$, 'mcq',
$j$[{"key":"A","text":"DNA,","rationale":"A comma alone between two independent clauses creates a comma splice."},{"key":"B","text":"DNA;","rationale":"Correct. A semicolon properly joins two closely related independent clauses."},{"key":"C","text":"DNA","rationale":"No punctuation creates a run-on sentence."},{"key":"D","text":"DNA, however,","rationale":"\"However\" is not a conjunction, so a comma before it still leaves a comma splice. It would need a semicolon: \"DNA; however,\"."}]$j$,
'B', '{}',
$q$**Rule:** Two independent clauses must be joined by a period, a semicolon, or a comma plus a FANBOYS conjunction (for, and, nor, but, or, yet, so).

Both "Franklin's images helped reveal the structure of DNA" and "her contribution was not widely acknowledged" are complete sentences. Only the semicolon (B) joins them correctly.$q$, 'original', true),

('rw', 'Standard English Conventions', 'Form, Structure, and Sense', 'medium',
$q$The collection of rare manuscripts, which includes letters from several 18th-century scientists, ______ been digitized so that researchers around the world can study it.$q$,
$q$Which choice completes the text so that it conforms to the conventions of Standard English?$q$, 'mcq',
$j$[{"key":"A","text":"have","rationale":"\"Have\" is plural, but the subject \"collection\" is singular."},{"key":"B","text":"has","rationale":"Correct. The singular subject \"collection\" takes the singular verb \"has.\""},{"key":"C","text":"are having","rationale":"Plural and wrong in form: \"are having been digitized\" isn't grammatical."},{"key":"D","text":"were","rationale":"Plural, and \"were been\" isn't grammatical."}]$j$,
'B', '{}',
$q$**Strategy:** Cross out everything between the subject and the verb.

"The collection ~~of rare manuscripts, which includes letters from several 18th-century scientists,~~ ___ been digitized." The subject is **collection** (singular), so the verb is **has**. The pronoun "it" at the end confirms the singular subject.$q$, 'original', true),

('rw', 'Standard English Conventions', 'Form, Structure, and Sense', 'hard',
$q$By the time the expedition finally reached the summit, the climbers ______ for nearly eleven hours without a break.$q$,
$q$Which choice completes the text so that it conforms to the conventions of Standard English?$q$, 'mcq',
$j$[{"key":"A","text":"climb","rationale":"Present tense doesn't fit a sentence set in the past (\"reached\")."},{"key":"B","text":"will have climbed","rationale":"Future perfect refers to the future, but the summit was already reached."},{"key":"C","text":"had been climbing","rationale":"Correct. Past perfect progressive describes an ongoing action that continued up to a point in the past."},{"key":"D","text":"are climbing","rationale":"Present progressive doesn't fit a completed past event."}]$j$,
'C', '{}',
$q$**Rule:** "By the time [past event]" signals an action that was already happening *before* another past event. Use the past perfect ("had climbed") or past perfect progressive ("had been climbing"). "For nearly eleven hours" stresses duration, so the progressive form fits best.$q$, 'original', true),

-- Math: Algebra -----------------------------------------------------------
('math', 'Algebra', 'Linear equations in one variable', 'easy', null,
$q$If $3x + 7 = 22$, what is the value of $6x$?$q$, 'mcq',
$j$[{"key":"A","text":"5","rationale":"This is the value of x, not 6x."},{"key":"B","text":"15","rationale":"This is the value of 3x. The question asks for 6x."},{"key":"C","text":"30","rationale":"Correct. 3x = 15, so 6x = 2(3x) = 30."},{"key":"D","text":"45","rationale":"This is 3(3x). Doubling 3x gives 6x, not tripling it."}]$j$,
'C', '{}',
$q$**Solve:** $3x + 7 = 22 \Rightarrow 3x = 15$.

**Shortcut:** You don't need $x$. Since $6x = 2(3x)$, $6x = 2 \times 15 = 30$.

**Trap:** Stopping at $x = 5$ (A) or $3x = 15$ (B). Always reread what the question asks for.$q$, 'original', true),

('math', 'Algebra', 'Linear functions', 'medium', null,
$q$A plumber charges a fixed fee plus an hourly rate. A 2-hour job costs \$170, and a 5-hour job costs \$335. What is the plumber's fixed fee?$q$, 'mcq',
$j$[{"key":"A","text":"$55","rationale":"This is the hourly rate, not the fixed fee."},{"key":"B","text":"$60","rationale":"Correct. Rate = (335 − 170) ÷ 3 = 55; fee = 170 − 2(55) = 60."},{"key":"C","text":"$85","rationale":"This is 170 ÷ 2, which treats the whole cost as hourly with no fixed fee."},{"key":"D","text":"$115","rationale":"This subtracts only one hour's rate (170 − 55). A 2-hour job includes two hours."}]$j$,
'B', '{}',
$q$Let cost $C = f + rh$.

1. **Rate (slope):** $r = \dfrac{335 - 170}{5 - 2} = \dfrac{165}{3} = 55$ dollars per hour.
2. **Fee (intercept):** $170 = f + 55(2) \Rightarrow f = 60$.

**Check:** $60 + 55(5) = 335$ ✓$q$, 'original', true),

('math', 'Algebra', 'Systems of two linear equations in two variables', 'medium', null,
$q$$$2x + 3y = 19$$ $$x - y = 2$$ If $(x, y)$ is the solution to the system of equations above, what is the value of $x$?$q$, 'spr',
'[]'::jsonb, '5', '{5}',
$q$**Substitution:** From the second equation, $x = y + 2$.

$2(y + 2) + 3y = 19 \Rightarrow 5y + 4 = 19 \Rightarrow y = 3$, so $x = 5$.

**Check:** $2(5) + 3(3) = 19$ ✓ and $5 - 3 = 2$ ✓

**Desmos:** Graph both lines and click the intersection point: $(5, 3)$.$q$, 'original', true),

('math', 'Algebra', 'Linear inequalities in one or two variables', 'hard', null,
$q$A school has \$1,200 to spend on a field trip. Renting a bus costs \$350, and each student ticket costs \$18. What is the maximum number of students who can go on the trip?$q$, 'mcq',
$j$[{"key":"A","text":"47","rationale":"Correct. 350 + 18s ≤ 1200 → s ≤ 47.2, and s must be a whole number, so 47."},{"key":"B","text":"48","rationale":"Rounding 47.2 up breaks the budget: 350 + 18(48) = 1214 > 1200."},{"key":"C","text":"66","rationale":"This ignores the bus: 1200 ÷ 18 ≈ 66.7."},{"key":"D","text":"86","rationale":"This adds the bus cost instead of subtracting it: (1200 + 350) ÷ 18 ≈ 86.1."}]$j$,
'A', '{}',
$q$Let $s$ be the number of students: $350 + 18s \le 1200$.

$18s \le 850 \Rightarrow s \le 47.\overline{2}$.

Students come in whole numbers, and you can't exceed the budget, so round **down**: $s = 47$.

**Check:** $350 + 18(47) = 1196 \le 1200$ ✓, while $48$ students would cost $1214$.$q$, 'original', true),

-- Math: Advanced Math -----------------------------------------------------
('math', 'Advanced Math', 'Equivalent expressions', 'easy', null,
$q$Which expression is equivalent to $(x + 4)(x - 4) + 16$?$q$, 'mcq',
$j$[{"key":"A","text":"$x^2$","rationale":"Correct. (x + 4)(x − 4) = x² − 16, and x² − 16 + 16 = x²."},{"key":"B","text":"$x^2 + 32$","rationale":"This treats (x + 4)(x − 4) as x² + 16. The product of a sum and difference is x² − 16."},{"key":"C","text":"$x^2 + 8x$","rationale":"This would come from (x + 4)² − 16, not from (x + 4)(x − 4) + 16."},{"key":"D","text":"$x^2 - 32$","rationale":"This subtracts 16 twice. The +16 cancels the −16."}]$j$,
'A', '{}',
$q$**Difference of squares:** $(a + b)(a - b) = a^2 - b^2$.

$(x + 4)(x - 4) = x^2 - 16$, then $x^2 - 16 + 16 = x^2$.

**Check with a number:** at $x = 1$: $(5)(-3) + 16 = 1 = 1^2$ ✓$q$, 'original', true),

('math', 'Advanced Math', 'Nonlinear functions', 'medium', null,
$q$The function $f$ is defined by $f(x) = 2(x - 3)^2 + 5$. What is the minimum value of $f(x)$?$q$, 'mcq',
$j$[{"key":"A","text":"3","rationale":"3 is the x-value where the minimum occurs, not the minimum value itself."},{"key":"B","text":"5","rationale":"Correct. (x − 3)² ≥ 0, so f(x) ≥ 5, with equality at x = 3."},{"key":"C","text":"−3","rationale":"Sign error on the x-coordinate, and it's still an x-value rather than f(x)."},{"key":"D","text":"23","rationale":"This is f(0) = 2(9) + 5, the y-intercept, not the minimum."}]$j$,
'B', '{}',
$q$The function is in **vertex form** $a(x - h)^2 + k$ with vertex $(h, k) = (3, 5)$.

Since $a = 2 > 0$, the parabola opens upward, so the vertex is a minimum. The minimum **value** is $k = 5$.

**Trap:** "Minimum value" means the output $f(x)$, not the input $x$.$q$, 'original', true),

('math', 'Advanced Math', 'Nonlinear functions', 'medium', null,
$q$A bacteria culture doubles in size every 3 hours. If the culture starts with 400 bacteria, which expression gives the number of bacteria after $t$ hours?$q$, 'mcq',
$j$[{"key":"A","text":"$400(2)^{3t}$","rationale":"This doubles 3 times every hour instead of once every 3 hours."},{"key":"B","text":"$400(2)^{t/3}$","rationale":"Correct. The number of doublings after t hours is t/3."},{"key":"C","text":"$400(3)^{t/2}$","rationale":"This swaps the roles: it triples every 2 hours."},{"key":"D","text":"$\\frac{800t}{3}$","rationale":"This is linear growth. Doubling is exponential."}]$j$,
'B', '{}',
$q$**Exponential model:** $N(t) = N_0 \cdot b^{t/p}$, where $b$ is the growth factor and $p$ is how long one cycle takes.

Here $N_0 = 400$, $b = 2$, $p = 3$: $N(t) = 400(2)^{t/3}$.

**Check:** at $t = 3$, $400(2)^1 = 800$ ✓ (doubled once).$q$, 'original', true),

('math', 'Advanced Math', 'Nonlinear equations in one variable and systems of equations in two variables', 'hard', null,
$q$$$x^2 + y^2 = 25$$ $$y = x + 1$$ The graphs of the equations above intersect at two points. What is the product of the $x$-coordinates of the two points?$q$, 'spr',
'[]'::jsonb, '-12', '{-12}',
$q$**Substitute** $y = x + 1$:

$x^2 + (x + 1)^2 = 25 \Rightarrow 2x^2 + 2x + 1 = 25 \Rightarrow x^2 + x - 12 = 0$.

**Factor:** $(x + 4)(x - 3) = 0$, so $x = -4$ or $x = 3$. Product: $-12$.

**Shortcut (Vieta):** for $x^2 + bx + c = 0$, the product of the roots is $c = -12$. No solving needed.$q$, 'original', true),

-- Math: Problem-Solving and Data Analysis ---------------------------------
('math', 'Problem-Solving and Data Analysis', 'Percentages', 'easy', null,
$q$A jacket originally priced at \$80 is on sale for 25% off. What is the sale price of the jacket?$q$, 'mcq',
$j$[{"key":"A","text":"$20","rationale":"This is the discount amount (25% of 80), not the sale price."},{"key":"B","text":"$55","rationale":"This subtracts 25 dollars instead of 25 percent."},{"key":"C","text":"$60","rationale":"Correct. 80 × 0.75 = 60."},{"key":"D","text":"$100","rationale":"This adds 25% instead of subtracting it."}]$j$,
'C', '{}',
$q$25% off means you pay 75%: $80 \times 0.75 = 60$.

**Habit:** for a percent decrease of $p\%$, multiply by $(1 - p/100)$. It's one step and avoids the "discount vs. sale price" trap.$q$, 'original', true),

('math', 'Problem-Solving and Data Analysis', 'Ratios, rates, proportional relationships, and units', 'medium', null,
$q$A car travels 150 miles on 6 gallons of gas. At this rate, how many gallons of gas are needed to travel 425 miles?$q$, 'mcq',
$j$[{"key":"A","text":"15","rationale":"15 gallons would cover only 375 miles at 25 miles per gallon."},{"key":"B","text":"17","rationale":"Correct. 150 ÷ 6 = 25 miles per gallon; 425 ÷ 25 = 17 gallons."},{"key":"C","text":"18","rationale":"18 gallons would cover 450 miles, more than needed."},{"key":"D","text":"25","rationale":"This is the rate in miles per gallon, not the number of gallons."}]$j$,
'B', '{}',
$q$**Unit rate:** $150 \div 6 = 25$ miles per gallon.

**Gallons needed:** $425 \div 25 = 17$.

**Proportion check:** $\dfrac{6}{150} = \dfrac{g}{425} \Rightarrow g = \dfrac{6 \times 425}{150} = 17$ ✓$q$, 'original', true),

('math', 'Problem-Solving and Data Analysis', 'Probability and conditional probability', 'medium',
$q$|  | Plays a sport | Does not play a sport | Total |
| --- | --- | --- | --- |
| Grade 11 | 42 | 38 | 80 |
| Grade 12 | 36 | 54 | 90 |
| Total | 78 | 92 | 170 |$q$,
$q$The table summarizes a survey of 170 students. If a student who plays a sport is selected at random, what is the probability that the student is in grade 12?$q$, 'mcq',
$j$[{"key":"A","text":"$\\frac{36}{170}$","rationale":"This is the probability a random student from everyone plays a sport AND is in grade 12. The question restricts to students who play a sport."},{"key":"B","text":"$\\frac{36}{90}$","rationale":"This is the probability a grade 12 student plays a sport: the condition is reversed."},{"key":"C","text":"$\\frac{6}{13}$","rationale":"Correct. Of the 78 students who play a sport, 36 are in grade 12: 36/78 = 6/13."},{"key":"D","text":"$\\frac{78}{170}$","rationale":"This is the probability that any student plays a sport."}]$j$,
'C', '{}',
$q$**Conditional probability:** "If a student who plays a sport is selected" sets the denominator to that group.

- Denominator: students who play a sport = 78
- Numerator: of those, grade 12 = 36

$\dfrac{36}{78} = \dfrac{6}{13}$.

**Trap:** B reverses the condition (grade 12 students who play a sport).$q$, 'original', true),

('math', 'Problem-Solving and Data Analysis', 'One-variable data: distributions and measures of center and spread', 'medium', null,
$q$The mean of 5 numbers is 12. When a sixth number is added, the mean of the 6 numbers is 13. What is the sixth number?$q$, 'mcq',
$j$[{"key":"A","text":"13","rationale":"Adding 13 would raise the mean less than 1. The new number must be well above the new mean."},{"key":"B","text":"14","rationale":"This guesses that the new number is one more than the new mean. Use sums instead."},{"key":"C","text":"18","rationale":"Correct. Old sum = 60, new sum = 78, so the sixth number is 18."},{"key":"D","text":"25","rationale":"This is 12 + 13, which doesn't follow from the sums."}]$j$,
'C', '{}',
$q$**Work with sums, not means.**

- Original sum: $5 \times 12 = 60$
- New sum: $6 \times 13 = 78$
- Sixth number: $78 - 60 = 18$

**Intuition:** the new number must lift each of the 6 values' share by 1, so it is $13 + 5 = 18$.$q$, 'original', true),

('math', 'Problem-Solving and Data Analysis', 'Inference from sample statistics and margin of error', 'hard', null,
$q$A random sample of 400 voters in a city found that 58% support a proposed park. The margin of error for the estimate is 4 percentage points. Which conclusion is most appropriate?$q$, 'mcq',
$j$[{"key":"A","text":"Exactly 58% of all voters in the city support the proposed park.","rationale":"A sample estimate is never exact for the whole population; that's why there's a margin of error."},{"key":"B","text":"It is plausible that between 54% and 62% of all voters in the city support the proposed park.","rationale":"Correct. 58% ± 4% gives a plausible range for the whole population."},{"key":"C","text":"Between 54% and 62% of the 400 voters surveyed support the proposed park.","rationale":"Exactly 58% of the surveyed voters support it; the margin of error describes the population, not the sample."},{"key":"D","text":"The proposal will certainly pass if all voters in the city vote.","rationale":"Too strong. A plausible range above 50% isn't a certainty, and not everyone who supports it will necessarily vote."}]$j$,
'B', '{}',
$q$**Margin of error** gives a range of plausible values for the **population** parameter:

$58\% \pm 4\% \Rightarrow 54\%$ to $62\%$.

**Watch for:** "exactly" (A), applying the range to the sample (C), and words like "certainly" (D). SAT correct answers use cautious language like *plausible* or *likely*.$q$, 'original', true),

-- Math: Geometry and Trigonometry -----------------------------------------
('math', 'Geometry and Trigonometry', 'Area and volume', 'easy', null,
$q$A rectangular box has a length of 6 inches, a width of 4 inches, and a height of 5 inches. What is the volume of the box, in cubic inches?$q$, 'mcq',
$j$[{"key":"A","text":"15","rationale":"This adds the dimensions (6 + 4 + 5) instead of multiplying them."},{"key":"B","text":"74","rationale":"This adds the three different face areas once (24 + 30 + 20). Volume multiplies the three dimensions."},{"key":"C","text":"120","rationale":"Correct. V = 6 × 4 × 5 = 120."},{"key":"D","text":"148","rationale":"This is the surface area: 2(24 + 30 + 20) = 148."}]$j$,
'C', '{}',
$q$**Volume of a rectangular prism:** $V = \ell w h = 6 \times 4 \times 5 = 120$.

**Trap:** surface area $2(\ell w + \ell h + wh) = 148$ (D). Volume is *cubic* units; surface area is *square* units.$q$, 'original', true),

('math', 'Geometry and Trigonometry', 'Lines, angles, and triangles', 'medium', null,
$q$In triangle $ABC$, the measure of angle $A$ is $48^\circ$, and the measure of angle $B$ is twice the measure of angle $C$. What is the measure of angle $B$?$q$, 'mcq',
$j$[{"key":"A","text":"44°","rationale":"This is angle C. Angle B is twice that."},{"key":"B","text":"66°","rationale":"This splits the remaining 132° evenly, ignoring that B = 2C."},{"key":"C","text":"88°","rationale":"Correct. B + C = 132 and B = 2C, so 3C = 132, C = 44, B = 88."},{"key":"D","text":"96°","rationale":"This doubles angle A (48 × 2), but B is twice angle C, not angle A."}]$j$,
'C', '{}',
$q$**Angle sum:** $A + B + C = 180^\circ$, so $B + C = 132^\circ$.

With $B = 2C$: $3C = 132 \Rightarrow C = 44^\circ$, so $B = 88^\circ$.

**Check:** $48 + 88 + 44 = 180$ ✓$q$, 'original', true),

('math', 'Geometry and Trigonometry', 'Right triangles and trigonometry', 'medium', null,
$q$In right triangle $PQR$, angle $R$ is the right angle and $\sin P = \dfrac{5}{13}$. What is the value of $\cos Q$?$q$, 'mcq',
$j$[{"key":"A","text":"$\\frac{12}{13}$","rationale":"This is cos P (and sin Q). The question asks for cos Q."},{"key":"B","text":"$\\frac{5}{13}$","rationale":"Correct. P and Q are complementary, so cos Q = sin P = 5/13."},{"key":"C","text":"$\\frac{13}{5}$","rationale":"This is the reciprocal of sin P; sine and cosine of acute angles are always less than 1."},{"key":"D","text":"$\\frac{5}{12}$","rationale":"This is tan P (opposite/adjacent)."}]$j$,
'B', '{}',
$q$**Complementary angles:** in a right triangle, the two acute angles add to $90^\circ$, and $\sin\theta = \cos(90^\circ - \theta)$.

So $\cos Q = \sin P = \dfrac{5}{13}$.

**Check with sides:** opposite $P$ = 5, hypotenuse = 13. The side opposite $P$ is adjacent to $Q$, so $\cos Q = 5/13$ ✓$q$, 'original', true),

('math', 'Geometry and Trigonometry', 'Circles', 'hard', null,
$q$In the $xy$-plane, the graph of $x^2 + y^2 - 6x + 8y = 11$ is a circle. What is the radius of the circle?$q$, 'spr',
'[]'::jsonb, '6', '{6}',
$q$**Complete the square** for $x$ and $y$:

$(x^2 - 6x + 9) + (y^2 + 8y + 16) = 11 + 9 + 16$

$(x - 3)^2 + (y + 4)^2 = 36$

So the center is $(3, -4)$ and $r = \sqrt{36} = 6$.

**Trap:** answering $\sqrt{11}$ or $36$. Add the completed-square constants to *both* sides, then take the square root.$q$, 'original', true);
