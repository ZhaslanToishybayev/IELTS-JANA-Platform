"""Seed high-quality IELTS content: Listening transcripts, Speaking prompts, Writing prompts."""

import sys
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app.models import Skill, Question, TestSet, SpeakingPrompt, WritingPrompt

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Listening Section 3 – Academic Discussion (2 students + tutor)
# ---------------------------------------------------------------------------

SECTION3_TRANSCRIPTS = [
    {
        "title": "The Impact of Social Media on Academic Performance",
        "section": "Section 3",
        "estimated_band": 6.5,
        "transcript": """Tutor: Right, so today I'd like us to discuss the findings from your research projects on social media and academic performance. Sarah, you've been looking at the psychological aspects, haven't you?

Sarah: Yes, that's right. So, um, I surveyed about two hundred university students and asked them to report their daily social media usage alongside their most recent GPA. What I found was quite striking, actually. Students who reported using social media for more than four hours a day had a noticeably lower average GPA compared to those who used it for less than one hour.

James: That's interesting. Did you find any difference between platforms? Because I'd imagine TikTok and Instagram are more distracting than, say, LinkedIn.

Sarah: Absolutely. The students who primarily used visual-based platforms like Instagram and TikTok scored lower on average than those who used text-heavy platforms. But, um, I should mention that correlation doesn't necessarily mean causation. There could be other factors involved.

Tutor: That's a very important distinction, Sarah. What about your methodology? How did you control for variables like course difficulty or part-time employment?

Sarah: Good question. I used a multiple regression analysis and controlled for year of study, employment status, and course type. Even after controlling for those, social media use was still a significant predictor of GPA, though the effect was smaller.

James: That's really well thought out. I took a slightly different approach, actually. I conducted interviews with twelve students who had been placed on academic probation. I was interested in the qualitative side of things, you know, the personal experiences behind the numbers.

Tutor: And what did your interviews reveal, James?

James: Well, um, several participants described what they called a "scrolling spiral." They'd open their phone to check one notification and then lose track of time. One student mentioned spending three hours on Instagram when she only intended to check one message. The interesting thing is that most of them were aware it was a problem but felt unable to stop.

Sarah: That aligns with what I found in the literature. There's research on what psychologists call "dopamine loops" where the reward mechanism in the brain keeps pulling you back to the screen.

James: Right, and what surprised me was that five out of twelve participants said they actually used social media more during exam periods, which is exactly when they should be studying.

Tutor: That's a fascinating paradox. Did any of your participants mention strategies they'd tried to manage their usage?

James: Yes, a few had tried apps that limit screen time, but most said they just found ways around them. The ones who were most successful seemed to be those who had a very structured study schedule with specific break times.

Sarah: I found something similar. The students with higher GPAs tended to use what I'd call "intentional usage" patterns. They'd set specific times for social media rather than having it as a constant background activity.

Tutor: So, James, going back to your research design, how did you ensure the reliability of your qualitative data?

James: I used a technique called "member checking," where I sent my interpretations back to the participants to see if they agreed with my analysis. I also had a colleague independently code a couple of the transcripts to check for consistency.

Tutor: Excellent methodology. Now, Sarah, what would you say are the implications of your findings for universities?

Sarah: I think there's a case for incorporating digital literacy into first-year programmes. Students need to understand how these platforms are designed to capture attention. Um, also, some universities have started implementing phone-free zones in libraries, which I think could be beneficial.

James: That's a good point. From my interviews, I'd add that universities should probably offer more counselling support around digital wellbeing. A lot of students I spoke to seemed quite distressed about their inability to manage their screen time but didn't know where to turn.

Tutor: Those are both valuable recommendations. For your final papers, I'd like you to consider how your findings might differ across different cultural contexts. There's some evidence that social media usage patterns vary significantly between Eastern and Western universities. Right, any final questions before we wrap up?

Sarah: Just one. Do you think the relationship between social media and performance is linear, or is there a threshold effect?

Tutor: That's an excellent question, and it's something you could explore in your discussion section. I'd suggest looking at the work by Twenge and Campbell for some guidance. Right, let's reconvene next week with your draft conclusions.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "What was the main finding of Sarah's survey regarding social media usage and GPA?",
                "options": [
                    "Students using social media for 2-3 hours had the lowest GPA",
                    "Students using social media for more than 4 hours had a lower average GPA",
                    "Social media usage had no significant effect on GPA",
                    "Only Instagram usage was linked to lower grades"
                ],
                "answer": "Students using social media for more than 4 hours had a lower average GPA",
                "explanation": "Sarah states that students who reported using social media for more than four hours a day had a noticeably lower average GPA compared to those who used it for less than one hour."
            },
            {
                "type": "MCQ",
                "text": "What surprised James about his interview participants' social media habits during exam periods?",
                "options": [
                    "They stopped using social media entirely",
                    "They switched to educational content only",
                    "Five out of twelve used social media more during exams",
                    "They all deleted their apps temporarily"
                ],
                "answer": "Five out of twelve used social media more during exams",
                "explanation": "James states: 'five out of twelve participants said they actually used social media more during exam periods, which is exactly when they should be studying.'"
            },
            {
                "type": "MCQ",
                "text": "Which of the following did Sarah control for in her regression analysis?",
                "options": [
                    "Age, gender, and income",
                    "Year of study, employment status, and course type",
                    "Social media platform type and duration of use",
                    "University location and class size"
                ],
                "answer": "Year of study, employment status, and course type",
                "explanation": "Sarah states: 'I used a multiple regression analysis and controlled for year of study, employment status, and course type.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "James's participants described a phenomenon called a 'scrolling __________.'",
                "options": [],
                "answer": "spiral",
                "explanation": "James mentions that several participants described what they called a 'scrolling spiral.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "Sarah's research found that students with higher GPAs used __________ usage patterns.",
                "options": [],
                "answer": "intentional",
                "explanation": "Sarah says: 'The students with higher GPAs tended to use what I'd call intentional usage patterns.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "James used a technique called 'member __________' to validate his qualitative data.",
                "options": [],
                "answer": "checking",
                "explanation": "James says: 'I used a technique called member checking, where I sent my interpretations back to the participants.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Sarah suggests that universities should incorporate __________ into first-year programmes.",
                "options": [],
                "answer": "digital literacy",
                "explanation": "Sarah states: 'I think there's a case for incorporating digital literacy into first-year programmes.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The tutor recommends Sarah look at the work by __________ and Campbell for guidance on threshold effects.",
                "options": [],
                "answer": "Twenge",
                "explanation": "The tutor says: 'I'd suggest looking at the work by Twenge and Campbell for some guidance.'"
            },
            {
                "type": "MATCHING",
                "text": "Match each researcher with their research method.",
                "options": [
                    "Sarah — Survey with regression analysis",
                    "James — Qualitative interviews with member checking"
                ],
                "answer": "Sarah — Survey with regression analysis; James — Qualitative interviews with member checking",
                "explanation": "Sarah conducted a survey of 200 students with regression analysis, while James conducted 12 qualitative interviews and used member checking."
            },
            {
                "type": "MATCHING",
                "text": "Match each finding to the correct researcher.",
                "options": [
                    "Visual platforms linked to lower scores — Sarah",
                    "Students used social media more during exams — James"
                ],
                "answer": "Visual platforms linked to lower scores — Sarah; Students used social media more during exams — James",
                "explanation": "Sarah found visual platforms were more distracting, and James found participants increased usage during exam periods."
            }
        ]
    },
    {
        "title": "Sustainable Architecture in Modern Universities",
        "section": "Section 3",
        "estimated_band": 6.5,
        "transcript": """Professor: Good afternoon, both. I've read your preliminary reports on sustainable architecture in university buildings, and I must say I'm impressed with the direction you've both taken. Priya, would you like to start by summarising your case study?

Priya: Of course. So, um, I focused on the Bullitt Center in Seattle, which is often cited as one of the greenest commercial buildings in the world. It was completed in 2013 and has been described as a "living building" because it meets all the criteria of the Living Building Challenge. What struck me most was the rainwater harvesting system. The building collects about 56,000 gallons of rainwater annually, which is then filtered and used for all the building's water needs, including drinking water.

Tom: That's fascinating. I looked at a different example. I examined the CH2 building in Melbourne, Australia. It uses a system of recycled timber and concrete, and it has these remarkable "phase-change material" panels embedded in the ceiling. They absorb heat during the day and release it at night, which reduces the need for air conditioning by about forty percent.

Professor: Excellent choices, both of you. Priya, what about the energy performance of the Bullitt Center? How does it compare to a conventional office building?

Priya: Well, according to the data I found, the Bullitt Center uses about 80% less energy than a typical office building of the same size. The main strategies are the rooftop solar panels, which generate more electricity than the building actually consumes, and the triple-glazed windows, which provide excellent insulation. Um, there's also the fact that the building is oriented to maximise natural light, which reduces the need for artificial lighting during daytime hours.

Tom: That's impressive. The CH2 building in Melbourne also has interesting water features. It uses recycled stormwater for toilet flushing and irrigation. And the facade is covered in these recycled timber louvres that provide shading from the harsh Australian sun while still allowing natural light to enter the building.

Professor: Tom, you mentioned in your report that the CH2 building was more challenging to retrofit than to build from scratch. Can you elaborate on that?

Tom: Yes, so the original building was constructed in the 1990s with no consideration for sustainability. When they decided to retrofit it, they had to essentially rebuild the entire facade and replace all the mechanical systems. The cost was approximately 12 million Australian dollars, which is quite significant. However, the building now saves about 800,000 dollars per year in energy costs, so the payback period is roughly fifteen years.

Priya: That's a really important point about retrofitting. In my research, I found that about 85% of existing university buildings will still be in use in 2050, so we can't just focus on new construction. We need to find ways to make existing buildings more sustainable.

Professor: Absolutely. And what are the main barriers you've identified to implementing these sustainable features in university campuses?

Priya: I'd say the biggest barrier is upfront cost. Universities often have limited budgets and competing priorities. A new library or lecture theatre tends to get prioritised over solar panels or improved insulation because the benefits are more visible to students and donors.

Tom: I agree with that. I'd also add that there's a knowledge gap. Many university facilities managers don't have detailed expertise in green building technologies, so they're reluctant to invest in systems they don't fully understand.

Professor: Those are both valid points. Now, thinking about the future, what developments do you see on the horizon for sustainable university architecture?

Priya: I think the integration of smart building technology is going to be transformative. Buildings that can monitor and adjust their own energy usage in real-time, using artificial intelligence to optimise heating, cooling, and lighting based on occupancy patterns.

Tom: That's exciting. I'm also interested in the concept of "embodied carbon" in building materials. There's a growing movement towards using materials like mass timber, which actually stores carbon rather than releasing it during production. Some universities in Scandinavia are already building entirely timber structures.

Professor: These are excellent insights. For your final essays, I'd like you to both address the question of how universities can balance the desire for sustainable buildings with the practical constraints of limited budgets and competing demands. And Tom, make sure you explore the embodied carbon concept in more depth - it's a very current topic. Any final questions?

Priya: Just one. Do you think there should be mandatory sustainability standards for all university buildings, or should it be left to individual institutions to decide?

Professor: That's a policy question that deserves its own essay. I'll leave you to explore both sides. Right, let's reconvene in two weeks with your complete drafts.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "How much rainwater does the Bullitt Center collect annually?",
                "options": [
                    "About 36,000 gallons",
                    "About 45,000 gallons",
                    "About 56,000 gallons",
                    "About 70,000 gallons"
                ],
                "answer": "About 56,000 gallons",
                "explanation": "Priya states the Bullitt Center 'collects about 56,000 gallons of rainwater annually.'"
            },
            {
                "type": "MCQ",
                "text": "What is the estimated payback period for the CH2 building retrofit?",
                "options": [
                    "About 5 years",
                    "About 10 years",
                    "About 15 years",
                    "About 20 years"
                ],
                "answer": "About 15 years",
                "explanation": "Tom says the building saves about 800,000 dollars per year on a 12 million dollar investment, so the payback period is roughly fifteen years."
            },
            {
                "type": "MCQ",
                "text": "What percentage of existing university buildings will still be in use in 2050?",
                "options": [
                    "About 65%",
                    "About 75%",
                    "About 85%",
                    "About 95%"
                ],
                "answer": "About 85%",
                "explanation": "Priya says: 'about 85% of existing university buildings will still be in use in 2050.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The CH2 building uses __________ material panels embedded in the ceiling to absorb and release heat.",
                "options": [],
                "answer": "phase-change",
                "explanation": "Tom describes 'phase-change material' panels embedded in the ceiling."
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The Bullitt Center uses __________-glazed windows to provide excellent insulation.",
                "options": [],
                "answer": "triple",
                "explanation": "Priya mentions 'the triple-glazed windows, which provide excellent insulation.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The CH2 building facade is covered in recycled __________ louvres that provide shading.",
                "options": [],
                "answer": "timber",
                "explanation": "Tom states the facade is covered in 'recycled timber louvres that provide shading.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "According to Priya, the biggest barrier to implementing sustainable features is __________ __________.",
                "options": [],
                "answer": "upfront cost",
                "explanation": "Priya states: 'I'd say the biggest barrier is upfront cost.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Tom identifies a __________ gap among university facilities managers as a barrier to green building adoption.",
                "options": [],
                "answer": "knowledge",
                "explanation": "Tom says: 'I'd also add that there's a knowledge gap.'"
            },
            {
                "type": "MATCHING",
                "text": "Match each building to its key sustainable feature.",
                "options": [
                    "Bullitt Center — Solar panels generating surplus electricity",
                    "CH2 Building — Phase-change material ceiling panels"
                ],
                "answer": "Bullitt Center — Solar panels generating surplus electricity; CH2 Building — Phase-change material ceiling panels",
                "explanation": "The Bullitt Center has rooftop solar panels, and the CH2 Building has phase-change material panels."
            },
            {
                "type": "MATCHING",
                "text": "Match each researcher to the country where their case study building is located.",
                "options": [
                    "Priya — United States",
                    "Tom — Australia"
                ],
                "answer": "Priya — United States; Tom — Australia",
                "explanation": "Priya studied the Bullitt Center in Seattle (US) and Tom studied the CH2 Building in Melbourne (Australia)."
            }
        ]
    },
    {
        "title": "Marine Conservation and Coastal Communities",
        "section": "Section 3",
        "estimated_band": 7.0,
        "transcript": """Supervisor: Thank you both for coming in today. I've had a chance to review your research proposals on marine conservation and its impact on coastal communities, and I think you've both identified very promising angles. Anika, would you like to begin with your overview?

Anika: Yes, thank you. So, um, my research focuses on marine protected areas, or MPAs, in the Philippines and how they affect the livelihoods of local fishing communities. I spent three months conducting fieldwork in a coastal village in Palawan, which is in the western part of the country. The village had been within an MPA for about five years at the time of my study.

Ethan: That's interesting. I took a broader approach. I looked at the economic impact of coral reef restoration projects across five countries in Southeast Asia. I used a combination of government reports and NGO data to compare the economic outcomes before and after restoration efforts.

Supervisor: Excellent contrast in methodology. Anika, what were your main findings regarding the fishing communities?

Anika: Well, the picture is quite complex. On the one hand, the establishment of the MPA led to a significant recovery of fish populations in the protected zone. Within three years, fish biomass increased by about 150%, which is remarkable. However, the immediate effect on the fishermen was negative because they were no longer allowed to fish in what had been their most productive grounds.

Ethan: So there was a trade-off between conservation and livelihoods in the short term?

Anika: Exactly. The fishermen had to travel further to reach fishing areas, which increased their fuel costs and reduced their catch per trip. Some families reported a 40% reduction in income during the first two years. But, um, by the fourth year, most families had adapted. Some had switched to tourism-related work, like guiding snorkelling trips, while others had taken up aquaculture.

Supervisor: And Ethan, how did the economic outcomes compare across the five countries you studied?

Ethan: There was considerable variation. The countries that had the most successful outcomes were those that had integrated conservation with community development. For example, in Indonesia, the restoration projects that also provided training in sustainable fishing practices and alternative livelihoods saw the greatest economic improvements. In contrast, the projects that focused purely on ecological restoration without addressing community needs tended to be less successful economically.

Anika: That's consistent with what I found in the Philippines. The families who were most successful in adapting were those who received support from NGOs in terms of training and micro-loans.

Ethan: In terms of numbers, the restoration projects in Indonesia and the Philippines generated an average increase in household income of about 25% within three years, while the projects in Vietnam and Cambodia, which had less community engagement, showed increases of only about 8%.

Supervisor: Those are very telling figures. Anika, you mentioned tourism as an alternative livelihood. Were there any concerns about over-reliance on tourism?

Anika: Yes, definitely. Several community leaders expressed concern that tourism was somewhat unpredictable. They mentioned that during the pandemic, tourist numbers dropped to almost zero, and families who had fully transitioned to tourism were hit very hard. Um, one elder told me that the most resilient families were those who maintained a mix of fishing, tourism, and aquaculture.

Supervisor: That's a valuable insight about economic resilience. Ethan, what about the long-term sustainability of the restoration projects? Did your data address that question?

Ethan: Partially. The projects that had been running for more than five years showed better long-term outcomes than the newer ones. But I should note that many of the projects relied heavily on external funding, and there were concerns about what would happen when that funding ended. The most sustainable projects were those where the local community had a genuine sense of ownership and was involved in decision-making from the outset.

Anika: I found the same thing. The village I studied had a community-managed MPA, and the sense of ownership was very strong. The villagers actually enforced the rules themselves, which was much more effective than government enforcement alone.

Supervisor: That points to the importance of community governance in conservation. For your dissertations, I'd like you both to develop a framework that balances ecological goals with socioeconomic needs. And Anika, I'd encourage you to explore the concept of "community-based natural resource management" in more depth. It's directly relevant to your case study. Any questions?

Anika: Just one. Do you think MPAs should always compensate fishermen for the income they lose in the short term?

Supervisor: That's a policy question worth exploring. Look at the different compensation models that have been tried globally, and evaluate their effectiveness. Right, let's meet again in three weeks with your chapter drafts.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "By how much did fish biomass increase in the MPA within three years?",
                "options": [
                    "About 50%",
                    "About 100%",
                    "About 150%",
                    "About 200%"
                ],
                "answer": "About 150%",
                "explanation": "Anika states: 'fish biomass increased by about 150%, which is remarkable.'"
            },
            {
                "type": "MCQ",
                "text": "What was the average increase in household income in the most successful restoration projects?",
                "options": [
                    "About 8%",
                    "About 15%",
                    "About 25%",
                    "About 40%"
                ],
                "answer": "About 25%",
                "explanation": "Ethan states the restoration projects in Indonesia and the Philippines 'generated an average increase in household income of about 25% within three years.'"
            },
            {
                "type": "MCQ",
                "text": "What did Anika find was the most effective form of MPA enforcement?",
                "options": [
                    "Government patrol boats",
                    "International monitoring",
                    "Community self-enforcement",
                    "Satellite surveillance"
                ],
                "answer": "Community self-enforcement",
                "explanation": "Anika says: 'The villagers actually enforced the rules themselves, which was much more effective than government enforcement alone.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "Anika conducted her fieldwork in a coastal village in __________, in the western Philippines.",
                "options": [],
                "answer": "Palawan",
                "explanation": "Anika states she conducted fieldwork 'in a coastal village in Palawan.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "Some fishing families reported a __________% reduction in income during the first two years of the MPA.",
                "options": [],
                "answer": "40",
                "explanation": "Anika says: 'Some families reported a 40% reduction in income during the first two years.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The restoration projects in Vietnam and Cambodia showed income increases of only about __________%.",
                "options": [],
                "answer": "8",
                "explanation": "Ethan says these projects 'showed increases of only about 8%.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Ethan studied the economic impact of __________ reef restoration projects across five countries.",
                "options": [],
                "answer": "coral",
                "explanation": "Ethan states he looked at 'the economic impact of coral reef restoration projects.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The most resilient fishing families were those who maintained a mix of fishing, tourism, and __________.",
                "options": [],
                "answer": "aquaculture",
                "explanation": "Anika reports the elder saying the most resilient families maintained 'a mix of fishing, tourism, and aquaculture.'"
            },
            {
                "type": "MATCHING",
                "text": "Match each researcher with their primary methodology.",
                "options": [
                    "Anika — Three-month fieldwork with qualitative interviews",
                    "Ethan — Analysis of government and NGO reports across five countries"
                ],
                "answer": "Anika — Three-month fieldwork with qualitative interviews; Ethan — Analysis of government and NGO reports across five countries",
                "explanation": "Anika spent three months conducting fieldwork, while Ethan used government reports and NGO data."
            },
            {
                "type": "MATCHING",
                "text": "Match each country group with its economic outcome from restoration projects.",
                "options": [
                    "Indonesia and Philippines — About 25% income increase",
                    "Vietnam and Cambodia — About 8% income increase"
                ],
                "answer": "Indonesia and Philippines — About 25% income increase; Vietnam and Cambodia — About 8% income increase",
                "explanation": "Ethan provides these specific figures for the different country groups."
            }
        ]
    }
]


# ---------------------------------------------------------------------------
# Listening Section 4 – Academic Lecture (single speaker)
# ---------------------------------------------------------------------------

SECTION4_TRANSCRIPTS = [
    {
        "title": "The Psychology of Decision Making",
        "section": "Section 4",
        "estimated_band": 7.0,
        "transcript": """Good morning, everyone. Today's lecture is on the psychology of decision making, a topic that has fascinated researchers for decades and has very practical implications for how we live our lives. I want to start by challenging a common assumption: that human beings are fundamentally rational decision makers. As we'll see, the evidence suggests otherwise.

Let me begin with a concept that many of you may have encountered: cognitive biases. These are systematic patterns of deviation from rational judgement. In other words, they're predictable errors that our brains make when processing information. The pioneering work in this area was done by Daniel Kahneman and Amos Tversky in the 1970s, and it fundamentally changed how we understand human decision making.

The first bias I want to discuss is known as the "anchoring effect." This refers to our tendency to rely too heavily on the first piece of information we encounter when making decisions. For example, if you're negotiating a salary and the employer offers you 40,000 dollars, that number becomes an anchor, even if the fair market value is actually 55,000 dollars. Research has shown that even arbitrary numbers can serve as anchors. In one study, participants were asked to estimate the percentage of African countries in the United Nations after spinning a wheel of fortune. Those who landed on higher numbers gave significantly higher estimates than those who landed on lower numbers, even though the wheel result was completely unrelated to the question.

The second bias is "loss aversion." This is the well-documented finding that losses loom larger than gains. Losing 100 dollars feels roughly twice as painful as gaining 100 dollars feels pleasurable. This has enormous implications for financial decision making, but also for everyday choices. For instance, people are often reluctant to switch jobs even when the new position offers better prospects, simply because the potential loss of familiarity and security outweighs the potential gain.

Now, let me introduce the concept of "the framing effect." This bias demonstrates that how a decision is presented, or "framed," can dramatically influence our choices. In a famous experiment, participants were told about a disease expected to kill 600 people. When the options were framed in terms of lives saved, with Option A saving 200 people for certain, most people chose the sure thing. But when the same options were framed in terms of deaths, with Option A resulting in 400 deaths, most people chose the gamble. The outcomes are mathematically identical, yet the framing changed the preference entirely.

Moving on to what I consider one of the most pervasive biases in modern life: "the availability heuristic." This is our tendency to judge the likelihood of events based on how easily examples come to mind. After watching several news reports about plane crashes, people often overestimate the danger of flying, even though statistically it is far safer than driving. The vividness and emotional impact of the examples make them more "available" in memory, leading to distorted risk assessments.

Let me now discuss "confirmation bias," which is particularly relevant in the age of social media. This is our tendency to seek out, interpret, and remember information that confirms our pre-existing beliefs while ignoring contradictory evidence. Studies have shown that when people with strong political views read articles about controversial topics, they disproportionately remember arguments that support their position. This creates what researchers call "echo chambers" where beliefs become increasingly entrenched.

The final bias I'll cover today is "the sunk cost fallacy." This is the irrational tendency to continue investing in something because of what you've already invested, rather than based on future returns. Have you ever watched a terrible movie to the very end simply because you paid for the ticket? That's the sunk cost fallacy at work. Companies make this mistake too, pouring millions into failing projects because of the money already spent.

Now, why does all of this matter? Because understanding these biases is the first step toward making better decisions. Research by Kahneman and others has shown that simply being aware of a bias doesn't necessarily eliminate it, but it does allow us to develop strategies to counteract it. These strategies include seeking out diverse perspectives, taking time before making important decisions, using structured decision-making frameworks, and being especially cautious when we feel strong emotions about a choice.

I want to leave you with an important question to consider: if our brains are hardwired with these biases, to what extent can we ever truly make rational decisions? That's something I'd like you to think about for next week's seminar. We'll also be looking at how organisations are using "nudge theory" to design choice architectures that help people make better decisions without restricting their freedom. Thank you.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "What is the anchoring effect?",
                "options": [
                    "The tendency to avoid making decisions",
                    "The tendency to rely too heavily on the first piece of information encountered",
                    "The tendency to follow the majority opinion",
                    "The tendency to make decisions based on emotions"
                ],
                "answer": "The tendency to rely too heavily on the first piece of information encountered",
                "explanation": "The lecturer defines anchoring as 'our tendency to rely too heavily on the first piece of information we encounter when making decisions.'"
            },
            {
                "type": "MCQ",
                "text": "According to loss aversion research, losing 100 dollars feels approximately how much more painful than gaining 100 dollars feels pleasurable?",
                "options": [
                    "The same",
                    "Twice as much",
                    "Three times as much",
                    "Four times as much"
                ],
                "answer": "Twice as much",
                "explanation": "The lecturer states: 'Losing 100 dollars feels roughly twice as painful as gaining 100 dollars feels pleasurable.'"
            },
            {
                "type": "MCQ",
                "text": "In the disease experiment demonstrating the framing effect, what changed between the two versions?",
                "options": [
                    "The number of people affected",
                    "The type of disease described",
                    "Whether outcomes were described as lives saved or deaths",
                    "The treatments offered"
                ],
                "answer": "Whether outcomes were described as lives saved or deaths",
                "explanation": "The lecturer explains the options were framed differently: 'lives saved' versus 'deaths,' even though the outcomes were identical."
            },
            {
                "type": "MCQ",
                "text": "Which bias is described as being particularly relevant in the age of social media?",
                "options": [
                    "Anchoring effect",
                    "Loss aversion",
                    "Confirmation bias",
                    "Sunk cost fallacy"
                ],
                "answer": "Confirmation bias",
                "explanation": "The lecturer states: 'confirmation bias, which is particularly relevant in the age of social media.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The pioneering work on cognitive biases was done by Daniel Kahneman and Amos __________ in the 1970s.",
                "options": [],
                "answer": "Tversky",
                "explanation": "The lecturer mentions 'Daniel Kahneman and Amos Tversky in the 1970s.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "People's tendency to judge event likelihood based on how easily examples come to mind is called the availability __________.",
                "options": [],
                "answer": "heuristic",
                "explanation": "The lecturer names this 'the availability heuristic.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The sunk cost fallacy is the irrational tendency to continue investing because of what you've already __________.",
                "options": [],
                "answer": "invested",
                "explanation": "The lecturer defines it as continuing 'because of what you've already invested, rather than based on future returns.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "According to the lecturer, simply being aware of a bias doesn't necessarily __________ it.",
                "options": [],
                "answer": "eliminate",
                "explanation": "The lecturer says: 'simply being aware of a bias doesn't necessarily eliminate it.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Kahneman and others suggest using structured __________-making frameworks to counteract biases.",
                "options": [],
                "answer": "decision",
                "explanation": "The lecturer recommends 'using structured decision-making frameworks.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The lecturer will next discuss how organisations use __________ theory to design choice architectures.",
                "options": [],
                "answer": "nudge",
                "explanation": "The lecturer mentions 'nudge theory' for the next seminar."
            }
        ]
    },
    {
        "title": "The History and Future of Renewable Energy",
        "section": "Section 4",
        "estimated_band": 6.5,
        "transcript": """Good afternoon, everyone. Today I want to take you on a journey through the history of renewable energy and, more importantly, look at where we're heading. Now, when most people think of renewable energy, they think of solar panels and wind turbines that have appeared in the last couple of decades. But the history actually goes back much further than that.

Let's start in the late 19th century. In 1882, the world's first hydroelectric power plant opened on the Fox River in Appleton, Wisconsin. So hydropower was really the original renewable energy source. By the 1930s, large-scale hydroelectric dams were being constructed around the world, including the Hoover Dam in the United States, which was completed in 1936 and provided electricity to millions of people in the Southwest.

Solar energy has an surprisingly long history too. In 1954, Bell Laboratories developed the first practical silicon solar cell, which could convert sunlight into electricity at an efficiency of about 6%. That might sound low by today's standards, but it was revolutionary at the time. The problem was that solar cells were extraordinarily expensive. In the 1950s, a single watt of solar capacity cost about 1,760 dollars. Compare that to today, where the cost has fallen to roughly 0.20 to 0.30 dollars per watt. That's a reduction of over 99%.

Wind energy also has deeper roots than many people realise. Denmark was an early pioneer, and by the 1890s, Danish farmers were using windmills to generate electricity. The modern wind turbine as we know it was developed in the 1940s and 1950s, though large-scale wind farms didn't emerge until the 1980s, primarily in California.

Now, let me fast forward to the present day. Renewable energy currently accounts for about 30% of global electricity generation, which is impressive but still leaves us heavily dependent on fossil fuels. The International Energy Agency projects that renewables could reach 50% by 2030 if current growth rates are maintained. However, there are significant challenges to overcome.

The first challenge is energy storage. Solar and wind are intermittent sources; the sun doesn't always shine and the wind doesn't always blow. Current battery technology, primarily lithium-ion, is improving rapidly but still isn't cheap enough or scalable enough to solve this problem completely. There are promising alternatives being developed, including solid-state batteries, which could offer higher energy density and lower costs, and flow batteries, which are better suited to large-scale grid storage.

The second challenge is grid infrastructure. Most electrical grids were designed for centralised power generation from large fossil fuel plants. Integrating distributed renewable sources requires significant upgrades to transmission and distribution networks. Smart grid technology, which uses digital communication to manage electricity flows in real-time, is essential for this transition.

The third challenge, and perhaps the most politically sensitive, is the phase-out of existing fossil fuel infrastructure. There are trillions of dollars worth of coal plants, gas pipelines, and oil refineries around the world that still have decades of operational life remaining. The concept of "stranded assets" refers to the risk that these investments will lose their value before the end of their expected lifespan, which has enormous financial implications for companies and governments.

Looking ahead, I see several exciting developments. Green hydrogen, produced by splitting water using renewable electricity, could decarbonise sectors that are difficult to electrify directly, such as heavy industry and long-distance transport. Offshore wind is growing rapidly, with floating turbine technology allowing installations in deeper waters where winds are stronger and more consistent. And geothermal energy, which provides reliable baseload power by tapping into the Earth's heat, is expanding beyond traditional volcanic regions through enhanced geothermal systems.

The bottom line is this: the transition to renewable energy is not just a technological challenge. It's an economic, political, and social challenge. The countries and communities that invest in this transition now will be the ones that thrive in the decades to come. Those that delay will face increasing costs, both financial and environmental. Thank you very much, and I'm happy to take questions.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "When did the world's first hydroelectric power plant open?",
                "options": [
                    "1872",
                    "1882",
                    "1892",
                    "1902"
                ],
                "answer": "1882",
                "explanation": "The lecturer states: 'In 1882, the world's first hydroelectric power plant opened on the Fox River.'"
            },
            {
                "type": "MCQ",
                "text": "What was the cost per watt of solar capacity in the 1950s?",
                "options": [
                    "About 170 dollars",
                    "About 1,760 dollars",
                    "About 17,600 dollars",
                    "About 176,000 dollars"
                ],
                "answer": "About 1,760 dollars",
                "explanation": "The lecturer says: 'In the 1950s, a single watt of solar capacity cost about 1,760 dollars.'"
            },
            {
                "type": "MCQ",
                "text": "What does the International Energy Agency project renewables could reach by 2030?",
                "options": [
                    "30% of global electricity",
                    "40% of global electricity",
                    "50% of global electricity",
                    "75% of global electricity"
                ],
                "answer": "50% of global electricity",
                "explanation": "The lecturer states: 'renewables could reach 50% by 2030 if current growth rates are maintained.'"
            },
            {
                "type": "MCQ",
                "text": "Which country was an early pioneer in wind energy in the 1890s?",
                "options": [
                    "Germany",
                    "Denmark",
                    "United States",
                    "United Kingdom"
                ],
                "answer": "Denmark",
                "explanation": "The lecturer says: 'Denmark was an early pioneer, and by the 1890s, Danish farmers were using windmills to generate electricity.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The first practical silicon solar cell was developed by __________ Laboratories in 1954.",
                "options": [],
                "answer": "Bell",
                "explanation": "The lecturer states: 'In 1954, Bell Laboratories developed the first practical silicon solar cell.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The Hoover Dam was completed in __________ and provided electricity to millions.",
                "options": [],
                "answer": "1936",
                "explanation": "The lecturer says: 'the Hoover Dam in the United States, which was completed in 1936.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The term __________ assets refers to fossil fuel investments that may lose value before the end of their expected lifespan.",
                "options": [],
                "answer": "stranded",
                "explanation": "The lecturer defines 'stranded assets' as investments that will lose their value prematurely."
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The first challenge to renewable energy growth is energy __________, since solar and wind are intermittent.",
                "options": [],
                "answer": "storage",
                "explanation": "The lecturer identifies 'energy storage' as the first challenge."
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Green __________, produced by splitting water using renewable electricity, could decarbonise heavy industry and transport.",
                "options": [],
                "answer": "hydrogen",
                "explanation": "The lecturer mentions 'Green hydrogen' as a promising development."
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Smart grid technology uses digital communication to manage electricity flows in __________-time.",
                "options": [],
                "answer": "real",
                "explanation": "The lecturer states: 'Smart grid technology, which uses digital communication to manage electricity flows in real-time.'"
            }
        ]
    },
    {
        "title": "Linguistic Diversity and Language Endangerment",
        "section": "Section 4",
        "estimated_band": 7.0,
        "transcript": """Good morning, everyone. Today's lecture explores a topic that I find deeply compelling: the extraordinary diversity of human languages and the alarming rate at which that diversity is disappearing. There are approximately 7,000 languages spoken in the world today, but linguists estimate that roughly half of them will be extinct by the end of this century. That's a staggering loss of cultural knowledge and human heritage.

Let me start with some context. The field of language documentation has become increasingly urgent as languages disappear at a rate of approximately one every two weeks. When a language dies, it takes with it centuries of accumulated knowledge about the natural world, social organisation, and human cognition. Many indigenous languages contain botanical and ecological knowledge that has no equivalent in major world languages. For example, the Ainu language of Japan contains detailed terminology for bear behaviour and habitat that reflects centuries of careful observation.

The causes of language endangerment are complex, but they generally fall into a few categories. The most common is language shift, where communities voluntarily or involuntarily adopt a dominant language, often for economic or social reasons. This is happening at an accelerating pace due to globalisation, urbanisation, and the influence of mass media. When parents decide to raise their children in a dominant language rather than their heritage language, it's often a pragmatic choice aimed at improving their children's economic prospects. But it comes at a cost.

The second major cause is language suppression, where governments or institutions actively discourage or prohibit the use of minority languages. The history of colonisation is littered with examples of this. In many former colonies, indigenous languages were banned from schools and public life. Even today, there are countries where minority languages are not taught in schools and have no official status.

The third cause, which is often overlooked, is demographic collapse. When a small community is devastated by disease, conflict, or forced displacement, the intergenerational transmission of language can be disrupted. If children are separated from their elders, the chain of language transmission is broken, and the language may be lost within a generation.

Now, let me discuss some of the efforts being made to reverse this trend. Language revitalisation has become a global movement, with programmes ranging from small community-led initiatives to major government-sponsored projects. The most famous success story is probably Hebrew, which was revived as a spoken language in the late 19th and early 20th centuries after being used primarily as a written and liturgical language for centuries. This is often called the "Hebrew miracle" because it's the only known case of a language being successfully revived after it had ceased to be spoken natively.

Closer to our present day, the Māori language of New Zealand has seen remarkable recovery thanks to a combination of government support, community programmes, and immersion schools called "kōhanga reo" or "language nests." The number of Māori speakers has increased significantly since the 1980s, though there's still work to be done.

Technology is also playing an increasingly important role in language preservation. Digital tools are being developed to document and teach endangered languages. Apps, online dictionaries, and social media platforms in minority languages are making it easier for speakers to use their languages in daily life. Machine learning is being used to create speech recognition and translation tools for languages that previously had no digital presence.

However, I want to emphasise that technology alone cannot save a language. Language is fundamentally a social phenomenon. It exists in the interactions between people, in the stories told around a fire, in the songs sung at celebrations, in the daily conversations of a community. Without a living community of speakers who use the language in meaningful contexts, no amount of digital documentation can keep it alive.

I'd also like to touch on the concept of "linguistic relativity," sometimes known as the Sapir-Whorf hypothesis. This theory suggests that the language we speak influences how we think about the world. Languages encode different aspects of reality. For instance, some languages have elaborate systems of evidentiality, where speakers must grammatically mark how they know something; whether they saw it directly, heard it from someone else, or inferred it. This has implications not just for linguistics but for psychology and philosophy.

As I conclude, I want to leave you with a thought experiment. If we accept that every language represents a unique way of understanding the world, then the loss of a language is not just a cultural tragedy; it's an intellectual one. We lose a perspective, a way of seeing that can never be replicated. The question we must ask ourselves is: what responsibility do we bear, as global citizens, to preserve this diversity? Thank you very much for your attention.""",
        "questions": [
            {
                "type": "MCQ",
                "text": "Approximately how many languages are currently spoken in the world?",
                "options": [
                    "About 3,000",
                    "About 5,000",
                    "About 7,000",
                    "About 10,000"
                ],
                "answer": "About 7,000",
                "explanation": "The lecturer states: 'There are approximately 7,000 languages spoken in the world today.'"
            },
            {
                "type": "MCQ",
                "text": "At what rate are languages disappearing according to the lecture?",
                "options": [
                    "About one every month",
                    "About one every two weeks",
                    "About one every week",
                    "About one every day"
                ],
                "answer": "About one every two weeks",
                "explanation": "The lecturer says: 'languages disappear at a rate of approximately one every two weeks.'"
            },
            {
                "type": "MCQ",
                "text": "What is unique about the revival of Hebrew?",
                "options": [
                    "It was supported by a government technology programme",
                    "It is the only known case of a language being revived after ceasing to be spoken natively",
                    "It was the first language to be documented digitally",
                    "It was revived entirely through community efforts"
                ],
                "answer": "It is the only known case of a language being revived after ceasing to be spoken natively",
                "explanation": "The lecturer states Hebrew is 'the only known case of a language being successfully revived after it had ceased to be spoken natively.'"
            },
            {
                "type": "MCQ",
                "text": "What is the concept of evidentiality in some languages?",
                "options": [
                    "Marking the tense of a verb",
                    "Grammatically marking how the speaker knows something",
                    "Indicating the gender of the speaker",
                    "Showing the emotional tone of a statement"
                ],
                "answer": "Grammatically marking how the speaker knows something",
                "explanation": "The lecturer explains evidentiality as marking 'how they know something; whether they saw it directly, heard it from someone else, or inferred it.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The Ainu language of Japan contains detailed terminology for bear __________ and habitat.",
                "options": [],
                "answer": "behaviour",
                "explanation": "The lecturer mentions 'detailed terminology for bear behaviour and habitat.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "In New Zealand, Māori language immersion schools are called 'kōhanga reo' or 'language __________.'",
                "options": [],
                "answer": "nests",
                "explanation": "The lecturer says immersion schools are called 'kōhanga reo or language nests.'"
            },
            {
                "type": "FORM_COMPLETION",
                "text": "The theory that language influences how we think is sometimes called the Sapir-__________ hypothesis.",
                "options": [],
                "answer": "Whorf",
                "explanation": "The lecturer refers to 'the Sapir-Whorf hypothesis.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The most common cause of language endangerment is language __________, where communities adopt a dominant language.",
                "options": [],
                "answer": "shift",
                "explanation": "The lecturer identifies 'language shift' as the most common cause."
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "Technology alone cannot save a language because language is fundamentally a __________ phenomenon.",
                "options": [],
                "answer": "social",
                "explanation": "The lecturer states: 'Language is fundamentally a social phenomenon.'"
            },
            {
                "type": "SENTENCE_COMPLETION",
                "text": "The loss of a language is not just a cultural tragedy but also an __________ one, as we lose a unique perspective.",
                "options": [],
                "answer": "intellectual",
                "explanation": "The lecturer says: 'the loss of a language is not just a cultural tragedy; it's an intellectual one.'"
            }
        ]
    }
]


# ---------------------------------------------------------------------------
# Speaking Prompts
# ---------------------------------------------------------------------------

SPEAKING_PART1_PROMPTS = [
    {
        "part": "Part 1",
        "title": "Music",
        "questions": [
            "Do you enjoy listening to music? What kinds?",
            "Did you learn to play a musical instrument when you were young?",
            "Has your taste in music changed over the years?",
            "Do you think music is important in people's lives?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Movies and TV Shows",
        "questions": [
            "Do you prefer watching movies or TV shows? Why?",
            "What kind of movies or shows do you usually watch?",
            "Do you often watch movies at the cinema or at home?",
            "Has a movie or show ever changed the way you think about something?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Sports",
        "questions": [
            "Do you play any sports or do any physical exercise regularly?",
            "What is the most popular sport in your country?",
            "Did you enjoy sports as a child?",
            "Do you prefer playing sports or watching them?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Shopping",
        "questions": [
            "Do you enjoy shopping? Why or why not?",
            "Do you prefer shopping in physical stores or online?",
            "How often do you go shopping for clothes?",
            "Do you ever buy things on impulse?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Social Media",
        "questions": [
            "Which social media platforms do you use most often?",
            "Do you think social media has a positive or negative effect on people?",
            "How much time do you typically spend on social media each day?",
            "Would you consider reducing your use of social media?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Photography",
        "questions": [
            "Do you enjoy taking photographs?",
            "Do you prefer using a camera or a phone for taking photos?",
            "What kinds of photos do you like to take?",
            "Do you think photography is an important form of art?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Holidays",
        "questions": [
            "Do you prefer taking holidays in your own country or abroad?",
            "What do you usually do during holidays?",
            "How important are holidays for your wellbeing?",
            "Do you prefer relaxing holidays or adventurous ones?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Weather",
        "questions": [
            "What kind of weather do you like best?",
            "Does the weather affect your mood?",
            "How does the weather in your country compare to other places you've visited?",
            "Do you check the weather forecast regularly?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Friends",
        "questions": [
            "Do you have many close friends?",
            "How often do you spend time with your friends?",
            "What do you and your friends usually do together?",
            "Do you think it's important to have friends with similar interests?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Nature",
        "questions": [
            "Do you enjoy spending time in nature?",
            "How often do you visit parks or natural areas?",
            "What is your favourite natural landscape?",
            "Do you think city people have enough contact with nature?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Art",
        "questions": [
            "Do you enjoy visiting art galleries or museums?",
            "Have you ever tried drawing or painting?",
            "Do you think art is an important part of education?",
            "What kind of art appeals to you most?"
        ]
    },
    {
        "part": "Part 1",
        "title": "Languages",
        "questions": [
            "How many languages can you speak?",
            "Would you like to learn a new language in the future?",
            "Do you think learning a language is difficult?",
            "How has knowing more than one language helped you?"
        ]
    },
]

SPEAKING_PART2_PROMPTS = [
    {
        "part": "Part 2",
        "title": "A Time You Received Good News",
        "cue_card": "Describe a time when you received good news.\n\nYou should say:\n- what the news was\n- when you received it\n- how you found out about it\nand explain how you felt when you heard the news.",
    },
    {
        "part": "Part 2",
        "title": "A Place Where You Feel Relaxed",
        "cue_card": "Describe a place where you feel relaxed.\n\nYou should say:\n- where it is\n- how often you go there\n- what you do there\nand explain why this place makes you feel relaxed.",
    },
    {
        "part": "Part 2",
        "title": "A Person You Admire",
        "cue_card": "Describe a person you admire.\n\nYou should say:\n- who this person is\n- how you know about them\n- what qualities they have\nand explain why you admire this person.",
    },
    {
        "part": "Part 2",
        "title": "An Important Event in Your Life",
        "cue_card": "Describe an important event in your life.\n\nYou should say:\n- what the event was\n- when it happened\n- who was involved\nand explain why this event was important to you.",
    },
    {
        "part": "Part 2",
        "title": "A Skill You Learned Recently",
        "cue_card": "Describe a skill you learned recently.\n\nYou should say:\n- what the skill is\n- how you learned it\n- how long it took to learn\nand explain why you decided to learn this skill.",
    },
    {
        "part": "Part 2",
        "title": "A Gift You Gave Someone",
        "cue_card": "Describe a gift you gave someone.\n\nYou should say:\n- what the gift was\n- who you gave it to\n- why you chose this gift\nand explain how the person reacted to it.",
    },
    {
        "part": "Part 2",
        "title": "A Meal You Enjoyed",
        "cue_card": "Describe a meal you particularly enjoyed.\n\nYou should say:\n- what you ate\n- where you had the meal\n- who you were with\nand explain why this meal was special to you.",
    },
    {
        "part": "Part 2",
        "title": "A Journey That Didn't Go as Planned",
        "cue_card": "Describe a journey or trip that didn't go as planned.\n\nYou should say:\n- where you were going\n- what went wrong\n- how you dealt with the situation\nand explain what you learned from the experience.",
    },
    {
        "part": "Part 2",
        "title": "A Rule You Think Should Be Changed",
        "cue_card": "Describe a rule (at school, work, or in your country) that you think should be changed.\n\nYou should say:\n- what the rule is\n- why you think it should be changed\n- what you would change it to\nand explain how this change would benefit people.",
    },
    {
        "part": "Part 2",
        "title": "A Movie You Recently Watched",
        "cue_card": "Describe a movie you watched recently.\n\nYou should say:\n- what the movie was called\n- what it was about\n- who was in it\nand explain whether you would recommend it to others.",
    },
    {
        "part": "Part 2",
        "title": "A Change That Improved Your Life",
        "cue_card": "Describe a change in your life that had a positive impact.\n\nYou should say:\n- what the change was\n- when it happened\n- why you made the change\nand explain how it improved your life.",
    },
    {
        "part": "Part 2",
        "title": "A Challenge You Overcame",
        "cue_card": "Describe a challenge you successfully overcame.\n\nYou should say:\n- what the challenge was\n- when you faced it\n- what steps you took to overcome it\nand explain how you felt after overcoming it.",
    },
]

SPEAKING_PART3_PROMPTS = [
    {
        "part": "Part 3",
        "title": "Technology and Education",
        "questions": [
            "How has technology changed the way people learn?",
            "Do you think online learning is as effective as classroom learning?",
            "Should schools replace textbooks with digital devices?",
            "What challenges do teachers face when using technology in the classroom?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Globalisation and Culture",
        "questions": [
            "Do you think globalisation is making cultures more similar or more different?",
            "Should countries take steps to protect their traditional cultures?",
            "How has globalisation affected the food people eat in your country?",
            "Is it possible to maintain local identity in an increasingly connected world?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Urban Planning and Housing",
        "questions": [
            "What are the main problems caused by rapid urbanisation?",
            "Do you think governments should provide more affordable housing?",
            "How can cities be designed to be more sustainable?",
            "What are the advantages and disadvantages of living in a big city?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Mental Health in Modern Society",
        "questions": [
            "Why do you think mental health issues are more common now than in the past?",
            "What role should employers play in supporting their employees' mental health?",
            "How can individuals take better care of their mental wellbeing?",
            "Do you think social media has a positive or negative effect on mental health?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Space Exploration",
        "questions": [
            "Should governments spend money on space exploration or focus on problems on Earth?",
            "What benefits has space exploration brought to everyday life?",
            "Do you think humans will ever live on other planets?",
            "How might space exploration change in the next fifty years?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Artificial Intelligence and Employment",
        "questions": [
            "Which jobs do you think are most at risk from artificial intelligence?",
            "Should governments regulate the use of AI in the workplace?",
            "How can workers prepare for a future where AI plays a bigger role?",
            "Do you think AI will create more jobs than it destroys?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Climate Change and Individual Action",
        "questions": [
            "Do you think individual actions can make a difference to climate change?",
            "What responsibilities do corporations have in addressing environmental problems?",
            "How can governments encourage people to adopt more sustainable lifestyles?",
            "Is it realistic to expect people to change their habits for the environment?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Traditional vs Modern Parenting",
        "questions": [
            "How has parenting changed compared to previous generations?",
            "Do you think strict parenting is more effective than lenient parenting?",
            "What role do grandparents play in raising children in your culture?",
            "How has technology affected the way parents raise their children?"
        ]
    },
    {
        "part": "Part 3",
        "title": "The Role of Media in Democracy",
        "questions": [
            "How important is a free press in a democratic society?",
            "Do you think the media has too much influence on public opinion?",
            "How has social media changed the way people get their news?",
            "What can individuals do to distinguish reliable news from misinformation?"
        ]
    },
    {
        "part": "Part 3",
        "title": "Space Tourism and Colonisation",
        "questions": [
            "Do you think space tourism will become common in the future?",
            "Who should be responsible for governing activities in space?",
            "What ethical issues might arise from colonising other planets?",
            "How might space colonisation change human society?"
        ]
    },
]


# ---------------------------------------------------------------------------
# Writing Task 1 Prompts
# ---------------------------------------------------------------------------

WRITING_TASK1_PROMPTS = [
    {
        "task_type": "TASK_1",
        "title": "Global Smartphone Sales by Region",
        "prompt_text": "The bar chart below shows the number of smartphones sold in four different regions (North America, Europe, Asia, and Africa) in 2020 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "category": "BAR_CHART",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Write an overview summarising the main trends",
            "Compare the regions, not just individual years",
            "Highlight the largest and smallest values",
            "Use a range of vocabulary for describing trends"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Renewable Energy Consumption Trends",
        "prompt_text": "The line graph shows the percentage of energy consumed from renewable sources in five countries (Germany, China, Brazil, India, and Australia) between 2010 and 2024. Summarise the main trends and make comparisons where relevant.",
        "category": "LINE_GRAPH",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Identify overall trends (increase, decrease, fluctuation)",
            "Note where lines cross or diverge",
            "Group similar trends together in your report",
            "Use appropriate time expressions"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Household Expenditure Breakdown",
        "prompt_text": "The pie charts show how the average household in the United Kingdom spent its income in 2005 and 2025. Summarise the information by selecting and reporting the main features.",
        "category": "PIE_CHART",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Compare the two pie charts, not just describe each separately",
            "Highlight significant changes in proportions",
            "Group categories that show similar patterns",
            "Include an overview of the main changes"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Changes to Riverside Town Centre",
        "prompt_text": "The maps below show the layout of Riverside town centre in 1995 and today. Summarise the main changes that have taken place.",
        "category": "MAP",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Use appropriate prepositions of location and direction",
            "Describe what was added, removed, or changed",
            "Compare the two maps systematically",
            "Organise your report by area or direction"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Production of Olive Oil",
        "prompt_text": "The diagram below illustrates the process of producing olive oil from olives. Summarise the process by selecting and reporting the main stages.",
        "category": "PROCESS",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Use passive voice to describe stages",
            "Include all steps in the process",
            "Use sequencing words (firstly, subsequently, finally)",
            "Identify the start and end points clearly"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "University Student Enrollment by Subject",
        "prompt_text": "The bar chart compares the number of male and female students enrolled in five subjects (Engineering, Medicine, Law, Education, and Arts) at a European university in 2023. Summarise the information by selecting and reporting the main features.",
        "category": "BAR_CHART",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Compare male and female enrollment for each subject",
            "Identify subjects with the largest gender differences",
            "Note which subjects have the most and least students overall",
            "Use appropriate comparative and contrast language"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Tourist Arrivals Over Ten Years",
        "prompt_text": "The line graph shows the number of international tourist arrivals (in millions) to five countries (France, Spain, United States, Thailand, and Turkey) from 2014 to 2024. Summarise the main trends and make comparisons.",
        "category": "LINE_GRAPH",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Note the impact of any visible disruptions (e.g., pandemic dips)",
            "Identify which countries showed the strongest growth",
            "Compare peak values and troughs",
            "Use a range of trend language (surged, declined, recovered)"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Land Use in a Proposed Development Area",
        "prompt_text": "The two maps show how a coastal area is planned to be developed. The first map shows the current layout, and the second shows the proposed changes. Summarise the main differences.",
        "category": "MAP",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Describe the planned additions and removals",
            "Note changes to transport and green spaces",
            "Use language of proposal (will be, is planned, is proposed to)",
            "Organise by geographic area for clarity"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Time Spent on Daily Activities",
        "prompt_text": "The table below shows the average number of hours per day spent on various activities (sleeping, working, studying, exercising, and using social media) by people in three age groups (18-25, 26-45, and 46-65). Summarise the information.",
        "category": "TABLE",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Identify which age group spends the most and least time on each activity",
            "Compare patterns across age groups",
            "Highlight any surprising or notable differences",
            "Use data accurately without listing every figure"
        ]
    },
    {
        "task_type": "TASK_1",
        "title": "Sources of Electricity Production",
        "prompt_text": "The pie charts show the main sources of electricity production in a particular country in 2000 and 2025. Summarise the main features and describe the significant changes.",
        "category": "PIE_CHART",
        "word_limit": 150,
        "time_limit_minutes": 20,
        "tips": [
            "Note which sources increased or decreased in share",
            "Identify the dominant source in each year",
            "Mention any new sources that appeared",
            "Provide an overview of the overall shift in energy mix"
        ]
    },
]


# ---------------------------------------------------------------------------
# Seed Functions
# ---------------------------------------------------------------------------

def seed_listening(db):
    """Seed Section 3 and Section 4 listening content."""
    seeded = 0

    existing_titles = {
        row[0]
        for row in db.query(TestSet.title).filter(
            TestSet.module == "LISTENING"
        ).all()
    }

    listening_skill = db.query(Skill).filter(
        Skill.category == "LISTENING"
    ).first()
    if not listening_skill:
        listening_skill = Skill(
            name="Listening Comprehension",
            category="LISTENING",
            description="Understanding academic and everyday English through audio",
        )
        db.add(listening_skill)
        db.flush()

    all_transcripts = SECTION3_TRANSCRIPTS + SECTION4_TRANSCRIPTS

    for data in all_transcripts:
        if data["title"] in existing_titles:
            print(f"  [skip] TestSet already exists: {data['title']}")
            continue

        test_set = TestSet(
            title=data["title"],
            module="LISTENING",
            section=data["section"],
            transcript=data["transcript"],
            estimated_band=data["estimated_band"],
            instructions="Listen to the recording and answer the questions below.",
        )
        db.add(test_set)
        db.flush()

        for i, q in enumerate(data["questions"], start=1):
            question = Question(
                skill_id=listening_skill.id,
                test_set_id=test_set.id,
                module="LISTENING",
                section=data["section"],
                passage_title=data["title"],
                question_text=q["text"],
                question_type=q["type"],
                options=q.get("options") or [],
                correct_answer=q["answer"],
                explanation=q["explanation"],
                difficulty=5,
                estimated_band=data["estimated_band"],
            )
            db.add(question)

        seeded += 1
        print(f"  [added] TestSet: {data['title']} ({len(data['questions'])} questions)")

    return seeded


def seed_speaking(db):
    """Seed Speaking prompts (Part 1, 2, 3)."""
    seeded = 0

    existing_titles = {
        row[0]
        for row in db.query(SpeakingPrompt.title).all()
    }

    all_prompts = SPEAKING_PART1_PROMPTS + SPEAKING_PART2_PROMPTS + SPEAKING_PART3_PROMPTS

    for data in all_prompts:
        if data["title"] in existing_titles:
            print(f"  [skip] SpeakingPrompt already exists: {data['title']}")
            continue

        prompt = SpeakingPrompt(
            part=data["part"],
            title=data["title"],
            cue_card=data.get("cue_card"),
            questions=data.get("questions", []),
            prep_time_sec=60 if data["part"] == "Part 2" else None,
            speak_time_sec=120 if data["part"] == "Part 2" else 60,
        )
        db.add(prompt)
        seeded += 1
        print(f"  [added] SpeakingPrompt: {data['part']} - {data['title']}")

    return seeded


def seed_writing(db):
    """Seed Writing Task 1 prompts."""
    seeded = 0

    existing_titles = {
        row[0]
        for row in db.query(WritingPrompt.title).all()
    }

    for data in WRITING_TASK1_PROMPTS:
        if data["title"] in existing_titles:
            print(f"  [skip] WritingPrompt already exists: {data['title']}")
            continue

        prompt = WritingPrompt(
            task_type=data["task_type"],
            title=data["title"],
            prompt_text=data["prompt_text"],
            category=data["category"],
            word_limit=data["word_limit"],
            time_limit_minutes=data["time_limit_minutes"],
            tips=data["tips"],
        )
        db.add(prompt)
        seeded += 1
        print(f"  [added] WritingPrompt: {data['title']}")

    return seeded


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    db = SessionLocal()
    try:
        print("=== IELTS Content Seed Script ===\n")

        print("[1/3] Seeding Listening content...")
        listening_count = seed_listening(db)
        print(f"  Listening: {listening_count} test sets added\n")

        print("[2/3] Seeding Speaking prompts...")
        speaking_count = seed_speaking(db)
        print(f"  Speaking: {speaking_count} prompts added\n")

        print("[3/3] Seeding Writing prompts...")
        writing_count = seed_writing(db)
        print(f"  Writing: {writing_count} prompts added\n")

        db.commit()

        print("=== Summary ===")
        print(f"  TestSets (Listening): {db.query(TestSet).filter(TestSet.module == 'LISTENING').count()}")
        print(f"  Questions (Listening): {db.query(Question).filter(Question.module == 'LISTENING').count()}")
        print(f"  SpeakingPrompts: {db.query(SpeakingPrompt).count()}")
        print(f"  WritingPrompts: {db.query(WritingPrompt).count()}")
        print("\nDone.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
