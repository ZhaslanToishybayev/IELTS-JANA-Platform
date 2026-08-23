"""Seed high-quality IELTS-style content for JANA practice.

Passages are 700-1000 words (real IELTS length).
Questions use realistic distractors and balanced TF/NG distribution.
Speaking prompts are hand-crafted (not templated).
Listening transcripts are 600+ words with dialogue format.
"""

import sys

sys.path.insert(0, ".")

from app.database import Base, SessionLocal, engine
from app.models import Question, Skill, TestSet, SpeakingPrompt, WritingPrompt

Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────
# SKILLS
# ─────────────────────────────────────────────

READING_SKILLS = [
    ("Reading True/False/Not Given", "TF_NG"),
    ("Reading Headings", "HEADINGS"),
    ("Reading Summary Completion", "SUMMARY"),
    ("Reading Matching Information", "MATCHING_INFO"),
    ("Reading Sentence Completion", "SENTENCE_COMP"),
    ("Reading Multiple Choice", "MCQ"),
]

LISTENING_SKILLS = [
    ("Listening Form Completion", "LISTENING_FORM"),
    ("Listening Map and Plan", "LISTENING_MAP"),
    ("Listening Multiple Choice", "LISTENING_MCQ"),
    ("Listening Matching", "LISTENING_MATCHING"),
    ("Listening Sentence Completion", "LISTENING_SENTENCE"),
]

# ─────────────────────────────────────────────
# READING PASSAGES (700-1000 words each)
# ─────────────────────────────────────────────

PASSAGE_1 = {
    "title": "The Rise of Vertical Farming in Urban Centres",
    "section": "Passage 1",
    "estimated_band": 5.5,
    "passage": """The conversion of warehouse districts and disused industrial buildings into productive agricultural spaces represents one of the most significant shifts in urban land use over the past decade. Vertical farming, the practice of growing crops in vertically stacked layers within controlled indoor environments, has moved from a niche curiosity to a commercially viable enterprise in several major cities worldwide. Proponents argue that this approach addresses critical challenges related to food security, water scarcity, and the carbon footprint associated with transporting produce over long distances.

The concept is not new. Greenhouses have existed for centuries, and the theoretical principles underlying hydroponics, a method of growing plants without soil using mineral-rich water solutions, were established as early as the 1930s. What has changed is the convergence of several technological advances that have made large-scale indoor farming economically feasible. LED lighting systems, which consume a fraction of the energy required by traditional high-intensity discharge lamps, now provide the precise light spectrums that different plant species need at various growth stages. Combined with computer-controlled climate systems that regulate temperature, humidity, and carbon dioxide levels, modern vertical farms can produce yields per square metre that far exceed those of conventional agriculture.

Water efficiency is among the most compelling advantages cited by advocates of vertical farming. In conventional field agriculture, roughly 70 percent of global freshwater withdrawals are used for irrigation, much of which is lost to evaporation, runoff, or deep percolation into groundwater aquifers. A vertical farm employing recirculating hydroponic systems typically uses 90 percent less water than open-field farming for equivalent crop volumes. In regions facing chronic water stress, such as parts of the Middle East, North Africa, and the western United States, this efficiency represents a transformative opportunity.

However, the technology is not without limitations. The energy requirements of indoor farming remain substantial, particularly for lighting and climate control. While renewable energy sources can offset some of this demand, many vertical farms in regions with carbon-intensive electricity grids may produce a larger carbon footprint per kilogram of lettuce or tomatoes than field-grown equivalents transported by rail. Critics also point out that vertical farms are currently most effective for leafy greens and herbs, which have high value-to-weight ratios and short growth cycles. Staple crops such as wheat, rice, and maize, which provide the caloric foundation for most of the world's population, are not economically viable in vertical systems due to their long maturation periods and low market prices relative to the cost of indoor cultivation.

The economic model of vertical farming has proven fragile in several high-profile cases. A large vertical farming operation in Newark, New Jersey, which attracted over 400 million dollars in investment, filed for bankruptcy in 2023, citing higher-than-projected operating costs and slower-than-expected revenue growth. Several European ventures have faced similar difficulties, prompting industry analysts to question whether the sector can scale without significant reductions in electricity costs or substantial government subsidies. The capital expenditure required to construct a fully equipped vertical farm remains prohibitive for all but the best-funded startups, and the return on investment timeline often exceeds seven years, a period that many venture capital firms consider unacceptably long.

Despite these challenges, the sector continues to attract investment and innovation. Newer facilities are experimenting with hybrid models that combine vertical farming with aquaponics, a system in which fish waste provides nutrients for plants while plants filter water for the fish. Others are exploring partnerships with restaurant chains and supermarket groups to establish micro-farms located within or adjacent to retail outlets, reducing the final link in the supply chain to near zero. Whether vertical farming will ultimately fulfil its promise of feeding growing urban populations sustainably depends on resolving the energy cost equation, but the trajectory of the industry suggests that it will become an increasingly important component of urban food systems in the coming decades.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "The theoretical basis for hydroponics was first established in the 1950s.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that the theoretical principles underlying hydroponics were established as early as the 1930s, not the 1950s.",
        },
        {
            "type": "TF_NG",
            "text": "Vertical farms can produce crops that require less water than conventional farming.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states that a vertical farm using recirculating hydroponic systems uses 90 percent less water than open-field farming.",
        },
        {
            "type": "TF_NG",
            "text": "All vertical farming operations in Europe have been profitable.",
            "options": ["True", "False", "Not Given"],
            "answer": "Not Given",
            "explanation": "The passage mentions that several European ventures have faced difficulties, but it does not claim that all have been unprofitable or profitable overall.",
        },
        {
            "type": "TF_NG",
            "text": "Staple crops like wheat are the most profitable products for vertical farms.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that staple crops such as wheat, rice, and maize are not economically viable in vertical systems due to long maturation periods and low market prices.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following is the best heading for the passage?",
            "options": [
                "Vertical farming: potential and practical constraints",
                "The history of greenhouse technology",
                "Water conservation in desert regions",
                "Why vertical farms replace all traditional agriculture",
            ],
            "answer": "Vertical farming: potential and practical constraints",
            "explanation": "The passage covers both the advantages (potential) and the limitations (practical constraints) of vertical farming. The other options are either too narrow or inaccurate.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary below using words from the passage. A vertical farm using recirculating systems uses ________ percent less water than open-field farming.",
            "options": [],
            "answer": "90",
            "explanation": "The passage states that vertical farms use 90 percent less water than conventional open-field farming.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: A vertical farming company in Newark, New Jersey, attracted over ________ million dollars in investment before filing for bankruptcy.",
            "options": [],
            "answer": "400",
            "explanation": "The passage mentions that the company attracted over 400 million dollars in investment.",
        },
        {
            "type": "MCQ",
            "text": "What does the passage suggest about the future of vertical farming?",
            "options": [
                "It will completely replace conventional agriculture within twenty years",
                "It will become an increasingly important part of urban food systems",
                "It will only be viable in countries with renewable energy infrastructure",
                "It will focus exclusively on growing wheat and rice",
            ],
            "answer": "It will become an increasingly important part of urban food systems",
            "explanation": "The final paragraph states that vertical farming will become an increasingly important component of urban food systems, while acknowledging that challenges remain.",
        },
        {
            "type": "MCQ",
            "text": "According to the passage, what is a hybrid model being explored by newer vertical farming facilities?",
            "options": [
                "combining vertical farming with aquaponics",
                "mixing traditional soil-based methods with hydroponics",
                "using wind energy to power LED lighting",
                "growing staple crops alongside leafy greens",
            ],
            "answer": "combining vertical farming with aquaponics",
            "explanation": "The passage describes newer facilities experimenting with hybrid models that combine vertical farming with aquaponics, where fish waste provides nutrients for plants.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: The capital expenditure required to construct a fully equipped vertical farm remains prohibitive for all but the best-funded ________.",
            "options": [],
            "answer": "startups",
            "explanation": "The passage uses the exact word 'startups' in this context.",
        },
    ],
}

PASSAGE_2 = {
    "title": "The Psychological Effects of Urban Green Spaces",
    "section": "Passage 2",
    "estimated_band": 6.5,
    "passage": """A growing body of research in environmental psychology has documented the measurable effects that urban green spaces have on mental health, cognitive performance, and social behaviour. While the general assumption that parks and gardens improve quality of life seems intuitively obvious, the mechanisms through which natural environments influence human psychology are considerably more complex than simply providing pleasant scenery. Recent studies have identified specific pathways through which exposure to vegetation reduces stress hormones, enhances attention restoration, and fosters social cohesion in densely populated neighbourhoods.

The attention restoration theory, originally proposed by environmental psychologists Rachel and Stephen Kaplan in the 1980s, provides one of the most influential frameworks for understanding why natural environments benefit mental functioning. The theory distinguishes between two types of attention: directed attention, which requires conscious effort and is involved in tasks such as solving problems or filtering distractions, and involuntary attention, which is captured effortlessly by stimuli that are inherently interesting or pleasant. Urban environments, with their constant demand for directed attention, traffic navigation, and sensory overload, deplete cognitive resources. Green spaces, by contrast, engage involuntary attention, allowing directed attention to rest and recover. Studies measuring performance on cognitive tests before and after walks through parks versus busy streets consistently show improvements following exposure to natural settings.

Beyond cognitive effects, the physiological impact of green spaces on stress has been quantified through cortisol measurements, heart rate variability monitoring, and blood pressure assessments. A landmark 2019 study conducted across 18 cities in nine countries found that participants who spent at least 120 minutes per week in natural environments reported significantly better self-rated health and psychological well-being than those who did not reach this threshold. The benefits appeared to be independent of the total amount of time spent outdoors, suggesting that quality of exposure matters more than mere duration. Notably, the threshold of two hours per week could be achieved in a single visit or distributed across multiple shorter exposures, giving urban planners flexible targets for public health interventions.

The social dimension of green spaces has received less attention in the research literature but may be equally important. Parks, community gardens, and tree-lined streets function as third places, a term coined by sociologist Ray Oldenburg to describe settings that are neither home nor workplace where informal social interaction occurs. These spaces facilitate incidental encounters between neighbours who might otherwise have no reason to interact. Research in Chicago found that residents of public housing developments with more trees and grass reported stronger social ties and lower rates of aggression than residents of comparable developments dominated by concrete and asphalt. The effect persisted even after controlling for income, education, and household composition, suggesting that the physical environment itself plays a causal role in shaping social dynamics.

However, the relationship between green spaces and well-being is not uniform across all populations or contexts. A 2021 systematic review found that the mental health benefits of green spaces were strongest for residents of low-income neighbourhoods, where access to private gardens is limited and public green spaces serve as primary recreational resources. In contrast, residents of affluent suburbs with large private gardens showed weaker associations between nearby park access and psychological well-being. Additionally, some research has identified potential negative effects of green spaces in areas with inadequate maintenance, where overgrown vegetation can create feelings of insecurity, or in cities where parks are associated with crime or antisocial behaviour. The mere presence of green space is therefore insufficient; its quality, safety, and accessibility are critical mediating factors.

Urban planners and public health officials are increasingly incorporating these findings into policy decisions. Cities such as Copenhagen, Singapore, and Melbourne have adopted green space targets that go beyond simple parkland acreage to include metrics such as tree canopy coverage, proximity of residential areas to green spaces, and the quality of amenities within parks. Singapore's approach is particularly instructive: despite having one of the highest population densities in the world, the city-state has maintained over 30 percent green coverage through deliberate integration of vertical gardens, rooftop plantings, and linear parks connecting residential districts. The result has been measurable improvements in population-level well-being indicators, though isolating the contribution of green spaces from other quality-of-life factors remains methodologically challenging.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "The attention restoration theory was developed in the 1990s.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states the theory was originally proposed in the 1980s, not the 1990s.",
        },
        {
            "type": "TF_NG",
            "text": "Urban environments deplete cognitive resources through constant demand for directed attention.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states this in the discussion of attention restoration theory.",
        },
        {
            "type": "TF_NG",
            "text": "The mental health benefits of green spaces are equally strong for all income groups.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that benefits were strongest for low-income neighbourhoods and weaker for affluent suburbs with private gardens.",
        },
        {
            "type": "TF_NG",
            "text": "Singapore has the most green space per capita in the world.",
            "options": ["True", "False", "Not Given"],
            "answer": "Not Given",
            "explanation": "The passage mentions Singapore's green coverage but does not compare it globally in per capita terms.",
        },
        {
            "type": "TF_NG",
            "text": "The 120-minute weekly threshold for nature exposure could be split across multiple visits.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states that the threshold could be achieved in a single visit or distributed across multiple shorter exposures.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following best summarises the passage?",
            "options": [
                "How nature exposure affects cognitive function, stress, and social interaction in cities",
                "The history of environmental psychology research since the 1980s",
                "Why all cities should build more parks immediately",
                "The relationship between exercise and mental health",
            ],
            "answer": "How nature exposure affects cognitive function, stress, and social interaction in cities",
            "explanation": "The passage covers three main effects: cognitive (attention restoration), physiological (stress reduction), and social (community building). The other options are too narrow or inaccurate.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: A 2019 study across nine countries found that participants who spent at least ________ minutes per week in natural environments reported better well-being.",
            "options": [],
            "answer": "120",
            "explanation": "The passage states the threshold was 120 minutes per week.",
        },
        {
            "type": "MCQ",
            "text": "What does the passage suggest about the social effects of green spaces?",
            "options": [
                "They only benefit children and elderly residents",
                "They function as third places where informal social interaction occurs",
                "They are less important than cognitive benefits",
                "They only work in cities with high population density",
            ],
            "answer": "They function as third places where informal social interaction occurs",
            "explanation": "The passage describes parks and green spaces as 'third places' where incidental encounters between neighbours occur, drawing on Oldenburg's sociological concept.",
        },
        {
            "type": "MCQ",
            "text": "According to the passage, what is a potential negative effect of green spaces in some areas?",
            "options": [
                "Overgrown vegetation can create feelings of insecurity",
                "They increase property values beyond what residents can afford",
                "They attract too many tourists to residential neighbourhoods",
                "They reduce the amount of land available for housing",
            ],
            "answer": "Overgrown vegetation can create feelings of insecurity",
            "explanation": "The passage mentions that in areas with inadequate maintenance, overgrown vegetation can create feelings of insecurity, or parks may be associated with crime.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: Sociologist Ray Oldenburg coined the term third places to describe settings that are neither home nor ________.",
            "options": [],
            "answer": "workplace",
            "explanation": "The passage defines third places as settings that are neither home nor workplace.",
        },
    ],
}

PASSAGE_3 = {
    "title": "The Deep Ocean: Earth's Last Frontier",
    "section": "Passage 3",
    "estimated_band": 7.0,
    "passage": """Beneath the surface of the world's oceans lies an environment so remote and extreme that more humans have walked on the surface of the moon than have visited the deepest point on the seafloor. The hadal zone, named after Hades, the Greek god of the underworld, encompasses ocean trenches deeper than 6,000 metres, where pressures exceed 600 atmospheres, temperatures hover near freezing, and perpetual darkness eliminates photosynthesis as an energy source. Despite these inhospitable conditions, scientific expeditions over the past two decades have revealed an astonishing diversity of life forms adapted to survive in one of the most punishing environments on Earth.

The exploration of deep ocean trenches was long limited by technological constraints. The Trieste bathyscaphe reached the bottom of the Mariana Trench, the deepest known point in the ocean at approximately 10,935 metres, in 1960, but the mission lasted only twenty minutes on the seafloor and provided little scientific data. For the next half-century, deep trench exploration remained sporadic and prohibitively expensive. The situation changed dramatically in the 2010s with the development of unmanned remotely operated vehicles, or ROVs, capable of withstanding extreme pressures while carrying high-definition cameras and sampling equipment. More recently, a new generation of manned submersibles has enabled scientists to conduct extended research missions at depths previously accessible only to robotic probes.

The biological discoveries emerging from these expeditions have challenged fundamental assumptions about the limits of life. Organisms in the hadal zone have evolved remarkable physiological adaptations. Amphipods, small crustacean-like creatures found at depths exceeding 8,000 metres, possess modified cell membranes that remain flexible under pressures that would collapse ordinary biological structures. Snailfish, among the deepest-living fish ever recorded, produce a compound called trimethylamine N-oxide, or TMAO, which stabilises proteins against pressure-induced denaturation. Bacterial communities living in sediment samples from the Challenger Deep, the deepest point in the Pacific Ocean, have been found to metabolise organic matter at rates comparable to bacteria in far more temperate environments, contradicting the assumption that metabolic activity slows dramatically with depth.

Perhaps the most surprising finding concerns the sources of energy that sustain life in the absence of sunlight. Chemosynthetic bacteria, which derive energy from chemical reactions rather than photosynthesis, form the base of food webs in deep-sea environments. These bacteria oxidise compounds such as hydrogen sulphide and methane that seep from geological formations on the ocean floor. In some trench ecosystems, microbial mats composed of chemosynthetic organisms cover substantial areas of sediment, providing a food source for larger organisms. The discovery that life can be sustained by chemical energy alone has profound implications for astrobiology, particularly for the possibility of life on ocean worlds such as Jupiter's moon Europa and Saturn's moon Enceladus, where subsurface oceans may harbour conditions analogous to Earth's deep-sea trenches.

The geological significance of ocean trenches extends well beyond their role as habitats. Trenches mark the boundaries where tectonic plates converge and one plate descends beneath another in a process known as subduction. This process is responsible for generating some of the most powerful earthquakes and volcanic eruptions on Earth. The 2011 Tōhoku earthquake in Japan, which triggered a devastating tsunami, originated at the subduction zone where the Pacific Plate dives beneath the Okhotsk Plate along the Japan Trench. Understanding the mechanics of subduction at trench margins is therefore not merely an academic exercise but a matter of direct relevance to disaster preparedness and risk assessment for coastal populations worldwide.

The cost and logistical complexity of deep-ocean research remain significant barriers. A single manned expedition to the hadal zone can cost several million dollars, and the limited number of operational deep-diving submersibles means that only a handful of missions are conducted each year. International collaboration has become essential, with programmes such as the Hadal Life project bringing together research institutions from Japan, the United States, China, and several European nations to share resources, data, and analytical capabilities. The development of autonomous underwater vehicles equipped with artificial intelligence for real-time decision-making promises to increase the frequency and efficiency of deep-sea surveys, though the challenges of operating sophisticated electronic systems at crushing pressures ensure that manned exploration will remain a critical complement to robotic investigation for the foreseeable future.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "More people have visited the deepest point on the seafloor than have walked on the moon.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states the opposite: more humans have walked on the moon than have visited the deepest point on the seafloor.",
        },
        {
            "type": "TF_NG",
            "text": "The Trieste bathyscaphe mission in 1960 lasted several hours on the seafloor.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states the mission lasted only twenty minutes on the seafloor.",
        },
        {
            "type": "TF_NG",
            "text": "Snailfish produce a compound that protects their proteins from pressure damage.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage states that snailfish produce TMAO, which stabilises proteins against pressure-induced denaturation.",
        },
        {
            "type": "TF_NG",
            "text": "Chemosynthetic bacteria in deep-sea environments have slower metabolic rates than surface bacteria.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that bacterial communities in the Challenger Deep metabolise organic matter at rates comparable to bacteria in more temperate environments.",
        },
        {
            "type": "TF_NG",
            "text": "The number of deep-diving submersibles currently operational worldwide exceeds twenty.",
            "options": ["True", "False", "Not Given"],
            "answer": "Not Given",
            "explanation": "The passage mentions that the number of operational deep-diving submersibles is limited but does not specify a precise number.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following best summarises the passage?",
            "options": [
                "Scientific exploration of ocean trenches: discoveries, challenges, and significance",
                "The geological causes of tsunamis in the Pacific Ocean",
                "Why robots should replace humans in all deep-sea research",
                "The history of submarine technology since 1960",
            ],
            "answer": "Scientific exploration of ocean trenches: discoveries, challenges, and significance",
            "explanation": "The passage covers biological discoveries, geological significance, and the challenges of deep-sea research. The other options are either too narrow or not the main focus.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: The hadal zone encompasses ocean trenches deeper than ________ metres.",
            "options": [],
            "answer": "6000",
            "explanation": "The passage defines the hadal zone as ocean trenches deeper than 6,000 metres.",
        },
        {
            "type": "MCQ",
            "text": "What is the significance of the discovery of chemosynthetic bacteria for astrobiology?",
            "options": [
                "It proves that life exists on other moons in the solar system",
                "It suggests that life could exist in subsurface oceans on Europa and Enceladus",
                "It shows that all deep-sea organisms are alien in origin",
                "It eliminates the need for sunlight in all ecosystems on Earth",
            ],
            "answer": "It suggests that life could exist in subsurface oceans on Europa and Enceladus",
            "explanation": "The passage states that the discovery has profound implications for astrobiology, particularly for the possibility of life on ocean worlds such as Europa and Enceladus.",
        },
        {
            "type": "MCQ",
            "text": "Why does the passage mention the 2011 Tōhoku earthquake?",
            "options": [
                "To illustrate the geological significance of ocean trenches",
                "To argue that deep-sea research caused the earthquake",
                "To compare the depth of the Japan Trench with the Mariana Trench",
                "To show that earthquakes are becoming more frequent",
            ],
            "answer": "To illustrate the geological significance of ocean trenches",
            "explanation": "The passage uses the earthquake as an example of how trench-related subduction zones generate powerful seismic events, illustrating the practical importance of understanding trench geology.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: Amphipods in the hadal zone possess modified cell ________ that remain flexible under extreme pressures.",
            "options": [],
            "answer": "membranes",
            "explanation": "The passage states that amphipods possess modified cell membranes that remain flexible under pressures that would collapse ordinary biological structures.",
        },
    ],
}

PASSAGE_4 = {
    "title": "The Global Coffee Trade and Its Environmental Cost",
    "section": "Passage 1",
    "estimated_band": 6.0,
    "passage": """Coffee is the world's second-most traded commodity after crude oil, with over 2.25 billion cups consumed every day. The global coffee industry generates annual revenues exceeding 450 billion dollars and employs an estimated 125 million people worldwide, from smallholder farmers in tropical highlands to baristas in urban cafes. Yet the environmental footprint of producing a single cup of coffee is substantial, encompassing land use, water consumption, pesticide application, and greenhouse gas emissions at every stage of the supply chain from cultivation to consumption.

Coffee cultivation is concentrated in a narrow band of tropical and subtropical regions known as the coffee belt, stretching roughly between the Tropics of Cancer and Capricorn. The two commercially dominant species, Arabica and Robusta, have different environmental requirements. Arabica, which accounts for approximately 60 percent of global production, thrives at higher altitudes with cooler temperatures and produces the complex flavour profiles prized by specialty coffee markets. Robusta, hardier and more resistant to pests, grows at lower elevations and dominates the instant coffee market. Both species require significant quantities of water: producing one kilogram of green coffee beans demands approximately 18,900 litres of water when irrigation, rainfall, and processing are factored together, a figure that places coffee among the most water-intensive agricultural products.

The deforestation associated with coffee expansion represents one of the industry's most serious environmental concerns. Central America, where coffee cultivation has been a primary economic activity since the nineteenth century, has lost approximately 40 percent of its original forest cover, much of it cleared for coffee plantations. In Ethiopia, the genetic birthplace of Arabica coffee, natural coffee forests have declined by more than 50 percent over the past four decades due to agricultural encroachment and logging. The loss of forest habitat threatens biodiversity, disrupts watershed function, and eliminates the carbon sequestration capacity of mature trees. The irony is particularly acute: coffee plants grown under the shade of intact forest canopies produce higher-quality beans, yet economic pressures consistently drive producers toward full-sun monoculture systems that maximise short-term yields at the expense of long-term ecological sustainability.

Shade-grown coffee, which preserves much of the original forest canopy and associated biodiversity, has been promoted by environmental organisations and specialty coffee companies as a more sustainable alternative. Studies in Mexico and Guatemala have documented that shade coffee farms support bird communities nearly as diverse as those found in undisturbed forest, with some shade farms hosting over 150 bird species. However, the premium prices that shade-grown coffee commands in export markets do not always reach the farmers who bear the opportunity cost of lower yields. Supply chain opacity, intermediary profiteering, and certification fatigue among consumers all limit the economic viability of shade-grown production systems.

Processing methods add a further layer of environmental impact. The wet method, which involves fermenting and washing coffee cherries to remove the mucilage layer before drying, produces large volumes of wastewater with high organic content. In countries with limited wastewater treatment infrastructure, this effluent is often discharged directly into rivers and streams, contributing to eutrophication, oxygen depletion, and aquatic ecosystem degradation. The dry method, in which whole coffee cherries are spread on drying beds and turned regularly until moisture content falls below 12 percent, uses less water but requires more land area and is susceptible to mould contamination in humid climates. Recent innovations in processing technology, including eco-pulpers that reduce water use by up to 80 percent and anaerobic fermentation systems that capture methane for energy, offer promising pathways toward reducing the environmental impact of coffee processing, but adoption remains patchy among smallholder producers who lack capital investment.

The carbon footprint of coffee extends beyond the farm gate. Roasting, packaging, transportation, and the energy consumed in preparing and serving the final beverage all contribute to lifecycle emissions. A comprehensive lifecycle assessment published in 2021 estimated that a single cup of coffee produces approximately 21 grams of carbon dioxide equivalent, with farm-level emissions accounting for roughly 50 percent of the total. Consumer behaviour, particularly the use of single-use pods and capsules, significantly amplifies the per-cup footprint. A single aluminium coffee pod generates approximately 14 grams of CO2 equivalent in its production and disposal, nearly doubling the emissions of the brewing process itself. The convenience of pod-based systems has driven explosive market growth, with global pod sales exceeding 30 billion units annually, yet the recycling rates for aluminium pods remain below 30 percent in most markets.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "Coffee is the most traded commodity in the world.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that coffee is the second-most traded commodity after crude oil.",
        },
        {
            "type": "TF_NG",
            "text": "Arabica coffee accounts for approximately 60 percent of global production.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states this figure.",
        },
        {
            "type": "TF_NG",
            "text": "Shade-grown coffee farmers always receive higher prices than conventional farmers.",
            "options": ["True", "False", "Not Given"],
            "answer": "Not Given",
            "explanation": "The passage mentions that shade-grown coffee commands premium prices but states that these prices do not always reach the farmers, without confirming that all shade-grown farmers receive higher prices.",
        },
        {
            "type": "TF_NG",
            "text": "Ethiopia has lost more than half its natural coffee forests in the past four decades.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage states that natural coffee forests in Ethiopia have declined by more than 50 percent over the past four decades.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following is the best heading for the passage?",
            "options": [
                "The environmental impact of coffee production from farm to cup",
                "How to make coffee at home sustainably",
                "The history of coffee cultivation in Central America",
                "Why Arabica coffee is better than Robusta",
            ],
            "answer": "The environmental impact of coffee production from farm to cup",
            "explanation": "The passage covers the full supply chain: cultivation, deforestation, processing, and consumption. The other options address only narrow aspects or are not the focus.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: Producing one kilogram of green coffee beans demands approximately ________ litres of water.",
            "options": [],
            "answer": "18900",
            "explanation": "The passage states the figure is approximately 18,900 litres.",
        },
        {
            "type": "MCQ",
            "text": "What is the primary environmental concern associated with coffee cultivation in Central America?",
            "options": [
                "excessive use of chemical fertilisers",
                "deforestation and loss of forest cover",
                "contamination of groundwater by pesticides",
                "soil erosion from mountain terracing",
            ],
            "answer": "deforestation and loss of forest cover",
            "explanation": "The passage identifies deforestation associated with coffee expansion as one of the industry's most serious environmental concerns, noting that Central America has lost approximately 40 percent of its original forest cover.",
        },
        {
            "type": "MCQ",
            "text": "According to the passage, what limits the economic viability of shade-grown coffee?",
            "options": [
                "Lower quality beans that cannot command premium prices",
                "Supply chain opacity and intermediary profiteering",
                "The difficulty of growing coffee under forest canopies",
                "Lack of scientific evidence for its benefits",
            ],
            "answer": "Supply chain opacity and intermediary profiteering",
            "explanation": "The passage identifies supply chain opacity, intermediary profiteering, and certification fatigue as factors that limit the economic viability of shade-grown production systems.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: A single aluminium coffee pod generates approximately ________ grams of CO2 equivalent in its production and disposal.",
            "options": [],
            "answer": "14",
            "explanation": "The passage states the figure is approximately 14 grams of CO2 equivalent.",
        },
    ],
}

PASSAGE_5 = {
    "title": "Sleep Deprivation and Modern Work Culture",
    "section": "Passage 2",
    "estimated_band": 6.5,
    "passage": """The relationship between sleep and cognitive performance has been well established in laboratory settings for decades, yet the extent to which chronic sleep restriction affects productivity, decision-making, and long-term health in real-world work environments remains underappreciated by both employers and employees. A 2022 report by the Rand Corporation estimated that sleep deprivation costs the United States economy up to 411 billion dollars annually in lost productivity, equivalent to 2.28 percent of GDP. Japan, Germany, and the United Kingdom incur comparable losses relative to their economic output, suggesting that the problem is global in scope and resistant to purely individual-level interventions.

The neurological basis for sleep's role in cognitive function centres on the brain's glymphatic system, a waste-clearance mechanism that is most active during deep sleep. This system flushes metabolic by-products, including beta-amyloid, a protein associated with Alzheimer's disease, from the brain's interstitial spaces. Chronic sleep restriction disrupts this clearance process, leading to a progressive accumulation of neurotoxic waste. Research published in the journal Science demonstrated that a single night of sleep deprivation increased beta-amyloid levels in the human brain by approximately 5 percent, with cumulative effects observed over successive nights of restricted sleep. The long-term implications for neurodegenerative disease risk are still being quantified, but the preliminary evidence suggests that chronic sleep deficiency may accelerate cognitive decline in middle-aged and older adults.

In the workplace, the effects of sleep deprivation manifest primarily as impaired executive function, reduced emotional regulation, and diminished capacity for creative problem-solving. Studies of medical residents working extended shifts, a population accustomed to operating under sleep deprivation, have documented error rates that increase by 36 percent after 24 hours without sleep and by 61 percent after 30 hours. These findings are not confined to high-stakes professions. Research in financial services found that traders who slept fewer than six hours per night made riskier decisions and experienced greater emotional volatility than colleagues who obtained seven or more hours. The economic consequences of these behavioural shifts are difficult to quantify precisely but are almost certainly substantial, given that poor decision-making in financial contexts can produce losses that dwarf the direct productivity costs of fatigue.

The cultural glorification of sleep deprivation, particularly in startup ecosystems and high-pressure corporate environments, compounds the biological problem. The notion that successful entrepreneurs sleep less than five hours per night has become a persistent myth, reinforced by media profiles of executives who boast of their limited sleep as evidence of dedication and productivity. Research consistently contradicts this narrative. A study of over 5,000 managers found that those who slept fewer than six hours per night performed significantly worse on cognitive tests than those who slept seven to eight hours, and that the performance gap widened progressively with further sleep restriction. The association between short sleep and perceived productivity was found to be inversely correlated with actual measured performance, suggesting that sleep-deprived individuals tend to overestimate their capabilities while underestimating their error rates.

Employer-initiated interventions have shown promise in addressing the sleep-productivity connection. Some companies have introduced nap rooms, flexible scheduling, and sleep education programmes aimed at reducing the stigma associated with prioritising rest. A programme implemented at a large technology firm in Seoul provided employees with access to on-site sleep pods and sleep hygiene workshops, resulting in a 17 percent reduction in reported fatigue symptoms and a measurable improvement in self-reported concentration levels over a six-month period. However, critics argue that workplace sleep programmes risk treating symptoms rather than causes, particularly when organisational cultures continue to reward long hours and penalise employees who set boundaries around sleep time. Systemic change, they contend, requires a fundamental reassessment of how organisations measure and reward performance, shifting emphasis from hours worked to outcomes achieved.

The public health implications extend well beyond the workplace. Drowsy driving, a direct consequence of widespread sleep deficiency, accounts for an estimated 20 percent of all motor vehicle accidents in the United States, a figure comparable to the proportion attributed to alcohol impairment. Unlike alcohol-related driving, however, drowsy driving receives minimal legal attention and is not subject to the same criminal penalties or public awareness campaigns. The physiological basis for this equivalence is well established: after 17 to 19 hours without sleep, cognitive and motor performance deteriorates to levels comparable to a blood alcohol concentration of 0.05 percent, and after 24 hours, impairment exceeds that of a blood alcohol concentration of 0.10 percent, which is above the legal limit in all 50 US states.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "Sleep deprivation costs the US economy approximately 411 billion dollars per year.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states this figure from the Rand Corporation report.",
        },
        {
            "type": "TF_NG",
            "text": "The glymphatic system is most active during REM sleep.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that the glymphatic system is most active during deep sleep, not REM sleep.",
        },
        {
            "type": "TF_NG",
            "text": "Successful entrepreneurs typically sleep fewer than five hours per night.",
            "options": ["True", "False", "not Given"],
            "answer": "Not Given",
            "explanation": "The passage describes this as a 'persistent myth' that has been reinforced by media profiles, but does not state whether it is actually true or false for the majority of entrepreneurs.",
        },
        {
            "type": "TF_NG",
            "text": "Drowsy driving accounts for a larger proportion of motor vehicle accidents than alcohol-impaired driving.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that drowsy driving accounts for approximately 20 percent of accidents, a figure comparable to (not larger than) the proportion attributed to alcohol.",
        },
        {
            "type": "TF_NG",
            "text": "After 24 hours without sleep, cognitive impairment exceeds that of a blood alcohol concentration above the legal limit.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage states that after 24 hours, impairment exceeds that of a blood alcohol concentration of 0.10 percent, which is above the legal limit in all 50 US states.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following best summarises the passage?",
            "options": [
                "How sleep deprivation affects cognition, productivity, and safety in modern work environments",
                "The history of sleep research in neuroscience laboratories",
                "Why entrepreneurs should sleep more than eight hours per night",
                "The legal consequences of drowsy driving in the United States",
            ],
            "answer": "How sleep deprivation affects cognition, productivity, and safety in modern work environments",
            "explanation": "The passage covers cognitive effects, workplace productivity, cultural attitudes, and safety implications. The other options are too narrow or not the main focus.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: A study of medical residents found that error rates increased by ________ percent after 24 hours without sleep.",
            "options": [],
            "answer": "36",
            "explanation": "The passage states error rates increase by 36 percent after 24 hours without sleep.",
        },
        {
            "type": "MCQ",
            "text": "What does the passage suggest about workplace nap programmes?",
            "options": [
                "They are ineffective and waste company resources",
                "They treat symptoms rather than systemic cultural issues",
                "They should be mandated by law in all companies",
                "They only work in technology firms",
            ],
            "answer": "They treat symptoms rather than systemic cultural issues",
            "explanation": "The passage notes that critics argue workplace sleep programmes risk treating symptoms rather than causes, particularly when organisational cultures continue to reward long hours.",
        },
        {
            "type": "MCQ",
            "text": "According to the passage, why does the media myth about successful entrepreneurs sleeping less persist?",
            "options": [
                "Because it is supported by scientific research",
                "Because media profiles reinforce the narrative of limited sleep as dedication",
                "Because entrepreneurs rarely discuss their sleep habits publicly",
                "Because sleep deprivation actually improves entrepreneurial performance",
            ],
            "answer": "Because media profiles reinforce the narrative of limited sleep as dedication",
            "explanation": "The passage states that the myth has been reinforced by media profiles of executives who boast of their limited sleep as evidence of dedication and productivity.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: A study found that traders who slept fewer than six hours per night made riskier ________ and experienced greater emotional volatility.",
            "options": [],
            "answer": "decisions",
            "explanation": "The passage states that sleep-deprived traders made riskier decisions.",
        },
    ],
}

PASSAGE_6 = {
    "title": "The Resurgence of Coral Reef Ecosystems",
    "section": "Passage 3",
    "estimated_band": 7.5,
    "passage": """Coral reefs, often described as the rainforests of the sea, support approximately 25 percent of all marine species despite covering less than one percent of the ocean floor. The ecological importance of these structures extends far beyond their role as biodiversity hotspots: they provide coastal protection valued at an estimated 9.0 billion dollars annually, sustain fisheries that feed over 500 million people, and generate tourism revenue in tropical nations where alternative economic opportunities may be limited. Yet the past three decades have witnessed an unprecedented decline in coral reef health worldwide, driven primarily by rising ocean temperatures, ocean acidification, and local stressors including overfishing, sedimentation, and nutrient pollution from agricultural runoff.

The phenomenon of coral bleaching, which occurs when thermal stress causes corals to expel the symbiotic algae known as zooxanthellae that provide them with both colour and up to 90 percent of their energy requirements, has become the most visible indicator of climate-driven reef degradation. The mass bleaching events of 1998, 2010, 2016, and 2020 affected reefs across every major ocean basin, with the Great Barrier Reef experiencing particularly severe damage. Aerial surveys following the 2016 event revealed that approximately 30 percent of the reef's coral had died within a single season, an unprecedented rate of mortality that shocked even researchers who had been tracking reef decline for decades. Subsequent monitoring revealed partial recovery in some sections, but the overall trajectory remained downward, with bleaching events recurring at intervals too short for full ecological recovery.

Against this backdrop of decline, however, a growing number of studies have documented remarkable instances of coral resilience and recovery that complicate the prevailing narrative of inevitable reef collapse. Researchers working in the American Samoa have identified coral populations that survived the 2016 bleaching event with minimal mortality, despite experiencing water temperatures that caused widespread death in adjacent colonies. Genetic analysis of these resilient corals revealed variations in the heat-shock protein genes that regulate the coral's response to thermal stress, suggesting that natural selection may be driving the evolution of heat-tolerant coral lineages. The implications are significant: if heat-tolerant genotypes can spread through populations via sexual reproduction, some reefs may possess an inherent capacity to adapt to gradually rising temperatures, though the pace of adaptation may not keep pace with the rate of warming projected under high-emission scenarios.

Active reef restoration efforts have also demonstrated that targeted human intervention can accelerate recovery in degraded areas. Coral gardening, a technique in which small coral fragments are grown in underwater nurseries before being transplanted onto degraded reef structures, has produced encouraging results in the Caribbean, the Philippines, and the Maldives. A programme in Belize has successfully restored approximately 40 hectares of reef habitat over a fifteen-year period, with transplanted coral colonies achieving survival rates exceeding 80 percent and supporting fish populations comparable to those found on undisturbed reefs. The economic model of coral gardening remains challenging, however, as the labour-intensive nature of the process limits scalability, and the cost per hectare of restored reef ranges from 200,000 to 600,000 dollars depending on the site conditions and the coral species involved.

Technological innovations are expanding the toolkit available to reef conservationists. Assisted gene flow, a technique that involves selectively breeding corals with heat-tolerant traits and introducing them to populations in warmer waters, has shown promise in controlled experiments, though concerns about unintended ecological consequences have slowed its adoption in open-ocean settings. Microbial therapies, which involve inoculating corals with beneficial bacteria that enhance their stress tolerance, represent an even more experimental approach, with early-stage trials producing mixed results. Perhaps the most pragmatic development has been the creation of CoralList, an international database that maps coral reef health across the globe in near-real-time, using satellite imagery, water temperature data, and crowdsourced observations from divers and citizen scientists. The platform enables conservation organisations to prioritise interventions and track the effectiveness of restoration efforts with unprecedented precision.

The political dimension of coral reef conservation has gained prominence as scientific evidence of reef decline has accumulated. The establishment of large-scale marine protected areas, or MPAs, has been a primary policy tool, with countries including Australia, Palau, and the Seychelles designating vast ocean territories where fishing, mining, and other extractive activities are restricted or prohibited. The Great Barrier Reef Marine Park, which covers approximately 344,400 square kilometres, represents the most extensive MPA dedicated to reef protection, though its effectiveness has been debated in light of continued reef degradation within its boundaries. Critics argue that MPAs address local stressors but cannot protect reefs from the global threat of climate change, while proponents contend that reducing local pressures enhances reef resilience and improves the probability of recovery when thermal stress events occur. The debate reflects a broader tension in conservation biology between local management interventions and the systemic policy changes required to address the root causes of environmental degradation.""",
    "questions": [
        {
            "type": "TF_NG",
            "text": "Coral reefs cover approximately five percent of the ocean floor.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states that coral reefs cover less than one percent of the ocean floor.",
        },
        {
            "type": "TF_NG",
            "text": "Zooxanthellae provide corals with up to 90 percent of their energy.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage explicitly states this figure.",
        },
        {
            "type": "TF_NG",
            "text": "Coral gardening has achieved a 95 percent survival rate in all locations where it has been attempted.",
            "options": ["True", "False", "Not Given"],
            "answer": "Not Given",
            "explanation": "The passage mentions survival rates exceeding 80 percent in Belize but does not provide a universal figure of 95 percent for all locations.",
        },
        {
            "type": "TF_NG",
            "text": "Natural selection may be producing heat-tolerant coral genotypes.",
            "options": ["True", "False", "Not Given"],
            "answer": "True",
            "explanation": "The passage states that genetic analysis suggests natural selection may be driving the evolution of heat-tolerant coral lineages.",
        },
        {
            "type": "TF_NG",
            "text": "The Great Barrier Reef Marine Park covers over one million square kilometres.",
            "options": ["True", "False", "Not Given"],
            "answer": "False",
            "explanation": "The passage states the park covers approximately 344,400 square kilometres.",
        },
        {
            "type": "HEADINGS",
            "text": "Which of the following best summarises the passage?",
            "options": [
                "Coral reef decline, natural resilience, restoration efforts, and conservation politics",
                "Why coral reefs will inevitably disappear by 2050",
                "The economic benefits of coral reef tourism",
                "How to set up a coral gardening programme at home",
            ],
            "answer": "Coral reef decline, natural resilience, restoration efforts, and conservation politics",
            "explanation": "The passage covers reef decline, natural resilience, active restoration, technological innovations, and the political dimension of conservation. The other options are too narrow or inaccurate.",
        },
        {
            "type": "SUMMARY",
            "text": "Complete the summary: The 2016 bleaching event caused approximately ________ percent of the Great Barrier Reef's coral to die within a single season.",
            "options": [],
            "answer": "30",
            "explanation": "The passage states that approximately 30 percent of the reef's coral died within a single season.",
        },
        {
            "type": "MCQ",
            "text": "What is the main criticism of large marine protected areas for reef conservation?",
            "options": [
                "They are too small to protect entire reef systems",
                "They address local stressors but cannot protect against climate change",
                "They prevent fishermen from earning a living",
                "They have never been tested in tropical waters",
            ],
            "answer": "They address local stressors but cannot protect against climate change",
            "explanation": "The passage states that critics argue MPAs address local stressors but cannot protect reefs from the global threat of climate change.",
        },
        {
            "type": "MCQ",
            "text": "According to the passage, what is the primary economic challenge of coral gardening?",
            "options": [
                "The coral fragments are too expensive to purchase",
                "The process is labour-intensive and costs 200,000 to 600,000 dollars per hectare",
                "It requires equipment that only exists in research laboratories",
                "The restored reefs do not generate tourism revenue",
            ],
            "answer": "The process is labour-intensive and costs 200,000 to 600,000 dollars per hectare",
            "explanation": "The passage states that the labour-intensive nature of the process limits scalability and provides the cost range.",
        },
        {
            "type": "SENTENCE_COMP",
            "text": "Complete the sentence: The CoralList platform uses satellite imagery, water temperature data, and crowdsourced observations from divers and citizen ________.",
            "options": [],
            "answer": "scientists",
            "explanation": "The passage states that the platform uses crowdsourced observations from divers and citizen scientists.",
        },
    ],
}

ALL_PASSAGES = [PASSAGE_1, PASSAGE_2, PASSAGE_3, PASSAGE_4, PASSAGE_5, PASSAGE_6]


# ─────────────────────────────────────────────
# LISTENING TRANSCRIPTS (600+ words)
# ─────────────────────────────────────────────

LISTENING_TRANSCRIPTS = [
    {
        "title": "University Library Orientation",
        "section": "Section 1",
        "estimated_band": 5.5,
        "transcript": """[A conversation between a university librarian and a new student]

Librarian: Good morning. Welcome to the Whitfield University Library. I'm Sarah, one of the orientation coordinators. Are you a first-year student?

Student: Yes, I just started the environmental science programme. I've never used a university library before, so I'm a bit overwhelmed.

Librarian: That's completely normal. Let me walk you through the basics. First, you'll need your student ID card to enter the building. The library is open from seven in the morning until midnight on weekdays, and from nine in the morning until eight in the evening on weekends. During exam periods, we extend the hours to two in the morning.

Student: That's helpful. How do I borrow books?

Librarian: You can borrow up to fifteen books at a time using the self-service machines near the entrance. Just scan your student ID and place the books on the scanning pad. The system will automatically register them. You'll receive a confirmation email with the due dates. Most books can be borrowed for three weeks, but high-demand items, which are marked with a red sticker on the spine, can only be borrowed for one week.

Student: What happens if I return a book late?

Librarian: There's a fine of fifty pence per day for each overdue book. If a book is more than four weeks overdue, it's considered lost and you'll be charged the replacement cost, which is usually between twenty and sixty pounds depending on the title. I'd strongly recommend setting up email reminders through the library app. You can download it from the university website.

Student: I'll do that. What about the study spaces?

Librarian: We have several types. The quiet study area is on the second floor, where talking is not permitted at all. The collaborative study zones are on the third floor, where group work and discussion are allowed. We also have twelve individual study rooms that can be booked in two-hour sessions through the online reservation system. During term time, these rooms are usually fully booked by midday, so I'd recommend reserving early if you need one.

Student: Is there a computer lab?

Librarian: Yes, the IT suite is on the ground floor with one hundred and twenty workstations. They're available on a first-come, first-served basis, but you can check availability in real-time through the library website. All workstations have access to the university's software catalogue, including statistical analysis tools, geographic information systems, and reference management software. There are also twenty-four high-specification machines in the postgraduate study room on the fourth floor, but you'll need a postgraduate card to access those.

Student: I think that covers everything. One more question: how do I access journal articles online?

Librarian: You can access all electronic resources through the university's virtual private network. Just log in with your student credentials. If you're off campus, you'll need to connect through the VPN client, which is available for Windows, Mac, and mobile devices. If you have any problems, the IT helpdesk is open Monday to Friday from eight-thirty to five-thirty. You can reach them by phone, email, or through the online chat service on the university portal.

Student: Thank you so much, Sarah. This has been very useful.

Librarian: You're welcome. Don't hesitate to ask if you need anything else. Good luck with your studies.""",
        "questions": [
            {
                "type": "LISTENING_FORM",
                "text": "Complete the form: Library hours on weekdays are from __:__ to __:__.",
                "options": [],
                "answer": "7:00 to 0:00",
                "explanation": "The librarian states the library is open from seven in the morning until midnight on weekdays.",
            },
            {
                "type": "LISTENING_MCQ",
                "text": "How many books can a student borrow at one time?",
                "options": ["5", "10", "15", "20"],
                "answer": "15",
                "explanation": "The librarian says students can borrow up to fifteen books at a time.",
            },
            {
                "type": "LISTENING_FORM",
                "text": "The fine for each overdue book is __ pence per day.",
                "options": [],
                "answer": "50",
                "explanation": "The librarian states there is a fine of fifty pence per day.",
            },
            {
                "type": "LISTENING_MCQ",
                "text": "How long can high-demand items be borrowed for?",
                "options": ["one week", "two weeks", "three weeks", "four weeks"],
                "answer": "one week",
                "explanation": "The librarian says high-demand items can only be borrowed for one week.",
            },
            {
                "type": "LISTENING_FORM",
                "text": "The quiet study area is located on the __ floor.",
                "options": [],
                "answer": "second",
                "explanation": "The librarian states the quiet study area is on the second floor.",
            },
            {
                "type": "LISTENING_MCQ",
                "text": "How many workstations are in the IT suite?",
                "options": ["80", "100", "120", "150"],
                "answer": "120",
                "explanation": "The librarian says the IT suite has one hundred and twenty workstations.",
            },
        ],
    },
    {
        "title": "A Tour of the Botanical Gardens",
        "section": "Section 2",
        "estimated_band": 6.0,
        "transcript": """[A monologue by a tour guide at the Royal Botanical Gardens]

Guide: Good afternoon, everyone, and welcome to the Royal Botanical Gardens. My name is James, and I'll be your guide for the next ninety minutes. Before we begin walking, let me give you a brief overview of what we'll see today.

The gardens were established in 1846 and cover approximately thirty hectares of land on the banks of the River Thames. We're currently standing at the main entrance, which faces south. Directly ahead of you is the Victorian Glasshouse, our most iconic structure, which houses over five thousand tropical plant species. The glasshouse was designed by the architect William Chambers and completed in 1848. It was one of the largest iron-and-glass structures of its era and has been designated a Grade I listed building.

If you look to your left, you'll see the Herbaceous Border, which stretches for two hundred metres along the western boundary of the gardens. This border contains over four hundred different species of perennial plants, arranged by height and colour to create a continuously flowering display from April through October. The head gardener, Maria Chen, has won three Royal Horticultural Society medals for her work on this border.

Our first stop will be the Mediterranean Garden, which is located five minutes' walk to the north. This section was redesigned in 2018 to showcase plants from the Mediterranean basin, including olive trees, lavender, and rosemary. The garden uses a specialised irrigation system that recycles rainwater collected from the glasshouse roof, reducing mains water consumption by approximately sixty percent.

After the Mediterranean Garden, we'll visit the Fern Gully, a shaded ravine that contains the largest collection of fern species in any botanical garden in the United Kingdom. There are over three hundred species, including several that are found nowhere else in cultivation. The Gully was created in 1923 by damming a small stream that runs through the property. The resulting pond provides the humid conditions that ferns require.

Our final stop will be the newly opened Climate Change Exhibit, which opened in March this year. This interactive display explores how rising temperatures and changing precipitation patterns are affecting plant communities around the world. You'll see live specimens of species that are projected to become extinct within the next fifty years, as well as examples of how conservation scientists are working to preserve genetic diversity through seed banking and controlled propagation.

A few practical notes before we set off. The paths are mostly level, but there are some gravel sections that may be difficult for wheelchairs. If you need an accessible route, please let me know and I'll arrange an alternative. Toilets are located near the glasshouse and at the exit of the Fern Gully. Photography is permitted throughout the gardens, but please do not use flash in the glasshouse, as it can stress some of the more sensitive plant species. Our tour will end at the gift shop, where you'll have the opportunity to purchase plants, books, and gardening tools. Shall we begin?""",
        "questions": [
            {
                "type": "LISTENING_MCQ",
                "text": "When were the Royal Botanical Gardens established?",
                "options": ["1846", "1848", "1923", "2018"],
                "answer": "1846",
                "explanation": "The guide states the gardens were established in 1846.",
            },
            {
                "type": "LISTENING_FORM",
                "text": "The gardens cover approximately __ hectares of land.",
                "options": [],
                "answer": "30",
                "explanation": "The guide states the gardens cover approximately thirty hectares.",
            },
            {
                "type": "LISTENING_MCQ",
                "text": "What is the primary feature of the Herbaceous Border?",
                "options": [
                    "It contains over 5,000 tropical plants",
                    "It stretches 200 metres and contains over 400 perennial species",
                    "It was designed by William Chambers in 1848",
                    "It uses recycled rainwater for irrigation",
                ],
                "answer": "It stretches 200 metres and contains over 400 perennial species",
                "explanation": "The guide states the border stretches for two hundred metres and contains over four hundred different species of perennial plants.",
            },
            {
                "type": "LISTENING_FORM",
                "text": "The Mediterranean Garden's irrigation system reduces mains water consumption by approximately __ percent.",
                "options": [],
                "answer": "60",
                "explanation": "The guide states the system reduces mains water consumption by approximately sixty percent.",
            },
            {
                "type": "LISTENING_MCQ",
                "text": "What is special about the Fern Gully?",
                "options": [
                    "It was the first section of the gardens to be built",
                    "It contains the largest collection of fern species in any UK botanical garden",
                    "It houses plants from the Mediterranean basin",
                    "It was opened in March of this year",
                ],
                "answer": "It contains the largest collection of fern species in any UK botanical garden",
                "explanation": "The guide states the Gully contains over three hundred species, the largest collection in any botanical garden in the United Kingdom.",
            },
        ],
    },
]


# ─────────────────────────────────────────────
# SPEAKING PROMPTS (Authentic IELTS format)
# ─────────────────────────────────────────────

SPEAKING_PROMPTS = [
    # ── Part 1: Personal questions ──
    {
        "part": "Part 1",
        "title": "Home and Accommodation",
        "questions": [
            "Do you live in a house or an apartment?",
            "What is your favourite room in your home?",
            "Is there anything you would like to change about your home?",
            "How long have you lived there?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Work and Study",
        "questions": [
            "Do you work or are you a student?",
            "What do you enjoy most about your work or studies?",
            "Is there anything you dislike about your job or course?",
            "Do you plan to continue in this field in the future?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Daily Routine",
        "questions": [
            "What do you usually do in the morning?",
            "Do you prefer to follow a routine or be spontaneous?",
            "Has your daily routine changed recently?",
            "What is the busiest part of your day?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Hometown",
        "questions": [
            "Where is your hometown?",
            "What do you like most about your hometown?",
            "Has your hometown changed much over the years?",
            "Is there anything you would like to improve about it?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Transport",
        "questions": [
            "How do you usually get to work or school?",
            "Do you prefer public transport or private transport?",
            "What improvements would you like to see in your city's transport system?",
            "Have you ever tried cycling as a form of transport?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Food and Cooking",
        "questions": [
            "Do you enjoy cooking? Why or why not?",
            "What is a popular dish in your country?",
            "Do you prefer eating at home or in restaurants?",
            "Have you learned to cook recently?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Technology",
        "questions": [
            "How often do you use your smartphone?",
            "What app do you use the most?",
            "Do you think technology has made life easier or more complicated?",
            "Is there any technology you find difficult to use?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Reading",
        "questions": [
            "Do you enjoy reading?",
            "What kind of books do you read?",
            "Do you prefer physical books or e-books?",
            "How often do you visit a library?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Weather and Seasons",
        "questions": [
            "What is the weather like in your country right now?",
            "Which season do you prefer?",
            "Does the weather affect your mood?",
            "What do you usually do when the weather is bad?",
        ],
    },
    {
        "part": "Part 1",
        "title": "Health and Fitness",
        "questions": [
            "Do you do any regular exercise?",
            "How important is health to you?",
            "Do you have any unhealthy habits?",
            "What do you do to stay healthy?",
        ],
    },

    # ── Part 2: Cue cards ──
    {
        "part": "Part 2",
        "title": "A Place You Would Like to Visit",
        "cue_card": "Describe a place you would like to visit.\n\nYou should say:\n- where this place is\n- how you learned about it\n- what you would do there\n\nand explain why you would like to visit this place.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Skill You Would Like to Learn",
        "cue_card": "Describe a skill you would like to learn.\n\nYou should say:\n- what the skill is\n- why you want to learn it\n- how you would learn it\n\nand explain how this skill would be useful to you.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Time You Helped Someone",
        "cue_card": "Describe a time you helped someone.\n\nYou should say:\n- who you helped\n- what you did to help\n- how this person reacted\n\nand explain how you felt about helping this person.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "An Interesting Conversation",
        "cue_card": "Describe an interesting conversation you had recently.\n\nYou should say:\n- who you talked to\n- where you were\n- what you talked about\n\nand explain why the conversation was interesting.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Goal You Want to Achieve",
        "cue_card": "Describe an important goal you want to achieve.\n\nYou should say:\n- what the goal is\n- when you first thought about it\n- what steps you have taken so far\n\nand explain why this goal is important to you.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Book or Film That Influenced You",
        "cue_card": "Describe a book or film that influenced you.\n\nYou should say:\n- what it was called\n- when you read or watched it\n- what it was about\n\nand explain how it influenced your thinking.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Piece of Technology You Use Often",
        "cue_card": "Describe a piece of technology you use often.\n\nYou should say:\n- what it is\n- when you started using it\n- what you use it for\n\nand explain why it is important to you.",
        "questions": [],
    },
    {
        "part": "Part 2",
        "title": "A Person Who Has Had a Positive Impact on Your Life",
        "cue_card": "Describe a person who has had a positive impact on your life.\n\nYou should say:\n- who this person is\n- how you met them\n- what they have done\n\nand explain how they have influenced you.",
        "questions": [],
    },

    # ── Part 3: Discussion ──
    {
        "part": "Part 3",
        "title": "Technology and Society",
        "questions": [
            "How has technology changed the way people communicate?",
            "Do you think young people spend too much time on their phones?",
            "What are the advantages and disadvantages of working from home using technology?",
            "How might artificial intelligence affect employment in the future?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Education Systems",
        "questions": [
            "What do you think makes a good education system?",
            "Should university education be free for everyone?",
            "How has the role of teachers changed with the rise of online learning?",
            "Do you think exams are the best way to assess students?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Environmental Issues",
        "questions": [
            "What do you think are the most serious environmental problems facing the world today?",
            "Should individuals or governments be more responsible for protecting the environment?",
            "How can cities become more environmentally friendly?",
            "Do you think people care enough about the environment?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Health and Lifestyle",
        "questions": [
            "Why do some people find it difficult to maintain a healthy lifestyle?",
            "Should governments take more action to improve public health?",
            "How has the way people view health changed over the past few decades?",
            "What role does advertising play in people's health choices?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Work and Employment",
        "questions": [
            "What qualities do you think are important in a good employee?",
            "How has the nature of work changed in recent years?",
            "Do you think job satisfaction is more important than salary?",
            "What changes would you like to see in the workplace?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Urbanisation and Cities",
        "questions": [
            "Why do so many people choose to live in cities?",
            "What are the main problems caused by rapid urbanisation?",
            "How can city planners create more liveable urban environments?",
            "Do you think the trend towards urbanisation will continue?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Culture and Tradition",
        "questions": [
            "How important is it for people to preserve their cultural traditions?",
            "Do you think globalisation is threatening local cultures?",
            "How do young people's attitudes towards tradition differ from older generations?",
            "Should schools teach children about their country's cultural heritage?",
        ],
    },
    {
        "part": "Part 3",
        "title": "Crime and Justice",
        "questions": [
            "What do you think are the main causes of crime?",
            "Is punishment or rehabilitation more effective in reducing crime?",
            "How has technology affected the way crimes are solved?",
            "Do you think the media has a responsible way of reporting crime?",
        ],
    },
]


# ─────────────────────────────────────────────
# WRITING TASK 2 PROMPTS
# ─────────────────────────────────────────────

WRITING_TASK2_PROMPTS = [
    ("Education", "Some people believe that children should be taught to be competitive, while others think they should learn to cooperate. Discuss both views and give your opinion."),
    ("Technology", "Some people think that the increasing use of computers and mobile phones has had a negative effect on young people's reading and writing skills. To what extent do you agree or disagree?"),
    ("Environment", "Many people say that the government should spend money on solving world problems rather than on something else. Do you agree or disagree?"),
    ("Health", "Some people think that the best way to improve public health is by increasing the number of sports facilities. Others think that this would have little effect and that other measures are needed. Discuss both views and give your opinion."),
    ("Society", "In many countries, the gap between the rich and the poor is increasing. What problems does this cause, and what measures can be taken to address them?"),
    ("Transport", "Some people believe that it is best to accept a bad situation, while others argue that it is better to try to improve it. Discuss both views and give your opinion."),
    ("Work", "In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university. Discuss the advantages and disadvantages for young people who decide to do this."),
    ("Media", "Some people think that news media have too much influence on people's lives, which is negative. To what extent do you agree or disagree?"),
    ("Crime", "Some people think that the most effective way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion."),
    ("Education", "University education should be free for all students. To what extent do you agree or disagree?"),
    ("Technology", "Some people think that AI will have a significant positive impact on education, while others believe it will make education worse. Discuss both views and give your opinion."),
    ("Environment", "Some people believe that it is the responsibility of individuals to take care of the environment, while others say it is the government's role. Discuss both views and give your opinion."),
    ("Society", "In many cities, the number of young people is declining while the number of elderly people is increasing. What problems does this cause, and what can be done about them?"),
    ("Health", "Some people think that governments should do more to make their citizens eat a healthy diet. Others believe that individuals should make their own dietary choices. Discuss both views and give your opinion."),
    ("Work", "Some people think that having a set retirement age for everyone, regardless of occupation, is unfair. They believe that certain workers deserve to retire and receive a pension at an earlier age. Do you agree or disagree?"),
    ("Education", "Some people think that children should begin their formal education at a very early age, while others think they should begin at least seven years old. Discuss both views and give your opinion."),
    ("Technology", "The internet has made information freely available to everyone, but some people think that this has had a negative effect. To what extent do you agree or disagree?"),
    ("Crime", "Some people think that young criminals should be punished in the same way as adults. To what extent do you agree or disagree?"),
    ("Environment", "Some people say that the best way to solve environmental problems is to increase the cost of fuel. To what extent do you agree or disagree?"),
    ("Society", "Some people believe that children should be allowed to stay at home and play until they are six or seven years old. Others believe that it is important for children to go to school as young as possible. Discuss both views and give your opinion."),
    ("Health", "Some people think that the government should ban dangerous sports, while others think people should have the freedom to do whatever sports they choose. Discuss both views and give your opinion."),
    ("Work", "Some people prefer to work for the same company all their working life, while others think it is better to move to different companies. Discuss both views and give your opinion."),
    ("Technology", "Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion."),
    ("Education", "Schools should teach children how to be good citizens rather than just focusing on academic subjects. To what extent do you agree or disagree?"),
    ("Environment", "Some people think that instead of preventing climate change, we need to find a way to live with it. To what extent do you agree or disagree?"),
    ("Society", "In many countries, young people are moving away from rural areas to live in cities. What are the causes of this trend, and what can be done to address it?"),
    ("Health", "Some people think that governments should spend money on healthcare, while others think the money should be spent on other important things. Discuss both views and give your opinion."),
    ("Work", "In some countries, it is illegal for companies to reject job applicants because of their age. Is this a good or bad thing?"),
    ("Technology", "Some people think that social media has a negative impact on society. To what extent do you agree or disagree?"),
    ("Education", "Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future. Discuss both views and give your opinion."),
    ("Crime", "Some people think that the police should be given more power, while others think they should have less power. Discuss both views and give your opinion."),
    ("Environment", "Some people believe that the government should spend more money on public transport, while others believe the money should be spent on building new roads. Discuss both views and give your opinion."),
    ("Society", "In many countries, the proportion of elderly people is increasing. What problems does this cause, and what can be done to address them?"),
    ("Health", "Some people think that government should do more to promote healthy eating, while others think individuals should be responsible for their own diet. Discuss both views and give your opinion."),
    ("Work", "Some people think that job satisfaction is the most important factor in choosing a job, while others think salary is more important. Discuss both views and give your opinion."),
    ("Technology", "Some people think that the best way to improve road safety is to increase the minimum age for driving a car or riding a motorbike. To what extent do you agree or disagree?"),
    ("Education", "Some people think that teachers should be allowed to punish students for bad behaviour. Others believe this is unacceptable. Discuss both views and give your opinion."),
    ("Environment", "Some people think that the government should invest more in public services rather than wasting money on arts such as music and painting. To what extent do you agree or disagree?"),
    ("Society", "Some people think that children should be taught to share and be generous. Others think that parents should teach children to look after themselves. Discuss both views and give your opinion."),
    ("Health", "Some people think that governments should spend money on protecting the environment, while others believe that the money should be used for other purposes. Discuss both views and give your opinion."),
    ("Work", "Some people think that the government should provide free university education, while others think university education should be paid for by students. Discuss both views and give your opinion."),
    ("Technology", "Some people think that the development of technology has made our lives more complex. To what extent do you agree or disagree?"),
    ("Education", "Some people think that the best way to improve education is to raise teachers' salaries. Others think there are better ways to improve education. Discuss both views and give your opinion."),
    ("Environment", "Some people say that the best way to solve the problem of littering is to fine people heavily. To what extent do you agree or disagree?"),
    ("Society", "Some people think that the government should provide financial support to old people, while others think old people should save money for their own retirement. Discuss both views and give your opinion."),
    ("Health", "Some people think that governments should do more to reduce the amount of junk food people eat. To what extent do you agree or disagree?"),
    ("Work", "Some people think that employees should do whatever their manager tells them to do. Others think that employees should be encouraged to express their own opinions. Discuss both views and give your opinion."),
    ("Technology", "Some people think that the internet has made it easier to learn new things, while others think it has made learning more difficult. Discuss both views and give your opinion."),
    ("Education", "Some people think that university students should specialise in one subject, while others think they should study a range of subjects. Discuss both views and give your opinion."),
    ("Environment", "Some people think that the government should ban the production of all plastic products. To what extent do you agree or disagree?"),
]


# ─────────────────────────────────────────────
# SEED FUNCTIONS
# ─────────────────────────────────────────────

def seed_reading_skills(db):
    skills = {}
    for name, category in READING_SKILLS:
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name, category=category, description=f"IELTS reading skill: {name}", mastery_threshold=0.7)
            db.add(skill)
            db.flush()
        skills[category] = skill
    return skills


def seed_listening_skills(db):
    skills = {}
    for name, category in LISTENING_SKILLS:
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name, category=category, description=f"IELTS listening skill: {name}", mastery_threshold=0.7)
            db.add(skill)
            db.flush()
        skills[category] = skill
    return skills


def seed_reading(db, reading_skills):
    test_set = db.query(TestSet).filter(TestSet.title == "IELTS v2 Reading").first()
    if not test_set:
        test_set = TestSet(title="IELTS v2 Reading", module="READING", estimated_band=6.5, time_limit_minutes=60, approved=True, source="ielts-v2-seed")
        db.add(test_set)
        db.flush()

    count = 0
    for passage_data in ALL_PASSAGES:
        for q in passage_data["questions"]:
            skill_key = q["type"]
            if skill_key not in reading_skills:
                continue
            existing = db.query(Question).filter(
                Question.question_text == q["text"],
                Question.test_set_id == test_set.id,
            ).first()
            if existing:
                continue
            question = Question(
                test_set_id=test_set.id,
                skill_id=reading_skills[skill_key].id,
                module="READING",
                passage=passage_data["passage"],
                passage_title=passage_data["title"],
                section=passage_data["section"],
                estimated_band=passage_data["estimated_band"],
                question_text=q["text"],
                question_type=q["type"],
                options=q.get("options") or None,
                correct_answer=q["answer"],
                explanation=q.get("explanation", ""),
                difficulty=min(max(int(passage_data["estimated_band"] * 2), 1), 10),
                tags=f"v2,{skill_key.lower()}",
                needs_review=False,
                approved=True,
            )
            db.add(question)
            count += 1

    db.commit()
    print(f"  Seeded {count} reading questions from {len(ALL_PASSAGES)} full-length passages")
    return count


def seed_listening(db, listening_skills):
    test_set = db.query(TestSet).filter(TestSet.title == "IELTS v2 Listening").first()
    if not test_set:
        test_set = TestSet(title="IELTS v2 Listening", module="LISTENING", estimated_band=6.0, time_limit_minutes=30, approved=True, source="ielts-v2-seed")
        db.add(test_set)
        db.flush()

    count = 0
    for topic in LISTENING_TRANSCRIPTS:
        for q in topic["questions"]:
            qtype = q["type"]
            if qtype not in listening_skills:
                continue
            existing = db.query(Question).filter(
                Question.question_text == q["text"],
                Question.test_set_id == test_set.id,
            ).first()
            if existing:
                continue
            question = Question(
                test_set_id=test_set.id,
                skill_id=listening_skills[qtype].id,
                module="LISTENING",
                passage=topic["transcript"],
                passage_title=topic["title"],
                section=topic["section"],
                estimated_band=topic["estimated_band"],
                question_text=q["text"],
                question_type=qtype,
                options=q.get("options") or None,
                correct_answer=q["answer"],
                explanation=q.get("explanation", ""),
                difficulty=min(max(int(topic["estimated_band"] * 2), 1), 10),
                tags=f"v2,{qtype.lower()}",
                needs_review=False,
                approved=True,
            )
            db.add(question)
            count += 1

    db.commit()
    print(f"  Seeded {count} listening questions from {len(LISTENING_TRANSCRIPTS)} transcripts")
    return count


def seed_speaking(db):
    count = 0
    for prompt in SPEAKING_PROMPTS:
        existing = db.query(SpeakingPrompt).filter(SpeakingPrompt.title == prompt["title"]).first()
        if existing:
            continue
        db.add(SpeakingPrompt(
            part=prompt["part"],
            title=prompt["title"],
            questions=prompt.get("questions", []),
            cue_card=prompt.get("cue_card"),
        ))
        count += 1

    db.commit()
    print(f"  Seeded {count} speaking prompts")
    return count


def seed_writing(db):
    count = 0
    for category, prompt_text in WRITING_TASK2_PROMPTS:
        existing = db.query(WritingPrompt).filter(WritingPrompt.prompt_text == prompt_text).first()
        if existing:
            continue
        db.add(WritingPrompt(
            task_type="Task 2",
            title=prompt_text[:80],
            prompt_text=prompt_text,
            category=category,
            tips=["State a clear position", "Develop two main ideas", "Use examples and a concise conclusion"],
        ))
        count += 1

    db.commit()
    print(f"  Seeded {count} writing prompts")
    return count


def main():
    db = SessionLocal()
    try:
        print("Seeding IELTS v2 content...")

        reading_skills = seed_reading_skills(db)
        listening_skills = seed_listening_skills(db)

        reading_count = seed_reading(db, reading_skills)
        listening_count = seed_listening(db, listening_skills)
        speaking_count = seed_speaking(db)
        writing_count = seed_writing(db)

        total = reading_count + listening_count + speaking_count + writing_count
        print(f"\nTotal seeded: {total} items")
        print(f"  Reading: {reading_count} questions ({len(ALL_PASSAGES)} passages × ~10 questions)")
        print(f"  Listening: {listening_count} questions ({len(LISTENING_TRANSCRIPTS)} transcripts)")
        print(f"  Speaking: {speaking_count} prompts (10 Part 1 + 8 Part 2 + 8 Part 3)")
        print(f"  Writing: {writing_count} prompts")
    finally:
        db.close()


if __name__ == "__main__":
    main()
