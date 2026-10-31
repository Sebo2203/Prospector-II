const RETIREMENT_TIERS = [
  {
    min: 0, max: 999,
    title: 'Broke & Stranded',
    col: '#ff4444',
    lines: [
      'You retire with nothing but debt and stories nobody wants to hear.',
      'You sign on as security aboard another freelancer ship. Some retirement.',
      'Your experience in planet exploration keeps you alive out there, barely.',
    ],
    story: [
      [
        'You dock for the last time with your accounts barely in the black.',
        'The station clerk stamps your retirement papers without looking up.',
        'With {credits} credits to your name, you cannot even book passage home.',
        'You take a bunk in the transient quarters and start asking around for work.',
        'Nobody hires a broke prospector. Not straight away.',
      ],
      [
        'A colonist on a frontier world takes you in as a farm hand.',
        'The work is hard and the pay is almost nothing.',
        'But the sunrise over the alien plains is something you never',
        'expected to find beautiful, and slowly it makes up for everything.',
        'You stay longer than you planned. You stop counting the days.',
      ],
      [
        'You sign on as security aboard another freelancer ship.',
        'The captain barely looks at your record. He just needs a warm body.',
        'Some retirement. But you know the ship\'s sounds better than he does,',
        'and when the hull groans in a nebula you are the first one up.',
        'That still counts for something.',
      ],
      [
        'You find a job as a waiter at a station bar near the docking ring.',
        'The pilots come and go. Sometimes one looks just like you did once.',
        'You pour their drinks and do not say much.',
        'Your employer rarely pays on time. You manage.',
        'The stars are still visible through the viewport if you pick the right table.',
      ],
      [
        'Your experience in the field keeps you alive when most redshirts',
        'end up on the wrong end of a hungry alien.',
        'You take contract security work on survey expeditions.',
        'The pay is bad. The terrain is familiar.',
        'You survive long enough to save the ticket home. Eventually.',
      ],
      [
        'You never make it off the station with enough to settle anywhere.',
        'A shady individual offers you a route-scouting job, cash upfront.',
        'You know better. You take it anyway.',
        'Turns out the job is legitimate. The money almost covers the debt.',
        'You lead a modest life. You have survived worse.',
      ],
      // --- dark endings ---
      {
        noEpilogue: true,
        lines: [
          'You sign on as security on a survey expedition.',
          'On the third planet, the alien life is not what the scans suggested.',
          'You are the first one through the door, as always.',
          'You are not the last one out.',
          '',
          'They file the paperwork. Missing, presumed dead.',
          'Your retirement credits sit unclaimed in the system for seven years.',
        ],
      },
      {
        noEpilogue: true,
        lines: [
          'You take a cheap berth on a freighter heading rimward.',
          'Three days out, pirates intercept the convoy.',
          'You know exactly how this goes. You have been on the other side of it.',
          '',
          'The freighter does not make it to port.',
          'Nobody comes looking for a broke retired prospector.',
          'The stars do not care either way.',
        ],
      },
      {
        noEpilogue: true,
        lines: [
          'You take one last contract. Just to cover the passage home.',
          'The client says the site is clear. They always say the site is clear.',
          '',
          'It is not clear.',
          'You put up a better fight than anyone expected.',
          'It does not change the outcome.',
          'The coordinates die with you. Somewhere out there, the site still waits.',
        ],
      },
    ],
  },
  {
    min: 1000, max: 2999,
    title: 'Modest Pension',
    col: '#ffaa44',
    lines: [
      'You lead a modest life, with nothing but a small pension and few assets.',
      'A small apartment on Luna Colony. Nothing fancy, but the view never gets old.',
      'Your life insurance finally pays out. You live carefully on what remains.',
    ],
    story: [
      [
        'You file the paperwork and hand in your prospector\'s license.',
        'Your life insurance finally pays out — not much, but enough.',
        'A modest life. A small pension. Not the dream you launched with,',
        'but you made it back alive.',
        'For a prospector, that counts for a great deal.',
      ],
      [
        'A small apartment on Luna Colony. Nothing fancy.',
        'The view of Earth through the dome never quite gets old.',
        'You live quietly, taking odd jobs when the pension runs short.',
        'Old spacers sometimes recognize your callsign patch in the corridor.',
        'They don\'t say much. They don\'t need to.',
      ],
      [
        'You find a job as station security. The pay is steady.',
        'Your employer is slow to pay and quick to complain,',
        'but compared to what you have survived out there,',
        'a late paycheck barely registers.',
        'You sleep better than you have in years.',
      ],
      [
        'You buy a small share in a docking bay concession on a mid-rim station.',
        'Nothing glamorous. Ships come in, ships go out.',
        'You watch the young pilots climb out of their cockpits',
        'with that particular look in their eyes you remember well.',
        'You don\'t warn them. It wouldn\'t help.',
      ],
      [
        'The company offers a modest settlement to retired contractors.',
        'You take it without arguing. You have heard the arguments.',
        'A studio unit in a hab ring. Basic food allowance. A terminal.',
        'You spend a lot of time writing up survey notes nobody asked for.',
        'Someone at the Academy cites one of them, years later. You smile.',
      ],
      [
        'You sign on as a navigation consultant for a short-haul freight line.',
        'The routes are dull but safe, which is a novelty.',
        'Your employer doesn\'t pay well, but he pays on time.',
        'You stop jumping at loud sounds after the first year.',
        'That alone feels like a victory.',
      ],
      // --- dark endings ---
      {
        noEpilogue: true,
        lines: [
          'You retire to a modest hab unit on a mid-rim station.',
          'One night the station\'s reactor section has an incident.',
          'They evacuate most of the ring in time.',
          '',
          'Your section is not most of the ring.',
          'You have survived alien encounters, pirate attacks, and fuel crises.',
          'In the end it is a faulty pressure seal.',
          'The irony would not have been lost on you.',
        ],
      },
      {
        noEpilogue: true,
        lines: [
          'You take a job as a guide on a wilderness colony.',
          'You know the terrain better than anyone.',
          'On a routine survey the weather turns faster than the forecast said.',
          '',
          'The colonists make it back.',
          'You stay behind to get the last one clear.',
          'The storm is faster than you are.',
          'They name the trail after you. It seems right.',
        ],
      },
    ],
  },
  {
    min: 3000, max: 5999,
    title: 'Comfortable Life',
    col: '#ffe066',
    lines: [
      'You lead a life of leisure. You rarely need odd work to get through a tight spot.',
      'A small asteroid in a colonized system. Cosy rooms carved out of the rock.',
      'You spend your days reading old star charts and telling stories your grandchildren half-believe.',
    ],
    story: [
      [
        'You dock the ship for the last time and sign the transfer papers.',
        'The company representative is polite. You are not.',
        'With {credits} credits you buy a small asteroid in a colonized system.',
        'Several rooms with life support carved out of the rock.',
        'Cosy, quiet, and entirely yours.',
      ],
      [
        'You buy a place on Mars.',
        'The sunsets are red and long and entirely worth it.',
        'Enough to live on, enough to be comfortable.',
        'More than most prospectors ever manage to hold onto.',
        'You spend evenings reading old star charts by lamplight.',
      ],
      [
        'The sector you charted is still being settled.',
        'Occasionally a colony ship passes through a system you mapped',
        'and names a mountain range after your callsign.',
        'You hear about it third-hand, through an old crew contact.',
        'You are quietly, deeply pleased.',
      ],
      [
        'You buy a small house on a colony world near the rim.',
        'The neighbours are farmers and retired engineers.',
        'They ask what you did before. You give the short version.',
        'Nobody believes all of it. You don\'t blame them.',
        'You lead a life of leisure. It suits you more than you expected.',
      ],
      [
        'You invest in a small automated mining claim in a nearby belt.',
        'It pays just enough to keep you comfortable without working.',
        'Your grandchildren visit in the summers.',
        'You tell them stories over dinner. They ask for more.',
        'You never run out.',
      ],
      [
        'A fellow retired prospector tracks you down through the directory.',
        'You haven\'t spoken in years. You meet for drinks.',
        'Three hours later you are still there, going through the old routes.',
        'You chip in on a small hab together, pooling the pensions.',
        'It turns out retirement is easier with company.',
      ],
      // --- dark ending ---
      {
        noEpilogue: true,
        lines: [
          'You buy your asteroid and settle in comfortably.',
          'In the second year, a routine mining survey uncovers something unusual.',
          'You go to look yourself. Old habits.',
          '',
          'Whatever it is, it was not dormant.',
          'The automated distress beacon fires as programmed.',
          'Rescue arrives in four days.',
          'Four days is too long.',
          'They bury you on the asteroid, which is what you would have wanted.',
        ],
      },
    ],
  },
  {
    min: 6000, max: 9999,
    title: 'A Good Life',
    col: '#88ffaa',
    lines: [
      'You lead a life of leisure and modest luxury. You only work when you want to.',
      'A nice estate in the country on a civilized world. Perfect autumn years.',
      'You spend your later years funding young prospectors. Some remind you of yourself.',
    ],
    story: [
      [
        'You sell your ship to a young pilot who reminds you of yourself.',
        'You give her one piece of advice: trust your sensors over the charts.',
        'She nods like she understands. She will, eventually.',
        'With {credits} credits you buy a nice estate on a civilized world.',
        'The country is quiet. The company sends congratulations. You ignore them.',
      ],
      [
        'A hollowed asteroid base — self-sufficient, calm, entirely yours.',
        'You earned it. Every scar, every fuel scare, every crew member',
        'you watched walk down the ramp for the last time.',
        'You spend your later years funding young prospectors.',
        'A few of them remind you very much of yourself.',
      ],
      [
        'The company offers you a consultant role. You decline, politely.',
        'You\'ve done quite enough for them already.',
        'Word spreads quietly among the stations. Old-timers raise a glass.',
        'You lead a life of leisure and modest luxury,',
        'and only work when you choose to. You almost never choose to.',
      ],
      [
        'You purchase a country manor on a terraformed colony world.',
        'There are gardens. You have never grown anything before.',
        'You find you are surprisingly good at it.',
        'The company rep who used to give you contracts visits once.',
        'He seems smaller than you remembered.',
      ],
      [
        'You endow a small bursary at the Academy for prospector training.',
        'Your name is on a plaque in a corridor you will never walk down.',
        'That is fine. The idea is what matters.',
        'You live well, travel occasionally, and sleep without nightmares.',
        'Most nights, anyway.',
      ],
      [
        'You buy a small private shuttle and spend two years just drifting.',
        'No cargo, no crew, no contracts. Just the map and the fuel gauge.',
        'It turns out retirement can look a lot like what you always did,',
        'except nobody is shooting at you.',
        'You find this suits you extremely well.',
      ],
      // --- dark ending ---
      {
        noEpilogue: true,
        lines: [
          'You buy a private shuttle and spend your first year of retirement exploring.',
          'No contracts. No pressure. Just curiosity.',
          'On a nameless moon you find something the charts do not mention.',
          '',
          'You go in for a closer look.',
          'They find the shuttle eventually, drifting with the engines cold.',
          'Whatever you found, you took it with you.',
          'The moon stays on the charts, unnamed.',
          'Explorers still give it a wide berth.',
        ],
      },
    ],
  },
  {
    min: 10000, max: 19999,
    title: "Prospector's Dream",
    col: '#44ddff',
    lines: [
      'You have enough money to spend the rest of your life in luxury.',
      'A terraformed asteroid — large enough to hold an atmosphere. Entirely yours.',
      'You started with nothing. You return with everything. The sector remembers your name.',
    ],
    story: [
      [
        'You retire with {credits} credits to your name.',
        'Word spreads on the stations. Prospectors raise a glass in the bar.',
        'A terraformed asteroid — large enough to hold a real atmosphere,',
        'uninhabited except for you and whoever you invite.',
        'You started with nothing. You come back with everything.',
      ],
      [
        'You retire to your private colony.',
        'The company sends a congratulatory letter.',
        'You frame it ironically and hang it in the airlock.',
        'Staff, a garden dome, a library of star charts you\'ll never finish reading.',
        'The sector remembers your name. That, you did not expect.',
      ],
      [
        'You are approached about an endowment — a chair at the Academy',
        'for exploration cartography, to bear your name.',
        'You accept.',
        'Future prospectors will learn to read the stars using maps you made',
        'in the dark, alone, running on the last of the fuel.',
      ],
      [
        'You buy a terraformed asteroid and spend a year making it habitable.',
        'Workers come and go. You supervise every detail.',
        'When the atmosphere finally holds, you go outside without a suit',
        'for the first time in your career.',
        'You stand there for a long time, not saying anything.',
      ],
      [
        'The company names a relay station after you.',
        'You hear about it from a courier who had no idea you were still alive.',
        'You send the company a polite acknowledgement and nothing else.',
        'You live in genuine luxury. You employ a small staff.',
        'You are, by any measure, content.',
      ],
      [
        'You fund three separate survey expeditions in your retirement,',
        'just because you can.',
        'You review their reports with the same eye you always had.',
        'One crew finds something that makes the news across the sector.',
        'You knew they would. You picked them yourself.',
      ],
      // --- dark ending ---
      {
        noEpilogue: true,
        lines: [
          'You retire to your terraformed asteroid in genuine comfort.',
          'In your third year, one of the expeditions you funded goes dark.',
          'The company sends no one. The sector is too remote.',
          '',
          'You go yourself. You know the coordinates. You have the ship.',
          'You find the expedition. You get most of them out.',
          '',
          'You do not make it back.',
          'The sector loses one of its finest.',
          'The crew you saved never forget it.',
        ],
      },
    ],
  },
  {
    min: 20000, max: Infinity,
    title: 'Legend',
    col: '#cc88ff',
    lines: [
      'You have more money than you could ever spend.',
      'You buy a planet. Not a large one — but still. You buy a planet.',
      'Future prospectors fly past systems you mapped and never know your name. You do not mind.',
    ],
    story: [
      [
        'You retire with {credits} credits.',
        'You have more money than you could ever spend.',
        'You buy a planet. Not a large one — barren, honestly — but still.',
        'You buy a planet.',
        'The company names a station after you. You find this mildly embarrassing.',
      ],
      [
        'Within a few years you have built a domed settlement on your world.',
        'After the terraforming company finishes, it gets considerably nicer.',
        'You hire servants for whatever tasks you do not wish to do yourself.',
        'Future prospectors fly past the systems you mapped first',
        'and never know your name. You don\'t mind. You know.',
      ],
      [
        'You are near the end of your life.',
        'Human influence has reached almost every corner of the sector you opened.',
        'There are rumours of new alien contacts in the outer reaches.',
        'You lie in your chair and wish you were young enough to go.',
        'But you have led a life more exciting than most can claim.',
      ],
      [
        'The sector\'s largest independent station holds a ceremony in your honour.',
        'Half the old-timers you once flew with are there.',
        'A few of them you thought were dead.',
        'You give a short speech. You do not mention the company.',
        'Everyone knows why. Everyone raises a glass anyway.',
      ],
      [
        'You spend your first year of retirement building a proper archive.',
        'Every chart, every survey log, every contact report from your career.',
        'The Academy accepts the whole collection.',
        'The archivist tells you it is the most complete record of the outer sector',
        'held anywhere in known space. You believe her.',
      ],
      [
        'One of the alien scout ships recovered during your career',
        'is eventually reverse-engineered and used as a template',
        'for a new generation of long-range exploration vessels.',
        'They name the class after your ship.',
        'You watch the launch broadcast from your study and say nothing for a long time.',
      ],
      [
        'You are asked to give the keynote address at the Sector Exploration Summit.',
        'You accept, then spend three weeks trying to decide what to say.',
        'In the end you just tell them what it was really like out there.',
        'The room goes very quiet.',
        'Afterwards, twice as many students apply to the prospector program.',
      ],
      // --- dark ending ---
      {
        noEpilogue: true,
        lines: [
          'You buy your planet and build something extraordinary on it.',
          'In your fifth year, contact is made with an unknown vessel in the outer system.',
          'Every diplomat and admiral in the sector defers to your experience.',
          'You go out to meet them.',
          '',
          'Nobody knows exactly what happens next.',
          'The vessel leaves. You do not return with it.',
          'A signal arrives fourteen months later.',
          'It is in your voice. It is not entirely your words.',
          '',
          'Whatever you became out there, the sector is grateful.',
          'The planet is left as you built it, as a monument.',
          '— T H E   E N D —',
        ],
      },
    ],
  },
];

const RETIREMENT_EPILOGUES = [
  // Alone by choice
  [
    'You never find a partner to share your life with.',
    'You decide, after some reflection, that this suits you.',
    'The only love of a captain is the ship.',
    'You have no complaints.',
  ],
  // Alone, some regret
  [
    'You never find a partner to share your life with.',
    'There are a few who came close over the years.',
    'You think about them sometimes, on quiet evenings.',
    'The stars were easier. They never asked you to stay.',
  ],
  // Found love, no kids
  [
    'You find someone, late and unexpectedly.',
    'They have no interest in space and that turns out to be exactly right.',
    'You spend your remaining years mostly groundside.',
    'It is nothing like what you imagined. It is better.',
  ],
  // Found love, have kids
  [
    'One day you find the love of your life.',
    'You have children. They grow up hearing your stories.',
    'They do not entirely believe all of them.',
    'That is fine. You would not have believed them either.',
  ],
  // Found love, kids become explorers
  [
    'One day you find the love of your life.',
    'You have children. Two of them become explorers.',
    'This terrifies and delights you in equal measure.',
    'You give them the same advice nobody gave you.',
  ],
  // Found love, grandchildren
  [
    'You find love later than most.',
    'You have grandchildren eventually.',
    'They sit on your knee and ask about the aliens.',
    'You never run out of things to tell them.',
  ],
  // Several relationships, nothing lasting
  [
    'You have several relationships over the years.',
    'Nothing that lasts, but nothing that ends badly either.',
    'You are not made for permanent roots.',
    'The sector you mapped still carries your survey tags.',
    'That is legacy enough.',
  ],
  // Old crew reunions
  [
    'You stay in contact with a few old crew members.',
    'Every couple of years you meet somewhere and drink too much.',
    'Nobody talks about the close calls until the third round.',
    'Then nobody can stop.',
  ],
  // Unexpected late friendship
  [
    'In your later years you meet another retired prospector by chance.',
    'You have a drink. Then several.',
    'You end up living nearby and spending most evenings arguing about old routes.',
    'It is the best company you have had in decades.',
  ],
  // Quiet solitude, at peace
  [
    'You live quietly and mostly alone.',
    'Not out of loneliness — out of preference.',
    'You have had enough company for several lifetimes.',
    'The silence, for once, is welcome.',
  ],
  // Legacy through maps
  [
    'You never marry. You never particularly want to.',
    'But the charts you filed are still in use thirty years later.',
    'Somewhere out there, a ship follows a route you plotted',
    'running on fumes in the dark.',
    'They do not know your name. The route still works.',
  ],
  // Unexpected late love, bittersweet
  [
    'You meet someone at a station bar near the end of your first year retired.',
    'You do not expect it to go anywhere.',
    'It goes everywhere.',
    'You have fewer years together than you would have liked.',
    'You would not trade any of them.',
  ],
  // Stars were enough — the original
  [
    'You never find a partner to share your life with.',
    'Looks like the only love of a captain is the ship.',
    'The stars were enough.',
    'They always were.',
  ],
];


// ═════════════════════════════════════════════════════════════════
// HUMANITY ARC SCREEN  —  DEAD CODE
// Intended position: after retire_story, before career stats screen.
// To activate: add 'retire_humanity' confirm state between the two,
// wire it in the keydown handler, and call drawRetirementHumanityScreen()
// from drawBaseOverlay().
// ═════════════════════════════════════════════════════════════════

// The humanity arc has two independent axes that combine:
//   HUMANITY_OUTCOMES — what happened to humanity/the sector broadly
//   HUMANITY_CODAS    — one final sentence that closes the whole thing
//
// A random outcome is picked at confirm time (same as story/epilogue),
// stored as G.retirementHumanityIdx.
// noEpilogue endings can still show this screen — it's about the world,
// not the captain's personal life.

const HUMANITY_OUTCOMES = [
  // 1 — Alien contacts, peaceful, Andromeda expedition
  {
    // shared opening — world events, no personal ref
    lines: [
      'During all this time, the use of recovered alien scout ships',
      'helps humanity reach further into the galaxy than ever before.',
      '',
      'Then the news breaks: a civilisation discovered in the Magellanic Clouds,',
      'one that can match human capability in most areas',
      'and surpass it in some.',
      '',
      'Peaceful relations are established surprisingly quickly.',
      'A joint project is founded almost immediately:',
      'an expedition to Andromeda.',
    ],
    // closing lines when the captain is still alive to watch it unfold
    closingAlive: [
      '',
      'As you follow the news from your chair, you wish, not for the first time,',
      'that you were young enough to go.',
    ],
    // closing lines when the captain died early and never saw any of this
    closingDead: [
      '',
      'You never lived to see it.',
      'But the routes you filed are in the navigation database of every ship',
      'that heads toward those clouds.',
    ],
  },
  // 2 — Alien contacts, war breaks out
  {
    lines: [
      'During all this time, the recovered alien technology',
      'pushes human expansion further and faster than anyone planned for.',
      '',
      'A civilisation is eventually discovered in the outer clouds.',
      'They are not interested in peace.',
      '',
      'The diplomats try for years.',
      'The war for the sector is still ongoing decades later,',
      'and probably will be for centuries to come.',
    ],
    closingAlive: [
      '',
      'When you lie on your deathbed, you think about the planets you mapped.',
      'Some of them are battlegrounds now.',
    ],
    closingDead: [
      '',
      'You never lived to see the war.',
      'Some of the planets you mapped are battlegrounds now.',
      'The sector you opened became a front line.',
    ],
  },
  // 3 — Robot ships, humanity retreats
  {
    lines: [
      'In the years that follow, reports multiply of automated alien vessels',
      'attacking explorers, settlers and traders in the sector.',
      '',
      'The stations are eventually abandoned.',
      'Mankind comes to the quiet conclusion that the exploration of space',
      'may be more dangerous than it is worth.',
      '',
      'New expeditions are cancelled.',
      'The current borders of humanity are fortified and held.',
      'The sector is left to the dark and the machines.',
    ],
    closingAlive: [
      '',
      'You watch the news and say nothing.',
      'You knew what was out there.',
      'You went anyway.',
    ],
    closingDead: [
      '',
      'You never lived to see the retreat.',
      'In a way, you were lucky.',
      'You only ever knew it as a frontier worth crossing.',
    ],
  },
  // 4 — Robot ships, humanity adapts, automated exploration
  {
    lines: [
      'For a time the reports out of the sector are troubling.',
      'Automated alien vessels. Unexplained losses. Stations going silent.',
      '',
      'Then SHI announces they have managed to reverse-engineer',
      'and control a class of alien scout ship that had been',
      'threatening commerce and exploration for years.',
      '',
      'Automated exploration becomes the new standard.',
      'Safer. More efficient. Less human.',
    ],
    closingAlive: [
      '',
      'You are too old to be part of this new chapter.',
      'But you remember when none of it existed,',
      'and you went out there anyway.',
      'That still counts for something.',
    ],
    closingDead: [
      '',
      'You never lived to see it resolved.',
      'But the work you did out there — the maps, the contacts, the data —',
      'was part of what made the solution possible.',
    ],
  },
  // 5 — Quiet expansion, no drama
  {
    lines: [
      'The sector you helped map fills in slowly over the decades.',
      'Colonies. Relay stations. Trade routes you once flew alone.',
      '',
      'There is no single dramatic moment, no great discovery.',
      'Just the steady, unglamorous work of civilisation',
      'following the trails that people like you cut first.',
    ],
    closingAlive: [
      '',
      'Near the end of your life you look at a current sector map.',
      'You recognise most of the system names.',
      'A few of them you chose yourself.',
      'It is not a bad thing to leave behind.',
    ],
    closingDead: [
      '',
      'You never saw how far it went.',
      'But the trails you cut are still there.',
      'People are living on planets you named.',
      'It is not a bad thing to leave behind.',
    ],
  },
  // 6 — Corporate consolidation
  {
    lines: [
      'Over the decades the independent prospector trade quietly disappears.',
      'The company absorbs the contracts, the routes, the survey databases.',
      'What you did as a freelancer is now done by automated drones',
      'under a corporate flag.',
      '',
      'The sector you mapped is profitable. Very profitable.',
      'All of it built on the work of people like you,',
      'when none of it existed yet.',
    ],
    closingAlive: [
      '',
      'You watch the news from your chair.',
      'History will not record your name.',
      'The coordinates still work.',
    ],
    closingDead: [
      '',
      'You never lived to see what they built on top of your work.',
      'History will not record your name.',
      'The coordinates still work.',
    ],
  },
];

// Closing lines shown after the outcome body, varies by whether captain survived retirement.
// Alive = natural end of life. Dead = killed shortly after retiring (noEpilogue endings).
const HUMANITY_CODAS_ALIVE = [
  'And you finally pass on to the next adventure, one you will never return from.',
  'And then, as it does for everyone, the next adventure comes for you too.',
  'You close your eyes for the last time with no regrets worth naming.',
  'The next adventure, you have always suspected, will not be in space.',
  '— T H E   E N D —',
];

const HUMANITY_CODAS_DEAD = [
  'The stars do not mourn. But the sector remembers.',
  'Somewhere out there, a ship is following a route you plotted. It always will be.',
  'You did not live long enough to see what you started. Few people do.',
  '— T H E   E N D —',
];

// Dead function — not called anywhere yet.
// Wire: add 'retire_humanity' confirm state between retire_story and G.retired=true.
// In drawBaseOverlay: add case for b.confirm==='retire_humanity', call this function.
// In keydown: retire_story → retire_humanity → G.retired=true.
function drawRetirementHumanityScreen() { // eslint-disable-line no-unused-vars
  const cw = canvas.width, ch = canvas.height;
  const dead = !!G.retirementNoEpilogue;

  ctx.fillStyle = 'rgba(0,10,30,0.97)'; ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#001830'; ctx.fillRect(0, 0, cw, 6);
  ctx.fillStyle = '#003060'; ctx.fillRect(0, 6, cw, 2);

  const cx = cw / 2;
  ctx.textAlign = 'center';

  ctx.font = 'bold 22px Courier New'; ctx.fillStyle = '#445566';
  ctx.fillText('— THE WORLD YOU LEAVE BEHIND —', cx, 48);
  ctx.fillStyle = '#112233'; ctx.fillRect(cx - 320, 60, 640, 1);

  const outcome  = HUMANITY_OUTCOMES[G.retirementHumanityIdx ?? 0] || HUMANITY_OUTCOMES[0];
  const codaPool = dead ? HUMANITY_CODAS_DEAD : HUMANITY_CODAS_ALIVE;
  const coda     = codaPool[G.retirementHumanityCodaIdx % codaPool.length] || codaPool[0];
  const closing  = dead ? outcome.closingDead : outcome.closingAlive;

  // Render shared body + appropriate closing as one continuous block
  const allLines = [...outcome.lines, ...closing];
  let y = 82;
  const lineMax = 64;
  for (const rawLine of allLines) {
    if (rawLine === '') { y += 12; continue; }
    const words = rawLine.split(' ');
    let cur = '', wrapped = [];
    for (const w of words) { if ((cur + w).length > lineMax) { wrapped.push(cur.trim()); cur = ''; } cur += w + ' '; }
    if (cur.trim()) wrapped.push(cur.trim());
    ctx.font = '16px Courier New'; ctx.fillStyle = '#8899aa';
    for (const wl of wrapped) { ctx.fillText(wl, cx, y); y += 22; }
  }

  y += 10;
  ctx.fillStyle = '#112233'; ctx.fillRect(cx - 320, y, 640, 1);
  y += 22;
  ctx.font = '14px Courier New'; ctx.fillStyle = '#445566';
  ctx.fillText(coda, cx, y);

  ctx.font = 'bold 15px Courier New'; ctx.fillStyle = '#ffe066';
  ctx.fillText('[ ENTER ]  See your career stats', cx, ch - 30);
  ctx.textAlign = 'left';
}

