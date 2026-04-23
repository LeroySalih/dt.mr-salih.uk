// Placeholder topics with sample study content. Swap in topics.json when ready.
// Each topic: { code, title, section, vocabCount, intro, objectives, sections, flashcards, mcqs, explainPrompt, explainModel }

// Sample rich study notes for topic 5.4 — used as the template for all cards.
const SAMPLE_NOTES = {
  intro: "Microcontrollers are tiny computers on a single chip. They take in signals from the world (like a button press or a temperature reading), decide what to do, and switch outputs (like a motor or an LED) on and off. In this topic you'll learn how they work, why designers love them, and how you choose the right one for a job.",
  objectives: [
    "Explain what a microcontroller is and why it's used in modern products.",
    "Describe the difference between analogue and digital signals.",
    "Identify common inputs (sensors, switches) and outputs (LEDs, motors, buzzers).",
    "Understand how programs are written, compiled and flashed onto a chip.",
  ],
  sections: [
    {
      id: "what",
      title: "What is a microcontroller?",
      body: [
        { type: "p", text: "A microcontroller is a small chip that contains a processor, memory and input/output pins in one package. You'll find them inside almost every modern product — kettles, washing machines, fitness trackers, even toasters." },
        { type: "p", text: "Compared with a full computer, a microcontroller is cheap, uses very little power, and is designed to do one job reliably. You write a program on a laptop, then send it down a USB cable onto the chip. Once flashed, the chip runs that program every time it's powered on." },
        { type: "keyword", term: "Microcontroller", def: "A small programmable chip containing a CPU, memory and I/O pins, used to control a product." },
        { type: "tip", label: "Exam tip", text: "Examiners love the word embedded. A microcontroller inside a kettle is an embedded system — it's built in and hidden from the user." },
        { type: "mcq",
          q: "Which of these is the best example of an embedded system?",
          opts: [
            "A desktop PC running Windows",
            "A washing machine's control board",
            "A USB memory stick",
            "A set of external speakers",
          ],
          answer: 1,
          why: "The washing machine's board is a microcontroller built in and hidden inside the product — the definition of an embedded system." },
      ],
    },
    {
      id: "signals",
      title: "Digital vs analogue signals",
      body: [
        { type: "p", text: "Microcontrollers work with two kinds of signal. Digital signals are ON or OFF only — like a light switch. Analogue signals can be any value in a range — like a volume knob." },
        { type: "diagram", kind: "signals" },
        { type: "p", text: "Most input pins on a microcontroller are digital, but some are analogue — they can read a varying voltage from a sensor (for example, a light-dependent resistor) and convert it to a number between 0 and 1023." },
        { type: "keyword", term: "ADC", def: "Analogue-to-Digital Converter: the circuit inside a microcontroller that turns a varying voltage into a number the program can use." },
        { type: "explain",
          prompt: "In your own words, explain the difference between an analogue and a digital signal. Use an everyday example.",
          hint: "Think: a switch vs a dimmer. ON/OFF vs any-value-in-a-range." },
      ],
    },
    {
      id: "io",
      title: "Inputs and outputs",
      body: [
        { type: "p", text: "The point of a microcontroller is to connect inputs to outputs through a program. Common inputs include push switches, LDRs, thermistors and potentiometers. Common outputs include LEDs, buzzers, motors and servos." },
        { type: "diagram", kind: "inputoutput" },
        { type: "tip", label: "Think about it", tone: "coral", text: "A PIR (passive infrared) sensor detects movement. What product could you design around one? How would the microcontroller decide what to do?" },
        { type: "mcq",
          q: "A thermistor is used in a product to measure room temperature. Which pin on the microcontroller should it connect to?",
          opts: [
            "A digital input pin",
            "A digital output pin",
            "An analogue input pin",
            "A power pin",
          ],
          answer: 2,
          why: "A thermistor's resistance changes smoothly with temperature — this is an analogue signal, so it needs an analogue input pin with an ADC." },
      ],
    },
    {
      id: "program",
      title: "Writing and flashing a program",
      body: [
        { type: "p", text: "Programs are written in a language like Arduino C or MicroPython. The steps are always: write the code, compile it (turn it into machine instructions), and flash it (copy it to the chip's memory)." },
        { type: "p", text: "Once flashed, the program runs in a loop. A typical program might read a sensor, compare the value to a threshold, then turn an output on or off. Most microcontrollers can run thousands of loops every second." },
        { type: "keyword", term: "Flashing", def: "Copying a compiled program onto the memory of a microcontroller so it runs when powered." },
        { type: "tip", label: "Exam tip", text: "If asked to explain why a designer might choose a microcontroller over hard-wired electronics, mention: flexibility (reprogrammable), fewer components, smaller PCBs, and easier prototyping." },
      ],
    },
    {
      id: "choosing",
      title: "Choosing the right chip",
      body: [
        { type: "p", text: "Not all microcontrollers are equal. Designers pick based on: number of I/O pins, processing speed, memory size, power consumption, and cost per unit. A smart watch needs a low-power chip; a 3D printer needs a fast one with lots of pins." },
        { type: "p", text: "For GCSE projects you'll usually use a development board like an Arduino Uno, Micro:bit or Raspberry Pi Pico — these make it easy to prototype because they already have USB, power regulation and headers for wires." },
        { type: "explain",
          prompt: "A designer is making a low-power fitness tracker. List three things they should look for when choosing a microcontroller, and explain why each matters.",
          hint: "Think about: battery life, size, the sensors it needs to read." },
      ],
    },
  ],
};

const SAMPLE_STUDY = {
  flashcards: [
    { term: "Ergonomics", def: "The study of designing products to fit the user — how they see, reach, hold and interact with them comfortably and safely." },
    { term: "Anthropometrics", def: "Measurements of the human body (like hand width or sitting height) used to design products that fit different people." },
    { term: "Iterative design", def: "A design process where you build, test, get feedback, and improve — repeating the cycle to get to a better solution." },
    { term: "Prototype", def: "A working model of a product made to test ideas, function, or appearance before full manufacture." },
    { term: "Quality control", def: "Checks carried out during or after manufacture to make sure products meet the required standard." },
  ],
  mcqs: [
    { q: "Which of these best describes 'anthropometrics'?",
      opts: ["Designing with nice colours", "Measurements of the human body", "Testing a prototype", "Recycling materials"],
      answer: 1,
      why: "Anthropometrics = body measurements (hand size, reach, height). Designers use these to make products that fit people." },
    { q: "A designer builds a model and tests it, then changes it based on feedback. This is an example of…",
      opts: ["Mass production", "Iterative design", "Quality assurance", "Sustainability"],
      answer: 1,
      why: "Iterative design = build → test → improve → repeat." },
    { q: "Which is a key benefit of using a prototype?",
      opts: ["It is always cheaper than the final product", "It lets you test ideas before full production", "It means no testing is needed later", "It guarantees the product will sell"],
      answer: 1,
      why: "Prototypes catch problems early — before expensive manufacturing starts." },
  ],
  explainPrompt: "In your own words, explain why designers use iterative design. Give one example of how a student could use it in a school project.",
  explainModel: "Designers use iterative design because first ideas rarely work perfectly. By testing a prototype, getting feedback and making changes, the product improves each time. For example, a student designing a phone holder could make a cardboard version, check if the phone sits at the right angle, then rebuild it with adjustments.",
};

window.TOPICS = [
  // Core (1.1 – 1.17)
  { code: "1.1",  title: "Impact on individuals, society and the environment",       section: "core", vocabCount: 14 },
  { code: "1.2",  title: "Responsibilities of designers and manufacturers",           section: "core", vocabCount: 10 },
  { code: "1.3",  title: "Factors influencing the development of products",           section: "core", vocabCount: 12 },
  { code: "1.4",  title: "Investigation, primary and secondary data",                 section: "core", vocabCount: 11 },
  { code: "1.5",  title: "Design strategies and iterative design",                    section: "core", vocabCount: 9  },
  { code: "1.6",  title: "Communicating design ideas",                                section: "core", vocabCount: 13 },
  { code: "1.7",  title: "Prototype development and testing",                         section: "core", vocabCount: 10 },
  { code: "1.8",  title: "Selection of materials and components",                     section: "core", vocabCount: 12 },
  { code: "1.9",  title: "Tolerances, quality control and quality assurance",         section: "core", vocabCount: 9  },
  { code: "1.10", title: "Material management and waste reduction",                   section: "core", vocabCount: 8  },
  { code: "1.11", title: "Specialist techniques and processes",                       section: "core", vocabCount: 14 },
  { code: "1.12", title: "Surface treatments and finishes",                           section: "core", vocabCount: 10 },
  { code: "1.13", title: "Scales of production",                                      section: "core", vocabCount: 7  },
  { code: "1.14", title: "Sources, origins and properties of materials",              section: "core", vocabCount: 15 },
  { code: "1.15", title: "Functionality, aesthetics, ergonomics and anthropometrics", section: "core", vocabCount: 12 },
  { code: "1.16", title: "Mechanical devices and motion",                             section: "core", vocabCount: 11 },
  { code: "1.17", title: "Modern and smart materials",                                section: "core", vocabCount: 10 },
  // Systems (5.1 – 5.8)
  { code: "5.1",  title: "Sources, origins and classification of systems components", section: "systems", vocabCount: 13 },
  { code: "5.2",  title: "Working properties and functional characteristics",         section: "systems", vocabCount: 12 },
  { code: "5.3",  title: "Inputs, processes and outputs",                             section: "systems", vocabCount: 14 },
  { code: "5.4",  title: "Programmable components and microcontrollers",              section: "systems", vocabCount: 15 },
  { code: "5.5",  title: "Sensors, switches and signal conditioning",                 section: "systems", vocabCount: 13 },
  { code: "5.6",  title: "Electronic circuit construction",                           section: "systems", vocabCount: 11 },
  { code: "5.7",  title: "PCB design, manufacture and assembly",                      section: "systems", vocabCount: 12 },
  { code: "5.8",  title: "Soldering, conformal coating and finishing systems",        section: "systems", vocabCount: 10 },
].map(t => ({ ...t, ...SAMPLE_STUDY, ...SAMPLE_NOTES }));
