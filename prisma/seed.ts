import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuestionSeed {
    difficulty: number;
    prompt: string;
    choices: string[];
    correctIndex: number;
    category: string;
}

const questions: QuestionSeed[] = [
    // ===== DIFFICULTY 1 (Easy) =====
    { difficulty: 1, prompt: 'What color is the sky on a clear day?', choices: ['Green', 'Blue', 'Red', 'Yellow'], correctIndex: 1, category: 'general' },
    { difficulty: 1, prompt: 'How many legs does a dog have?', choices: ['2', '4', '6', '8'], correctIndex: 1, category: 'general' },
    { difficulty: 1, prompt: 'What is 2 + 2?', choices: ['3', '4', '5', '6'], correctIndex: 1, category: 'math' },
    { difficulty: 1, prompt: 'Which animal says "meow"?', choices: ['Dog', 'Cow', 'Cat', 'Duck'], correctIndex: 2, category: 'general' },
    { difficulty: 1, prompt: 'What do you use to write on paper?', choices: ['Fork', 'Pen', 'Spoon', 'Knife'], correctIndex: 1, category: 'general' },
    { difficulty: 1, prompt: 'What shape is a ball?', choices: ['Square', 'Triangle', 'Circle', 'Rectangle'], correctIndex: 2, category: 'general' },
    { difficulty: 1, prompt: 'How many days are in a week?', choices: ['5', '6', '7', '8'], correctIndex: 2, category: 'general' },
    { difficulty: 1, prompt: 'What is the first letter of the alphabet?', choices: ['B', 'A', 'C', 'D'], correctIndex: 1, category: 'general' },
    { difficulty: 1, prompt: 'Which fruit is yellow and curved?', choices: ['Apple', 'Banana', 'Orange', 'Grape'], correctIndex: 1, category: 'general' },
    { difficulty: 1, prompt: 'What do fish live in?', choices: ['Trees', 'Sand', 'Water', 'Clouds'], correctIndex: 2, category: 'science' },

    // ===== DIFFICULTY 2 =====
    { difficulty: 2, prompt: 'What is the capital of France?', choices: ['London', 'Berlin', 'Paris', 'Madrid'], correctIndex: 2, category: 'geography' },
    { difficulty: 2, prompt: 'How many continents are there?', choices: ['5', '6', '7', '8'], correctIndex: 2, category: 'geography' },
    { difficulty: 2, prompt: 'What is 7 × 8?', choices: ['54', '56', '58', '64'], correctIndex: 1, category: 'math' },
    { difficulty: 2, prompt: 'Which planet is known as the Red Planet?', choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1, category: 'science' },
    { difficulty: 2, prompt: 'What is the largest ocean on Earth?', choices: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3, category: 'geography' },

    // ===== DIFFICULTY 3 =====
    { difficulty: 3, prompt: 'What is the chemical symbol for gold?', choices: ['Ag', 'Au', 'Fe', 'Cu'], correctIndex: 1, category: 'science' },
    { difficulty: 3, prompt: 'Which country has the most people?', choices: ['USA', 'India', 'China', 'Russia'], correctIndex: 1, category: 'geography' },
    { difficulty: 3, prompt: 'What is the square root of 144?', choices: ['10', '11', '12', '14'], correctIndex: 2, category: 'math' },
    { difficulty: 3, prompt: 'Who painted the Mona Lisa?', choices: ['Van Gogh', 'Picasso', 'Michelangelo', 'Leonardo da Vinci'], correctIndex: 3, category: 'history' },
    { difficulty: 3, prompt: 'What is the speed of light approximately?', choices: ['300 km/s', '3,000 km/s', '30,000 km/s', '300,000 km/s'], correctIndex: 3, category: 'science' },

    // ===== DIFFICULTY 4 =====
    { difficulty: 4, prompt: 'What is the powerhouse of the cell?', choices: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Body'], correctIndex: 2, category: 'science' },
    { difficulty: 4, prompt: 'Who developed the theory of relativity?', choices: ['Newton', 'Einstein', 'Bohr', 'Hawking'], correctIndex: 1, category: 'science' },
    { difficulty: 4, prompt: 'What is the value of Pi to 2 decimal places?', choices: ['3.12', '3.14', '3.16', '3.18'], correctIndex: 1, category: 'math' },
    { difficulty: 4, prompt: 'Which element has atomic number 1?', choices: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correctIndex: 1, category: 'science' },
    { difficulty: 4, prompt: 'What is the longest river in the world?', choices: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correctIndex: 1, category: 'geography' },

    // ===== DIFFICULTY 5 =====
    { difficulty: 5, prompt: 'What is the time complexity of binary search?', choices: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1, category: 'tech' },
    { difficulty: 5, prompt: 'Who is considered the father of computer science?', choices: ['Ada Lovelace', 'Alan Turing', 'John von Neumann', 'Charles Babbage'], correctIndex: 1, category: 'tech' },
    { difficulty: 5, prompt: 'What causes tides on Earth?', choices: ['Wind', 'Earth rotation', 'Moon gravity', 'Sun heat'], correctIndex: 2, category: 'science' },
    { difficulty: 5, prompt: 'What is the smallest prime number greater than 50?', choices: ['51', '53', '57', '59'], correctIndex: 1, category: 'math' },
    { difficulty: 5, prompt: 'Which sorting algorithm has the best average-case performance?', choices: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'], correctIndex: 1, category: 'tech' },

    // ===== DIFFICULTY 6 =====
    { difficulty: 6, prompt: 'What is the derivative of x² with respect to x?', choices: ['x', '2x', '2x²', 'x²/2'], correctIndex: 1, category: 'math' },
    { difficulty: 6, prompt: 'Which data structure uses LIFO?', choices: ['Queue', 'Stack', 'Array', 'Linked List'], correctIndex: 1, category: 'tech' },
    { difficulty: 6, prompt: 'What is the CAP theorem in distributed systems?', choices: ['Cache, API, Protocol', 'Consistency, Availability, Partition Tolerance', 'Compute, Analyze, Process', 'Create, Access, Persist'], correctIndex: 1, category: 'tech' },
    { difficulty: 6, prompt: 'Which planet has the most moons?', choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctIndex: 1, category: 'science' },
    { difficulty: 6, prompt: 'What does ACID stand for in databases?', choices: ['Atomic, Consistent, Isolated, Durable', 'Atomicity, Consistency, Isolation, Durability', 'Add, Create, Index, Delete', 'Access, Control, Insert, Drop'], correctIndex: 1, category: 'tech' },

    // ===== DIFFICULTY 7 =====
    { difficulty: 7, prompt: 'What is the time complexity of Dijkstra\'s algorithm with a min-heap?', choices: ['O(V²)', 'O(V + E)', 'O((V + E) log V)', 'O(V log V)'], correctIndex: 2, category: 'tech' },
    { difficulty: 7, prompt: 'What is the Schrödinger equation primarily used for?', choices: ['Electromagnetic fields', 'Quantum wave function', 'Thermodynamics', 'Fluid dynamics'], correctIndex: 1, category: 'science' },
    { difficulty: 7, prompt: 'Which consensus algorithm does Bitcoin use?', choices: ['Proof of Stake', 'Proof of Work', 'PBFT', 'Raft'], correctIndex: 1, category: 'tech' },
    { difficulty: 7, prompt: 'What is the halting problem?', choices: ['Stopping infinite loops', 'Undecidable problem about program termination', 'CPU throttling issue', 'Memory leak detection'], correctIndex: 1, category: 'tech' },
    { difficulty: 7, prompt: 'What is CRISPR primarily used for?', choices: ['Data encryption', 'Gene editing', 'Quantum computing', 'Neural networks'], correctIndex: 1, category: 'science' },

    // ===== DIFFICULTY 8 =====
    { difficulty: 8, prompt: 'What is the space complexity of merge sort?', choices: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctIndex: 2, category: 'tech' },
    { difficulty: 8, prompt: 'What is eventual consistency in distributed systems?', choices: ['All reads return latest write', 'System converges to consistent state over time', 'Transactions are serializable', 'Writes are linearizable'], correctIndex: 1, category: 'tech' },
    { difficulty: 8, prompt: 'What is the Church-Turing thesis?', choices: ['All algorithms are polynomial', 'Turing machines capture computability', 'P equals NP', 'Halting problem is decidable'], correctIndex: 1, category: 'tech' },
    { difficulty: 8, prompt: 'What is a Galois field?', choices: ['Infinite vector space', 'Finite field', 'Topological space', 'Metric space'], correctIndex: 1, category: 'math' },
    { difficulty: 8, prompt: 'What is the Paxos algorithm used for?', choices: ['Sorting', 'Encryption', 'Distributed consensus', 'Load balancing'], correctIndex: 2, category: 'tech' },

    // ===== DIFFICULTY 9 =====
    { difficulty: 9, prompt: 'What is the Curry-Howard isomorphism?', choices: ['Types as propositions, programs as proofs', 'Functions as objects, objects as functions', 'Data as code, code as data', 'Inputs as outputs, outputs as inputs'], correctIndex: 0, category: 'tech' },
    { difficulty: 9, prompt: 'What is the Kolmogorov complexity of a string?', choices: ['Its length', 'Shortest program that produces it', 'Number of unique characters', 'Compression ratio'], correctIndex: 1, category: 'tech' },
    { difficulty: 9, prompt: 'What is a topological quantum computer based on?', choices: ['Qubits', 'Anyons', 'Photons', 'Electrons'], correctIndex: 1, category: 'science' },
    { difficulty: 9, prompt: 'What is the Cook-Levin theorem?', choices: ['SAT is NP-complete', 'P ≠ NP', 'BPP ⊆ P', 'Every NP problem is decidable'], correctIndex: 0, category: 'tech' },
    { difficulty: 9, prompt: 'What is the AdS/CFT correspondence?', choices: ['Anti-de Sitter space maps to conformal field theory', 'Quantum gravity equals string theory', 'Dark energy relates to dark matter', 'Entropy equals information'], correctIndex: 0, category: 'science' },

    // ===== DIFFICULTY 10 (Hardest) =====
    { difficulty: 10, prompt: 'What is the Navier-Stokes existence and smoothness problem?', choices: ['Proving solutions always exist and are smooth', 'Solving turbulent flow equations', 'Computing fluid viscosity', 'Modeling ocean currents'], correctIndex: 0, category: 'math' },
    { difficulty: 10, prompt: 'What is the computational complexity of matrix multiplication (best known)?', choices: ['O(n³)', 'O(n^2.373)', 'O(n² log n)', 'O(n²)'], correctIndex: 1, category: 'tech' },
    { difficulty: 10, prompt: 'What is the Hodge conjecture about?', choices: ['Algebraic cycles on algebraic varieties', 'Topology of manifolds', 'Number theory primes', 'Graph coloring'], correctIndex: 0, category: 'math' },
    { difficulty: 10, prompt: 'What is the ER=EPR conjecture?', choices: ['Wormholes equal entanglement', 'Energy equals mass', 'Entropy equals radiation', 'Expansion equals recession'], correctIndex: 0, category: 'science' },
    { difficulty: 10, prompt: 'What is homotopy type theory?', choices: ['Foundation of math combining type theory and homotopy', 'Algorithm for path finding', 'Graph theory extension', 'Database normalization theory'], correctIndex: 0, category: 'math' },
];

// ── App Config defaults ────────────────────────────────────────
const configDefaults = [
    // UI Config
    { key: 'app_title', value: 'BrainBolt', category: 'ui', label: 'Application Title' },
    { key: 'app_subtitle', value: 'Adaptive Infinite Quiz Platform', category: 'ui', label: 'Application Subtitle' },
    { key: 'app_logo_emoji', value: '⚡', category: 'ui', label: 'Logo Emoji' },
    {
        key: 'difficulty_labels',
        value: {
            '1': 'Beginner', '2': 'Beginner',
            '3': 'Easy', '4': 'Easy',
            '5': 'Medium', '6': 'Medium',
            '7': 'Hard', '8': 'Hard',
            '9': 'Expert', '10': 'Expert',
        },
        category: 'ui',
        label: 'Difficulty Level Labels',
    },
    {
        key: 'categories',
        value: ['general', 'science', 'technology', 'mathematics', 'history', 'geography', 'literature', 'pop_culture'],
        category: 'ui',
        label: 'Question Categories',
    },

    // Leaderboard Config
    { key: 'leaderboard_size', value: 20, category: 'leaderboard', label: 'Leaderboard Size' },
    { key: 'leaderboard_refresh_interval', value: 10000, category: 'leaderboard', label: 'Leaderboard Refresh Interval (ms)' },

    // Scoring Config
    { key: 'scoring_base_multiplier', value: 10, category: 'scoring', label: 'Base Score Multiplier per Difficulty' },
    { key: 'scoring_streak_increment', value: 0.1, category: 'scoring', label: 'Streak Multiplier Increment' },
    { key: 'scoring_max_streak_multiplier', value: 3.0, category: 'scoring', label: 'Max Streak Multiplier Cap' },

    // Adaptive Algorithm Config
    { key: 'momentum_increase', value: 0.15, category: 'adaptive', label: 'Momentum Increase per Correct Answer' },
    { key: 'momentum_decrease', value: 0.30, category: 'adaptive', label: 'Momentum Decrease per Wrong Answer' },
    { key: 'momentum_threshold', value: 0.60, category: 'adaptive', label: 'Momentum Threshold to Increase Difficulty' },
    { key: 'min_streak_to_increase', value: 2, category: 'adaptive', label: 'Min Streak to Increase Difficulty' },
    { key: 'inactivity_timeout_min', value: 30, category: 'adaptive', label: 'Inactivity Timeout (minutes)' },
    { key: 'rolling_window_size', value: 10, category: 'adaptive', label: 'Rolling Window Size' },
    { key: 'rolling_window_accuracy_threshold', value: 0.6, category: 'adaptive', label: 'Rolling Window Accuracy Threshold' },

    // Feature Flags
    { key: 'enable_gemini', value: true, category: 'features', label: 'Enable Gemini AI Question Generation' },
    { key: 'enable_leaderboard', value: true, category: 'features', label: 'Enable Leaderboard' },
    { key: 'enable_metrics', value: true, category: 'features', label: 'Enable Metrics Dashboard' },
    { key: 'enable_dark_mode', value: true, category: 'features', label: 'Enable Dark Mode Toggle' },
];

async function main() {
    console.log('🧠 Seeding BrainBolt database...');

    // Clear existing data
    await prisma.answerLog.deleteMany();
    await prisma.leaderboardScore.deleteMany();
    await prisma.leaderboardStreak.deleteMany();
    await prisma.userState.deleteMany();
    await prisma.user.deleteMany();
    await prisma.question.deleteMany();
    await prisma.appConfig.deleteMany();

    // Seed fallback questions
    for (const q of questions) {
        await prisma.question.create({
            data: {
                difficulty: q.difficulty,
                prompt: q.prompt,
                choices: q.choices,
                correctIndex: q.correctIndex,
                category: q.category,
            },
        });
    }

    console.log(`✅ Seeded ${questions.length} fallback questions across difficulties 1-10`);

    // Seed app config
    for (const cfg of configDefaults) {
        await prisma.appConfig.upsert({
            where: { key: cfg.key },
            update: { value: cfg.value, category: cfg.category, label: cfg.label },
            create: { key: cfg.key, value: cfg.value, category: cfg.category, label: cfg.label },
        });
    }

    console.log(`✅ Seeded ${configDefaults.length} config entries`);

    // Create demo users
    const demoUsers = ['alice', 'bob', 'charlie', 'diana', 'eve'];
    for (const username of demoUsers) {
        const user = await prisma.user.create({
            data: {
                username,
                state: {
                    create: {
                        currentDifficulty: 1,
                        streak: 0,
                        maxStreak: 0,
                        totalScore: 0,
                        totalAnswered: 0,
                        totalCorrect: 0,
                        momentum: 0,
                        recentAnswers: [],
                    },
                },
                leaderScore: {
                    create: { totalScore: 0, username },
                },
                leaderStreak: {
                    create: { maxStreak: 0, username },
                },
            },
        });
        console.log(`  👤 Created user: ${username} (${user.id})`);
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
