import { RepoConfig, StudyDocument } from '../types/study';

export const STARTER_REPO_ID = 'starter-grade-12';

export const STARTER_REPO_CONFIG: RepoConfig = {
  id: STARTER_REPO_ID,
  label: 'Grade 12 Starter Curriculum',
  owner: 'local',
  repo: 'grade-12-curriculum',
  branch: 'main',
  docsPath: '',
  isStarterPack: true,
  lastSyncedAt: Date.now(),
  syncIntervalMinutes: 60,
  totalFiles: 10,
  totalBytes: 24500,
};

interface RawStarterDoc {
  path: string;
  subject: string;
  title: string;
  orderIndex: number;
  contentText: string;
}

const RAW_STARTER_DOCS: RawStarterDoc[] = [
  {
    path: 'Physics/01-kinematics-and-projectile-motion.md',
    subject: 'Physics',
    title: '01 · Kinematics & Projectile Motion',
    orderIndex: 1,
    contentText: `# Kinematics & Projectile Motion

Two-dimensional projectile motion separates horizontal inertia from vertical gravitational acceleration. Understanding vector decomposition allows us to predict trajectory, time of flight, and maximum range accurately.

## 1. Core Kinematic Equations

Under constant acceleration $a$, displacement $\\Delta x$ and velocity $v$ evolve according to:

$$v_f = v_i + a t$$

$$\\Delta x = v_i t + \\frac{1}{2} a t^2$$

$$v_f^2 = v_i^2 + 2 a \\Delta x$$

> **Key Principle:** Horizontal velocity $v_x = v_0 \\cos(\\theta)$ remains constant throughout flight (neglecting air drag), while vertical acceleration stays fixed at $a_y = -g \\approx -9.81\\,\\text{m/s}^2$.

## 2. Trajectory Parameters

| Quantity | Formula | Condition |
| :--- | :--- | :--- |
| Time to Peak | $t_{\\text{peak}} = \\frac{v_0 \\sin(\\theta)}{g}$ | $v_y = 0$ at apex |
| Total Flight Time | $T = \\frac{2 v_0 \\sin(\\theta)}{g}$ | Symmetric launch & landing |
| Maximum Height | $H_{\\max} = \\frac{v_0^2 \\sin^2(\\theta)}{2g}$ | Vertical apex |
| Horizontal Range | $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$ | Maximized at $\\theta = 45^\\circ$ |

## 3. Worked Exam Example

A projectile is launched from level ground at $v_0 = 28.0\\,\\text{m/s}$ at an angle $\\theta = 35^\\circ$ above the horizontal.

1. Resolve initial components:
   - $v_{0x} = 28.0 \\cos(35^\\circ) = 22.94\\,\\text{m/s}$
   - $v_{0y} = 28.0 \\sin(35^\\circ) = 16.06\\,\\text{m/s}$
2. Calculate total time in the air:
   $$T = \\frac{2(16.06)}{9.81} = 3.27\\,\\text{s}$$
3. Calculate horizontal range:
   $$R = v_{0x} \\cdot T = 22.94 \\times 3.27 = 75.0\\,\\text{m}$$

## 4. Quick Self-Check

- Why do complementary launch angles such as $30^\\circ$ and $60^\\circ$ produce identical horizontal ranges on level ground?
- What is the direction of the net acceleration vector at the exact peak of a projectile's arc?
`,
  },
  {
    path: 'Physics/02-special-relativity-and-time-dilation.md',
    subject: 'Physics',
    title: '02 · Special Relativity & Time Dilation',
    orderIndex: 2,
    contentText: `# Special Relativity & Time Dilation

Einstein's 1905 theory of special relativity reconciles classical mechanics with Maxwell's electromagnetism using two foundational postulates.

## 1. The Two Postulates

1. **Principle of Relativity:** The laws of physics take the exact same mathematical form in every inertial reference frame.
2. **Constancy of Light Speed:** The speed of light in vacuum, $c = 2.998 \\times 10^8\\,\\text{m/s}$, is identical for all observers regardless of the motion of the source or detector.

## 2. The Lorentz Factor

Relativistic effects scale by the dimensionless Lorentz factor $\\gamma$:

$$\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}$$

When $v \\ll c$, $\\gamma \\approx 1$ and Newtonian mechanics holds to high precision. As $v \\to c$, $\\gamma \\to \\infty$.

## 3. Time Dilation & Length Contraction

- **Time Dilation:** A clock moving relative to an observer ticks slower by a factor of $\\gamma$:
  $$\\Delta t = \\gamma \\Delta t_0$$
  where $\\Delta t_0$ is the proper time measured in the clock's rest frame.

- **Length Contraction:** An object of proper length $L_0$ measured along its direction of motion appears shorter:
  $$L = \\frac{L_0}{\\gamma}$$

> **Exam Tip:** Always identify which observer measures **proper time** ($\\Delta t_0$, where both events occur at the same spatial location) and **proper length** ($L_0$, where the object is at rest).

## 4. Relativistic Momentum & Energy

$$p = \\gamma m v \\qquad E = \\gamma m c^2 \\qquad E^2 = (pc)^2 + (m c^2)^2$$
`,
  },
  {
    path: 'Calculus & Vectors/01-limits-continuity-and-derivatives.md',
    subject: 'Calculus & Vectors',
    title: '01 · Limits, Continuity & Derivatives',
    orderIndex: 1,
    contentText: `# Limits, Continuity & Derivatives

Differential calculus formalizes instantaneous rates of change through limits and tangent slopes.

## 1. Formal Definition of Continuity

A function $f(x)$ is continuous at $x = a$ if and only if three conditions hold simultaneously:

1. $f(a)$ is defined.
2. $\\lim_{x \\to a} f(x)$ exists (meaning left-hand and right-hand limits agree).
3. $\\lim_{x \\to a} f(x) = f(a)$.

## 2. First Principles Derivative

The derivative $f'(x)$ represents the instantaneous slope of the tangent line at $x$:

$$f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}$$

## 3. Essential Differentiation Rules

| Rule | Function Form | Derivative |
| :--- | :--- | :--- |
| Power Rule | $x^n$ | $n x^{n-1}$ |
| Product Rule | $f(x)g(x)$ | $f'(x)g(x) + f(x)g'(x)$ |
| Quotient Rule | $\\frac{f(x)}{g(x)}$ | $\\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}$ |
| Chain Rule | $f(g(x))$ | $f'(g(x)) \\cdot g'(x)$ |

## 4. Applied Optimization Strategy

1. Define variables and write the primary objective function to maximize or minimize.
2. Use constraint equations to express the objective in terms of a single variable.
3. Determine the feasible domain $[a, b]$.
4. Solve $f'(x) = 0$ for critical points and test endpoints alongside critical values.
`,
  },
  {
    path: 'Calculus & Vectors/02-vectors-planes-and-intersections.md',
    subject: 'Calculus & Vectors',
    title: '02 · 3D Vectors, Lines & Planes',
    orderIndex: 2,
    contentText: `# 3D Vectors, Lines & Planes

Cartesian and vector equations let us describe lines, planes, and spatial intersections in $\\mathbb{R}^3$.

## 1. Dot Product & Projections

Given $\\vec{u} = (u_1, u_2, u_3)$ and $\\vec{v} = (v_1, v_2, v_3)$:

$$\\vec{u} \\cdot \\vec{v} = u_1 v_1 + u_2 v_2 + u_3 v_3 = |\\vec{u}||\\vec{v}|\\cos(\\theta)$$

Two non-zero vectors are orthogonal if and only if $\\vec{u} \\cdot \\vec{v} = 0$.

## 2. Cross Product & Normal Vectors

The cross product $\\vec{u} \\times \\vec{v}$ produces a vector perpendicular to both $\\vec{u}$ and $\\vec{v}$, with magnitude equal to the parallelogram area:

$$|\\vec{u} \\times \\vec{v}| = |\\vec{u}||\\vec{v}|\\sin(\\theta)$$

## 3. Equations of a Plane

A plane passing through point $P_0(x_0, y_0, z_0)$ with normal vector $\\vec{n} = (A, B, C)$ has scalar equation:

$$A x + B y + C z + D = 0$$

where $D = -(A x_0 + B y_0 + C z_0)$.

> **Distance from Point to Plane:** For any point $Q(x_1, y_1, z_1)$:
> $$d = \\frac{|A x_1 + B y_1 + C z_1 + D|}{\\sqrt{A^2 + B^2 + C^2}}$$
`,
  },
  {
    path: 'Organic Chemistry/01-functional-groups-and-isomerism.md',
    subject: 'Organic Chemistry',
    title: '01 · Functional Groups & Isomerism',
    orderIndex: 1,
    contentText: `# Functional Groups & Structural Isomerism

Carbon's ability to form four covalent bonds yields diverse molecular architectures whose reactivity depends on characteristic functional groups.

## 1. Priority Functional Groups (IUPAC)

| Class | Functional Motif | Suffix | Example |
| :--- | :--- | :--- | :--- |
| Carboxylic Acid | $-\\text{COOH}$ | -oic acid | Ethanoic acid |
| Ester | $-\\text{COOR}$ | -oate | Methyl propanoate |
| Aldehyde | $-\\text{CHO}$ | -al | Propanal |
| Ketone | $>\\text{C}=\\text{O}$ | -one | Propanone |
| Alcohol | $-\\text{OH}$ | -ol | Butan-2-ol |
| Amine | $-\\text{NH}_2$ | -amine | Ethanamine |

## 2. Boiling Point Trends

Intermolecular forces govern physical properties across homologous series:

- **Carboxylic Acids > Alcohols > Ketones/Aldehydes > Alkanes** (for comparable molar mass).
- Carboxylic acids form stable hydrogen-bonded dimers, significantly elevating boiling points.

## 3. Types of Isomerism

1. **Structural (Constitutional) Isomers:** Same molecular formula, different atom connectivity (chain, position, functional group isomers).
2. **Geometric (cis/trans or E/Z) Isomers:** Restricted rotation around a $\\text{C}=\\text{C}$ double bond.
3. **Optical Isomers (Enantiomers):** Non-superimposable mirror images containing a chiral carbon bonded to four distinct substituents.
`,
  },
  {
    path: 'Organic Chemistry/02-thermodynamics-and-gibbs-free-energy.md',
    subject: 'Organic Chemistry',
    title: '02 · Chemical Equilibrium & Gibbs Free Energy',
    orderIndex: 2,
    contentText: `# Chemical Equilibrium & Gibbs Free Energy

Spontaneity in chemical systems balances enthalpy ($\\Delta H$) and entropy ($\\Delta S$) across temperature $T$ in Kelvin.

## 1. The Gibbs Equation

$$\\Delta G = \\Delta H - T \\Delta S$$

- When $\\Delta G < 0$, the forward reaction is **spontaneous (exergonic)**.
- When $\\Delta G > 0$, the reaction is **non-spontaneous (endergonic)**.
- When $\\Delta G = 0$, the system is at **dynamic equilibrium**.

## 2. Equilibrium Constant Connection

$$\\Delta G^\\circ = -R T \\ln(K_{\\text{eq}})$$

| $\\Delta H$ | $\\Delta S$ | Spontaneity Behavior |
| :--- | :--- | :--- |
| Negative ($-$) | Positive ($+$) | Spontaneous at all temperatures |
| Positive ($+$) | Negative ($-$) | Non-spontaneous at all temperatures |
| Negative ($-$) | Negative ($-$) | Spontaneous at low temperatures |
| Positive ($+$) | Positive ($+$) | Spontaneous at high temperatures |
`,
  },
  {
    path: 'Molecular Biology/01-dna-replication-and-transcription.md',
    subject: 'Molecular Biology',
    title: '01 · DNA Replication & Gene Expression',
    orderIndex: 1,
    contentText: `# DNA Replication & Gene Expression

Genetic information flows from DNA to RNA to protein through tightly regulated enzymatic mechanisms.

## 1. Semiconservative Replication Enzymes

- **Helicase:** Unwinds the parental double helix at the replication fork by breaking hydrogen bonds.
- **Topoisomerase (Gyrase):** Relieves torsional supercoiling ahead of the replication fork.
- **RNA Primase:** Synthesizes short complementary RNA primers providing a free $3'$-OH group.
- **DNA Polymerase III:** Extends nucleotides strictly in the $5' \\to 3'$ direction (continuous leading strand; Okazaki fragments on lagging strand).
- **DNA Polymerase I & Ligase:** Replaces RNA primers with DNA and seals phosphodiester nicks.

## 2. Transcription & mRNA Processing (Eukaryotes)

1. **Initiation:** RNA Polymerase II binds the promoter TATA box assisted by transcription factors.
2. **Elongation:** Synthesizes pre-mRNA complementary to the $3' \\to 5'$ template strand.
3. **Post-transcriptional Modification:**
   - Addition of a $5'$ methylguanosine cap
   - Addition of a $3'$ poly-A tail
   - Spliceosome excision of introns and joining of exons

> **Concept Check:** Why does lagging strand synthesis require multiple RNA primers whereas the leading strand requires only one?
`,
  },
  {
    path: 'Molecular Biology/02-cellular-respiration-and-metabolic-yield.md',
    subject: 'Molecular Biology',
    title: '02 · Cellular Respiration & ATP Yield',
    orderIndex: 2,
    contentText: `# Cellular Respiration & ATP Yield

Aerobic respiration harvests chemical bond energy from glucose through four coordinated metabolic stages.

## 1. Overall Stoichiometry

$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\,\\text{O}_2 \\longrightarrow 6\\,\\text{CO}_2 + 6\\,\\text{H}_2\\text{O} + \\text{Energy (ATP + Heat)}$$

## 2. Stage-by-Stage Accounting

| Stage | Location | Net ATP | Electron Carriers |
| :--- | :--- | :--- | :--- |
| Glycolysis | Cytosol | 2 ATP | 2 NADH |
| Pyruvate Oxidation | Mitochondrial Matrix | 0 ATP | 2 NADH |
| Citric Acid Cycle | Mitochondrial Matrix | 2 ATP | 6 NADH, 2 FADH$_2$ |
| Oxidative Phosphorylation | Inner Membrane | ~28–32 ATP | Consumes NADH & FADH$_2$ |

## 3. Chemiosmosis

Electrons pass along Complexes I–IV, pumping protons ($\\text{H}^+$) into the intermembrane space. The resulting electrochemical gradient drives **ATP synthase** as protons flow back into the matrix, with $\\text{O}_2$ serving as the terminal electron acceptor to form $\\text{H}_2\\text{O}$.
`,
  },
  {
    path: 'English Literature/01-rhetorical-analysis-and-essay-structure.md',
    subject: 'English Literature',
    title: '01 · Rhetorical Analysis & Argumentation',
    orderIndex: 1,
    contentText: `# Rhetorical Analysis & Argumentation

Critical literary and rhetorical essays evaluate **how** an author constructs meaning through diction, syntax, structure, and appeals.

## 1. The Rhetorical Triangle

- **Ethos (Credibility):** How the speaker establishes authority, shared values, or moral reliability.
- **Pathos (Emotion):** Sensory imagery, connotative diction, and narrative pacing that evoke empathy or urgency.
- **Logos (Logic):** Evidence, concessions, counterarguments, and deductive reasoning.

## 2. Precision Thesis Formula

Avoid summarizing plot. Anchor your thesis around **device + textual evidence + thematic effect**:

> *Through recurring motifs of fractured glass and terse, fragmented syntax, the narrator exposes how rigid social conformity erodes personal identity.*

## 3. Paragraph Architecture (TEAL)

1. **Topic Claim:** One analytical assertion tied directly to the thesis.
2. **Evidence:** Embedded, concise quotation integrated smoothly into your own sentence.
3. **Analysis:** Unpack specific word choices, figurative shifts, or structural contrasts.
4. **Link:** Connect the insight back to the broader thematic argument.
`,
  },
  {
    path: 'English Literature/02-modernist-poetry-close-reading.md',
    subject: 'English Literature',
    title: '02 · Modernist Poetry Close Reading',
    orderIndex: 2,
    contentText: `# Modernist Poetry Close Reading

Early twentieth-century modernist poets broke away from Victorian symmetry to mirror industrial fragmentation and psychological interiority.

## 1. Core Modernist Techniques

- **Juxtaposition & Allusion:** Colliding classical mythology with ordinary urban scenes to highlight cultural disillusionment.
- **Free Verse & Enjambment:** Variable line lengths and mid-clause line breaks that mimic restless thought.
- **Objective Correlative:** Evoking complex emotion through concrete objects or situations rather than explicit statement.

## 2. Five-Step Unseen Poem Protocol

1. Read once aloud (or mentally) for literal situation and speaker voice.
2. Identify the **volta** (tonal or structural turn).
3. Circle contrasts in imagery (light/shadow, organic/mechanical).
4. Examine sound patterns: caesura, alliteration, sibilance, and rhythm disruptions.
5. Synthesize how form reinforces the poem's central tension.
`,
  },
];

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function buildStarterDocuments(): StudyDocument[] {
  const now = Date.now();
  return RAW_STARTER_DOCS.map((doc) => ({
    key: `${STARTER_REPO_ID}:${doc.path}`,
    repoId: STARTER_REPO_ID,
    path: doc.path,
    subject: doc.subject,
    subjectSlug: slugify(doc.subject),
    title: doc.title,
    fileName: doc.path.split('/').pop() || doc.path,
    type: 'markdown',
    contentText: doc.contentText,
    sha: `starter-${doc.orderIndex}`,
    size: new Blob([doc.contentText]).size,
    readTimeMinutes: estimateReadTime(doc.contentText),
    orderIndex: doc.orderIndex,
    updatedAt: now,
  }));
}
