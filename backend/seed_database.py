"""Seed script to populate the database with initial data."""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models.models import Achievement, Skill, Question
from app.services.achievements import ACHIEVEMENT_DEFINITIONS

def seed_achievements():
    """Seed achievement definitions."""
    db = SessionLocal()
    try:
        for achievement_data in ACHIEVEMENT_DEFINITIONS:
            existing = db.query(Achievement).filter(
                Achievement.code == achievement_data["code"]
            ).first()
            
            if not existing:
                achievement = Achievement(**achievement_data)
                db.add(achievement)
                print(f"  ✅ Added achievement: {achievement_data['name']}")
            else:
                print(f"  ⏭️  Skipped (exists): {achievement_data['name']}")
        
        db.commit()
        print(f"\n✅ Seeded {len(ACHIEVEMENT_DEFINITIONS)} achievements")
    finally:
        db.close()


def seed_skills():
    """Seed IELTS skill categories."""
    db = SessionLocal()
    
    skills = [
        # Reading Skills
        {"name": "True/False/Not Given", "category": "TF_NG", "description": "Determine if statements match the text"},
        {"name": "Matching Headings", "category": "HEADINGS", "description": "Match paragraphs to headings"},
        {"name": "Summary Completion", "category": "SUMMARY", "description": "Complete summaries with words from text"},
        {"name": "Multiple Choice", "category": "MCQ", "description": "Choose correct answers from options"},
        {"name": "Sentence Completion", "category": "SENTENCE", "description": "Complete sentences with text information"},
        {"name": "Matching Information", "category": "MATCHING", "description": "Match information to paragraphs"},
        
        # Listening Skills
        {"name": "Form Completion", "category": "LISTENING_FORM", "description": "Complete forms while listening"},
        {"name": "Map Labelling", "category": "LISTENING_MAP", "description": "Label maps based on audio"},
        {"name": "Note Completion", "category": "LISTENING_NOTES", "description": "Complete notes while listening"},
    ]
    
    try:
        for skill_data in skills:
            existing = db.query(Skill).filter(Skill.name == skill_data["name"]).first()
            
            if not existing:
                skill = Skill(**skill_data)
                db.add(skill)
                print(f"  ✅ Added skill: {skill_data['name']}")
            else:
                print(f"  ⏭️  Skipped (exists): {skill_data['name']}")
        
        db.commit()
        print(f"\n✅ Seeded {len(skills)} skills")
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")


def seed_questions():
    """Seed sample questions for practice."""
    db = SessionLocal()
    
    # Get skill IDs first
    tf_skill = db.query(Skill).filter(Skill.name == "True/False/Not Given").first()
    mcq_skill = db.query(Skill).filter(Skill.name == "Multiple Choice").first()
    
    if not tf_skill or not mcq_skill:
        print("  ⚠️  Skills not found, skipping questions")
        db.close()
        return
    
    questions = [
        # Reading Questions
        {
            "skill_id": tf_skill.id,
            "passage": """The history of coffee dates back to the 15th century in Yemen, where Sufi monks used it to stay awake during nighttime prayers. From there, it spread to Egypt and North Africa, and by the 16th century, it had reached Persia, Turkey, and the Middle East. The first European coffee house opened in Venice in 1629, and the beverage quickly became popular across the continent. Today, coffee is one of the most traded commodities in the world, second only to oil.""",
            "passage_title": "The History of Coffee",
            "question_text": "Coffee was first discovered by Sufi monks in Yemen.",
            "question_type": "TRUE_FALSE_NG",
            "options": ["True", "False", "Not Given"],
            "correct_answer": "True",
            "explanation": "The passage states that 'The history of coffee dates back to the 15th century in Yemen, where Sufi monks used it to stay awake during nighttime prayers.'",
            "difficulty": 5,
            "module": "READING"
        },
        {
            "skill_id": tf_skill.id,
            "passage": """The history of coffee dates back to the 15th century in Yemen, where Sufi monks used it to stay awake during nighttime prayers. From there, it spread to Egypt and North Africa, and by the 16th century, it had reached Persia, Turkey, and the Middle East. The first European coffee house opened in Venice in 1629, and the beverage quickly became popular across the continent. Today, coffee is one of the most traded commodities in the world, second only to oil.""",
            "passage_title": "The History of Coffee",
            "question_text": "Coffee is the most traded commodity in the world.",
            "question_type": "TRUE_FALSE_NG",
            "options": ["True", "False", "Not Given"],
            "correct_answer": "False",
            "explanation": "The passage says coffee is 'second only to oil', meaning oil is the most traded commodity.",
            "difficulty": 4,
            "module": "READING"
        },
        {
            "skill_id": mcq_skill.id,
            "passage": """Climate change is causing polar ice caps to melt at an unprecedented rate. Scientists estimate that if current trends continue, Arctic summer ice could disappear completely by 2050. This would have devastating consequences for polar bears, seals, and other Arctic wildlife that depend on sea ice for hunting and breeding. Rising sea levels would also threaten coastal communities around the world.""",
            "passage_title": "Climate Change and Arctic Ice",
            "question_text": "According to the passage, what could happen to Arctic summer ice by 2050?",
            "question_type": "MCQ",
            "options": ["It will become thicker", "It could disappear completely", "It will reach record levels", "It will remain stable"],
            "correct_answer": "It could disappear completely",
            "explanation": "The passage states 'Arctic summer ice could disappear completely by 2050.'",
            "difficulty": 3,
            "module": "READING"
        },
        {
            "skill_id": mcq_skill.id,
            "passage": """Renewable energy sources have grown significantly in recent years. Solar power capacity has increased by 40% globally since 2020, while wind energy now provides 7% of the world's electricity. Governments worldwide are investing heavily in clean energy infrastructure to reduce carbon emissions and combat climate change. However, challenges remain in energy storage and grid infrastructure.""",
            "passage_title": "The Rise of Renewable Energy",
            "question_text": "What percentage of the world's electricity is provided by wind energy?",
            "question_type": "MCQ",
            "options": ["40%", "7%", "20%", "15%"],
            "correct_answer": "7%",
            "explanation": "The passage explicitly states 'wind energy now provides 7% of the world's electricity.'",
            "difficulty": 2,
            "module": "READING"
        },
        {
            "skill_id": tf_skill.id,
            "passage": """Artificial intelligence has transformed many industries over the past decade. From healthcare to finance, AI systems are now used to analyze data, make predictions, and automate tasks. Machine learning, a subset of AI, allows computers to learn from data without being explicitly programmed. Deep learning, which uses neural networks, has achieved remarkable results in image and speech recognition.""",
            "passage_title": "The AI Revolution",
            "question_text": "Machine learning requires computers to be explicitly programmed for each task.",
            "question_type": "TRUE_FALSE_NG",
            "options": ["True", "False", "Not Given"],
            "correct_answer": "False",
            "explanation": "The passage states that machine learning 'allows computers to learn from data without being explicitly programmed.'",
            "difficulty": 4,
            "module": "READING"
        },
    ]
    
    try:
        added = 0
        for q_data in questions:
            existing = db.query(Question).filter(
                Question.question_text == q_data["question_text"]
            ).first()
            
            if not existing:
                question = Question(**q_data)
                db.add(question)
                added += 1
                print(f"  ✅ Added question: {q_data['passage_title'][:30]}...")
            else:
                print(f"  ⏭️  Skipped (exists): {q_data['passage_title'][:30]}...")
        
        db.commit()
        print(f"\n✅ Seeded {added} new questions (total: {len(questions)})")
    finally:
        db.close()


def main():
    print("=" * 50)
    print("🌱 IELTS JANA Database Seeding")
    print("=" * 50)
    
    create_tables()
    
    print("\n📊 Seeding Skills...")
    seed_skills()
    
    print("\n🏆 Seeding Achievements...")
    seed_achievements()
    
    print("\n❓ Seeding Questions...")
    seed_questions()
    
    print("\n" + "=" * 50)
    print("✅ Database seeding complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()

