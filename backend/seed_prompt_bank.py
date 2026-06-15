"""Seed original IELTS Writing and Speaking prompt banks."""

import sys

sys.path.insert(0, ".")

from app.database import Base, SessionLocal, engine
from app.models import SpeakingPrompt, WritingPrompt


Base.metadata.create_all(bind=engine)

WRITING_TOPICS = [
    ("Technology and communication", "Some people think digital communication has made relationships weaker. To what extent do you agree or disagree?"),
    ("Environment", "Some people believe environmental problems should be solved globally, while others prefer national action. Discuss both views and give your opinion."),
    ("Education", "Universities should prepare students for employment rather than develop academic knowledge. To what extent do you agree or disagree?"),
    ("Cities", "More people are moving to large cities. What problems does this cause and how can these problems be solved?"),
    ("Health", "Governments should spend more money preventing illness than treating disease. To what extent do you agree or disagree?"),
    ("Work", "Remote work is becoming more common. Do the advantages outweigh the disadvantages?"),
    ("Transport", "Public transport should be free in major cities. Discuss the advantages and disadvantages."),
    ("Media", "News media focuses too much on problems and emergencies. To what extent do you agree or disagree?"),
    ("Culture", "Traditional festivals are becoming less important. What are the causes and what can be done?"),
    ("Science", "Scientific research should be controlled by governments rather than private companies. Discuss both views."),
    ("Travel", "International tourism creates tension rather than understanding between cultures. Do you agree or disagree?"),
    ("Crime", "Some people think prison is the best way to reduce crime. Others believe education is more effective. Discuss both views."),
    ("Family", "Children today spend less time with family members. What are the causes and effects?"),
    ("Sports", "Hosting international sports events is beneficial for a country. To what extent do you agree or disagree?"),
    ("Shopping", "Consumer culture encourages people to buy things they do not need. What problems does this cause?"),
]

TASK1_TOPICS = [
    ("Library visitors", "The chart shows visits to three public libraries between 2015 and 2022. Summarise the information and make comparisons where relevant."),
    ("Energy sources", "The pie charts compare the sources of electricity in one country in 2000 and 2020. Summarise the main features."),
    ("Transport use", "The table shows how commuters travelled to work in five cities. Summarise the information by selecting and reporting the main features."),
    ("Student spending", "The bar chart shows average monthly spending by university students in four categories. Summarise the information."),
    ("Water consumption", "The line graph shows household water consumption from 1990 to 2020. Summarise the main trends."),
    ("Factory process", "The diagram illustrates how recycled paper is produced. Summarise the process."),
    ("Town map", "The maps show changes to a town centre between 1990 and today. Summarise the main changes."),
    ("Population age", "The charts show the age structure of a country in 1980 and 2020. Summarise the information."),
    ("Museum attendance", "The graph compares museum attendance by age group over ten years. Summarise the main features."),
    ("Food exports", "The table shows export values for five food products. Summarise the information."),
    ("Internet access", "The chart shows household internet access in urban and rural areas. Summarise the data."),
    ("Recycling rates", "The line graph compares recycling rates for paper, glass, and plastic. Summarise the main trends."),
    ("Rainwater system", "The diagram shows a rainwater collection system for domestic use. Summarise the process."),
    ("Park redevelopment", "The maps show a park before and after redevelopment. Summarise the changes."),
    ("Employment sectors", "The pie charts compare employment by sector in 1995 and 2025. Summarise the information."),
]

SPEAKING_TITLES = [
    "Hometown", "Work or Study", "Books", "Technology", "Public Transport", "Food", "Weather", "Sports",
    "Music", "Shopping", "A memorable journey", "A useful app", "A person you admire", "A difficult decision",
    "A public place", "A skill you learned", "A film you enjoyed", "A time you helped someone", "A quiet place",
    "A successful event", "Education and society", "Cities and countryside", "Technology and relationships",
    "Health and lifestyle", "Environment and responsibility", "Tourism and culture", "Media and trust",
    "Workplace changes", "Family and generations", "Government and public services", "Creativity", "Teamwork",
    "Learning languages", "Time management", "Online learning", "Art and museums", "Consumer habits",
    "Community life", "Future plans", "Science in daily life",
]


def seed_writing(db):
    if db.query(WritingPrompt).count() >= 30:
        return 0
    created = 0
    for title, prompt in TASK1_TOPICS:
        db.add(WritingPrompt(
            task_type="Task 1",
            title=title,
            prompt_text=prompt,
            category="ACADEMIC",
            word_limit=150,
            time_limit_minutes=20,
            tips=["Write an overview", "Select key figures", "Compare only important trends"],
        ))
        created += 1
    for title, prompt in WRITING_TOPICS:
        db.add(WritingPrompt(
            task_type="Task 2",
            title=title,
            prompt_text=prompt,
            category="ESSAY",
            word_limit=250,
            time_limit_minutes=40,
            tips=["State a clear position", "Develop two main ideas", "Use examples and a concise conclusion"],
        ))
        created += 1
    return created


def seed_speaking(db):
    if db.query(SpeakingPrompt).count() >= 40:
        return 0
    created = 0
    for index, title in enumerate(SPEAKING_TITLES, start=1):
        if index <= 10:
            db.add(SpeakingPrompt(
                part="Part 1",
                title=title,
                questions=[
                    f"Do you often think about {title.lower()}?",
                    f"Why is {title.lower()} important to some people?",
                    f"Has your attitude to {title.lower()} changed recently?",
                    f"Would you like to learn more about {title.lower()}?",
                ],
                speak_time_sec=30,
            ))
        elif index <= 20:
            db.add(SpeakingPrompt(
                part="Part 2",
                title=title,
                cue_card=f"Describe {title.lower()}.\n\nYou should say:\n- what it was\n- when it happened\n- who was involved\nand explain why it was important to you.",
                prep_time_sec=60,
                speak_time_sec=120,
            ))
        else:
            db.add(SpeakingPrompt(
                part="Part 3",
                title=title,
                questions=[
                    f"How does {title.lower()} affect modern society?",
                    f"Do young and older people think differently about {title.lower()}?",
                    f"What role should governments play in {title.lower()}?",
                    f"How might {title.lower()} change in the future?",
                ],
                speak_time_sec=60,
            ))
        created += 1
    return created


def main():
    db = SessionLocal()
    try:
        writing = seed_writing(db)
        speaking = seed_speaking(db)
        db.commit()
        print(f"Seeded prompts: {writing} writing, {speaking} speaking")
    finally:
        db.close()


if __name__ == "__main__":
    main()
