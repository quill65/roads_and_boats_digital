/**
 * Roads & Boats - Official Comprehensive Interactive Tutorial Lessons
 * Accurate Splotter Spellen tabletop rules:
 * - Starting Inventory: 3 Donkeys, 5 Boards, 1 Stone, 2 Geese
 * - Donkey Breeding: 2 donkeys alone on an empty Pasture hex (no buildings/goods/cargo)
 * - Authentic 3rd Edition building costs, Stone Roads / Board Bridges, & opening strategy
 */

export interface TutorialChecklistItem {
  step: string;
  transporter: string;
  action: string;
  why: string;
}

export interface TutorialUiStep {
  label: string;
  action: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  round1Focus?: boolean;
  round1Checklist?: TutorialChecklistItem[];
  uiSteps?: TutorialUiStep[];
  explanation: string[];
  tacticalAdvice: string[];
  keyRules: string[];
  recommendedMap: string;
  targetAction?: string;
}

export const TUTORIAL_LESSONS: TutorialStep[] = [
  {
    id: 'lesson_1_terrain_transporters',
    title: '1. The Frontier & Game Overview',
    subtitle: 'Hexagons, Rivers, and Foundational Logistics',
    objective: 'Select a Donkey and observe valid movement destinations across the hex map.',
    explanation: [
      'Welcome to Roads & Boats! In this renowned Splotter Spellen logistics masterpiece, you build an empire from humble pack animals into an industrial transport network.',
      'The board is a hexagonal landscape featuring Pasture (natural donkey breeding), Forest (timber trunks), Rock (stone quarries), Mountain (ore mines), Desert (open plains), and Water (navigable rivers & seas).',
      'Rivers run along hexagonal borders. Unbridged rivers permit Donkeys to walk along riverbanks but block wheeled vehicles completely! Pave a 2-Board Bridge for Wagons and Steam Trucks.',
      'Watercraft (Rafts, Rowboats, and Steamers) move exclusively along water borders and sea tiles, transporting freight through natural water networks.',
    ],
    tacticalAdvice: [
      'Always inspect your terrain carefully during setup—find the nearest forest, pasture, rock, and mountain relative to your home camp.',
      'Look for narrow river crossings where a 2-Board Bridge can connect wheeled Wagon routes.',
    ],
    keyRules: [
      'Donkey capacity: Exactly 2 goods max.',
      'Donkey movement: 1 off-road move OR 2 moves strictly along paved Roads/Bridges.',
      'Watercraft navigate only along water tiles or river hex edges.',
    ],
    uiSteps: [
      { label: 'Select Transporter', action: 'Click on any Donkey (🫏) token at your starting home camp.' },
      { label: 'View Movement', action: 'Observe the highlighted adjacent hexes with glowing movement rings.' },
      { label: 'Move Piece', action: 'Click an adjacent land hex to command your donkey to move.' },
      { label: 'Inspect Terrain', action: 'Click any tile on the map to inspect its terrain name, icon, and description in the HUD.' },
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_2_first_round_mastery',
    title: '2. Mastering Round 1: The Essential Opening Strategy',
    subtitle: 'The 5 Boards, 1 Stone & 2 Geese Opening — Splotter 3rd Edition',
    objective: 'Deploy Donkey 1 with 1 Board to Forest (Woodcutter), Donkey 2 with 2 Boards & 1 Stone for a Sawmill, and pave a Land Road using Quarry Stone.',
    round1Focus: true,
    round1Checklist: [
      {
        step: '1. Donkey 1 (The Lumberjack)',
        transporter: '🫏 Donkey A',
        action: 'Load 1 Board from home camp → Move 1 step onto an adjacent Forest hex.',
        why: 'In the Building Phase, this donkey erects your Woodcutter (costs 1 Board). This guarantees you harvest 1 Wood in Round 2!',
      },
      {
        step: '2. Donkey 2 (The Millwright)',
        transporter: '🫏 Donkey B',
        action: 'Load 2 Boards + 1 Stone (or prepare site) → Move toward your Sawmill site.',
        why: 'A Sawmill costs exactly 2 Boards & 1 Stone. Erecting your Sawmill enables you to turn 1 raw Wood into 2 Boards every round!',
      },
      {
        step: '3. Donkey 3 (Stone Quarry & Paving)',
        transporter: '🫏 Donkey C',
        action: 'Carry 2 Boards to an adjacent Rock hex (Quarry) or keep Boards for a River Bridge.',
        why: 'Remember: Land Roads strictly require 1 Stone (not Boards!), while Bridges strictly cost 2 Boards. Building an early Quarry yields endless Stone for highways!',
      },
      {
        step: '4. Authentic 3rd Edition Stock: 5 Boards, 1 Stone, 2 Geese!',
        transporter: '📦 Exact Starting Stock',
        action: 'Allocate 1 Board (Woodcutter) + 2 Boards & 1 Stone (Sawmill) + 2 Boards (Quarry on Rock or Bridge).',
        why: 'Your 5 starting Boards + 1 Stone fund Woodcutter (1B), Sawmill (2B+1S), and Quarry (2B), while your 2 starting Geese breed or fund early Research!',
      },
      {
        step: '5. What About the Wonder?',
        transporter: '🏛️ Wonder Phase',
        action: 'You may spend 1 extra good on your home tile or save materials and let a Neutral brick advance the clock.',
        why: 'Wonder bricks can be bought with any goods on your home tile (cost 1 for the 1st brick, escalating for extra bricks in the same round).',
      },
    ],
    explanation: [
      'In 3rd Edition Roads & Boats, every player begins with 3 Donkeys, 5 Boards, 1 Stone, and 2 Geese at their home camp.',
      'Phase 1 (Production): You have no factories yet, so Round 1 production produces nothing. All your potential lies in your 3 Donkeys and starting supplies.',
      'Phase 2 (Movement): Your 3 Donkeys carry up to 2 items each. Load materials onto Donkeys to reach Forest (Woodcutter), Rock (Quarry), and a Sawmill site.',
      'Phase 3 (Building): Build the Woodcutter (1 board) on Forest, Quarry (2 boards) on Rock, or Sawmill (2 boards, 1 stone) on non-desert land. Pave Roads with 1 Stone or Bridges with 2 Boards.',
      'Phase 4 (Wonder): Pass to save starting supplies or contribute 1 good on your home tile for the first Wonder brick.',
    ],
    tacticalAdvice: [
      'Golden Rule of Turn 1: Never end Round 1 without a Woodcutter on Forest.',
      'Build a Quarry on Rock early so you have steady Stone for paving 1-Stone roads.',
      'Keep your donkeys close together so you can combine cargo for construction.',
    ],
    keyRules: [
      'Starting inventory: 3 Donkeys, 5 Boards, 1 Stone, and 2 Geese.',
      'Woodcutter costs 1 Board on Forest; Quarry costs 2 Boards on Rock.',
      'Sawmill costs 2 Boards & 1 Stone on any non-desert land hex.',
      'Land Roads strictly cost 1 Stone; River Bridges strictly cost 2 Boards.',
    ],
    uiSteps: [
      { label: 'Step 1: Select Donkey A', action: 'Click on Donkey A (🫏) at your home camp.' },
      { label: 'Step 2: Load 1 Board', action: 'Click "🎒 Manage Cargo" in the bottom HUD → Click "+ Load (1)" on Boards to pick up 1 Board into cargo.' },
      { label: 'Step 3: Move to Forest', action: 'Click an adjacent Forest hex. Donkey A walks onto the timberland.' },
      { label: 'Step 4: Advance to Building', action: 'Click "Next Phase ⏩" in the bottom HUD to advance to BUILDING PHASE.' },
      { label: 'Step 5: Erect Woodcutter', action: 'Click Donkey A on the Forest → Click "🏗️ Build Workshop" → Click "Build" next to Woodcutter (costs 1 Board).' },
      { label: 'Step 6: Erect Sawmill or Quarry', action: 'Use 2 Boards + 1 Stone for a Sawmill, or 2 Boards on Rock for a Quarry to harvest Stone for Roads.' },
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_3_neutral_goods',
    title: '3. The Sacred "Neutral Goods" Law',
    subtitle: 'Goods on the ground belong to NOBODY!',
    objective: 'Pick up goods into your transporter to protect them from rival caravans.',
    explanation: [
      'This is the hallmark rule of Splotter Spellen design: Goods lying on the open ground have NO owner!',
      'Your donkeys, wagons, and factories belong strictly to you, but any wood, stone, boards, or bricks sitting on the surface of a tile can be loaded by ANY player whose transporter arrives at that space.',
      'If your Woodcutter drops 1 wood on a forest hex and a rival donkey strolls through, they can pick up that wood legally without your consent!',
      'To safeguard your hard-earned materials, keep goods moving, store them inside your own transporters, or maintain exclusive control of road networks through chokepoints.',
    ],
    tacticalAdvice: [
      'Pick up produced goods on the same turn they are created whenever possible.',
      'Do not build factories far away without building a road connection to haul the goods home.',
      'Watch your opponents! If an opponent leaves unattended bricks or gold, your donkeys can snatch them.',
    ],
    keyRules: [
      'Goods on hex tiles are neutral and accessible to all players present.',
      'Goods inside a transporter’s cargo belong exclusively to that transporter’s owner.',
      'Transporters and built workshops can never be captured or stolen.',
      'A transporter can load goods from the ground at any point during its movement.',
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_4_timber_pipeline',
    title: '4. Forestry & The Sawmill Pipeline',
    subtitle: 'From Raw Logs to Exponential Timber Boards',
    objective: 'Build a Sawmill using 2 Boards and 1 Stone to double your wood efficiency.',
    explanation: [
      'Every wooden structure, road, and wagon requires refined Boards. However, a Woodcutter only produces raw Wood logs.',
      'Combine 2 Boards and 1 Stone to erect a Sawmill on any land hex.',
      'During every Production Phase, the Sawmill automatically takes 1 Wood on its hex and mills it into 2 refined Boards! You literally double your timber supply every round.',
      'With a steady flow of Boards, you can pave extensive road networks, erect new workshops, and construct specialized factories.',
    ],
    tacticalAdvice: [
      'Place your Sawmill centrally between your Forest woodcutters and your home camp.',
      'Don’t forget that you can carry multiple wood logs to the Sawmill with donkeys traveling along paved roads.',
    ],
    keyRules: [
      'Sawmill Cost: 2 Boards + 1 Stone.',
      'Sawmill Production: 1 Wood → 2 Boards per round.',
      'Raw Wood CANNOT be used to pave roads directly—it must be milled into Boards or burned into Fuel.',
    ],
    uiSteps: [
      { label: 'Step 1: Gather Materials', action: 'Ensure 2 Boards and 1 Stone are available at the site (carried by donkeys or sitting on the hex ground).' },
      { label: 'Step 2: Select Builder', action: 'Click a friendly Donkey stationed at the planned Sawmill hex.' },
      { label: 'Step 3: Open Workshop Menu', action: 'Click "🏗️ Build Workshop" in the bottom HUD.' },
      { label: 'Step 4: Erect Sawmill', action: 'Under "Factories & Workshops", click "Build" next to Sawmill. The game pools your carried and ground materials automatically!' },
      { label: 'Step 5: Automated Production', action: 'Every round during Production, the Sawmill automatically takes 1 raw Wood and outputs 2 refined Boards.' },
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_5_roads_and_bridges',
    title: '5. Infrastructure: Roads, Bridges & Wheeled Wagons',
    subtitle: 'Doubling speed and enabling heavy freight haulers',
    objective: 'Pave roads along hex edges and upgrade your transport capacity with Wagons.',
    explanation: [
      'Without roads, your realm operates at a crawl. Off-road donkeys only travel 1 hex per round, and heavy Wagons cannot move at all!',
      'During the Building Phase, a transporter with 1 Stone on an adjacent hex can pave a Land Road along a dry border or alongside a riverbank on the same side of the river (Boards cannot build roads).',
      'To cross over a river to the opposite bank, you must construct a Bridge instead, which strictly costs 2 Boards (Stone cannot build bridges).',
      'Once roads are paved, donkeys can use 2 road moves per turn. Furthermore, you can construct a Wagon Factory (2 Boards, 1 Stone) to build Wagons (cap 3, speed 3, strictly road-only)!',
    ],
    tacticalAdvice: [
      'Build a Quarry on Rock early so you can pave 1-Stone trunk roads connecting factories—including along riverbanks.',
      'Save Boards for Bridges (2 Boards) when you need to cross a river!',
    ],
    keyRules: [
      'Land Road cost: Strictly 1 Stone per border (dry border or same-bank alongside a river).',
      'River Bridge cost: Strictly 2 Boards per river border to link opposite banks.',
      'Wagons have 3 capacity and 3 speed, and are STRICTLY ROAD-ONLY.',
      'Bridges allow both land units to cross and watercraft to pass beneath.',
    ],
    uiSteps: [
      { label: 'Step 1: Position Builder', action: 'Select a donkey standing on either hex bordering the border you wish to pave.' },
      { label: 'Step 2: Start Road Mode', action: 'Click "🛣️ Pave Road" in the bottom HUD (or open "🏗️ Build Workshop" → "Roads & Bridges" → "Select Border on Board").' },
      { label: 'Step 3: Click Border Marker', action: 'Click any glowing border marker (🛣️ for 1-Stone land roads, 🌉 for 2-Board river bridges) around your builder.' },
      { label: 'Step 4: Road Paved!', action: 'The road cobblestones or bridge appear immediately, consuming 1 Stone (road) or 2 Boards (bridge).' },
      { label: 'Step 5: High-Speed Travel', action: 'In the next Movement Phase, your donkeys can move 2 hexes strictly along roads, doubling hauling velocity!' },
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_6_pasture_breeding',
    title: '6. Natural Donkey Breeding on Pastures',
    subtitle: 'No special building needed — privacy on pasture is all they require!',
    objective: 'Leave exactly 2 Donkeys alone on an empty Pasture hex with no cargo or goods to breed a 3rd Donkey.',
    explanation: [
      'In Roads & Boats, there is NO Donkey Pasture building! Donkeys reproduce naturally on empty Pasture terrain tiles.',
      'To breed a new donkey during the Production Phase, a Pasture hex must satisfy the "Privacy Rule":',
      '1. Exactly TWO donkeys of the same player must be on the pasture hex.',
      '2. There can be NO buildings of any kind on the hex.',
      '3. There can be NO loose goods on the ground.',
      '4. There can be NO other transporters on the hex.',
      '5. The two donkeys themselves CANNOT be carrying any cargo!',
      'When all privacy conditions are met at the start of the round, the pair breeds to produce a brand new third Donkey on that pasture!',
    ],
    tacticalAdvice: [
      'Dedicate an empty pasture hex near your camp exclusively for breeding.',
      'Make sure to drop all cargo before ending the Movement Phase so the donkeys are completely unburdened.',
    ],
    keyRules: [
      'Natural Pasture Breeding: Exactly 2 donkeys of the same owner on an empty Pasture tile.',
      'No buildings, no goods on hex, no other transporters, and donkeys carrying NO cargo.',
      'Produces 1 new Donkey during the Production Phase.',
      'No goose or building required!',
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_7_advanced_industry',
    title: '7. Advanced Industry: Coal, Mining, Paper & Mint',
    subtitle: 'Steaming Trucks, Minted Gold, and High-Yield Stocks',
    objective: 'Explore Mines and Minting to produce massive victory point payloads.',
    explanation: [
      'Once basic timber and stone infrastructure are established, advance into the high-value industrial tree.',
      'Build a Coal Burner (3 Boards) to turn any 2 Wood/Boards into Fuel. Fuel powers Steam Trucks (capacity 6, road speed 4) and Steamers (capacity 8, water speed 6)!',
      'Construct a Mine on Mountain crags (3 Boards, 1 Stone) to draw 1 random ore counter per turn from its finite ore bag (default: 3 Gold + 3 Iron).',
      'Build a Royal Mint (2 Boards, 1 Stone) to strike 2 Gold + 1 Fuel into Coins worth 40 VPs each.',
      'Build a Papermill on any non-desert land (1 Board, 1 Stone) to press Paper from 2 Wood/Boards. Combine 2 Coins + 1 Paper at a Stock Exchange (3 Stone) for a Stock Certificate worth 120 VPs!',
    ],
    tacticalAdvice: [
      'Stock Certificates (120 VP) and Coins (40 VP) are the ultimate victory engines in Roads & Boats.',
      'Steam Trucks carry 6 items—an entire warehouse on wheels along paved highways.',
    ],
    keyRules: [
      'Mines draw 1 ore counter per round from a finite pool (3 Gold + 3 Iron default).',
      'Royal Mint: 2 Gold + 1 Fuel → 1 Coin (40 VP each).',
      'Stock Exchange: 2 Coins + 1 Paper → 1 Stock Certificate (120 VP each).',
      'Quarry costs 2 Boards on Rock; Stone Factory costs 2 Boards (1 Clay → 2 Stone).',
    ],
    recommendedMap: 'tutorial_meadow',
  },
  {
    id: 'lesson_8_wonder_and_scoring',
    title: '8. The Wonder of the World & Endgame Scoring',
    subtitle: '10 VP per Row & Escalating Goods Contributions',
    objective: 'Deliver goods back to your home (starting) tile to buy Wonder bricks and control scoring rows.',
    explanation: [
      'The monumental Wonder of the World is constructed using ANY goods present at your home (starting) tile during the Wonder Phase.',
      'Your first brick in a round costs 1 good, the 2nd costs 2 goods, the 3rd costs 3 goods, etc. Once the Wonder reaches 17+ bricks, base cost increases by +1!',
      'The Wonder has 13 rows [4,4,4,4, 5,5,5,5, 6,6,6, 7,3 = 64 slots]. Each row awards 10 VP divided proportionally among the non-neutral player bricks in that row. Placing Brick #45 irrigates all Desert hexes into Pasture!',
      'The match concludes at player-count brick limits (52 for 2P, 58 for 1P/3P, 64 for 4P) or 33 Neutral bricks. Highest total score from Wonder rows, Gold (10 VP), Coins (40 VP), and Stocks (120 VP) wins!',
    ],
    tacticalAdvice: [
      'Try to claim majorities in early 4-brick Wonder rows so you earn a bigger share of each 10 VP row.',
      'Don’t neglect Coins (40 VP) and Stocks (120 VP)—a financial powerhouse often beats a pure Wonder rush.',
    ],
    keyRules: [
      'Home (starting) tile (⛺): Spend any goods here during the Wonder Phase to place bricks.',
      'Cost escalates within each round (1, 2, 3...) and increases by +1 base after brick #17.',
      'Each of the 13 Wonder rows awards 10 VP split among non-neutral bricks in that row.',
      'Desert tiles convert into fertile Pasture when the 45th brick is placed.',
    ],
    recommendedMap: 'tutorial_meadow',
  },
];
