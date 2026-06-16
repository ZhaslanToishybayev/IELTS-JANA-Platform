"""Seed a larger original IELTS-style content bank for local JANA practice."""

import sys

sys.path.insert(0, ".")

from app.database import Base, engine, SessionLocal
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


READING_TOPICS = [
    ("Urban Wetlands", "wetlands", "flood control", "migratory birds", "2018", "15"),
    ("Community Solar", "solar gardens", "shared energy", "apartment residents", "2020", "22"),
    ("Museum Storage", "archive rooms", "climate sensors", "paper collections", "2017", "18"),
    ("Vertical Farming", "indoor farms", "water recycling", "leafy vegetables", "2019", "26"),
    ("Noise and Learning", "classroom acoustics", "speech clarity", "primary pupils", "2016", "12"),
    ("Ancient Trade Routes", "desert caravans", "salt and textiles", "oasis towns", "2015", "30"),
    ("Public Libraries", "digital lending", "community access", "job seekers", "2021", "40"),
    ("Coral Restoration", "reef nurseries", "heat-resistant coral", "coastal fishers", "2014", "9"),
    ("Bicycle Infrastructure", "protected lanes", "commuter safety", "city planners", "2022", "33"),
    ("Food Waste", "redistribution networks", "supermarket surplus", "local charities", "2023", "28"),
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


def seed_reading(db, skills):
    created = 0
    for index, (title, subject, benefit, audience, year, percent) in enumerate(READING_TOPICS, start=1):
        test_set = db.query(TestSet).filter(TestSet.title == title, TestSet.module == "READING").first()
        passage = (
            f"{title} have become a focus of urban research. The passage describes how {subject} "
            f"can support {benefit} while serving {audience}. A pilot project began in {year} and "
            f"reported a {percent} percent improvement in participation. Critics argued that funding "
            f"was limited, but the researchers found that public trust increased when local residents "
            f"helped collect data. The most successful sites combined expert planning with community "
            f"maintenance, rather than relying only on technology."
        )
        if not test_set:
            test_set = TestSet(
                title=title,
                module="READING",
                section=f"Passage {((index - 1) % 3) + 1}",
                passage=passage,
                source="original",
                estimated_band=5.5 + (index % 4) * 0.5,
                time_limit_minutes=20,
                approved=True,
            )
            db.add(test_set)
            db.flush()
        templates = [
            (skills["TF_NG"], "TF_NG", f"{title} are discussed as an urban research focus.", ["True", "False", "Not Given"], "True"),
            (skills["TF_NG"], "TF_NG", f"The pilot project began in {str(int(year) + 2)}.", ["True", "False", "Not Given"], "False"),
            (skills["TF_NG"], "TF_NG", f"The passage states that the project was funded by an international bank.", ["True", "False", "Not Given"], "Not Given"),
            (skills["HEADINGS"], "HEADINGS", "Choose the best heading for the passage.", ["Community involvement in a practical research project", "A history of private banking", "The decline of scientific planning", "A guide to laboratory safety"], "Community involvement in a practical research project"),
            (skills["MATCHING_INFO"], "MATCHING_INFO", f"Which group benefited directly from {subject}?", [audience, "foreign tourists", "factory owners", "professional athletes"], audience),
            (skills["SENTENCE_COMP"], "SENTENCE_COMP", "Complete the sentence: The pilot project began in ____.", None, year),
            (skills["SUMMARY"], "SUMMARY", f"Complete the summary: The project improved participation by ____ percent.", None, percent),
            (skills["MCQ"], "MCQ", "What made the most successful sites different?", ["They used only technology", "They avoided public meetings", "They combined expert planning with community maintenance", "They rejected local data"], "They combined expert planning with community maintenance"),
            (skills["MCQ"], "MCQ", "What problem did critics identify?", ["limited funding", "too many birds", "no local interest", "excessive rainfall"], "limited funding"),
            (skills["SUMMARY"], "SUMMARY", "Complete the summary: Public trust increased when residents helped collect ____.", None, "data"),
            (skills["MATCHING_INFO"], "MATCHING_INFO", "Match the role: researchers found improvement in what area?", ["public trust", "international trade", "exam scores", "fuel prices"], "public trust"),
            (skills["SENTENCE_COMP"], "SENTENCE_COMP", f"Complete the sentence: The passage focuses on ____.", None, subject),
            (skills["FILL_BLANK"], "FILL_BLANK", "Fill the blank: Public trust increased when residents helped collect ____.", None, "data"),
            (skills["FILL_BLANK"], "FILL_BLANK", "Fill the blank: Critics argued that ____ was limited.", None, "funding"),
        ]
        for skill, qtype, text, options, answer in templates:
            existing_question = db.query(Question).filter(
                Question.test_set_id == test_set.id,
                Question.question_type == qtype,
                Question.question_text == text,
            ).first()
            if existing_question:
                existing_question.skill_id = skill.id
                existing_question.module = "READING"
                existing_question.approved = True
                existing_question.is_active = True
                continue
            db.add(Question(
                skill_id=skill.id,
                test_set_id=test_set.id,
                module="READING",
                section=test_set.section,
                passage=passage,
                passage_title=title,
                question_text=text,
                question_type=qtype,
                options=options,
                correct_answer=answer,
                difficulty=3 + (index % 6),
                estimated_band=test_set.estimated_band,
                explanation=f"The answer is supported by the passage section about {subject}.",
                tags=[qtype.lower(), subject],
                approved=True,
                is_active=True,
            ))
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
