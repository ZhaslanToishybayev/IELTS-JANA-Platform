"""Seed original IELTS-style content for local JANA practice."""

import sys

sys.path.insert(0, ".")

from app.database import Base, SessionLocal, engine
from app.models import Question, Skill, TestSet


Base.metadata.create_all(bind=engine)


READING_SKILLS = [
    ("Reading True/False/Not Given", "TF_NG"),
    ("Reading Headings", "HEADINGS"),
    ("Reading Summary Completion", "SUMMARY"),
    ("Reading Matching Information", "MATCHING_INFO"),
    ("Reading Sentence Completion", "SENTENCE_COMP"),
    ("Reading Multiple Choice", "MCQ"),
    ("Reading Fill in the Blank", "FILL_BLANK"),
]

LISTENING_SKILLS = [
    ("Listening Form Completion", "LISTENING_FORM"),
    ("Listening Map and Plan", "LISTENING_MAP"),
    ("Listening Multiple Choice", "LISTENING_MCQ"),
    ("Listening Matching", "LISTENING_MATCHING"),
    ("Listening Sentence Completion", "LISTENING_SENTENCE"),
]


LEGACY_READING_TITLES = {
    "Urban Wetlands",
    "Community Solar",
    "Museum Storage",
    "Vertical Farming",
    "Noise and Learning",
    "Ancient Trade Routes",
    "Public Libraries",
    "Coral Restoration",
    "Bicycle Infrastructure",
    "Food Waste",
}


READING_PASSAGES = [
    {
        "title": "Bicycle Streets and the Quiet Commute",
        "section": "Passage 1",
        "estimated_band": 6.0,
        "passage": (
            "Many cities once treated cycling as a leisure activity rather than a serious form of transport. "
            "That view has changed as planners study streets where short car journeys create noise, delay, and "
            "air pollution. In the city of Merrow, a three-year pilot replaced painted cycle lanes with protected "
            "bicycle corridors on four commuter routes. The corridors were separated from traffic by low planters, "
            "and delivery bays were moved to side streets so that vans no longer blocked the cycle path during the "
            "morning peak. Surveys showed that cycling trips rose by 28 percent, but the more surprising result was "
            "a fall in complaints about street noise. Electric buses also helped, yet researchers concluded that "
            "the largest change came from fewer short car trips around schools and offices.\n\n"
            "The project was not universally popular. Shop owners initially worried that customers would avoid streets "
            "with fewer parking spaces. After six months, however, receipts from small cafes increased slightly because "
            "more people stopped on foot or by bicycle. Traffic delays did not disappear, especially near the central "
            "railway station, where roadworks continued throughout the study. The final report argued that bicycle "
            "streets work best when they are connected to public transport and when loading rules are enforced. It also "
            "warned that paint alone rarely changes travel behaviour; riders need routes that feel continuous and safe. "
            "A follow-up interview programme found that new cyclists were less interested in speed than in predictability. "
            "They wanted fewer sudden merges with buses, clearer junctions, and places to leave bicycles near workplaces. "
            "For planners, this meant that small design details shaped whether the route became part of everyday life."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "Merrow's pilot used physical separation rather than only painted cycle lanes.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage says painted lanes were replaced with protected corridors separated by low planters, so the statement is True.",
            },
            {
                "type": "TF_NG",
                "text": "The bicycle corridors removed all traffic delays near the central railway station.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "The passage states that delays did not disappear near the central railway station because roadworks continued, so the claim is False.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "How safer cycling routes changed urban travel",
                    "The invention of the electric bus",
                    "Why railway stations no longer need roads",
                    "A guide to opening a city cafe",
                ],
                "answer": "How safer cycling routes changed urban travel",
                "explanation": "The whole passage focuses on protected cycling corridors, their effects on travel behaviour, and the conditions that made them useful.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: Cycling trips in Merrow rose by ____ percent.",
                "answer": "28",
                "explanation": "The first paragraph reports that surveys showed cycling trips rose by 28 percent during the pilot.",
            },
            {
                "type": "MCQ",
                "text": "What did the final report say was necessary for bicycle streets to work best?",
                "options": [
                    "connections to public transport and enforced loading rules",
                    "free parking outside every shop",
                    "closing the railway station",
                    "using paint instead of planters",
                ],
                "answer": "connections to public transport and enforced loading rules",
                "explanation": "The final report specifically argued that bicycle streets work best when connected to public transport and loading rules are enforced.",
            },
            {
                "type": "SENTENCE_COMP",
                "text": "Complete the sentence: Delivery bays were moved to ____ streets.",
                "answer": "side",
                "explanation": "The passage explains that delivery bays were moved to side streets to stop vans blocking the cycle path.",
            },
            {
                "type": "FILL_BLANK",
                "text": "Fill the blank: Researchers linked the largest change in noise complaints to fewer short ____ trips.",
                "answer": "car",
                "explanation": "Although electric buses helped, researchers concluded that the largest change came from fewer short car trips.",
            },
        ],
    },
    {
        "title": "How Memory Changes During Practice",
        "section": "Passage 1",
        "estimated_band": 6.5,
        "passage": (
            "Students often imagine memory as a shelf on which facts are stored, but psychologists describe it as a "
            "system that is rebuilt whenever information is used. A learner who reads the same paragraph five times "
            "may feel familiar with it, yet familiarity is not the same as recall. In one study at Northbridge College, "
            "two groups studied unfamiliar biology terms. The first group reread definitions for thirty minutes, while "
            "the second group studied for ten minutes and then tried to write the meanings from memory. On a quiz two "
            "days later, the retrieval group remembered more terms even though they had spent less time looking at the "
            "page.\n\n"
            "Researchers argue that the effort of recalling information creates useful signals about what is still weak. "
            "Mistakes are not simply failures; they show the learner which connections need repair. Spacing also matters. "
            "Short practice sessions spread across several days produced stronger results than one long evening session. "
            "However, the study did not claim that rereading is useless. Rereading helped students notice the structure "
            "of a complex text, especially before their first attempt at recall. The strongest progress came when students "
            "combined brief review, self-testing, and correction of errors. The researchers therefore recommended that "
            "teachers give frequent low-pressure quizzes rather than relying only on final exams. They also advised "
            "students to write down uncertain answers before checking notes, because the comparison made forgotten details "
            "more visible. This approach required patience: early quiz scores sometimes looked worse, but later recall was "
            "more stable and students were better able to explain ideas in their own words."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "The retrieval group spent less time looking at the page than the rereading group.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage says the retrieval group studied for ten minutes while the rereading group reread for thirty minutes.",
            },
            {
                "type": "TF_NG",
                "text": "The study proved that rereading should never be used by students.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "The passage explicitly says the study did not claim rereading is useless and notes that it can help with text structure.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "Why recalling information strengthens learning",
                    "The history of biology textbooks",
                    "A debate about college entrance tests",
                    "How teachers design final exams",
                ],
                "answer": "Why recalling information strengthens learning",
                "explanation": "The main idea is that retrieval, spacing, and correction improve memory more effectively than simple rereading alone.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: The strongest progress came from brief review, self-testing, and correction of ____.",
                "answer": "errors",
                "explanation": "The final paragraph states that strongest progress came when students combined brief review, self-testing, and correction of errors.",
            },
            {
                "type": "MATCHING_INFO",
                "text": "Which activity helped students notice the structure of a complex text?",
                "options": ["rereading", "guessing answers", "drawing maps", "final exams"],
                "answer": "rereading",
                "explanation": "The passage says rereading helped students notice the structure of a complex text before recall.",
            },
            {
                "type": "MCQ",
                "text": "Why are mistakes useful according to the researchers?",
                "options": [
                    "They show which connections need repair",
                    "They make rereading unnecessary",
                    "They prove the quiz is unfair",
                    "They reduce the need for practice",
                ],
                "answer": "They show which connections need repair",
                "explanation": "The passage explains that mistakes reveal weak connections that need repair, making them useful signals for learners.",
            },
            {
                "type": "FILL_BLANK",
                "text": "Fill the blank: Short practice sessions spread across several days produced stronger ____.",
                "answer": "results",
                "explanation": "The passage contrasts spaced short sessions with one long evening session and says the spaced sessions produced stronger results.",
            },
        ],
    },
    {
        "title": "Renewable Energy on Working Farms",
        "section": "Passage 2",
        "estimated_band": 6.5,
        "passage": (
            "Renewable energy projects are often described as separate from agriculture, but some farms now combine food "
            "production with electricity generation. In the Lanton Valley, several sheep farms installed rows of solar "
            "panels above grazing land. The panels were high enough for animals to move underneath, and the partial shade "
            "reduced heat stress during dry summers. Farmers reported that grass stayed green for longer beneath the panels, "
            "although the shaded areas were not suitable for every crop. Engineers monitored the site for two years and "
            "found that electricity output was slightly lower than on a bare solar field because the panels were spaced "
            "further apart.\n\n"
            "The economic results were mixed but promising. Income from electricity helped farmers manage years when wool "
            "prices fell, while the land continued to produce food. Local residents were more willing to support the project "
            "after visiting an open day and seeing that the valley had not become an industrial zone. Conservation groups "
            "asked for wider strips of wildflowers around the fences to support insects. By the second year, the operators "
            "had added these strips and changed mowing schedules. The project showed that renewable energy can share land "
            "with farming, but only when design decisions consider animals, crops, landscape views, and local trust together."
            " Farmers also learned that communication mattered as much as engineering. Maps, open days, and clear answers "
            "about grazing helped residents judge the project for themselves rather than relying on rumours about lost "
            "fields. The valley became a case study for councils looking for energy sites that did not remove productive "
            "land from rural economies."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "The solar panels in Lanton Valley were installed above grazing land.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage says several sheep farms installed rows of solar panels above grazing land.",
            },
            {
                "type": "TF_NG",
                "text": "Electricity output was higher than on a bare solar field.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "Engineers found electricity output was slightly lower because panels were spaced further apart.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "Sharing farmland with solar energy",
                    "Why sheep farming ended in Lanton Valley",
                    "A new method for mining coal",
                    "The history of wool prices",
                ],
                "answer": "Sharing farmland with solar energy",
                "explanation": "The passage focuses on combining solar energy with active farming and the design choices needed to make that sharing work.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: Partial shade reduced heat stress during dry ____.",
                "answer": "summers",
                "explanation": "The first paragraph states that partial shade reduced heat stress during dry summers.",
            },
            {
                "type": "MATCHING_INFO",
                "text": "Which group requested wider wildflower strips?",
                "options": ["conservation groups", "wool buyers", "rail engineers", "school teachers"],
                "answer": "conservation groups",
                "explanation": "The passage says conservation groups asked for wider strips of wildflowers around the fences to support insects.",
            },
            {
                "type": "MCQ",
                "text": "Why did residents become more willing to support the project?",
                "options": [
                    "They visited an open day and saw the valley had not become industrial",
                    "They were promised free wool",
                    "They voted to remove all fences",
                    "They learned that crops no longer mattered",
                ],
                "answer": "They visited an open day and saw the valley had not become industrial",
                "explanation": "Support increased after residents saw during an open day that the project had not turned the valley into an industrial zone.",
            },
            {
                "type": "SENTENCE_COMP",
                "text": "Complete the sentence: Income from ____ helped farmers during years when wool prices fell.",
                "answer": "electricity",
                "explanation": "The economic paragraph says income from electricity helped farmers manage years when wool prices fell.",
            },
            {
                "type": "FILL_BLANK",
                "text": "Fill the blank: Engineers monitored the site for two ____.",
                "answer": "years",
                "explanation": "The passage states that engineers monitored the site for two years before reporting output differences.",
            },
        ],
    },
    {
        "title": "Messages Along Ancient Trade Routes",
        "section": "Passage 2",
        "estimated_band": 7.0,
        "passage": (
            "Ancient trade routes carried more than silk, salt, and spices. They also moved stories, measurements, and "
            "technical knowledge between communities that rarely met face to face. Archaeologists studying a chain of "
            "oasis towns in Central Asia found weights made from local stone but marked with symbols used hundreds of "
            "kilometres away. This suggests that merchants needed shared systems of trust when exchanging goods across "
            "languages and borders. The same excavation uncovered fragments of wooden tablets, probably used for temporary "
            "records rather than formal literature.\n\n"
            "Travel was slow and risky. Caravans planned journeys around wells, seasonal winds, and agreements with local "
            "guides. A route could shift if a water source dried or a ruler demanded higher taxes. For that reason, trade "
            "networks were flexible rather than fixed lines on a map. Some historians once described these routes as early "
            "global highways, but recent research presents a more complicated picture. Many goods travelled in stages, "
            "passing from one regional trader to another. Ideas moved in the same way. A weaving technique might be copied "
            "in one town, adapted in the next, and finally appear in a distant market in a form that no longer matched the "
            "original. The routes were therefore not just channels of exchange, but places where knowledge was reshaped. "
            "This has changed how museums present objects from the period. Instead of labelling a bowl or cloth as evidence "
            "of a single culture, curators increasingly describe the many hands and decisions that may have influenced it. "
            "The object becomes a record of contact, adaptation, and negotiation across distance."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "Archaeologists found stone weights marked with symbols from far away.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage describes local stone weights marked with symbols used hundreds of kilometres away.",
            },
            {
                "type": "TF_NG",
                "text": "The wooden tablets were formal literature written for royal libraries.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "The tablets were probably used for temporary records, not formal literature for royal libraries.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "Trade routes as flexible networks of knowledge",
                    "Why ancient rulers ended all trade",
                    "The invention of modern highways",
                    "A guide to identifying spices",
                ],
                "answer": "Trade routes as flexible networks of knowledge",
                "explanation": "The passage explains that routes moved goods and knowledge through flexible networks where ideas were reshaped.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: Trade networks were flexible rather than fixed lines on a ____.",
                "answer": "map",
                "explanation": "The second paragraph states directly that trade networks were flexible rather than fixed lines on a map.",
            },
            {
                "type": "MATCHING_INFO",
                "text": "Which items were probably used for temporary records?",
                "options": ["wooden tablets", "silk coats", "metal coins", "glass windows"],
                "answer": "wooden tablets",
                "explanation": "The excavation uncovered wooden tablet fragments that were probably used for temporary records.",
            },
            {
                "type": "MCQ",
                "text": "What could cause a route to shift?",
                "options": [
                    "a dry water source or higher taxes",
                    "the invention of railways",
                    "a ban on local guides",
                    "a shortage of formal literature",
                ],
                "answer": "a dry water source or higher taxes",
                "explanation": "The passage says a route could shift if a water source dried or a ruler demanded higher taxes.",
            },
            {
                "type": "SENTENCE_COMP",
                "text": "Complete the sentence: Caravans planned journeys around wells, seasonal winds, and local ____.",
                "answer": "guides",
                "explanation": "The passage lists wells, seasonal winds, and agreements with local guides as factors in caravan planning.",
            },
        ],
    },
    {
        "title": "Biodiversity in the Office Garden",
        "section": "Passage 3",
        "estimated_band": 7.0,
        "passage": (
            "Workplace productivity is usually discussed in terms of software, meetings, or management style. Recently, "
            "however, some companies have examined whether outdoor space can influence concentration. At the Halloway "
            "Design Centre, a plain lawn beside the office was replaced with a garden containing native shrubs, shallow "
            "ponds, and seating areas. The aim was not to create a park for long breaks, but to give employees a short "
            "walk through a varied natural setting. Biologists recorded an increase in bees and small birds within eight "
            "months, while managers tracked changes in staff surveys.\n\n"
            "The results require careful interpretation. Employees reported lower afternoon tiredness, but the company also "
            "introduced flexible lunch times during the same period, so the garden cannot receive all the credit. Team leaders "
            "noticed that informal conversations moved outdoors, where staff from different departments mixed more often. "
            "Maintenance costs were higher in the first year because the ponds needed adjustment and some shrubs failed in "
            "dry soil. By the second year, costs fell as the plants became established. The project suggests that biodiversity "
            "can support workplace wellbeing, but it works best when treated as part of everyday routines rather than as a "
            "decorative feature viewed from a window. The company later added short walking paths with signs naming common "
            "plants and insects. These signs were not meant as formal lessons; they simply encouraged workers to notice "
            "seasonal changes. Staff said the garden felt more useful when it invited brief attention rather than demanding "
            "a long break from work or another scheduled meeting."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "The Halloway garden included native shrubs and shallow ponds.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage says the lawn was replaced with a garden containing native shrubs, shallow ponds, and seating areas.",
            },
            {
                "type": "TF_NG",
                "text": "The company proved that the garden alone caused lower afternoon tiredness.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "The passage warns that flexible lunch times were introduced at the same time, so the garden cannot receive all the credit.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "A workplace garden with cautious benefits",
                    "How software replaced office meetings",
                    "The cost of building urban apartments",
                    "Why staff stopped talking outdoors",
                ],
                "answer": "A workplace garden with cautious benefits",
                "explanation": "The passage presents possible benefits of the garden but repeatedly notes limits and other factors, making the cautious heading best.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: Biologists recorded more bees and small ____.",
                "answer": "birds",
                "explanation": "The first paragraph says biologists recorded an increase in bees and small birds within eight months.",
            },
            {
                "type": "MCQ",
                "text": "Why were maintenance costs higher in the first year?",
                "options": [
                    "ponds needed adjustment and some shrubs failed",
                    "employees demanded longer meetings",
                    "software licences became expensive",
                    "birds damaged office computers",
                ],
                "answer": "ponds needed adjustment and some shrubs failed",
                "explanation": "The passage identifies pond adjustments and failed shrubs in dry soil as reasons for higher first-year maintenance costs.",
            },
            {
                "type": "MATCHING_INFO",
                "text": "Where did informal conversations increasingly take place?",
                "options": ["outdoors", "in elevators", "in parking tunnels", "at railway stations"],
                "answer": "outdoors",
                "explanation": "Team leaders noticed informal conversations moved outdoors, where staff from different departments mixed.",
            },
            {
                "type": "FILL_BLANK",
                "text": "Fill the blank: Flexible lunch ____ were introduced during the same period.",
                "answer": "times",
                "explanation": "The passage notes that flexible lunch times were introduced during the same period as the garden changes.",
            },
        ],
    },
    {
        "title": "Tablets in the Rural Classroom",
        "section": "Passage 3",
        "estimated_band": 6.0,
        "passage": (
            "Technology in education is sometimes judged by the number of devices delivered to schools. A rural tablet "
            "programme in Eastford showed why this measure is incomplete. The first shipment placed one tablet in the hands "
            "of every pupil aged eleven to fourteen, but teachers soon found that devices alone did not change learning. "
            "Internet access was unreliable, and many lessons became slower when students waited for pages to load. The "
            "second phase therefore focused on offline materials, teacher training, and repair plans. Local technicians were "
            "paid to maintain the devices, which reduced the number of broken tablets left unused in cupboards.\n\n"
            "After a year, reading scores improved modestly in classes where teachers used the tablets for short research "
            "tasks and vocabulary review. Scores did not improve in classes where tablets simply replaced exercise books. "
            "Parents valued the programme when pupils could download assignments before travelling home to villages with no "
            "signal. The evaluation concluded that technology helped most when it fitted existing classroom goals. It also "
            "noted that printed books remained important because they were reliable, easy to share, and did not depend on "
            "charging points. The programme's lesson was practical: digital tools can widen access, but only when training, "
            "maintenance, and lesson design receive as much attention as the devices themselves. The evaluation team also "
            "recommended that future projects budget for replacement screens and local technical support from the beginning. "
            "Without those plans, a successful launch could quickly turn into a storeroom of unusable equipment. Eastford's "
            "teachers argued that technology should be judged by classroom use, not delivery photographs."
        ),
        "questions": [
            {
                "type": "TF_NG",
                "text": "The first shipment gave tablets to pupils aged eleven to fourteen.",
                "options": ["True", "False", "Not Given"],
                "answer": "True",
                "explanation": "The passage states that the first shipment placed one tablet in the hands of every pupil aged eleven to fourteen.",
            },
            {
                "type": "TF_NG",
                "text": "Printed books were removed from all Eastford classrooms.",
                "options": ["True", "False", "Not Given"],
                "answer": "False",
                "explanation": "The evaluation noted that printed books remained important, so they were not removed from all classrooms.",
            },
            {
                "type": "HEADINGS",
                "text": "Choose the best heading for the passage.",
                "options": [
                    "Why devices need training and lesson design",
                    "A history of village libraries",
                    "How parents replaced teachers",
                    "The disappearance of printed books",
                ],
                "answer": "Why devices need training and lesson design",
                "explanation": "The passage argues that tablets helped only when supported by offline materials, training, maintenance, and classroom goals.",
            },
            {
                "type": "SUMMARY",
                "text": "Complete the summary: The second phase focused on offline materials, teacher training, and repair ____.",
                "answer": "plans",
                "explanation": "The first paragraph lists offline materials, teacher training, and repair plans as the focus of the second phase.",
            },
            {
                "type": "MATCHING_INFO",
                "text": "Who maintained the devices in the second phase?",
                "options": ["local technicians", "parents abroad", "railway workers", "university athletes"],
                "answer": "local technicians",
                "explanation": "The passage says local technicians were paid to maintain the devices, reducing unused broken tablets.",
            },
            {
                "type": "MCQ",
                "text": "In which classes did reading scores improve modestly?",
                "options": [
                    "classes using tablets for short research and vocabulary review",
                    "classes using tablets only as exercise books",
                    "classes without teachers",
                    "classes where internet pages loaded slowly",
                ],
                "answer": "classes using tablets for short research and vocabulary review",
                "explanation": "Reading scores improved modestly where teachers used tablets for short research tasks and vocabulary review.",
            },
            {
                "type": "SENTENCE_COMP",
                "text": "Complete the sentence: Parents valued the programme when pupils could download ____ before travelling home.",
                "answer": "assignments",
                "explanation": "Parents valued the programme when pupils downloaded assignments before returning to villages without signal.",
            },
        ],
    },
]


LISTENING_TOPICS = [
    ("Library Orientation", "library desk", "study room", "Wednesday", "blue card", "15"),
    ("Campus Tour", "science block", "north gate", "Tuesday", "green path", "20"),
    ("Volunteer Briefing", "community hall", "registration table", "Friday", "yellow badge", "12"),
    ("Travel Booking", "rail station", "platform four", "Monday", "return ticket", "18"),
    ("Museum Talk", "gallery entrance", "second floor", "Saturday", "audio guide", "25"),
    ("Research Meeting", "seminar room", "project folder", "Thursday", "data sheet", "30"),
]


def get_or_create_skill(db, name, category):
    skill = db.query(Skill).filter(Skill.category == category).first()
    if skill:
        if skill.name != name:
            skill.name = name
        if not skill.description:
            skill.description = f"IELTS skill: {name}"
        return skill

    skill = db.query(Skill).filter(Skill.name == name).first()
    if skill:
        skill.category = category
        skill.description = f"IELTS skill: {name}"
        return skill

    skill = Skill(name=name, category=category, description=f"IELTS skill: {name}", mastery_threshold=0.7)
    db.add(skill)
    db.flush()
    return skill


def deactivate_legacy_reading_seed(db):
    """Keep old local demo rows from failing stricter validation."""
    legacy_sets = (
        db.query(TestSet)
        .filter(TestSet.module == "READING", TestSet.source == "original", TestSet.title.in_(LEGACY_READING_TITLES))
        .all()
    )
    for test_set in legacy_sets:
        test_set.approved = False
        for question in test_set.questions:
            question.is_active = False
            question.approved = False


def _upsert_reading_question(db, test_set, skill, question, passage):
    existing_questions = (
        db.query(Question)
        .filter(
            Question.module == "READING",
            Question.passage_title == test_set.title,
            Question.question_type == question["type"],
            Question.question_text == question["text"],
        )
        .order_by(Question.id)
        .all()
    )
    payload = {
        "skill_id": skill.id,
        "test_set_id": test_set.id,
        "module": "READING",
        "section": test_set.section,
        "passage": passage,
        "passage_title": test_set.title,
        "question_text": question["text"],
        "question_type": question["type"],
        "options": question.get("options"),
        "correct_answer": question["answer"],
        "difficulty": question.get("difficulty", 5),
        "estimated_band": test_set.estimated_band,
        "explanation": question["explanation"],
        "tags": ["reading_v2", question["type"].lower()],
        "approved": True,
        "is_active": True,
    }
    if existing_questions:
        existing = existing_questions[0]
        for key, value in payload.items():
            setattr(existing, key, value)
        for duplicate in existing_questions[1:]:
            duplicate.is_active = False
            duplicate.approved = False
        return False

    db.add(Question(**payload))
    return True


def seed_reading(db, skills):
    created = 0
    deactivate_legacy_reading_seed(db)

    for passage_data in READING_PASSAGES:
        test_set = (
            db.query(TestSet)
            .filter(TestSet.title == passage_data["title"], TestSet.module == "READING")
            .first()
        )
        if not test_set:
            test_set = TestSet(
                title=passage_data["title"],
                module="READING",
                section=passage_data["section"],
                source="original",
            )
            db.add(test_set)
            db.flush()

        test_set.passage = passage_data["passage"]
        test_set.section = passage_data["section"]
        test_set.estimated_band = passage_data["estimated_band"]
        test_set.time_limit_minutes = 20
        test_set.approved = True

        for question in passage_data["questions"]:
            if _upsert_reading_question(db, test_set, skills[question["type"]], question, passage_data["passage"]):
                created += 1

    return created


def seed_listening(db, skills):
    created = 0
    for index, (title, place, location, day, item, number) in enumerate(LISTENING_TOPICS, start=1):
        if db.query(TestSet).filter(TestSet.title == title, TestSet.module == "LISTENING").first():
            continue
        transcript = (
            f"Welcome to the {title.lower()}. Please meet at the {place}. The main activity starts near "
            f"the {location} on {day}. You will need a {item}. The group limit is {number} people. "
            f"After the briefing, participants should write their names clearly and wait for the coordinator."
        )
        test_set = TestSet(
            title=title,
            module="LISTENING",
            section=f"Section {((index - 1) % 4) + 1}",
            transcript=transcript,
            source="original",
            estimated_band=5.0 + (index % 4) * 0.5,
            time_limit_minutes=10,
            approved=True,
        )
        db.add(test_set)
        db.flush()
        templates = [
            (skills["LISTENING_FORM"], "FORM_COMPLETION", "Complete the form: meeting point: ____.", None, place),
            (skills["LISTENING_FORM"], "FORM_COMPLETION", "Complete the form: group limit: ____ people.", None, number),
            (skills["LISTENING_SENTENCE"], "SENTENCE_COMPLETION", "The main activity starts near the ____.", None, location),
            (skills["LISTENING_SENTENCE"], "SENTENCE_COMPLETION", "The activity is on ____.", None, day),
            (skills["LISTENING_MCQ"], "MCQ", "What item is needed?", [item, "passport", "umbrella", "calculator"], item),
            (skills["LISTENING_MCQ"], "MCQ", "What should participants write clearly?", ["their names", "their scores", "the weather", "the price"], "their names"),
            (skills["LISTENING_MATCHING"], "MATCHING", "Match the person to the action: participants should wait for the ____.", ["coordinator", "driver", "doctor", "chef"], "coordinator"),
            (skills["LISTENING_MAP"], "MAP_PLAN", "Where does the main activity start?", [location, place, "car park", "cafeteria"], location),
            (skills["LISTENING_FORM"], "FORM_COMPLETION", "Complete the note: required item: ____.", None, item),
            (skills["LISTENING_SENTENCE"], "SENTENCE_COMPLETION", "After the briefing, participants should wait for the ____.", None, "coordinator"),
            (skills["LISTENING_MCQ"], "MCQ", "Where should people meet?", [place, "sports field", "bus stop", "restaurant"], place),
            (skills["LISTENING_MATCHING"], "MATCHING", "Match the schedule detail: day of activity.", [day, "Sunday", "April", "morning"], day),
            (skills["LISTENING_MAP"], "MAP_PLAN", "Which place is mentioned as the starting area?", [location, "east exit", "river bridge", "main road"], location),
            (skills["LISTENING_FORM"], "FORM_COMPLETION", "Complete the sentence: The group limit is ____.", None, number),
        ]
        for skill, qtype, text, options, answer in templates:
            db.add(Question(
                skill_id=skill.id,
                test_set_id=test_set.id,
                module="LISTENING",
                section=test_set.section,
                passage=transcript,
                passage_title=title,
                question_text=text,
                question_type=qtype,
                options=options,
                correct_answer=answer,
                difficulty=3 + (index % 6),
                estimated_band=test_set.estimated_band,
                explanation="The answer is stated directly in the listening transcript.",
                tags=[qtype.lower(), "listening"],
                approved=True,
                audio_duration_sec=90,
            ))
            created += 1
    return created


def main():
    db = SessionLocal()
    try:
        skill_map = {}
        for name, category in READING_SKILLS + LISTENING_SKILLS:
            skill_map[category] = get_or_create_skill(db, name, category)
        reading_created = seed_reading(db, skill_map)
        listening_created = seed_listening(db, skill_map)
        db.commit()
        print(f"Seeded IELTS v1: {reading_created} reading questions, {listening_created} listening questions")
    finally:
        db.close()


if __name__ == "__main__":
    main()
