"""Seed data script to populate questions and skills."""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models import Skill, Question

# Create tables
Base.metadata.create_all(bind=engine)


def seed_skills():
    """Create initial skills."""
    skills = [
        # TF/NG Skills
        Skill(name="Basic True/False", category="TF_NG", 
              description="Identify basic factual statements", mastery_threshold=0.6),
        Skill(name="Inference TF/NG", category="TF_NG", 
              description="Determine truth from implied information", mastery_threshold=0.7),
        Skill(name="Advanced TF/NG", category="TF_NG", 
              description="Complex passages with nuanced statements", mastery_threshold=0.75),
        
        # Headings Skills
        Skill(name="Paragraph Main Idea", category="HEADINGS", 
              description="Identify main idea of paragraphs", mastery_threshold=0.6),
        Skill(name="Multiple Headings", category="HEADINGS", 
              description="Match multiple headings to sections", mastery_threshold=0.7),
        Skill(name="Complex Headings", category="HEADINGS", 
              description="Handle distractors and similar headings", mastery_threshold=0.75),
        
        # Summary Skills
        Skill(name="Gap Fill Basics", category="SUMMARY", 
              description="Complete summaries with given words", mastery_threshold=0.6),
        Skill(name="Summary Inference", category="SUMMARY", 
              description="Infer missing information from context", mastery_threshold=0.7),
        Skill(name="Full Summary", category="SUMMARY", 
              description="Complete complex multi-part summaries", mastery_threshold=0.75),
    ]
    return skills


def seed_questions():
    """Create sample reading questions."""
    questions = []
    
    # ==================== TF/NG Questions ====================
    
    # Basic TF/NG (Skill 1)
    tf_passage_1 = """The Amazon rainforest covers approximately 5.5 million square kilometers and spans nine countries in South America. Brazil contains about 60% of the rainforest within its borders. The forest produces roughly 20% of the world's oxygen, earning it the nickname "the lungs of the Earth." More than 10% of all species on Earth live in the Amazon, including over 400 billion individual trees representing 16,000 species. The Amazon River, which flows through the forest, is the world's largest river by volume, discharging more water than the next seven largest rivers combined."""
    
    questions.extend([
        Question(skill_id=1, passage=tf_passage_1, passage_title="The Amazon Rainforest",
                question_text="The Amazon rainforest is located entirely within Brazil.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=3,
                explanation="The passage states Brazil contains about 60% of the rainforest, implying it spans other countries. It also explicitly mentions 'nine countries.'"),
        
        Question(skill_id=1, passage=tf_passage_1, passage_title="The Amazon Rainforest",
                question_text="The Amazon produces 20% of Earth's oxygen.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=2,
                explanation="The passage directly states: 'The forest produces roughly 20% of the world's oxygen.'"),
        
        Question(skill_id=1, passage=tf_passage_1, passage_title="The Amazon Rainforest",
                question_text="The Amazon River is the longest river in the world.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=4,
                explanation="The passage mentions the Amazon is the 'largest river by volume' but says nothing about its length."),
    ])
    
    # Inference TF/NG (Skill 2)
    tf_passage_2 = """Remote work has transformed the modern workplace. A 2023 survey found that 70% of employees prefer hybrid arrangements, combining office and home work. Companies report increased productivity but struggle with maintaining company culture. Some industries, particularly technology and finance, have embraced remote work more readily than manufacturing or healthcare. The shift has also affected commercial real estate, with vacancy rates in major cities reaching historic highs. Meanwhile, suburban housing markets have seen unexpected growth as workers no longer need daily commutes."""
    
    questions.extend([
        Question(skill_id=2, passage=tf_passage_2, passage_title="Remote Work Transformation",
                question_text="Manufacturing companies have largely rejected remote work policies.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=5,
                explanation="The passage says manufacturing hasn't embraced remote work 'as readily' as tech, but this doesn't mean they rejected it entirely."),
        
        Question(skill_id=2, passage=tf_passage_2, passage_title="Remote Work Transformation",
                question_text="The trend toward remote work has negatively affected urban commercial property.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=5,
                explanation="'Historic high' vacancy rates and 'affected commercial real estate' implies negative impact on urban property values."),
        
        Question(skill_id=2, passage=tf_passage_2, passage_title="Remote Work Transformation",
                question_text="Most employees want to work entirely from home.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=4,
                explanation="70% prefer 'hybrid arrangements' which means a mix of office and home, not entirely from home."),
    ])
    
    # Advanced TF/NG (Skill 3)
    tf_passage_3 = """Artificial intelligence in healthcare presents a paradox: while algorithms can diagnose certain conditions with accuracy exceeding that of human doctors, public trust remains stubbornly low. Research from Stanford University demonstrated that AI detected diabetic retinopathy with 94% accuracy compared to 90% for ophthalmologists. However, a subsequent study found that patients were 28% less likely to follow treatment recommendations when told they came from an AI system rather than a human doctor. This disconnect between capability and acceptance poses significant challenges for healthcare technology adoption. Some experts argue that hybrid approaches, where AI serves as a "second opinion" rather than primary diagnostician, may bridge this trust gap."""
    
    questions.extend([
        Question(skill_id=3, passage=tf_passage_3, passage_title="AI in Healthcare",
                question_text="Stanford's research proved AI is universally superior to human doctors in diagnosis.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="False", difficulty=7,
                explanation="The study showed better results for ONE condition (diabetic retinopathy), not universal superiority - 'certain conditions.'"),
        
        Question(skill_id=3, passage=tf_passage_3, passage_title="AI in Healthcare",
                question_text="Patients' distrust of AI recommendations could lead to worse health outcomes.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="True", difficulty=6,
                explanation="If patients are 28% less likely to follow AI treatment recommendations, this implies potential for worse outcomes."),
        
        Question(skill_id=3, passage=tf_passage_3, passage_title="AI in Healthcare",
                question_text="Hybrid AI-human diagnosis systems are currently being implemented in major hospitals.",
                question_type="TF_NG", options=["True", "False", "Not Given"],
                correct_answer="Not Given", difficulty=7,
                explanation="Experts 'argue' hybrids 'may bridge' the gap - this is a suggestion, not evidence of current implementation."),
    ])
    
    # ==================== Headings Questions ====================
    
    # Paragraph Main Idea (Skill 4)
    heading_passage_1 = """Paragraph A: Coffee originated in Ethiopia, where legend claims a goatherd named Kaldi discovered it after noticing his goats becoming energetic after eating certain berries. By the 15th century, coffee was being cultivated in Yemen and had spread throughout the Arabian Peninsula.

Paragraph B: The coffee trade transformed European ports in the 17th and 18th centuries. Amsterdam, London, and Paris became major trading hubs, and coffee houses emerged as centers of intellectual and commercial exchange. Some historians credit these establishments with sparking the Enlightenment.

Paragraph C: Modern coffee production is dominated by two species: Arabica and Robusta. Arabica accounts for 60-70% of world production and is prized for its smooth, complex flavor. Robusta, while considered lower quality, contains twice the caffeine and is more resistant to disease."""
    
    questions.extend([
        Question(skill_id=4, passage=heading_passage_1, passage_title="The Story of Coffee",
                question_text="Choose the best heading for Paragraph A.",
                question_type="HEADINGS", 
                options=["The Origins of Coffee Cultivation", "Ethiopian Agriculture", "Ancient Beverages", "Kaldi's Farm"],
                correct_answer="The Origins of Coffee Cultivation", difficulty=3,
                explanation="The paragraph traces coffee from its Ethiopian origin to Yemen cultivation - focusing on origins and early cultivation."),
        
        Question(skill_id=4, passage=heading_passage_1, passage_title="The Story of Coffee",
                question_text="Choose the best heading for Paragraph B.",
                question_type="HEADINGS", 
                options=["European Maritime Trade", "Coffee's Influence on European Society", "The Enlightenment Era", "Port City Development"],
                correct_answer="Coffee's Influence on European Society", difficulty=4,
                explanation="The paragraph describes how coffee trade transformed ports and sparked intellectual exchange, emphasizing coffee's societal impact."),
        
        Question(skill_id=4, passage=heading_passage_1, passage_title="The Story of Coffee",
                question_text="Choose the best heading for Paragraph C.",
                question_type="HEADINGS", 
                options=["Coffee Species and Characteristics", "Arabica vs. Robusta", "Global Coffee Production", "Plant Disease Resistance"],
                correct_answer="Coffee Species and Characteristics", difficulty=4,
                explanation="The paragraph covers the two main species and their properties - both production statistics and taste/caffeine characteristics."),
    ])
    
    # Multiple Headings (Skill 5)
    heading_passage_2 = """Paragraph A: Sleep deprivation affects more than just tiredness. Studies show that missing just one night of sleep impairs cognitive function equivalent to having a blood alcohol level of 0.05%. Chronic sleep loss has been linked to obesity, diabetes, and cardiovascular disease.

Paragraph B: The circadian rhythm, our internal 24-hour clock, controls not only sleep but also hormone release, body temperature, and metabolism. This rhythm is primarily regulated by exposure to light, which is why jet lag occurs when we cross time zones.

Paragraph C: Various strategies can improve sleep quality. Maintaining a consistent schedule trains the body's clock. Avoiding screens before bed reduces blue light exposure, which interferes with melatonin production. Temperature also plays a role: a slightly cool room promotes deeper sleep.

Paragraph D: Sleep disorders affect an estimated 50-70 million Americans. Insomnia is the most common, but conditions like sleep apnea—where breathing repeatedly stops during sleep—can be life-threatening if untreated. Many people with sleep disorders remain undiagnosed."""
    
    questions.extend([
        Question(skill_id=5, passage=heading_passage_2, passage_title="Understanding Sleep",
                question_text="Match the correct headings to ALL four paragraphs. Select the heading for Paragraph A.",
                question_type="HEADINGS", 
                options=["Health Consequences of Poor Sleep", "Practical Tips for Better Rest", "Common Sleep Conditions", "The Science of Body Clocks"],
                correct_answer="Health Consequences of Poor Sleep", difficulty=5,
                explanation="Paragraph A focuses on impairment and disease links from sleep loss."),
        
        Question(skill_id=5, passage=heading_passage_2, passage_title="Understanding Sleep",
                question_text="Match the correct heading to Paragraph B.",
                question_type="HEADINGS", 
                options=["Health Consequences of Poor Sleep", "Practical Tips for Better Rest", "Common Sleep Conditions", "The Science of Body Clocks"],
                correct_answer="The Science of Body Clocks", difficulty=5,
                explanation="Paragraph B explains the circadian rhythm and how it regulates bodily functions."),
        
        Question(skill_id=5, passage=heading_passage_2, passage_title="Understanding Sleep",
                question_text="Match the correct heading to Paragraph D.",
                question_type="HEADINGS", 
                options=["Health Consequences of Poor Sleep", "Practical Tips for Better Rest", "Common Sleep Conditions", "The Science of Body Clocks"],
                correct_answer="Common Sleep Conditions", difficulty=5,
                explanation="Paragraph D discusses sleep disorders like insomnia and sleep apnea."),
    ])
    
    # Complex Headings (Skill 6)
    heading_passage_3 = """Paragraph A: Renewable energy's growth has exceeded expectations. Solar panel costs dropped 89% between 2010 and 2020, making it the cheapest source of new electricity in history. Wind power costs fell 70% in the same period. These dramatic price reductions have made renewables economically competitive without subsidies in most markets.

Paragraph B: Critics argue that renewable energy's intermittency—its dependence on weather conditions—limits its reliability. However, advances in battery storage and grid management are addressing these concerns. California successfully managed several days powered predominantly by renewables in 2023, demonstrating large-scale feasibility.

Paragraph C: The transition to renewables has created millions of jobs globally but has also disrupted traditional energy communities. Coal-dependent regions face economic challenges as mines close, raising questions about "just transition" policies that support affected workers and communities."""
    
    questions.extend([
        Question(skill_id=6, passage=heading_passage_3, passage_title="The Renewable Revolution",
                question_text="Select the most appropriate heading for Paragraph A.",
                question_type="HEADINGS", 
                options=["Government Subsidies for Green Energy", "Economic Transformation of the Energy Market", "The Falling Cost of Clean Power", "Comparing Solar and Wind Technologies"],
                correct_answer="The Falling Cost of Clean Power", difficulty=7,
                explanation="While economic transformation is tempting, the paragraph specifically emphasizes the dramatic cost reductions (89%, 70%) making renewables competitive."),
        
        Question(skill_id=6, passage=heading_passage_3, passage_title="The Renewable Revolution",
                question_text="Select the most appropriate heading for Paragraph B.",
                question_type="HEADINGS", 
                options=["Weather-Dependent Energy Limitations", "Overcoming Renewable Energy Challenges", "California's Energy Experiment", "Battery Technology Advances"],
                correct_answer="Overcoming Renewable Energy Challenges", difficulty=7,
                explanation="The paragraph acknowledges criticisms but focuses on how they're being addressed through technology and demonstrated success."),
    ])
    
    # ==================== Summary Completion Questions ====================
    
    # Gap Fill Basics (Skill 7)
    summary_passage_1 = """Honey has been used as food and medicine for thousands of years. Ancient Egyptians used honey to treat wounds and as a preservative in mummification. Modern science has validated some of these traditional uses: honey has natural antibacterial properties due to its high sugar content, low pH, and the presence of hydrogen peroxide. Raw honey also contains antioxidants and has been shown to soothe sore throats and suppress coughs, sometimes more effectively than over-the-counter medications. However, honey should never be given to infants under one year old due to the risk of botulism."""
    
    questions.extend([
        Question(skill_id=7, passage=summary_passage_1, passage_title="Honey: Ancient Remedy, Modern Medicine",
                question_text="Complete the summary: Ancient Egyptians used honey for healing and ___________.",
                question_type="SUMMARY", 
                options=["cooking", "preserving bodies", "feeding infants", "making medicine"],
                correct_answer="preserving bodies", difficulty=3,
                explanation="The passage states honey was used 'as a preservative in mummification.'"),
        
        Question(skill_id=7, passage=summary_passage_1, passage_title="Honey: Ancient Remedy, Modern Medicine",
                question_text="Complete the summary: Honey's antibacterial properties come from its sugar content, pH level, and ___________.",
                question_type="SUMMARY", 
                options=["antioxidants", "hydrogen peroxide", "vitamins", "natural enzymes"],
                correct_answer="hydrogen peroxide", difficulty=3,
                explanation="The passage lists 'high sugar content, low pH, and the presence of hydrogen peroxide.'"),
        
        Question(skill_id=7, passage=summary_passage_1, passage_title="Honey: Ancient Remedy, Modern Medicine",
                question_text="Complete the summary: Honey can treat sore throats better than some ___________.",
                question_type="SUMMARY", 
                options=["prescription drugs", "natural remedies", "over-the-counter medications", "herbal treatments"],
                correct_answer="over-the-counter medications", difficulty=4,
                explanation="The passage mentions 'more effectively than over-the-counter medications.'"),
    ])
    
    # Summary Inference (Skill 8)
    summary_passage_2 = """Urban vertical farming represents a potential revolution in food production. By growing crops in stacked layers within controlled indoor environments, these facilities can produce food year-round, regardless of external weather conditions. They use up to 95% less water than traditional farming through hydroponic systems that recycle nutrient solutions. LED lighting tailored to specific plant needs optimizes growth while minimizing energy waste. Located in or near cities, vertical farms dramatically reduce transportation distances, delivering fresher produce with a lower carbon footprint. However, the initial investment costs remain prohibitive for many entrepreneurs, and current technology limits production to leafy greens and herbs rather than staple crops like wheat or rice."""
    
    questions.extend([
        Question(skill_id=8, passage=summary_passage_2, passage_title="Vertical Farming: The Future of Agriculture?",
                question_text="Complete the summary: Vertical farms overcome ___________ limitations that affect traditional agriculture.",
                question_type="SUMMARY", 
                options=["labor", "seasonal", "financial", "technological"],
                correct_answer="seasonal", difficulty=5,
                explanation="The passage emphasizes 'year-round' production 'regardless of external weather conditions.'"),
        
        Question(skill_id=8, passage=summary_passage_2, passage_title="Vertical Farming: The Future of Agriculture?",
                question_text="Complete the summary: The main barrier to wider adoption of vertical farming is ___________.",
                question_type="SUMMARY", 
                options=["lack of technology", "high startup costs", "limited crop variety", "energy consumption"],
                correct_answer="high startup costs", difficulty=5,
                explanation="While crop limitations are mentioned, 'prohibitive' initial investment costs suggest this is the PRIMARY barrier."),
        
        Question(skill_id=8, passage=summary_passage_2, passage_title="Vertical Farming: The Future of Agriculture?",
                question_text="Complete the summary: Locating farms in urban areas benefits the environment by reducing ___________.",
                question_type="SUMMARY", 
                options=["water usage", "land requirements", "transportation emissions", "pesticide needs"],
                correct_answer="transportation emissions", difficulty=5,
                explanation="The passage mentions 'lower carbon footprint' from reduced 'transportation distances.'"),
    ])
    
    # Full Summary (Skill 9)
    summary_passage_3 = """The decline of insects represents an ecological crisis that has escaped public attention. A 2019 meta-analysis found that 40% of insect species are declining, with a third classified as endangered. Habitat loss from agriculture and urbanization is the primary driver, followed by pesticide use and climate change. Insects pollinate 75% of crop species and form the base of food webs supporting birds, fish, and mammals. Germany recorded a 76% reduction in flying insect biomass between 1989 and 2016. Some scientists warn we may be witnessing the beginning of a sixth mass extinction event. Yet unlike charismatic species such as pandas or elephants, insects struggle to attract conservation funding and public concern."""
    
    questions.extend([
        Question(skill_id=9, passage=summary_passage_3, passage_title="The Insect Crisis",
                question_text="Complete the summary: The leading cause of insect decline is _______, with chemical and climate factors also contributing.",
                question_type="SUMMARY", 
                options=["pesticide exposure", "loss of natural environments", "global warming", "invasive species"],
                correct_answer="loss of natural environments", difficulty=7,
                explanation="'Habitat loss' is stated as the 'primary driver,' which means loss of natural environments."),
        
        Question(skill_id=9, passage=summary_passage_3, passage_title="The Insect Crisis",
                question_text="Complete the summary: Conservation efforts are hampered because insects lack the _______ that other endangered animals possess.",
                question_type="SUMMARY", 
                options=["scientific interest", "economic value", "public appeal", "legal protection"],
                correct_answer="public appeal", difficulty=7,
                explanation="The 'charismatic species' comparison suggests insects don't attract public concern due to less appeal."),
    ])
    
    return questions


def main():
    """Run the seed script."""
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_skills = db.query(Skill).count()
        if existing_skills > 0:
            print(f"Database already contains {existing_skills} skills. Skipping seed.")
            return
        
        # Seed skills
        skills = seed_skills()
        for skill in skills:
            db.add(skill)
        db.commit()
        print(f"Added {len(skills)} skills")
        
        # Seed questions
        questions = seed_questions()
        for question in questions:
            db.add(question)
        db.commit()
        print(f"Added {len(questions)} questions")
        
        # Set up skill tree relationships (parent_skill_id)
        # Basic skills are parents of advanced skills within each category
        skills = db.query(Skill).all()
        skill_by_name = {s.name: s for s in skills}
        
        # TF_NG tree: Basic -> Inference -> Advanced
        skill_by_name["Inference TF/NG"].parent_skill_id = skill_by_name["Basic True/False"].id
        skill_by_name["Advanced TF/NG"].parent_skill_id = skill_by_name["Inference TF/NG"].id
        
        # Headings tree: Paragraph Main Idea -> Multiple -> Complex
        skill_by_name["Multiple Headings"].parent_skill_id = skill_by_name["Paragraph Main Idea"].id
        skill_by_name["Complex Headings"].parent_skill_id = skill_by_name["Multiple Headings"].id
        
        # Summary tree: Gap Fill -> Inference -> Full
        skill_by_name["Summary Inference"].parent_skill_id = skill_by_name["Gap Fill Basics"].id
        skill_by_name["Full Summary"].parent_skill_id = skill_by_name["Summary Inference"].id
        
        db.commit()
        print("Set up skill tree relationships")
        
        print("\nSeed complete!")
        print(f"  Skills: {db.query(Skill).count()}")
        print(f"  Questions: {db.query(Question).count()}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
