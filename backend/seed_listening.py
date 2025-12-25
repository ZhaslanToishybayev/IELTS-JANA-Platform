"""Seed data for Listening module."""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models import Skill, Question

# Recreate tables to add new columns
Base.metadata.create_all(bind=engine)


def add_listening_skills():
    """Add Listening module skills."""
    skills = [
        Skill(name="MCQ Basics", category="LISTENING_MCQ", 
              description="Multiple choice from audio", mastery_threshold=0.6),
        Skill(name="Form Completion", category="LISTENING_FORM", 
              description="Fill forms from conversations", mastery_threshold=0.6),
        Skill(name="Map Labeling", category="LISTENING_MAP", 
              description="Label maps and diagrams", mastery_threshold=0.7),
        Skill(name="Summary Notes", category="LISTENING_NOTES", 
              description="Complete notes from lectures", mastery_threshold=0.7),
    ]
    return skills


def add_listening_questions():
    """Add sample Listening questions with embedded audio references."""
    # Note: Using placeholder audio URLs - in production, these would be real audio files
    # For MVP demo, questions work with transcript shown alongside audio player
    
    questions = []
    
    # Section 1: Everyday conversations
    conversation_1 = """[Audio Transcript]
Agent: Good morning, City Library. How can I help you?
Caller: Hi, I'd like to renew my library card. It expired last month.
Agent: Of course. Can I have your name please?
Caller: Jennifer Morrison. That's M-O-R-R-I-S-O-N.
Agent: Thank you, Jennifer. I can see your account. Your address is still 42 Oak Street?
Caller: Actually, I moved. It's now 78 Maple Avenue, apartment 3B.
Agent: Got it. And a contact number?
Caller: 555-0147.
Agent: Perfect. The renewal fee is $15. You can pay online or at the library.
Caller: I'll come in person. What are your hours?
Agent: We're open Monday to Friday, 9 AM to 8 PM, and Saturday 10 to 5.
Caller: Great, I'll come Saturday. Can I also reserve a book while I'm on the line?
Agent: Certainly. Which book?
Caller: "The Silent Patient" by Alex Michaelides.
Agent: That's currently on loan but due back Thursday. Shall I reserve it?
Caller: Yes please. Thank you so much."""

    questions.extend([
        Question(
            skill_id=14, module="LISTENING", 
            passage=conversation_1, passage_title="Library Card Renewal",
            audio_url="/audio/library_call.mp3", audio_duration_sec=95,
            question_text="What is the caller's new apartment number?",
            question_type="FILL_BLANK", options=None,
            correct_answer="3B", difficulty=3,
            explanation="The caller says 'apartment 3B' when giving her new address."),
        
        Question(
            skill_id=14, module="LISTENING",
            passage=conversation_1, passage_title="Library Card Renewal",
            audio_url="/audio/library_call.mp3", audio_duration_sec=95,
            question_text="How much does it cost to renew the library card?",
            question_type="FILL_BLANK", options=None,
            correct_answer="15", difficulty=3,
            explanation="The agent states 'The renewal fee is $15.'"),
        
        Question(
            skill_id=14, module="LISTENING",
            passage=conversation_1, passage_title="Library Card Renewal",
            audio_url="/audio/library_call.mp3", audio_duration_sec=95,
            question_text="When is the reserved book expected to be returned?",
            question_type="MCQ", options=["Monday", "Wednesday", "Thursday", "Saturday"],
            correct_answer="Thursday", difficulty=4,
            explanation="The agent says the book is 'due back Thursday.'"),
    ])
    
    # Section 2: Campus tour conversation
    tour_transcript = """[Audio Transcript]
Guide: Welcome to Riverside University. I'm Marcus, and I'll be showing you around campus today. Let's start at the main entrance. Behind me is the Central Library, which has over 2 million books and is open 24 hours during exam periods.

To our left is the Student Union building. The ground floor has a food court with 5 different restaurants. Upstairs, you'll find the student services office and the careers center.

Now, if you look at your maps, we're headed to the Science Complex next. It's the large building marked with an 'S'. The complex houses biology, chemistry, and physics departments. There's a new state-of-the-art lab that cost 12 million dollars to build.

Student: Excuse me, where is the gym?
Guide: Good question. The Sports Center is at the east end of campus, about a 10-minute walk from here. Membership is free for all students. They have an Olympic-sized swimming pool and tennis courts.

Student: And what about parking?
Guide: There are three parking lots. The largest one is behind the library with 500 spaces. Students need to register their vehicles online and pay $50 per semester for a permit."""

    questions.extend([
        Question(
            skill_id=15, module="LISTENING",
            passage=tour_transcript, passage_title="University Campus Tour",
            audio_url="/audio/campus_tour.mp3", audio_duration_sec=120,
            question_text="How many restaurants are in the Student Union food court?",
            question_type="MCQ", options=["3", "4", "5", "6"],
            correct_answer="5", difficulty=3,
            explanation="The guide mentions 'a food court with 5 different restaurants.'"),
        
        Question(
            skill_id=15, module="LISTENING",
            passage=tour_transcript, passage_title="University Campus Tour",
            audio_url="/audio/campus_tour.mp3", audio_duration_sec=120,
            question_text="On the map, the Science Complex is marked with which letter?",
            question_type="FILL_BLANK", options=None,
            correct_answer="S", difficulty=4,
            explanation="The guide says 'the large building marked with an S.'"),
        
        Question(
            skill_id=16, module="LISTENING",
            passage=tour_transcript, passage_title="University Campus Tour",
            audio_url="/audio/campus_tour.mp3", audio_duration_sec=120,
            question_text="The Sports Center is located in which direction from the tour starting point?",
            question_type="MCQ", options=["North", "South", "East", "West"],
            correct_answer="East", difficulty=4,
            explanation="The guide says the Sports Center 'is at the east end of campus.'"),
        
        Question(
            skill_id=16, module="LISTENING",
            passage=tour_transcript, passage_title="University Campus Tour",
            audio_url="/audio/campus_tour.mp3", audio_duration_sec=120,
            question_text="How much was spent on building the new science laboratory?",
            question_type="MCQ", options=["2 million", "5 million", "10 million", "12 million"],
            correct_answer="12 million", difficulty=5,
            explanation="The guide mentions 'a new state-of-the-art lab that cost 12 million dollars.'"),
    ])
    
    # Section 3: Academic lecture
    lecture_transcript = """[Audio Transcript - Lecture on Sleep Science]
Professor: Today we're discussing the science of sleep. Let me start with a surprising statistic: humans spend roughly one-third of their lives sleeping. That's about 25 years for the average person.

Now, sleep isn't a passive state as people once believed. During sleep, the brain is highly active, performing crucial functions. Let me outline the main stages.

First, we have light sleep, stages 1 and 2. Your heartbeat and breathing slow down. This phase accounts for about 50% of total sleep time in adults.

Then comes deep sleep, or stage 3. This is when tissue repair occurs and growth hormones are released. It's particularly important for physical recovery and makes up about 20% of sleep.

Finally, REM sleep - that's Rapid Eye Movement. This is when most dreaming occurs. Brain activity during REM resembles the waking state. Interestingly, your muscles are temporarily paralyzed during this stage, which is thought to prevent you from acting out dreams. REM comprises about 25% of sleep.

Now, here's something critical for students: sleep deprivation impairs memory consolidation. Research by Dr. Matthew Walker shows that students who sleep less than 6 hours before an exam score 40% lower on memory tests compared to those who sleep 8 hours.

Any questions before we continue?"""

    questions.extend([
        Question(
            skill_id=17, module="LISTENING",
            passage=lecture_transcript, passage_title="Sleep Science Lecture",
            audio_url="/audio/sleep_lecture.mp3", audio_duration_sec=180,
            question_text="According to the lecture, approximately how many years does an average person spend sleeping in their lifetime?",
            question_type="FILL_BLANK", options=None,
            correct_answer="25", difficulty=3,
            explanation="The professor states 'about 25 years for the average person.'"),
        
        Question(
            skill_id=17, module="LISTENING",
            passage=lecture_transcript, passage_title="Sleep Science Lecture",
            audio_url="/audio/sleep_lecture.mp3", audio_duration_sec=180,
            question_text="What percentage of total sleep time is spent in deep sleep?",
            question_type="FILL_BLANK", options=None,
            correct_answer="20", difficulty=4,
            explanation="Deep sleep 'makes up about 20% of sleep.'"),
        
        Question(
            skill_id=17, module="LISTENING",
            passage=lecture_transcript, passage_title="Sleep Science Lecture",
            audio_url="/audio/sleep_lecture.mp3", audio_duration_sec=180,
            question_text="During which stage of sleep are muscles temporarily paralyzed?",
            question_type="MCQ", options=["Stage 1", "Stage 2", "Stage 3", "REM"],
            correct_answer="REM", difficulty=5,
            explanation="'Your muscles are temporarily paralyzed during this stage' - referring to REM."),
        
        Question(
            skill_id=17, module="LISTENING",
            passage=lecture_transcript, passage_title="Sleep Science Lecture",
            audio_url="/audio/sleep_lecture.mp3", audio_duration_sec=180,
            question_text="Students who sleep less than 6 hours before exams score how much lower on memory tests?",
            question_type="MCQ", options=["20%", "30%", "40%", "50%"],
            correct_answer="40%", difficulty=5,
            explanation="Research shows students 'score 40% lower on memory tests.'"),
    ])
    
    return questions


def main():
    """Add Listening module content."""
    db = SessionLocal()
    
    try:
        # Check for existing Listening skills
        existing_listening = db.query(Skill).filter(
            Skill.category.like("LISTENING%")
        ).count()
        
        if existing_listening == 0:
            # Add Listening skills
            skills = add_listening_skills()
            for skill in skills:
                db.add(skill)
            db.commit()
            print(f"Added {len(skills)} Listening skills")
        else:
            print(f"Listening skills already exist ({existing_listening} found)")
        
        # Check for existing Listening questions
        existing_qs = db.query(Question).filter(
            Question.module == "LISTENING"
        ).count()
        
        if existing_qs == 0:
            questions = add_listening_questions()
            for q in questions:
                db.add(q)
            db.commit()
            print(f"Added {len(questions)} Listening questions")
        else:
            print(f"Listening questions already exist ({existing_qs} found)")
        
        print("\nListening module setup complete!")
        print(f"  Total Skills: {db.query(Skill).count()}")
        print(f"  Listening Skills: {db.query(Skill).filter(Skill.category.like('LISTENING%')).count()}")
        print(f"  Total Questions: {db.query(Question).count()}")
        print(f"  Listening Questions: {db.query(Question).filter(Question.module == 'LISTENING').count()}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
