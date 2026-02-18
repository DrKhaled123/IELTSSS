const ieltsReadingContent = {
  // ============ IELTS 18 Test 3 - Reading Passage 1 ============
  passage1: {
    id: "materials-beyond-concrete",
    title: "Materials to Take Us Beyond Concrete",
    source: "IELTS 18 Test 3 - Reading Passage 1",
    difficulty: "Medium",
    wordCount: 900,
    timeAllowed: "20 minutes",
    
    // Topic Narrative Explanation
    topicExplanation: {
      en: `🏗️ The Concrete Dilemma: Building a Sustainable Future

Imagine a world where the very foundation of our cities is both our greatest achievement and our biggest environmental threat. This is the paradox of concrete—the second most consumed substance on Earth after water.

**The Story Behind the Material:**
Concrete has built our modern civilization. From skyscrapers to bridges, it's everywhere. But here's the shocking truth: producing cement (concrete's key ingredient) generates massive CO2 emissions. With 9.8 billion people expected by 2050, we need housing—but if we use only concrete, we'll cook the planet.

**The Search for Alternatives:**
Scientists are racing against time to find alternatives:
• 🌲 Wood: Ancient material, modern solution. Tall wooden buildings now rise in Vancouver, Vienna, and Norway
• ⚙️ Cross-laminated timber: Layers of wood glued together, stronger than steel
• 🏭 Fly ash & slag: Turning industrial waste into building gold

**The Challenges:**
Each alternative has hurdles. Wood absorbs moisture and can burn. New materials are expensive. But the biggest challenge? Concrete is simply amazing at what it does—cheap, abundant, and incredibly versatile.

**The Hope:**
The passage leaves us with a question: Can innovation save us? As one expert says, "Concrete is amazing stuff. Making anything with similar properties is going to be very difficult." The race is on.`,

      ar: `🏗️ معضلة الخرسانة: بناء مستقبل مستدام

تخيل عالماً حيث الأساس الحقيقي لمدننا هو أعظم إنجاز لنا وأكبر تهديد بيئي في نفس الوقت. هذه هي مفارقة الخرسانة—ثاني أكثر مادة استهلاكاً على الأرض بعد الماء.

**قصة المادة:**
الخرسانة بنت حضارتنا الحديثة. من ناطحات السحاب إلى الجسور، هي في كل مكان. لكن إليك الحقيقة الصادمة: إنتاج الأسمنت (المكون الرئيسي للخرسانة) ينتج انبعاثات CO2 ضخمة. مع توقع 9.8 مليار نسمة بحلول 2050، نحتاج لسكن—لكن إذا استخدمنا الخرسانة فقط، سنُحرك الكوكب.

**البحث عن بدائل:**
العلماء يتسابقون مع الزمن للعثور على بدائل:
• 🌲 الخشب: مادة قديمة، حلول عصرية. مباني خشبية عالية ترتفع الآن في فانكوفر وفيينا والنرويج
• ⚙️ الخشب متقاطع الطبقات: طبقات من الخشب ملصقة معاً، أقوى من الفولاذ
• 🏭 الرماد المتطاير والخبث: تحويل النفايات الصناعية إلى ذهب بناء

**التحديات:**
كل بديل له عقبات. الخشب يمتص الرطوبة ويمكن أن يحترق. المواد الجديدة مكلفة. لكن التحدي الأكبر؟ الخرسانة ببساطة مدهشة في ما تفعله—رخيصة، وفيرة، ومتعددة الاستخدامات بشكل لا يصدق.`
    },

    // Key Vocabulary (EN/AR) - Extracted from the passage
    vocabulary: [
      { word: "Concrete", ar: "خرسانة", meaning: "A building material made from cement, sand, and water", synonym: "Cement, Building material", example: "The construction of the bridge took two years." },
      { word: "Emissions", ar: "انبعاثات", meaning: "Substances released into the air", synonym: "Discharge, Release", example: "The factory produces harmful emissions." },
      { word: "Abundance", ar: "وفرة", meaning: "A large quantity of something", synonym: "Plenty, Profusion", example: "The region has an abundance of natural resources." },
      { word: "Mouldable", ar: "قابل للتشكيل", meaning: "Can be shaped easily", synonym: "Shapable, Pliable", example: "Clay is a mouldable material." },
      { word: "Timber", ar: "أخشاب/خشب", meaning: "Wood prepared for building", synonym: "Lumber, Wood", example: "The house was built with timber from local forests." },
      { word: "Moisture", ar: "رطوبة", meaning: "Water or other liquid in the air or on a surface", synonym: "Humidity, Dampness", example: "Wood expands as it absorbs moisture." },
      { word: "Susceptible", ar: "عرضة/قابل للتأثر", meaning: "Likely to be affected by something", synonym: "Vulnerable, Prone", example: "Wood is susceptible to pests." },
      { word: "Adhesive", ar: "مادة لاصقة", meaning: "A substance that sticks things together", synonym: "Glue, Bonding agent", example: "An adhesive is used to stick layers of timber." },
      { word: "Slag", ar: "خبث", meaning: "Waste material from metal production", synonym: "Dross, Cinders", example: "Iron-ore slag can be used in concrete mixes." },
      { word: "Byproduct", ar: "منتج ثانوي", meaning: "Something produced while making something else", synonym: "Side product, Derivative", example: "Fly ash is a byproduct of coal-burning." },
      { word: "Viable", ar: "قابل للتطبيق/ممكن", meaning: "Able to work successfully", synonym: "Feasible, Practical", example: "Wood can be a viable alternative to concrete." },
      { word: "Cost-effective", ar: "فاتحتي من حيث التكلفة", meaning: "Giving good value for money", synonym: "Economical, Efficient", example: "These alternatives are rarely as cost-effective." }
    ],

    // Reading Passage Text (Condensed)
    passageText: `Concrete is the second most used substance in the global economy, after water – and one of the world's biggest single sources of greenhouse gas emissions. The chemical process by which cement, the key ingredient of concrete, is created results in large quantities of carbon dioxide. The UN estimates that there will be 9.8 billion people living on the planet by mid-century. They will need somewhere to live. If concrete is the only answer to the construction of new cities, then carbon emissions will soar, aggravating global warming. And so scientists have started innovating with other materials, in a scramble for alternatives.

The problem with replacing concrete is that it is so very good at what it does. The ingredients are relatively cheap and found in abundance. Concrete is mouldable and pourable, but quickly sets hard. Steel can be used to reinforce concrete, making it far stronger.

A possible alternative is wood. Recent years have seen tall buildings constructed almost entirely from timber in Vancouver, Vienna and Brumunddal in Norway. Cross-laminated timber is engineered wood where layers are glued together crosswise.

Fly ash and slag from iron ore are other alternatives. Fly ash can make up 15-30% of cement. However, Anna Surgenor notes that transportation costs may reduce environmental benefits.`,

    // Questions and Answers with Explanations
    questions: [
      {
        id: 1,
        type: "matching",
        question: "Which section contains: An explanation of industrial processes that create potential raw materials for concrete?",
        answer: "G",
        explanation: "🔍 Memory Tip: Look for 'industrial processes' → Paragraph G discusses fly ash and slag production processes. Keywords: 'byproduct', 'smelting process'."
      },
      {
        id: 2,
        type: "matching", 
        question: "Which section contains: A reference to various locations where high-rise wooden buildings can be found?",
        answer: "D",
        explanation: "🔍 Memory Tip: Look for city names → Paragraph D mentions Vancouver, Vienna, Brumunddal (Norway). These are locations of wooden buildings."
      },
      {
        id: 3,
        type: "matching",
        question: "Which section contains: An indication of how widely available raw materials of concrete are?",
        answer: "C",
        explanation: "🔍 Memory Tip: Look for 'abundance' and 'cheap' → Paragraph C states ingredients are 'found in abundance in most places'."
      },
      {
        id: 4,
        type: "matching",
        question: "Which section contains: The belief that more high-rise wooden buildings are needed before wood can be regarded as viable?",
        answer: "F",
        explanation: "🔍 Memory Tip: Look for limitation of wood → Paragraph F ends with 'limitations' and need for 'wider range of construction projects' to be proven."
      },
      {
        id: 5,
        type: "summary",
        question: "Complete: Wood is a traditional building material, but current environmental concerns are encouraging [5] ______ to use wood...",
        answer: "architects",
        explanation: "📝 Logic: Who designs buildings? Architects! The passage mentions 'architects turn to treated timber'."
      },
      {
        id: 6,
        type: "summary",
        question: "Complete: ...as [6] ______ in the atmosphere enters wood, it increases in size.",
        answer: "moisture",
        explanation: "📝 Logic: What makes wood expand? Water/moisture! Paragraph E: 'Wood expands as it absorbs moisture'."
      },
      {
        id: 7,
        type: "summary",
        question: "Complete: In one process, [7] ______ of solid wood are glued together...",
        answer: "layers",
        explanation: "📝 Logic: Cross-laminated timber = layers glued crosswise. Paragraph E mentions 'layers of solid-sawn timber'."
      },
      {
        id: 8,
        type: "summary",
        question: "Complete: ...in terms of the [8] ______ with which they can be constructed...",
        answer: "speed",
        explanation: "📝 Logic: Paragraph E states wooden buildings constructed at 'greater speed' and process is 'quieter'."
      },
      {
        id: 9,
        type: "matching-people",
        question: "The environmental advantage of cement alternatives may not be as great as initially assumed.",
        answer: "C - Anna Surgenor",
        explanation: "👤 Memory Tip: Anna = Cautious. She warns about transportation costs reducing benefits. Paragraph G."
      },
      {
        id: 10,
        type: "matching-people",
        question: "It would be hard to create a construction alternative to concrete that offers so many comparable benefits.",
        answer: "A - Chris Cheeseman",
        explanation: "👤 Memory Tip: Chris = Challenging. He says 'Making anything with similar properties is going to be very difficult.' Paragraph C."
      },
      {
        id: 11,
        type: "matching-people",
        question: "Worries about the environment have led to increased interest in wood as a construction material.",
        answer: "B - Markus Mannstrom",
        explanation: "👤 Memory Tip: Markus = Market. VP of timber company. 'Climate change concerns the key driver.' Paragraph F."
      },
      {
        id: 12,
        type: "matching-people",
        question: "Expense has been a factor in the negative response to the development of new cements.",
        answer: "D - Felix Preston and Johanna Lehne",
        explanation: "👤 Memory Tip: Felix & Johanna = Financial experts. Paragraph H mentions 'cost-effective' as barrier."
      },
      {
        id: 13,
        type: "matching-people",
        question: "The environmental damage caused by concrete is due to it being produced in large quantities.",
        answer: "B - Markus Mannstrom OR Paragraph B (Cheeseman)",
        explanation: "👤 Memory Tip: 'Sheer scale of manufacture is so huge.' This is in Paragraph B attributed to Cheeseman."
      }
    ],

    // Memory Notes for Easy Recall
    memoryNotes: {
      paragraphMap: {
        A: "Problem: Concrete = CO2 disaster",
        B: "Scale is the issue (not concrete itself)",
        C: "Why concrete wins: cheap, abundant, versatile",
        D: "Wood alternative + 3 cities",
        E: "Wood challenges + cross-laminated timber",
        F: "Mannstrom: timber demand rising",
        G: "Fly ash & slag + Surgenor warning",
        H: "Conclusion: alternatives face barriers"
      },
      peopleMap: {
        "Chris Cheeseman": "Engineer, London - says concrete is amazing, hard to replace",
        "Markus Mannstrom": "Stora Enso VP - timber demand up due to climate",
        "Anna Surgenor": "Green Building Council UK - warns about transport costs",
        "Felix Preston & Johanna Lehne": "Royal Institute - say new cements not cost-effective"
      }
    }
  },

  // ============ IELTS 18 Test 3 - Reading Passage 2 ============
  passage2: {
    id: "steam-car",
    title: "The Steam Car - The Doble Brothers' Story",
    source: "IELTS 18 Test 3 - Reading Passage 2",
    difficulty: "Medium",
    wordCount: 850,
    timeAllowed: "20 minutes",
    
    topicExplanation: {
      en: `🚗 The Forgotten Revolution: Steam Cars That Could Have Changed Everything

**The Dawn of Automobiles (1800s):**
Before gasoline cars ruled the roads, steam was king. Imagine cars that ran on the same technology as trains—boilers, steam pressure, and silent power. But there was a catch: you had to light the boiler by hand and wait 20 minutes before driving. And every 30 miles, you needed water.

**The Rise and Fall (Early 1900s):**
Steam cars were popular with wealthy citizens. But then came the internal combustion engine—noisy, smelly, but instant. Gasoline cars won because they were convenient. By the 1910s, steam was dying.

**The Doble Brothers' Dream (1906-1931):**
Enter four brothers from Massachusetts—Abner, John, Warren, and Bill. While still in HIGH SCHOOL, they built their first steam car in their parents' basement! Talk about ambition!

Their journey:
• Model B (1914): Silent, swift, could go 0-60 in 15 seconds! Faster than gas cars
• Model C (1916): Key ignition (no manual lighting!), 5,390 pre-orders
• Model E (1924): The masterpiece. Started in 40 seconds even after freezing overnight. 100+ mph. Clean emissions!

**The Tragic End:**
Despite being superior technology, the Doble steam car failed:
• Too expensive ($18,000 in 1924 = $300,000 today!)
• Abner kept tinkering—no two cars were the same
• Only 50 ever built
• Company folded in 1931

**The Irony:**
Those 50 cars? Many still run today—some with 500,000+ miles. They pass modern California emissions tests! Abner died believing steam was better. And maybe he was right...`,

      ar: `🚗 الثورة المنسية: سيارات البخار التي كان يمكن أن تغير كل شيء

**فجر السيارات (1800s):**
قبل أن تسيطر سيارات البنزين على الطرق، كان البخار ملكاً. تخيل سيارات تعمل بنفس تكنولوجيا القطارات—الغلايات، ضغط البخار، والقوة الصامتة. لكن كان هناك مشكل: عليك إشعال الغلاية باليد والانتظار 20 دقيقة قبل القيادة. وكل 30 ميل، تحتاج لماء.

**الصعود والسقوط ( orly 1900s):**
سيارات البخار كانت شائعة بين الأثرياء. لكن جاء محرك الاحتراق الداخلي—صاخب، ذو رائحة، لكن فوري. فازت سيارات البنزين لأنها كانت مريحة. بحلول 1910s، كان البخار يموت.

**حلم إخوة دوبل (1906-1931):**
ادخل أربعة إخوة من ماساتشوستس—أبنر، جون، وارن، وبيل. بينما كانوا لا يزالون في الثانوية، بنوا أول سيارة بخار لهم في قبو والديهم! تحدث عن الطموح!

رحلتهم:
• موديل B (1914): صامتة، سريعة، 0-60 في 15 ثانية! أسرع من سيارات البنزين
• موديل C (1916): إشعال بالمفتاح (بدون إشعال يدوي!)، 5390 طلب مسبق
• موديل E (1924): تحفة فنية. تبدأ في 40 ثانية حتى بعد تجمد ليلة كاملة. 100+ ميل/ساعة. انبعاثات نظيفة!

**النهاية المأساوية:**
بالرغم من كونها تكنولوجيا متفوقة، فشلت سيارة دوبل البخارية:
• مكلفة جداً (18000 دولار في 1924 = 300000 دولار اليوم!)
• أبنر استمر في التعديل—لا سيارتين متشابهتين
• 50 فقط صنعت
• الشركة انهارت في 1931

**المفارقة:**
تلك الـ 50 سيارة؟ كثير منها لا يزال يعمل اليوم—بعضها قطع 500,000+ ميل. تجتاز اختبارات انبعاثات كاليفورنيا الحديثة! مات أبنر وهو يعتقد أن البخار أفضل. وربما كان محقاً...`
    },

    vocabulary: [
      { word: "Primitive", ar: "بدائي/أولي", meaning: "Early or simple in development", synonym: "Early, Rudimentary", example: "Primitive automobiles first appeared in the 1800s." },
      { word: "Replenishment", ar: "تجديد/إعادة ملء", meaning: "Filling up again", synonym: "Refilling, Restoration", example: "Water reservoirs needed replenishment every 30 miles." },
      { word: "Shortcomings", ar: "عيوب/نقاط ضعف", meaning: "Faults or weaknesses", synonym: "Defects, Flaws", example: "Despite such shortcomings, steam cars offered quick transportation." },
      { word: "Backfired", ar: "انفجرت/عاكست", meaning: "Had opposite effect than intended", synonym: "Rebounded, Bounced back", example: "Hand-crank starters were known to break arms when engines backfired." },
      { word: "Phased out", ar: "تم التخلص التدريجي منها", meaning: "Gradually stopped using", synonym: "Discontinued, Eliminated", example: "Steam power was gradually phased out." },
      { word: "Rekindle", ar: "إعادة إشعال/إحياء", meaning: "Revive or make active again", synonym: "Revive, Renew", example: "The brothers made one last effort to rekindle the technology." },
      { word: "Comprised", ar: "تكونت من/شملت", meaning: "Made up of", synonym: "Consisted of, Contained", example: "It comprised parts taken from a wrecked car." },
      { word: "Hydrocarbons", ar: "هيدروكربونات", meaning: "Chemical compounds of hydrogen and carbon", synonym: "Organic compounds", example: "Gas engines emitted the aroma of burned hydrocarbons." },
      { word: "Swift", ar: "سريع", meaning: "Fast or rapid", synonym: "Quick, Rapid", example: "The Model B was amazingly swift." },
      { word: "Sluggish", ar: "بطيء/خامل", meaning: "Slow-moving", synonym: "Slow, Lethargic", example: "Buyers complained the vehicles were sluggish." },
      { word: "Erratic", ar: "غير منتظم/متقلب", meaning: "Unpredictable or irregular", synonym: "Inconsistent, Unsteady", example: "The cars were sluggish and erratic." },
      { word: "Glitches", ar: "أعطال/مشاكل", meaning: "Minor problems", synonym: "Bugs, Snags", example: "The design was plagued with serious glitches." },
      { word: "Negligible", ar: "ضئيل/غير مهم", meaning: "Very small or insignificant", synonym: "Minimal, Insignificant", example: "It achieved about fifteen miles per gallon with negligible emissions." },
      { word: "Adamant", ar: "متمسك/عنيد", meaning: "Refusing to change opinion", synonym: "Stubborn, Unyielding", example: "He remained adamant that steam was superior." },
      { word: "Tinkered", ar: "عبث/عدل", meaning: "Made small changes", synonym: "Adjusted, Fiddled", example: "Abner Doble tinkered endlessly with the design." }
    ],

    passageText: `When primitive automobiles first appeared in the 1800s, their engines were based on steam power. But these early cars inherited steam's weaknesses: boilers had to be lit by hand, required 20 minutes to build pressure, and water reservoirs only lasted 30 miles.

But the glory days were few. The internal combustion engine appeared, offering ability to drive moments after starting. In 1912, General Motors introduced the electric starter, and steam power was gradually phased out.

Even as the market declined, four brothers made one last effort. Between 1906-1909, while still in high school, Abner Doble and his brothers built their first steam car in their parents' basement. The Model B (1914) could accelerate 0-60 in 15 seconds—remarkable for the time.

In 1916, the Model C added key-based ignition. 5,390 deposits were received. But the Model C had serious glitches—cars sometimes went in reverse.

The Model E (1924) was the final attempt. It started in 40 seconds even after freezing overnight, reached 100+ mph, with negligible emissions. But at $18,000 (price of a mansion!), only 50 were ever made. The company folded in 1931.

Ironically, those surviving Model Es still run today, some with 500,000+ miles, and pass modern California emissions tests.`,

    questions: [
      {
        id: 14,
        type: "heading-matching",
        question: "Paragraph A heading?",
        answer: "iii - Good and bad aspects of steam technology are passed on",
        explanation: "📌 Paragraph A covers both strengths (quick transport) and weaknesses (boilers, water needs) of early steam cars."
      },
      {
        id: 15,
        type: "heading-matching",
        question: "Paragraph B heading?",
        answer: "viii - A better option than the steam car arises",
        explanation: "📌 Paragraph B introduces the internal combustion engine that replaced steam. 'Better option' = gasoline engine."
      },
      {
        id: 16,
        type: "heading-matching",
        question: "Paragraph C heading?",
        answer: "vi - Positive publicity at last for this quiet, clean, fast vehicle",
        explanation: "📌 Paragraph C describes Model B's success: 'remarkable acceleration', 'virtual silence', magazine attention."
      },
      {
        id: 17,
        type: "heading-matching",
        question: "Paragraph D heading?",
        answer: "v - Further improvements lead to commercial orders",
        explanation: "📌 Paragraph D: '5,390 deposits for Doble Detroits' = commercial orders from Model C improvements."
      },
      {
        id: 18,
        type: "heading-matching",
        question: "Paragraph E heading?",
        answer: "vii - A disappointing outcome for customers",
        explanation: "📌 Paragraph E: 'sluggish and erratic', 'going in reverse', 'serious glitches' = disappointed customers."
      },
      {
        id: 19,
        type: "heading-matching",
        question: "Paragraph F heading?",
        answer: "i - A period in cold conditions before the technology is assessed",
        explanation: "📌 Paragraph F: 'sitting overnight in freezing temperatures', 'frost morning air', 'road-tested'."
      },
      {
        id: 20,
        type: "heading-matching",
        question: "Paragraph G heading?",
        answer: "iv - A possible solution to the issues of today",
        explanation: "📌 Paragraph G mentions steam cars had 'negligible emissions' and 'pass California emissions laws today'—solution for modern pollution!"
      },
      {
        id: 21,
        type: "multiple-choice",
        question: "What point does the writer make about the steam car in Paragraph B?",
        answer: "A - Its success was short-lived",
        explanation: "🎯 Paragraph B: 'glory days were few' and 'steam power was gradually phased out' = short-lived success."
      },
      {
        id: 22,
        type: "multiple-choice",
        question: "When building their first steam car, the Doble brothers...",
        answer: "C - needed several attempts to achieve a competitive model",
        explanation: "🎯 Paragraph C mentions 'first steam car...did not run well' then 'second and third prototype' = several attempts."
      },
      {
        id: 23,
        type: "multiple-choice",
        question: "In order to produce the Model C, the Doble brothers...",
        answer: "B - raised financial capital",
        explanation: "🎯 Paragraph D: 'seek investment in his automobile design, which he used to open the General Engineering Company' = raised capital."
      },
      {
        id: 24,
        type: "summary",
        question: "A later version of the Model E raised its [24] ______",
        answer: "maximum speed",
        explanation: "📝 Paragraph F: 'maximum speed was pushed to over a hundred miles per hour'."
      },
      {
        id: 25,
        type: "summary",
        question: "Under [25] ______ cars were produced before the company went out of business.",
        answer: "fifty/50",
        explanation: "📝 Paragraph G: 'fewer than fifty of the amazing Model E steam cars had been produced'."
      },
      {
        id: 26,
        type: "summary",
        question: "They satisfy California's [26] ______ emissions laws.",
        answer: "strict",
        explanation: "📝 Paragraph G: 'pass the emissions laws in California today, and they are pretty strict'."
      }
    ],

    memoryNotes: {
      modelTimeline: {
        "Model B (1914)": "High school project → 0-60 in 15 seconds!",
        "Model C (1916)": "Key ignition added → 5,390 orders → BUT glitches",
        "Model E (1924)": "Final version → 40 sec startup in freezing → 100+ mph → Only 50 made"
      },
      keyNumbers: {
        "1906-1909": "Brothers in HIGH SCHOOL building cars!",
        "20 minutes": "Time to build steam pressure",
        "30 miles": "Water lasted this distance",
        "$18,000": "Price in 1924 ($300K today!)",
        "500,000+": "Miles some cars still drive today"
      }
    }
  },

  // ============ Topic 3: How to Make Wise Decisions (IELTS 16) ============
  passage3: {
    id: "wise-decisions",
    title: "How to Make Wise Decisions",
    source: "IELTS 16 - Reading Passage",
    difficulty: "Medium-Hard",
    wordCount: 950,
    timeAllowed: "20 minutes",
    
    topicExplanation: {
      en: `🧠 The Science of Wisdom: Can Anyone Become Wise?

**Challenging Ancient Beliefs:**
For centuries, we thought wisdom was rare—a gift for philosophers and elders. But modern research reveals a surprising truth: wisdom isn't a personality trait you either have or don't. It's a SKILL that depends on CONTEXT.

**The Research Breakthrough:**
Professor Igor Grossmann from Canada discovered that wisdom varies dramatically based on situations. Your ability to reason wisely changes depending on:
• Your experiences
• The culture you're in  
• The specific situation you face

**The Four Keys to Wise Reasoning:**
1. **Intellectual Humility** - Knowing you don't know everything
2. **Perspective-Taking** - Seeing beyond your own viewpoint
3. **Change Recognition** - Understanding relationships evolve
4. **Compromise** - Integrating different beliefs

**The Secret Technique: The "Fly on the Wall" Method**
Want to make wiser decisions? Pretend you're an outsider watching your own situation! Research proves this works:
• Students imagining careers as "distant observers" made wiser choices
• Couples viewing conflicts through "other's eyes" found better compromises

**The Mind-Blowing Finding:**
Wisdom has almost NO connection to IQ or personality! A person can be wise in one situation and foolish in another. The situation matters more than the person.

**Real-World Application:**
Next time you face a difficult decision—arguing with your partner, negotiating at work—step back. Ask yourself: "What would I advise a friend in this situation?" This simple shift unlocks your hidden wisdom.`,

      ar: `🧠 علم الحكمة: هل يمكن لأي شخص أن يصبح حكيماً؟

**تحدي المعتقدات القديمة:**
لقرون، ظننا أن الحكمة نادرة—هبة للفلاسفة وكبار السن. لكن البحث الحديث يكشف حقيقة مذهلة: الحكمة ليست سمة شخصية تمتلكها أو لا. إنها مهارة تعتمد على السياق.

**الاختراق البحثي:**
اكتشف البروفيسور إيغور غروسمان من كندا أن الحكمة تختلف بشكل كبير بناءً على المواقف. قدرتك على التفكير بحكمة تتغير حسب:
• تجاربك
• الثقافة التي تعيش فيها
• الموقف المحدد الذي تواجهه

**المفاتيح الأربعة للتفكير الحكيم:**
1. **التواضع الفكري** - معرفة أنك لا تعرف كل شيء
2. **أخذ منظور الآخر** - رؤية ما وراء وجهة نظرك
3. **التعرف على التغيير** - فهم أن العلاقات تتطور
4. **التوصل لحل وسط** - دمج معتقدات مختلفة

**السر: طريقة "الذبابة على الحائط"**
تريد اتخاذ قرارات أكثر حكمة؟ تظاهر أنك خارجي يراقب موقفك! البحث يثبت أن هذا يعمل:
• الطلاب الذين تخيلوا مهنهم كـ "مراقبين بعيدين" اتخذوا خيارات أكثر حكمة
• الأزواج الذين نظروا للصراعات من "عيون الآخر" وجدوا حلول وسط أفضل

**الاكتشاف المذهل:**
الحكمة ليس لها علاقة تقريباً بمعدل الذكاء أو الشخصية! الشخص يمكن أن يكون حكيماً في موقف واحد وأحمق في آخر. الموقف يهم أكثر من الشخص.`
    },

    vocabulary: [
      { word: "Revered", ar: "محترم/مهاب", meaning: "Deeply respected", synonym: "Respected, Honored", example: "Wisdom has been considered one of the most revered human qualities." },
      { word: "Empirical", ar: "تجريبي/عملي", meaning: "Based on observation/experiment", synonym: "Observational, Practical", example: "Empirical research examining wisdom suggests..." },
      { word: "Cumulatively", ar: "تراكمياً", meaning: "Increasing gradually", synonym: "Collectively, Increasingly", example: "Recent findings cumulatively suggest..." },
      { word: "Unfolds", ar: "يتكشف/يتطور", meaning: "Reveals or develops gradually", synonym: "Develops, Emerges", example: "Wisdom unfolds as a function of situations." },
      { word: "Intellectual humility", ar: "التواضع الفكري", meaning: "Recognition of limits of one's knowledge", synonym: "Mental modesty", example: "One key is intellectual humility." },
      { word: "Compromise", ar: "حل وسط/تسوية", meaning: "Agreement where both sides give up something", synonym: "Settlement, Concession", example: "Compromise of different attitudes is key." },
      { word: "Ego-decentering", ar: "إزالة مركزية الذات", meaning: "Moving focus away from self", synonym: "Self-distancing", example: "Ego-decentering promotes greater focus on others." },
      { word: "Crystallized intelligence", ar: "الذكاء المتبلور", meaning: "Accumulated knowledge/experience", synonym: "Learned intelligence", example: "Only a small relationship with crystallized intelligence." },
      { word: "Retaliate", ar: "ينتقم/يرد", meaning: "To respond to an attack", synonym: "Avenge, Get even", example: "Likelihood to forgive or retaliate." }
    ],

    questions: [
      {
        id: 27,
        type: "multiple-choice",
        question: "What point does the writer make in the first paragraph?",
        answer: "B - A basic assumption about wisdom may be wrong",
        explanation: "🎯 Paragraph 1: 'Although the truly wise may seem few and far between...latest studies suggest most of us have the ability' = challenges old assumption."
      },
      {
        id: 28,
        type: "multiple-choice",
        question: "What does Igor Grossmann suggest about the ability to make wise decisions?",
        answer: "C - The importance of certain influences on it was underestimated",
        explanation: "🎯 Paragraph 2: 'experiential, situational, and cultural factors are even more powerful...than previously imagined' = influences were underestimated."
      },
      {
        id: 29,
        type: "multiple-choice",
        question: "According to the third paragraph, Grossmann claims that the level of wisdom an individual shows...",
        answer: "B - will be different in different circumstances",
        explanation: "🎯 Paragraph 3: 'wisdom is not solely an inner quality but rather unfolds as a function of situations' = varies by circumstances."
      },
      {
        id: 30,
        type: "multiple-choice",
        question: "What is described in the fifth paragraph?",
        answer: "D - a recommended strategy that can help people to reason wisely",
        explanation: "🎯 Paragraph 5 describes the 'third-party perspective' technique—looking at scenarios as though giving advice to a friend."
      },
      {
        id: 31,
        type: "summary",
        question: "It is important to have a certain degree of [31] ______ regarding the extent of our knowledge",
        answer: "intellectual humility",
        explanation: "📝 Paragraph 4: 'One is intellectual humility or recognition of the limits of our own knowledge'."
      },
      {
        id: 32,
        type: "summary",
        question: "...and to take into account [32] ______ which may not be the same as our own",
        answer: "perspectives/appreciation of perspectives",
        explanation: "📝 Paragraph 4: 'another is appreciation of perspectives wider than the issue at hand'."
      },
      {
        id: 33,
        type: "summary",
        question: "We should also be able to take a broad [33] ______ of any situation",
        answer: "view/conceptual view",
        explanation: "📝 Paragraph 6: 'enables a bigger picture, conceptual view of the experience'."
      },
      {
        id: 34,
        type: "summary",
        question: "Grossmann also believes that it is better to regard scenarios with [34] ______",
        answer: "detachment/distance",
        explanation: "📝 Paragraph 5: 'look at scenarios from a third-party perspective' = emotional distance/detachment."
      },
      {
        id: 35,
        type: "summary",
        question: "By avoiding the first-person perspective, we focus more on [35] ______ and on other moral ideals",
        answer: "interpersonal ideals/justice and impartiality",
        explanation: "📝 Paragraph 5: 'focus more on interpersonal and moral ideals such as justice and impartiality'."
      }
    ],

    memoryNotes: {
      keyConcepts: {
        "Wisdom ≠ Personality": "Wisdom changes by situation, not fixed trait",
        "Third-Party View": "Pretend advising a friend = wiser decisions",
        "Four Keys": "Humility + Perspectives + Change awareness + Compromise",
        "No IQ Link": "Wisdom barely related to intelligence!"
      }
    }
  }
};

export default ieltsReadingContent;
