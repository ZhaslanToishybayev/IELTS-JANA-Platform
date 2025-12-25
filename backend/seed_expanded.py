"""Additional seed data - expanded question bank."""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models import Skill, Question

def add_new_skills():
    """Add new question type skills."""
    new_skills = [
        # Matching Information
        Skill(name="Basic Matching Info", category="MATCHING_INFO", 
              description="Match statements to paragraphs", mastery_threshold=0.6),
        Skill(name="Complex Matching Info", category="MATCHING_INFO", 
              description="Multiple matches with distractors", mastery_threshold=0.7),
        
        # Sentence Completion
        Skill(name="Sentence Completion Basics", category="SENTENCE_COMP", 
              description="Complete sentences with passage info", mastery_threshold=0.6),
        Skill(name="Advanced Sentence Completion", category="SENTENCE_COMP", 
              description="Complex inference for completion", mastery_threshold=0.7),
    ]
    return new_skills


def add_expanded_questions():
    """Add 50+ new reading questions."""
    questions = []
    
    # ==================== MORE TF/NG Questions ====================
    
    climate_passage = """Climate change is fundamentally altering Earth's ecosystems. Arctic sea ice has declined by about 13% per decade since 1979, with some scientists predicting ice-free summers by 2050. Rising temperatures have caused mountain glaciers worldwide to retreat, threatening water supplies for billions of people who depend on glacial meltwater. Coral reefs, home to 25% of marine species, are experiencing mass bleaching events due to ocean warming and acidification. The Great Barrier Reef has lost half its coral cover since 1995. Meanwhile, extreme weather events have become more frequent and intense, with economic losses from such events tripling since the 1980s."""
    
    questions.extend([
        Question(skill_id=1, passage=climate_passage, passage_title="Climate Change Impacts",
                question_text="Arctic sea ice has decreased by approximately 13% every ten years since observations began in 1979.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=3,
                explanation="The passage states 'Arctic sea ice has declined by about 13% per decade since 1979.'"),
        
        Question(skill_id=1, passage=climate_passage, passage_title="Climate Change Impacts",
                question_text="Scientists unanimously agree that Arctic summers will be ice-free by 2050.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=4,
                explanation="The passage says 'some scientists' predict this, not unanimous agreement."),
        
        Question(skill_id=2, passage=climate_passage, passage_title="Climate Change Impacts",
                question_text="Coral reefs support more marine species than any other ecosystem.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=5,
                explanation="The passage mentions coral reefs are home to 25% of marine species, but doesn't compare to other ecosystems."),
        
        Question(skill_id=2, passage=climate_passage, passage_title="Climate Change Impacts",
                question_text="Financial damage from extreme weather has increased significantly in recent decades.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=5,
                explanation="'Economic losses...tripling since the 1980s' indicates significant increase."),
        
        Question(skill_id=3, passage=climate_passage, passage_title="Climate Change Impacts",
                question_text="The Great Barrier Reef will completely disappear within the next decade.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=6,
                explanation="The passage mentions coral loss but makes no prediction about complete disappearance."),
    ])
    
    education_passage = """The Finnish education system is consistently ranked among the world's best, despite students starting formal schooling at age seven—later than most countries. There are no standardized tests until students are 16, and homework is minimal. Teachers in Finland must hold a master's degree and are highly respected, with teaching positions being extremely competitive. Class sizes are typically small, and students with learning difficulties receive additional support. The emphasis is on collaborative learning rather than competition. Remarkably, Finland spends less per student than many other developed nations yet achieves better outcomes. Critics argue the system succeeds partly because of Finland's cultural homogeneity and may not be easily replicated elsewhere."""
    
    questions.extend([
        Question(skill_id=1, passage=education_passage, passage_title="Finnish Education",
                question_text="Finnish children begin their formal education at a younger age than children in most other countries.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=3,
                explanation="The passage states they start 'later than most countries' at age seven."),
        
        Question(skill_id=2, passage=education_passage, passage_title="Finnish Education",
                question_text="Becoming a teacher in Finland is highly competitive.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=4,
                explanation="The passage explicitly states 'teaching positions being extremely competitive.'"),
        
        Question(skill_id=2, passage=education_passage, passage_title="Finnish Education",
                question_text="Finnish students score higher on international tests than students from any other country.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=5,
                explanation="The system is 'among the world's best' but no claim of being #1 in tests."),
        
        Question(skill_id=3, passage=education_passage, passage_title="Finnish Education",
                question_text="The Finnish model could be successfully implemented in culturally diverse societies without modification.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=7,
                explanation="Critics argue it 'may not be easily replicated' due to cultural homogeneity factors."),
    ])
    
    space_passage = """Private space companies are transforming the aerospace industry. SpaceX has reduced launch costs by 90% through reusable rocket technology, making space more accessible than ever. Blue Origin and Virgin Galactic are developing space tourism, with tickets initially costing $250,000 to $450,000. In 2021, SpaceX's Inspiration4 mission sent four civilians to orbit without professional astronauts aboard. Meanwhile, companies like Rocket Lab and Relativity Space are targeting the small satellite market. This commercial space race has prompted NASA to increasingly rely on private contractors for cargo and crew transportation to the International Space Station. Some experts predict that the first Mars colony will be established by a private company rather than a government agency."""
    
    questions.extend([
        Question(skill_id=1, passage=space_passage, passage_title="Commercial Space Race",
                question_text="SpaceX has made rocket launches ten times cheaper than before.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=4,
                explanation="90% cost reduction means 10x cheaper (original cost → 10% = 1/10th)."),
        
        Question(skill_id=2, passage=space_passage, passage_title="Commercial Space Race",
                question_text="Space tourism tickets are affordable for middle-class travelers.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=5,
                explanation="Prices of $250,000-$450,000 are stated but no judgment on affordability is made."),
        
        Question(skill_id=3, passage=space_passage, passage_title="Commercial Space Race",
                question_text="NASA has completely transferred space operations to private companies.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=6,
                explanation="NASA 'increasingly relies' on private contractors - not 'completely transferred.'"),
        
        Question(skill_id=3, passage=space_passage, passage_title="Commercial Space Race",
                question_text="It is certain that private companies will establish Mars colonies before governments.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=7,
                explanation="'Some experts predict' - this is a prediction, not a certainty."),
    ])
    
    # ==================== MORE HEADINGS Questions ====================
    
    food_passage = """Paragraph A: The global food system accounts for approximately 30% of greenhouse gas emissions. Agriculture uses 70% of the world's freshwater and occupies nearly half of habitable land. As the population grows toward 10 billion by 2050, these pressures will intensify dramatically without significant changes.

Paragraph B: Vertical farming offers a potential solution by growing crops in stacked indoor layers. These facilities use 95% less water than traditional farms, require no pesticides, and can operate year-round regardless of climate. Located in urban areas, they dramatically reduce transportation distances.

Paragraph C: Cultured meat, grown from animal cells in laboratories, could reduce the land use of meat production by 99% and water use by 96%. Companies like Upside Foods and GOOD Meat have received regulatory approval in some countries, though production costs remain high.

Paragraph D: Insects are another promising protein source. They require minimal land and water, emit few greenhouse gases, and are already consumed by 2 billion people worldwide. However, Western consumers remain reluctant to adopt insects as food despite their nutritional benefits.

Paragraph E: Food waste represents a major opportunity. One-third of all food produced is never eaten, releasing methane as it decomposes. Technologies for extending shelf life, along with apps connecting consumers with surplus food, are helping address this issue."""
    
    questions.extend([
        Question(skill_id=4, passage=food_passage, passage_title="Future of Food",
                question_text="Choose the best heading for Paragraph A.",
                question_type="HEADINGS", 
                options=["Environmental Cost of Food Production", "Population Growth Predictions", "Water Usage in Agriculture", "Carbon Emissions by Sector"],
                correct_answer="Environmental Cost of Food Production", difficulty=4,
                explanation="The paragraph covers multiple environmental impacts: emissions, water, and land use."),
        
        Question(skill_id=4, passage=food_passage, passage_title="Future of Food",
                question_text="Choose the best heading for Paragraph B.",
                question_type="HEADINGS", 
                options=["Urban Architecture Innovations", "Indoor Agriculture Solutions", "Water Conservation Methods", "Climate-Proof Farming"],
                correct_answer="Indoor Agriculture Solutions", difficulty=4,
                explanation="The paragraph describes vertical farming - a form of indoor agriculture."),
        
        Question(skill_id=5, passage=food_passage, passage_title="Future of Food",
                question_text="Choose the best heading for Paragraph C.",
                question_type="HEADINGS", 
                options=["Laboratory Food Production", "Animal Welfare Improvements", "Regulatory Challenges", "Cost-Effective Protein"],
                correct_answer="Laboratory Food Production", difficulty=5,
                explanation="Cultured meat grown 'from animal cells in laboratories' is the main topic."),
        
        Question(skill_id=5, passage=food_passage, passage_title="Future of Food",
                question_text="Choose the best heading for Paragraph D.",
                question_type="HEADINGS", 
                options=["Cultural Food Preferences", "Alternative Protein Sources", "Overcoming Consumer Resistance", "Insects as Sustainable Food"],
                correct_answer="Insects as Sustainable Food", difficulty=5,
                explanation="The paragraph specifically focuses on insects as food, not general alternatives."),
        
        Question(skill_id=6, passage=food_passage, passage_title="Future of Food",
                question_text="Choose the best heading for Paragraph E.",
                question_type="HEADINGS", 
                options=["Reducing Food Loss", "Methane and Climate", "Technology in Food Distribution", "Consumer Behavior Changes"],
                correct_answer="Reducing Food Loss", difficulty=6,
                explanation="The core topic is food waste and solutions to reduce it."),
    ])
    
    ai_passage = """Paragraph A: Artificial general intelligence (AGI) refers to AI systems that can perform any intellectual task a human can. Unlike current narrow AI, which excels at specific tasks like image recognition or language translation, AGI would possess general reasoning abilities across domains.

Paragraph B: Leading AI researchers disagree sharply on timelines. Some predict AGI within 10-20 years, while others believe it may never be achieved or remains centuries away. This uncertainty makes policy planning extremely difficult.

Paragraph C: Potential benefits are immense. AGI could accelerate scientific research, solving problems in medicine, climate, and energy that currently seem intractable. It might eliminate most forms of routine labor, potentially creating abundance.

Paragraph D: However, risks are equally significant. An AGI pursuing goals misaligned with human values could cause catastrophic harm. Ensuring AI systems remain beneficial and controllable—the alignment problem—is considered by many to be one of humanity's most important challenges.

Paragraph E: Governance efforts are underway. The EU has proposed comprehensive AI regulations, while the US has issued executive orders on AI safety. International coordination remains limited, with concerns that competitive pressures may override safety considerations."""
    
    questions.extend([
        Question(skill_id=4, passage=ai_passage, passage_title="The Future of AI",
                question_text="Choose the best heading for Paragraph A.",
                question_type="HEADINGS", 
                options=["Defining True Machine Intelligence", "Current AI Capabilities", "Human vs Machine Intelligence", "Limitations of Modern AI"],
                correct_answer="Defining True Machine Intelligence", difficulty=4,
                explanation="The paragraph defines AGI and distinguishes it from narrow AI."),
        
        Question(skill_id=5, passage=ai_passage, passage_title="The Future of AI",
                question_text="Choose the best heading for Paragraph B.",
                question_type="HEADINGS", 
                options=["Scientific Consensus on AGI", "Disagreement Over Development Timeline", "AI Research Funding", "Predicting Technological Change"],
                correct_answer="Disagreement Over Development Timeline", difficulty=5,
                explanation="The paragraph focuses on conflicting predictions among researchers."),
        
        Question(skill_id=6, passage=ai_passage, passage_title="The Future of AI",
                question_text="Choose the best heading for Paragraph D.",
                question_type="HEADINGS", 
                options=["Technical Challenges", "Existential Dangers of Misaligned AI", "The Ethics of Automation", "Controlling Advanced Systems"],
                correct_answer="Existential Dangers of Misaligned AI", difficulty=7,
                explanation="The focus is on catastrophic risks from goal misalignment—the alignment problem."),
    ])
    
    # ==================== MORE SUMMARY Questions ====================
    
    sleep_passage = """Sleep deprivation has reached epidemic proportions in modern society. Adults need 7-9 hours of sleep per night, yet 35% of Americans report getting less than 7 hours. The consequences extend far beyond tiredness: chronic sleep deprivation increases the risk of obesity by 55%, heart disease by 48%, and diabetes by 50%. Cognitively, sleep-deprived individuals show impairment equivalent to legal intoxication. The economic cost is staggering—the US loses an estimated $411 billion annually in productivity due to insufficient sleep. Blue light from screens suppresses melatonin production, delaying sleep onset. Meanwhile, caffeine consumed even six hours before bed can reduce total sleep time by over an hour. Experts recommend maintaining consistent sleep schedules, limiting screen time before bed, and keeping bedrooms cool and dark."""
    
    questions.extend([
        Question(skill_id=7, passage=sleep_passage, passage_title="The Sleep Crisis",
                question_text="Complete the summary: Over one-third of Americans sleep less than the recommended ___________ hours.",
                question_type="SUMMARY", 
                options=["5-6", "6-7", "7-9", "8-10"],
                correct_answer="7-9", difficulty=3,
                explanation="The passage states 'Adults need 7-9 hours' and 35% get less than 7."),
        
        Question(skill_id=7, passage=sleep_passage, passage_title="The Sleep Crisis",
                question_text="Complete the summary: Lack of sleep impairs thinking to a level similar to ___________.",
                question_type="SUMMARY", 
                options=["mild illness", "alcohol intoxication", "extreme fatigue", "medication effects"],
                correct_answer="alcohol intoxication", difficulty=4,
                explanation="The passage mentions 'impairment equivalent to legal intoxication.'"),
        
        Question(skill_id=8, passage=sleep_passage, passage_title="The Sleep Crisis",
                question_text="Complete the summary: Screen use before bed disrupts sleep by reducing ___________ production.",
                question_type="SUMMARY", 
                options=["cortisol", "serotonin", "melatonin", "dopamine"],
                correct_answer="melatonin", difficulty=5,
                explanation="'Blue light from screens suppresses melatonin production.'"),
        
        Question(skill_id=8, passage=sleep_passage, passage_title="The Sleep Crisis",
                question_text="Complete the summary: The American economy loses over ___________ billion dollars yearly due to sleep problems.",
                question_type="SUMMARY", 
                options=["100", "250", "400", "500"],
                correct_answer="400", difficulty=5,
                explanation="The passage states '$411 billion annually'—closest to 400."),
        
        Question(skill_id=9, passage=sleep_passage, passage_title="The Sleep Crisis",
                question_text="Complete the summary: Drinking coffee within ___________ hours of bedtime significantly reduces sleep duration.",
                question_type="SUMMARY", 
                options=["two", "four", "six", "eight"],
                correct_answer="six", difficulty=6,
                explanation="'Caffeine consumed even six hours before bed can reduce total sleep time.'"),
    ])
    
    ocean_passage = """The deep ocean remains one of Earth's last frontiers. Less than 20% of the ocean floor has been mapped with modern sonar technology, and less than 5% has been explored in detail. The Mariana Trench, reaching nearly 11,000 meters, harbors life forms adapted to crushing pressure and total darkness. Extremophile bacteria near hydrothermal vents thrive in water exceeding 400°C, challenging assumptions about the limits of life. Deep-sea mining companies are now targeting polymetallic nodules containing valuable metals like cobalt, nickel, and manganese—essential for renewable energy technology. However, marine biologists warn that mining could devastate ecosystems that take thousands of years to develop. International regulations remain inadequate, with the International Seabed Authority struggling to balance commercial interests with environmental protection."""
    
    questions.extend([
        Question(skill_id=7, passage=ocean_passage, passage_title="Deep Ocean Exploration",
                question_text="Complete the summary: Approximately ___________ of the ocean floor has been explored comprehensively.",
                question_type="SUMMARY", 
                options=["5%", "10%", "15%", "20%"],
                correct_answer="5%", difficulty=4,
                explanation="The passage states 'less than 5% has been explored in detail.'"),
        
        Question(skill_id=8, passage=ocean_passage, passage_title="Deep Ocean Exploration",
                question_text="Complete the summary: The deepest known ocean location reaches almost ___________ meters.",
                question_type="SUMMARY", 
                options=["8,000", "9,000", "10,000", "11,000"],
                correct_answer="11,000", difficulty=4,
                explanation="The Mariana Trench reaches 'nearly 11,000 meters.'"),
        
        Question(skill_id=8, passage=ocean_passage, passage_title="Deep Ocean Exploration",
                question_text="Complete the summary: Certain bacteria survive near underwater vents in temperatures above ___________.",
                question_type="SUMMARY", 
                options=["100°C", "200°C", "300°C", "400°C"],
                correct_answer="400°C", difficulty=5,
                explanation="Extremophile bacteria 'thrive in water exceeding 400°C.'"),
        
        Question(skill_id=9, passage=ocean_passage, passage_title="Deep Ocean Exploration",
                question_text="Complete the summary: Mining companies seek deep-sea minerals that are crucial for ___________ technology.",
                question_type="SUMMARY", 
                options=["digital", "renewable energy", "medical", "transportation"],
                correct_answer="renewable energy", difficulty=6,
                explanation="The metals are 'essential for renewable energy technology.'"),
    ])
    
    # ==================== NEW: MATCHING INFORMATION Questions ====================
    
    city_passage = """Paragraph A - Tokyo: With over 37 million residents, Greater Tokyo is the world's most populous metropolitan area. Its railway system transports 40 million passengers daily, more than any other city. Despite its density, Tokyo has remarkably low crime rates and streets are notably clean.

Paragraph B - Singapore: This city-state of 5.5 million people has transformed from a developing nation to one of the world's wealthiest through strict governance and strategic investment in education and technology. It enforces heavy fines for littering and gum disposal.

Paragraph C - Copenhagen: Often ranked the world's most livable city, Copenhagen has prioritized cycling infrastructure, with 62% of residents commuting by bicycle. The city aims to become carbon-neutral by 2025, investing heavily in wind power and district heating.

Paragraph D - Dubai: Rising from desert in just 50 years, Dubai features the world's tallest building (828m Burj Khalifa) and has become a global hub for luxury tourism and business. However, it relies heavily on migrant labor, which has drawn criticism.

Paragraph E - Medellín: Once notorious as the world's most dangerous city due to drug cartels, Medellín has undergone remarkable transformation through investment in public transportation, libraries, and education in poor neighborhoods."""
    
    questions.extend([
        Question(skill_id=10, passage=city_passage, passage_title="Cities of Innovation",
                question_text="Which city has the highest percentage of residents who cycle to work?",
                question_type="MATCHING_INFO", 
                options=["Tokyo", "Singapore", "Copenhagen", "Dubai", "Medellín"],
                correct_answer="Copenhagen", difficulty=4,
                explanation="Copenhagen has '62% of residents commuting by bicycle.'"),
        
        Question(skill_id=10, passage=city_passage, passage_title="Cities of Innovation",
                question_text="Which city has overcome a violent past through urban development?",
                question_type="MATCHING_INFO", 
                options=["Tokyo", "Singapore", "Copenhagen", "Dubai", "Medellín"],
                correct_answer="Medellín", difficulty=5,
                explanation="Medellín was 'once notorious as the world's most dangerous city' but transformed."),
        
        Question(skill_id=10, passage=city_passage, passage_title="Cities of Innovation",
                question_text="Which city developed rapidly through strict laws and education investment?",
                question_type="MATCHING_INFO", 
                options=["Tokyo", "Singapore", "Copenhagen", "Dubai", "Medellín"],
                correct_answer="Singapore", difficulty=5,
                explanation="Singapore 'transformed through strict governance and strategic investment in education.'"),
        
        Question(skill_id=11, passage=city_passage, passage_title="Cities of Innovation",
                question_text="Which city has faced ethical concerns over its workforce?",
                question_type="MATCHING_INFO", 
                options=["Tokyo", "Singapore", "Copenhagen", "Dubai", "Medellín"],
                correct_answer="Dubai", difficulty=6,
                explanation="Dubai 'relies heavily on migrant labor, which has drawn criticism.'"),
        
        Question(skill_id=11, passage=city_passage, passage_title="Cities of Innovation",
                question_text="Which city handles over 40 million rail passengers per day?",
                question_type="MATCHING_INFO", 
                options=["Tokyo", "Singapore", "Copenhagen", "Dubai", "Medellín"],
                correct_answer="Tokyo", difficulty=4,
                explanation="Tokyo's 'railway system transports 40 million passengers daily.'"),
    ])
    
    # ==================== NEW: SENTENCE COMPLETION Questions ====================
    
    memory_passage = """Human memory operates through three interconnected systems. Sensory memory holds vast amounts of information for mere milliseconds—the afterimage when you look away from a bright light. Working memory, capable of holding about seven items, processes and manipulates information actively for 20-30 seconds. Long-term memory has potentially unlimited capacity and can store information for a lifetime.

Creating lasting memories requires encoding, consolidation, and retrieval. During sleep, the hippocampus replays experiences, transferring important information to the cortex for permanent storage. This process explains why sleep deprivation impairs memory formation. Emotional experiences are remembered more vividly because the amygdala enhances encoding for survival-relevant information.

Memory is reconstructive rather than reproductive. Each time we recall an event, we subtly alter it based on current knowledge and beliefs. This malleability makes eyewitness testimony notoriously unreliable and explains why memories of childhood often differ from reality."""
    
    questions.extend([
        Question(skill_id=12, passage=memory_passage, passage_title="How Memory Works",
                question_text="Complete the sentence: Working memory can typically retain approximately _______ pieces of information.",
                question_type="SENTENCE_COMP", 
                options=["three", "five", "seven", "twelve"],
                correct_answer="seven", difficulty=4,
                explanation="Working memory is 'capable of holding about seven items.'"),
        
        Question(skill_id=12, passage=memory_passage, passage_title="How Memory Works",
                question_text="Complete the sentence: The _______ is responsible for transferring memories during sleep.",
                question_type="SENTENCE_COMP", 
                options=["cortex", "hippocampus", "amygdala", "cerebellum"],
                correct_answer="hippocampus", difficulty=5,
                explanation="'During sleep, the hippocampus replays experiences, transferring important information.'"),
        
        Question(skill_id=12, passage=memory_passage, passage_title="How Memory Works",
                question_text="Complete the sentence: Emotional events are remembered better because the _______ strengthens memory encoding.",
                question_type="SENTENCE_COMP", 
                options=["cortex", "hippocampus", "amygdala", "thalamus"],
                correct_answer="amygdala", difficulty=5,
                explanation="'The amygdala enhances encoding for survival-relevant information.'"),
        
        Question(skill_id=13, passage=memory_passage, passage_title="How Memory Works",
                question_text="Complete the sentence: Every time a memory is recalled, it becomes slightly _______ based on current beliefs.",
                question_type="SENTENCE_COMP", 
                options=["weaker", "stronger", "altered", "clearer"],
                correct_answer="altered", difficulty=6,
                explanation="'Each time we recall an event, we subtly alter it based on current knowledge.'"),
        
        Question(skill_id=13, passage=memory_passage, passage_title="How Memory Works",
                question_text="Complete the sentence: The reconstructive nature of memory makes _______ an unreliable source of evidence.",
                question_type="SENTENCE_COMP", 
                options=["DNA testing", "eyewitness testimony", "video footage", "fingerprints"],
                correct_answer="eyewitness testimony", difficulty=6,
                explanation="'This malleability makes eyewitness testimony notoriously unreliable.'"),
    ])
    
    return questions


def main():
    """Add expanded question bank."""
    db = SessionLocal()
    
    try:
        # Add new skills
        existing_skills = db.query(Skill).count()
        
        if existing_skills <= 9:  # Only original skills
            new_skills = add_new_skills()
            for skill in new_skills:
                db.add(skill)
            db.commit()
            print(f"Added {len(new_skills)} new skills")
            
            # Set up skill relationships for new skills
            skills = db.query(Skill).all()
            skill_by_name = {s.name: s for s in skills}
            
            if "Complex Matching Info" in skill_by_name and "Basic Matching Info" in skill_by_name:
                skill_by_name["Complex Matching Info"].parent_skill_id = skill_by_name["Basic Matching Info"].id
            if "Advanced Sentence Completion" in skill_by_name and "Sentence Completion Basics" in skill_by_name:
                skill_by_name["Advanced Sentence Completion"].parent_skill_id = skill_by_name["Sentence Completion Basics"].id
            
            db.commit()
            print("Set up new skill tree relationships")
        else:
            print(f"Skills already expanded ({existing_skills} skills found)")
        
        # Add new questions
        existing_questions = db.query(Question).count()
        
        if existing_questions < 60:  # Add if not already expanded
            new_questions = add_expanded_questions()
            for question in new_questions:
                db.add(question)
            db.commit()
            print(f"Added {len(new_questions)} new questions")
        else:
            print(f"Questions already expanded ({existing_questions} questions found)")
        
        print("\nExpansion complete!")
        print(f"  Total Skills: {db.query(Skill).count()}")
        print(f"  Total Questions: {db.query(Question).count()}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
