// ======================================================
// CALCAI v3 - CORE ENGINE (RESET BUILD)
// PART 1: STATE + ELEMENT BINDING + SUBJECT SYSTEM
// ======================================================


// ------------------------------
// GLOBAL STATE
// ------------------------------

const state = {
    subject: "Mathematics",
    isLoading: false,
    lastResult: null
};


// ------------------------------
// DOM ELEMENTS (MATCHING YOUR HTML)
// ------------------------------

const questionEl = document.getElementById("question");

const solveBtn = document.getElementById("solveBtn");
const clearBtn = document.getElementById("clearBtn");

const mathBtn = document.getElementById("mathBtn");
const physicsBtn = document.getElementById("physicsBtn");
const chemistryBtn = document.getElementById("chemistryBtn");

const emptyState = document.getElementById("emptyState");
const resultContent = document.getElementById("resultContent");


// OUTPUT ELEMENTS
const finalAnswerEl = document.getElementById("finalAnswer");

const subjectOut = document.getElementById("subjectOut");
const topicOut = document.getElementById("topicOut");
const difficultyOut = document.getElementById("difficultyOut");
const confidenceOut = document.getElementById("confidenceOut");

const formulaOut = document.getElementById("formulaOut");
const stepsList = document.getElementById("stepsList");
const explanationOut = document.getElementById("explanationOut");

const examTip = document.getElementById("examTip");
const commonMistake = document.getElementById("commonMistake");
const practiceQuestion = document.getElementById("practiceQuestion");

const relatedConcepts = document.getElementById("relatedConcepts");


// ------------------------------
// SUBJECT SWITCHING SYSTEM
// ------------------------------

mathBtn.addEventListener("click", () => setSubject("Mathematics"));
physicsBtn.addEventListener("click", () => setSubject("Physics"));
chemistryBtn.addEventListener("click", () => setSubject("Chemistry"));

function setSubject(subject) {

    state.subject = subject;

    // reset active states
    [mathBtn, physicsBtn, chemistryBtn].forEach(btn =>
        btn.classList.remove("active")
    );

    // set active
    if (subject === "Mathematics") mathBtn.classList.add("active");
    if (subject === "Physics") physicsBtn.classList.add("active");
    if (subject === "Chemistry") chemistryBtn.classList.add("active");

    console.log("Subject changed to:", subject);
}


// ------------------------------
// BASIC UTILITIES
// ------------------------------

function getQuestionText() {
    return questionEl.value.trim();
}


function showLoading() {
    state.isLoading = true;
    solveBtn.textContent = "Analyzing...";
    solveBtn.disabled = true;
}


function hideLoading() {
    state.isLoading = false;
    solveBtn.textContent = "✨ Analyze with AI";
    solveBtn.disabled = false;
}

// ======================================================
// CALCAI v3 - PART 2
// FAKE AI ENGINE + SOLVER SYSTEM
// ======================================================


// ------------------------------
// MAIN SOLVE ENTRY POINT
// ------------------------------

solveBtn.addEventListener("click", handleSolve);

function handleSolve() {

    const question = getQuestionText();

    if (!question) {
        alert("Please enter a question first.");
        return;
    }

    showLoading();

    setTimeout(() => {

        const result = generateSolution(question, state.subject);

        renderResult(result);

        hideLoading();

    }, 800); // simulate AI delay
}


// ------------------------------
// CORE AI ROUTER
// ------------------------------

function generateSolution(question, subject) {

    const lowerQ = question.toLowerCase();

    if (subject === "Mathematics") {
        return solveMath(lowerQ, question);
    }

    if (subject === "Physics") {
        return solvePhysics(lowerQ, question);
    }

    if (subject === "Chemistry") {
        return solveChemistry(lowerQ, question);
    }

    return fallbackSolution(question);
}


// ------------------------------
// MATH ENGINE
// ------------------------------

function solveMath(q, original) {

    if (q.includes("x") && q.includes("=")) {

        return {
            subject: "Mathematics",
            topic: "Algebra",
            difficulty: "Medium",
            confidence: "92%",
            formula: "Quadratic / Linear Equation Rules",
            answer: "Solution for equation",
            steps: [
                "Identify equation structure",
                "Move all terms to one side",
                "Factor or apply formula",
                "Solve for x"
            ],
            explanation: "We isolate the variable and solve step-by-step.",
            examTip: "Always simplify before solving.",
            commonMistake: "Sign errors when shifting terms.",
            practiceQuestion: "Solve a similar quadratic equation."
        };
    }

    if (q.includes("speed") || q.includes("velocity")) {

        return {
            subject: "Mathematics",
            topic: "Speed & Distance",
            difficulty: "Easy",
            confidence: "96%",
            formula: "Speed = Distance / Time",
            answer: "Apply S = D/T",
            steps: [
                "Identify distance",
                "Identify time",
                "Apply formula S = D/T",
                "Convert units if needed"
            ],
            explanation: "Speed is distance divided by time.",
            examTip: "Always convert km/h to m/s if required.",
            commonMistake: "Not converting units.",
            practiceQuestion: "Find speed for 10km in 2 hours."
        };
    }

    return fallbackSolution(original);
}


// ------------------------------
// PHYSICS ENGINE
// ------------------------------

function solvePhysics(q, original) {

    if (q.includes("force") || q.includes("f = m")) {

        return {
            subject: "Physics",
            topic: "Newton's Laws",
            difficulty: "Easy",
            confidence: "97%",
            formula: "F = m × a",
            answer: "Force = mass × acceleration",
            steps: [
                "Identify mass",
                "Identify acceleration",
                "Multiply both values",
                "Get force in Newtons"
            ],
            explanation: "Newton's second law defines force.",
            examTip: "Always use SI units.",
            commonMistake: "Using grams instead of kg.",
            practiceQuestion: "Find force for 5kg at 2m/s²."
        };
    }

    return fallbackSolution(original);
}


// ------------------------------
// CHEMISTRY ENGINE
// ------------------------------

function solveChemistry(q, original) {

    if (q.includes("mole") || q.includes("mol")) {

        return {
            subject: "Chemistry",
            topic: "Mole Concept",
            difficulty: "Medium",
            confidence: "90%",
            formula: "n = mass / molar mass",
            answer: "Use mole formula",
            steps: [
                "Identify mass",
                "Find molar mass",
                "Divide mass by molar mass",
                "Get moles"
            ],
            explanation: "Moles relate mass and molecular weight.",
            examTip: "Memorize common molar masses.",
            commonMistake: "Wrong molecular weight.",
            practiceQuestion: "Calculate moles in 18g water."
        };
    }

    return fallbackSolution(original);
}


// ------------------------------
// FALLBACK
// ------------------------------

function fallbackSolution(question) {

    return {
        subject: state.subject,
        topic: "General Problem",
        difficulty: "Unknown",
        confidence: "70%",
        formula: "Check relevant formula sheet",
        answer: "Cannot fully classify problem",
        steps: [
            "Read question carefully",
            "Identify known values",
            "Find relevant formula",
            "Solve step-by-step"
        ],
        explanation: "This problem needs deeper parsing.",
        examTip: "Break problem into smaller parts.",
        commonMistake: "Skipping unit analysis.",
        practiceQuestion: "Try a similar structured problem."
    };
}

// ======================================================
// CALCAI v3 - PART 3
// RENDER ENGINE + UI SYSTEM
// ======================================================


// ------------------------------
// RENDER RESULT TO UI
// ------------------------------

function renderResult(result) {

    state.lastResult = result;

    // show result / hide empty state
    emptyState.style.display = "none";
    resultContent.hidden = false;

    // fill top analysis
    subjectOut.textContent = result.subject;
    topicOut.textContent = result.topic;
    difficultyOut.textContent = result.difficulty;
    confidenceOut.textContent = result.confidence;

    // formula
    formulaOut.textContent = result.formula;

    // answer
    finalAnswerEl.textContent = result.answer;

    // explanation
    explanationOut.textContent = result.explanation;

    // exam tips / mistakes / practice
    examTip.textContent = result.examTip;
    commonMistake.textContent = result.commonMistake;
    practiceQuestion.textContent = result.practiceQuestion;

    // render steps
    renderSteps(result.steps);

    // related concepts (simple fallback generation)
    renderRelatedConcepts(result.subject, result.topic);
}


// ------------------------------
// STEPS RENDERER
// ------------------------------

function renderSteps(steps) {

    stepsList.innerHTML = "";

    steps.forEach(step => {

        const li = document.createElement("li");
        li.textContent = step;
        stepsList.appendChild(li);

    });
}


// ------------------------------
// RELATED CONCEPTS
// ------------------------------

function renderRelatedConcepts(subject, topic) {

    const concepts = generateConcepts(subject, topic);

    relatedConcepts.innerHTML = "";

    concepts.forEach(c => {

        const li = document.createElement("li");
        li.textContent = c;
        relatedConcepts.appendChild(li);

    });
}


// ------------------------------
// SIMPLE KNOWLEDGE GRAPH
// ------------------------------

function generateConcepts(subject, topic) {

    if (subject === "Mathematics") {
        return [
            "Linear Equations",
            "Quadratic Equations",
            "Algebraic Expressions",
            "Functions"
        ];
    }

    if (subject === "Physics") {
        return [
            "Newton's Laws",
            "Motion",
            "Force",
            "Energy"
        ];
    }

    if (subject === "Chemistry") {
        return [
            "Mole Concept",
            "Atomic Mass",
            "Chemical Reactions",
            "Stoichiometry"
        ];
    }

    return ["General Problem Solving"];
}


// ------------------------------
// CLEAR FUNCTION
// ------------------------------

clearBtn.addEventListener("click", () => {

    questionEl.value = "";

    resultContent.hidden = true;
    emptyState.style.display = "block";

    stepsList.innerHTML = "";
    relatedConcepts.innerHTML = "";

    finalAnswerEl.textContent = "";
    formulaOut.textContent = "";
    explanationOut.textContent = "";
});