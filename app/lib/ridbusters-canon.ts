export type CanonChunk = {
  id: string
  chapter?: number
  characters: string[]
  locations: string[]
  topics: string[]
  spoilerLevel: 1 | 2 | 3
  text: string
}

export const RIDBUSTERS_CANON: CanonChunk[] = [
  {
    id: "team_core",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["team", "ridbusters", "friends"],
    spoilerLevel: 1,
    text: `
Ridbusters is a trio of friends in London: Maya Valdes, Ryan Patel, and Ella Fox.
They are curious, brave, and willing to follow strange clues others ignore.
Their friendship is the emotional core of the story.
`.trim(),
  },

  {
    id: "maya_character_intro",
    chapter: 1,
    characters: ["Maya"],
    locations: ["London"],
    topics: ["maya", "character", "leader"],
    spoilerLevel: 1,
    text: `
Maya Valdes is thirteen, observant, brave, and naturally leader-like.
She likes mysteries and often senses when something is important before the others do.
Even when she feels fear, she stays focused.
`.trim(),
  },

  {
    id: "ryan_character_intro",
    chapter: 1,
    characters: ["Ryan"],
    locations: ["London"],
    topics: ["ryan", "character", "mechanisms"],
    spoilerLevel: 1,
    text: `
Ryan Patel is thoughtful, technical, and practical.
He notices structural details, studies objects carefully, and is drawn to mechanisms,
devices, and logical explanations.
`.trim(),
  },

  {
    id: "ella_character_intro",
    chapter: 1,
    characters: ["Ella"],
    locations: ["London"],
    topics: ["ella", "character", "curiosity"],
    spoilerLevel: 1,
    text: `
Ella Fox is expressive, curious, energetic, and emotionally vivid.
She reacts quickly, speaks vividly, and often pushes the group toward action.
`.trim(),
  },

  {
    id: "summer_vacation_start",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["summer", "vacation", "beginning"],
    spoilerLevel: 1,
    text: `
The story begins on the first day of summer vacation.
The three friends have just finished the school year and feel excited by their freedom.
`.trim(),
  },

  {
    id: "maya_new_house",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella", "Christian Valdes"],
    locations: ["Maya's house"],
    topics: ["house", "new house", "old house"],
    spoilerLevel: 1,
    text: `
Maya invites Ryan and Ella to see her family's new house.
It is described as the oldest house on the street, with an old exterior and a renovated interior.
`.trim(),
  },

  {
    id: "attic_entry",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["Maya's house", "attic"],
    topics: ["attic", "exploration", "discovery"],
    spoilerLevel: 1,
    text: `
The friends go up to the attic together because they expect it may contain something unusual.
The attic becomes the first real mystery-space of the story.
`.trim(),
  },

  {
    id: "attic_old_objects",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["attic"],
    topics: ["old objects", "boxes", "dust", "history"],
    spoilerLevel: 1,
    text: `
Inside the attic they find dust, old things, forgotten storage, and the atmosphere of a sealed past.
The place feels like it has been waiting a long time for someone to uncover its secrets.
`.trim(),
  },

  {
    id: "folder_confidential",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["attic"],
    topics: ["folder", "documents", "confidential", "1924"],
    spoilerLevel: 1,
    text: `
The most important attic find is a dusty folder marked:
“To Prime Minister Ramsay MacDonald. Confidential. July 12, 1924.”
This discovery turns attic exploration into a serious investigation.
`.trim(),
  },

  {
    id: "dalton_letter_intro",
    chapter: 1,
    characters: ["Thomas J. Dalton"],
    locations: ["London"],
    topics: ["dalton", "letter", "prime minister"],
    spoilerLevel: 1,
    text: `
Inside the folder is a letter from Thomas J. Dalton to Prime Minister Ramsay MacDonald.
The letter is one of the core pieces of evidence in the mystery.
`.trim(),
  },

  {
    id: "dalton_worked_for_verrard",
    chapter: 1,
    characters: ["Thomas J. Dalton", "Professor Verrard"],
    locations: ["London"],
    topics: ["dalton", "verrard", "engineer", "work"],
    spoilerLevel: 1,
    text: `
Dalton explains that he worked for Professor Verrard.
This establishes a direct historical link between the scientist, the machine, and the documents.
`.trim(),
  },

  {
    id: "machine_water_threat",
    chapter: 1,
    characters: ["Thomas J. Dalton", "Professor Verrard"],
    locations: ["London"],
    topics: ["machine", "water", "threat", "poison"],
    spoilerLevel: 1,
    text: `
Dalton warns that the Oblivion Machine was intended to poison London's water supply.
This reveals that the machine is not just strange technology but a weapon.
`.trim(),
  },

  {
    id: "water_tower_connection",
    chapter: 1,
    characters: ["Thomas J. Dalton", "Professor Verrard"],
    locations: ["London", "water tower"],
    topics: ["tower", "water tower", "location"],
    spoilerLevel: 1,
    text: `
Dalton's materials connect Professor Verrard's work to one of London's water towers.
This becomes the foundation for the later search for the machine.
`.trim(),
  },

  {
    id: "blueprints_and_notes",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["attic"],
    topics: ["blueprints", "notes", "drawings", "artifact"],
    spoilerLevel: 1,
    text: `
The folder includes notes, technical sketches, and old materials that suggest a larger hidden system.
Ryan is especially drawn to the mechanical details.
`.trim(),
  },

  {
    id: "chapter1_mood_shift",
    chapter: 1,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["attic"],
    topics: ["mood", "mystery", "danger"],
    spoilerLevel: 1,
    text: `
What begins as an exciting attic exploration quickly becomes unsettling.
The children realize they may have stumbled into something much bigger and more dangerous than expected.
`.trim(),
  },

  {
    id: "maya_dream_dog",
    chapter: 2,
    characters: ["Maya", "Pegas", "Professor Verrard"],
    locations: ["dream space"],
    topics: ["dream", "dog", "maya", "vision"],
    spoilerLevel: 1,
    text: `
That night Maya has a strange dream in a flooded underground place.
A large white dog appears and seems intelligent, calm, and meaningful rather than threatening.
Professor Verrard is also present in the dream, distant and mysterious.
`.trim(),
  },

  {
    id: "chain_in_dream",
    chapter: 2,
    characters: ["Maya", "Pegas"],
    locations: ["dream space"],
    topics: ["chain", "dream", "underground"],
    spoilerLevel: 1,
    text: `
In Maya's dream the dog leads her to a massive hanging chain.
The chain feels important, as if it is connected to a hidden mechanism or route.
`.trim(),
  },

  {
    id: "whirlpool_dream",
    chapter: 2,
    characters: ["Maya", "Pegas"],
    locations: ["dream space"],
    topics: ["whirlpool", "dream", "water"],
    spoilerLevel: 1,
    text: `
When Maya pulls the chain in the dream, a round opening appears and the water begins to swirl.
The moment feels symbolic and later turns out to be connected to real events.
`.trim(),
  },

  {
    id: "dog_becomes_puppy",
    chapter: 2,
    characters: ["Maya", "Pegas"],
    locations: ["dream space"],
    topics: ["dog", "puppy", "dream"],
    spoilerLevel: 1,
    text: `
At the end of the dream the large dog becomes a puppy in Maya's arms.
This detail makes the dream emotional and mysterious rather than purely frightening.
`.trim(),
  },

  {
    id: "maya_feels_dream_real",
    chapter: 2,
    characters: ["Maya"],
    locations: ["Maya's house"],
    topics: ["dream", "maya", "feelings"],
    spoilerLevel: 1,
    text: `
When Maya wakes up, the dream feels unusually real.
She senses that it may not be random and that the dog might be trying to guide her.
`.trim(),
  },

  {
    id: "library_research_start",
    chapter: 2,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["Central Library"],
    topics: ["library", "research", "archives"],
    spoilerLevel: 1,
    text: `
The children continue the investigation in the Central Library of London.
They search physical archives rather than digital databases, especially newspaper bundles from 1924.
`.trim(),
  },

  {
    id: "daily_telegraph_bundles",
    chapter: 2,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["Central Library"],
    topics: ["daily telegraph", "newspapers", "1924"],
    spoilerLevel: 1,
    text: `
In the library the children work through old Daily Telegraph bundles from March, April, and May 1924.
The investigation depends on forgotten paper records from the past.
`.trim(),
  },

  {
    id: "arnold_first_appearance",
    chapter: 2,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["Central Library"],
    topics: ["arnold", "librarian", "first appearance"],
    spoilerLevel: 1,
    text: `
Arnold Jansen first appears as a librarian in the Central Library.
He seems calm, knowledgeable, and slightly reserved.
`.trim(),
  },

  {
    id: "arnold_appearance_details",
    chapter: 2,
    characters: ["Arnold Jansen"],
    locations: ["Central Library"],
    topics: ["arnold", "appearance", "scar", "glasses"],
    spoilerLevel: 1,
    text: `
Arnold is described as an older man with gray hair, round glasses, and a noticeable scar.
He looks more distinctive than an ordinary background librarian.
`.trim(),
  },

  {
    id: "dalton_article_found",
    chapter: 2,
    characters: ["Maya", "Ryan", "Ella", "Thomas J. Dalton"],
    locations: ["Central Library", "Daily Telegraph archive"],
    topics: ["dalton", "article", "death"],
    spoilerLevel: 1,
    text: `
The children discover a Daily Telegraph article about the mysterious death of Thomas J. Dalton.
This proves he was a real historical person and not just a name in a hidden letter.
`.trim(),
  },

  {
    id: "dalton_article_details",
    chapter: 2,
    characters: ["Thomas J. Dalton"],
    locations: ["London"],
    topics: ["dalton", "warehouse", "death", "article"],
    spoilerLevel: 1,
    text: `
The article says Dalton disappeared and was later found dead in an abandoned warehouse.
The circumstances suggest that he may have been silenced.
`.trim(),
  },

  {
    id: "dalton_date_link",
    chapter: 2,
    characters: ["Thomas J. Dalton"],
    locations: ["London"],
    topics: ["dalton", "dates", "1924"],
    spoilerLevel: 1,
    text: `
The dates in the newspaper article line up with the timeline suggested by Dalton's letter.
This strengthens the credibility of the attic documents.
`.trim(),
  },

  {
    id: "dog_drawing_significance",
    chapter: 2,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["Central Library"],
    topics: ["dog", "drawing", "symbol"],
    spoilerLevel: 1,
    text: `
The children pay attention to a dog-related sign or drawing connected to the investigation.
Maya especially feels it is not a coincidence and may point toward a hidden pattern.
`.trim(),
  },

  {
    id: "croningen_tower_history",
    chapter: 3,
    characters: [],
    locations: ["Croningen Water Tower", "Waterworks Road", "Thames"],
    topics: ["croningen", "tower", "history"],
    spoilerLevel: 2,
    text: `
The Croningen Water Tower stands on Waterworks Road by the Thames.
It was built in 1879, once served the city's water system, and later became obsolete.
`.trim(),
  },

  {
    id: "tower_private_company_1920s",
    chapter: 3,
    characters: [],
    locations: ["Croningen Water Tower"],
    topics: ["tower", "1920s", "private company"],
    spoilerLevel: 2,
    text: `
In the 1920s the tower was acquired by a private company.
There were plans to use it for a new technical purpose, but the project was abandoned.
`.trim(),
  },

  {
    id: "tower_modern_reconstruction",
    chapter: 3,
    characters: [],
    locations: ["Croningen Water Tower"],
    topics: ["tower", "reconstruction", "offices"],
    spoilerLevel: 2,
    text: `
Roughly twenty years before the story, the tower was partly reconstructed.
An elevator was added and the building was converted into a structure with many small offices.
`.trim(),
  },

  {
    id: "tower_top_floor_inaccessible",
    chapter: 3,
    characters: [],
    locations: ["Croningen Water Tower"],
    topics: ["top floor", "locked door", "tower"],
    spoilerLevel: 2,
    text: `
The top part of the tower remains inaccessible.
The elevator does not go all the way up, and the staircase ends at a locked door.
`.trim(),
  },

  {
    id: "nox_with_documents",
    chapter: 3,
    characters: ["Nox", "Arnold Jansen", "Verrard"],
    locations: ["Croningen Water Tower"],
    topics: ["nox", "documents", "tower", "villains"],
    spoilerLevel: 2,
    text: `
In the tower Nox studies the stolen documents together with others.
This shows that the enemy is organized and already moving faster than the children.
`.trim(),
  },

  {
    id: "nox_role_established",
    chapter: 3,
    characters: ["Nox", "Verrard"],
    locations: ["Croningen Water Tower"],
    topics: ["nox", "villain", "right hand"],
    spoilerLevel: 2,
    text: `
Nox is not acting alone.
She is a trusted operative serving Verrard and carrying out dangerous tasks with precision.
`.trim(),
  },

  {
    id: "verrard_present_day_villain",
    chapter: 3,
    characters: ["Verrard", "Nox"],
    locations: ["Croningen Water Tower"],
    topics: ["verrard", "villain", "family"],
    spoilerLevel: 2,
    text: `
The modern antagonist is a man calling himself Verrard.
He continues the legacy of Professor Verrard and treats the old machine as a family inheritance.
`.trim(),
  },

  {
    id: "missing_piece_search",
    chapter: 3,
    characters: ["Verrard", "Nox"],
    locations: ["Croningen Water Tower"],
    topics: ["key", "missing piece", "machine"],
    spoilerLevel: 2,
    text: `
The villains have documents and information, but they are still searching for a missing activation component.
This missing piece is one of the reasons the children still have a chance to stop them.
`.trim(),
  },

  {
    id: "library_backpack_stolen",
    chapter: 4,
    characters: ["Maya", "Ryan", "Ella", "Nox"],
    locations: ["library", "London"],
    topics: ["backpack", "theft", "documents"],
    spoilerLevel: 2,
    text: `
The children's backpack containing the documents is stolen.
This becomes a major turning point because the investigation turns into a direct conflict.
`.trim(),
  },

  {
    id: "children_feel_hunted",
    chapter: 4,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["danger", "fear", "pursuit"],
    spoilerLevel: 2,
    text: `
After the theft, the children understand that someone is actively tracking their investigation.
They are no longer only researching the past, they are being opposed in the present.
`.trim(),
  },

  {
    id: "ridbusters_beginning",
    chapter: 5,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["ridbusters", "team name", "identity"],
    spoilerLevel: 1,
    text: `
The idea of Ridbusters becomes more defined as a team identity.
The children begin acting not just as friends in trouble, but as a real mystery-solving group.
`.trim(),
  },

  {
    id: "pegas_as_guide",
    chapter: 6,
    characters: ["Pegas", "Maya", "Ryan", "Ella"],
    locations: ["underground tunnels"],
    topics: ["pegas", "guide", "dog"],
    spoilerLevel: 2,
    text: `
The dog behaves not like a random animal but like a guide who knows the route.
This matches Maya's dream and strengthens the sense that the dream contained real clues.
`.trim(),
  },

  {
    id: "arnold_injured_found",
    chapter: 8,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella", "Pegas"],
    locations: ["underground tunnels"],
    topics: ["arnold", "injured", "tunnels"],
    spoilerLevel: 2,
    text: `
In the tunnels the children find Arnold injured.
This changes his role from suspicious librarian to someone directly involved in the larger conflict.
`.trim(),
  },

  {
    id: "chain_found_real",
    chapter: 8,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["underground tunnels"],
    topics: ["chain", "dream", "real clue"],
    spoilerLevel: 2,
    text: `
The massive chain Maya saw in her dream is found in real life hanging above them.
This confirms that her dream contained a genuine clue rather than random imagination.
`.trim(),
  },

  {
    id: "arnold_reveals_ross",
    chapter: 8,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["underground tunnels"],
    topics: ["arnold", "ross", "reveal"],
    spoilerLevel: 3,
    text: `
Arnold finally reveals that he is an agent of ROSS,
the Royal Office of Strategic Surveillance, a secret organization dealing with dangerous hidden threats.
`.trim(),
  },

  {
    id: "arnold_not_ordinary_librarian",
    chapter: 8,
    characters: ["Arnold Jansen"],
    locations: ["London"],
    topics: ["arnold", "agent", "identity"],
    spoilerLevel: 3,
    text: `
Arnold was never only a librarian.
His library role was partly a cover connected to his work monitoring suspicious historical traces and artifacts.
`.trim(),
  },

  {
    id: "arnold_fire_alarm_truth",
    chapter: 8,
    characters: ["Arnold Jansen", "Nox"],
    locations: ["Central Library"],
    topics: ["alarm", "theft", "arnold", "nox"],
    spoilerLevel: 3,
    text: `
Arnold admits that he triggered a test fire alarm from his computer in the library.
That alarm created the opportunity for Nox to steal the backpack with the documents.
`.trim(),
  },

  {
    id: "arnold_moral_ambiguity",
    chapter: 8,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["underground tunnels"],
    topics: ["betrayal", "trust", "arnold"],
    spoilerLevel: 3,
    text: `
Arnold's confession makes him morally complicated.
He was trying to control the danger, but his actions still betrayed the children and put them at risk.
`.trim(),
  },

  {
    id: "pump_station_five",
    chapter: 8,
    characters: ["Arnold Jansen", "Nox"],
    locations: ["Pump Station Five"],
    topics: ["pump station five", "shaft", "trap"],
    spoilerLevel: 3,
    text: `
Arnold explains that Nox directed events around Pump Station Five.
The plan involved intercepting the children and throwing them into a shaft.
`.trim(),
  },

  {
    id: "chain_pulled",
    chapter: 9,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["underground tunnels"],
    topics: ["chain", "mechanism", "escape"],
    spoilerLevel: 2,
    text: `
When the chain is pulled with great effort, it activates a hidden mechanical response.
This proves that the underground system is connected to an old working mechanism.
`.trim(),
  },

  {
    id: "hidden_opening_escape",
    chapter: 9,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["underground tunnels", "outside"],
    topics: ["escape", "hidden door", "sunlight"],
    spoilerLevel: 2,
    text: `
The chain eventually helps open a route to the outside.
After long darkness underground, the children and Arnold finally emerge into light and fresh air.
`.trim(),
  },

  {
    id: "london_silence",
    chapter: 10,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["London"],
    topics: ["silence", "city", "chaos"],
    spoilerLevel: 2,
    text: `
London suddenly falls into an eerie silence.
The city feels deserted and unnatural, as if normal life has been switched off.
`.trim(),
  },

  {
    id: "verrard_broadcast",
    chapter: 10,
    characters: ["Verrard"],
    locations: ["London"],
    topics: ["broadcast", "verrard", "message"],
    spoilerLevel: 2,
    text: `
Verrard's message appears on screens across the city.
His voice dominates public displays and turns the crisis into a theatrical demonstration of control.
`.trim(),
  },

  {
    id: "communications_fail",
    chapter: 10,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["phones", "internet", "communications"],
    spoilerLevel: 2,
    text: `
Communication systems fail across London.
Phones, radio, and the internet stop working, making organized resistance much harder.
`.trim(),
  },

  {
    id: "panic_in_london",
    chapter: 10,
    characters: [],
    locations: ["London"],
    topics: ["panic", "crowds", "city chaos"],
    spoilerLevel: 2,
    text: `
Panic spreads through the city.
People flee, supermarkets are raided, transport stops functioning, and London descends into chaos.
`.trim(),
  },

  {
    id: "stop_machine_decision",
    chapter: 10,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["London"],
    topics: ["decision", "stop machine"],
    spoilerLevel: 2,
    text: `
The group understands that escape is not enough.
They conclude that the only meaningful option is to stop the Oblivion Machine itself.
`.trim(),
  },

  {
    id: "kids_refuse_to_leave",
    chapter: 11,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen"],
    locations: ["London"],
    topics: ["courage", "choice", "stay"],
    spoilerLevel: 2,
    text: `
Arnold wants the children to leave the city for safety,
but they refuse because they know they are already part of the only realistic chance to stop the disaster.
`.trim(),
  },

  {
    id: "firefighters_join",
    chapter: 11,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["firefighters", "allies"],
    spoilerLevel: 2,
    text: `
The group gains temporary allies in the form of firefighters.
This gives them practical support and makes the final push toward the tower possible.
`.trim(),
  },

  {
    id: "arnold_shows_id",
    chapter: 11,
    characters: ["Arnold Jansen"],
    locations: ["London"],
    topics: ["id", "ross", "agent"],
    spoilerLevel: 3,
    text: `
Arnold confirms his authority by showing official identification as a ROSS agent.
This transforms the way other adults respond to him.
`.trim(),
  },

  {
    id: "one_hour_deadline",
    chapter: 11,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["deadline", "time", "activation"],
    spoilerLevel: 2,
    text: `
There is a strict time limit before Verrard's machine fully activates.
The story enters a countdown structure and every decision becomes more urgent.
`.trim(),
  },

  {
    id: "room_33",
    chapter: 12,
    characters: ["Arnold Jansen", "Maya", "Ryan", "Ella"],
    locations: ["Croningen Water Tower"],
    topics: ["room 33", "tower", "machine"],
    spoilerLevel: 2,
    text: `
The machine is believed to be in Room 33 inside the Croningen Water Tower.
This specific location becomes the final target of the mission.
`.trim(),
  },

  {
    id: "arnold_leg_reset",
    chapter: 12,
    characters: ["Arnold Jansen", "firefighter"],
    locations: ["London"],
    topics: ["injury", "leg", "medical"],
    spoilerLevel: 2,
    text: `
A firefighter resets Arnold's dislocated leg so he can continue.
The scene emphasizes pain, urgency, and Arnold's determination.
`.trim(),
  },

  {
    id: "machine_room_revealed",
    chapter: 12,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen", "Verrard", "Nox"],
    locations: ["Croningen Water Tower"],
    topics: ["machine room", "oblivion machine", "green liquid"],
    spoilerLevel: 2,
    text: `
Inside the tower the machine room is finally revealed.
It contains preserved pumps, pipes, a central control structure, and tanks filled with glowing green toxic liquid.
`.trim(),
  },

  {
    id: "machine_activation_slot",
    chapter: 12,
    characters: ["Verrard"],
    locations: ["Croningen Water Tower"],
    topics: ["activation", "slot", "missing piece"],
    spoilerLevel: 2,
    text: `
The machine has a circular recess or slot for the missing activation piece.
This confirms Dalton's clue that a critical component had been hidden.
`.trim(),
  },

  {
    id: "nox_during_finale",
    chapter: 12,
    characters: ["Nox"],
    locations: ["Croningen Water Tower"],
    topics: ["nox", "final confrontation"],
    spoilerLevel: 2,
    text: `
Nox remains dangerous and fully active during the final confrontation.
She operates as Verrard's fast and deadly enforcer.
`.trim(),
  },

  {
    id: "submarine_escape_setup",
    chapter: 12,
    characters: ["Verrard", "Nox"],
    locations: ["harbor", "Croningen Water Tower"],
    topics: ["submarine", "cable", "escape"],
    spoilerLevel: 3,
    text: `
A cable leads from the tower area toward a hidden submarine in the harbor.
This shows that Verrard prepared an escape long before the confrontation began.
`.trim(),
  },

  {
    id: "verrard_escapes",
    chapter: 12,
    characters: ["Verrard", "Nox"],
    locations: ["harbor"],
    topics: ["verrard", "nox", "escape", "submarine"],
    spoilerLevel: 3,
    text: `
Verrard and Nox escape by submarine.
The escape makes the ending feel unresolved and dangerous.
`.trim(),
  },

  {
    id: "countdown_console",
    chapter: 13,
    characters: ["Maya", "Ryan", "Ella", "firefighter"],
    locations: ["Croningen Water Tower"],
    topics: ["countdown", "console", "timer"],
    spoilerLevel: 2,
    text: `
A digital countdown on the machine makes the danger visible and immediate.
The characters can literally watch the remaining time disappear.
`.trim(),
  },

  {
    id: "ryan_mechanical_attempts",
    chapter: 13,
    characters: ["Ryan", "firefighter"],
    locations: ["Croningen Water Tower"],
    topics: ["ryan", "mechanical", "stop machine"],
    spoilerLevel: 2,
    text: `
Ryan focuses intensely on how the machine works and how it might be jammed or disabled.
Mechanical logic becomes central in the attempt to stop the system.
`.trim(),
  },

  {
    id: "pipe_jam_fails",
    chapter: 13,
    characters: ["firefighter", "Ryan", "Maya", "Ella"],
    locations: ["Croningen Water Tower"],
    topics: ["pipe", "gears", "failure"],
    spoilerLevel: 2,
    text: `
A desperate attempt is made to jam the machine using a metal pipe.
For a moment it seems to work, but the machine throws the pipe aside and keeps going.
`.trim(),
  },

  {
    id: "hope_nearly_lost",
    chapter: 13,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["Croningen Water Tower"],
    topics: ["despair", "countdown", "feelings"],
    spoilerLevel: 2,
    text: `
As the countdown continues, the group begins to feel that they may not be able to stop the machine in time.
The emotional pressure becomes intense.
`.trim(),
  },

  {
    id: "maya_bridge_memory",
    chapter: 14,
    characters: ["Maya", "Christian Valdes"],
    locations: ["Croningen Water Tower", "London"],
    topics: ["maya", "father", "water", "insight"],
    spoilerLevel: 2,
    text: `
In the final crisis Maya remembers things her father taught her about London's old bridges, canals, and water systems.
This memory gives her a practical idea when others are running out of options.
`.trim(),
  },

  {
    id: "power_of_water_solution",
    chapter: 14,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen", "firefighters"],
    locations: ["Croningen Water Tower"],
    topics: ["water", "solution", "machine"],
    spoilerLevel: 3,
    text: `
The final solution depends on understanding water itself rather than only the machine's metal parts.
The title “The Power of Water” reflects this shift in thinking.
`.trim(),
  },

  {
    id: "pegas_attacks_nox",
    chapter: 14,
    characters: ["Pegas", "Nox"],
    locations: ["Croningen Water Tower"],
    topics: ["pegas", "nox", "attack"],
    spoilerLevel: 3,
    text: `
During the final confrontation Pegas attacks Nox and bites her wrist.
This creates a crucial moment of disruption.
`.trim(),
  },

  {
    id: "machine_stopped",
    chapter: 14,
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen", "firefighters"],
    locations: ["Croningen Water Tower"],
    topics: ["machine stopped", "victory", "london saved"],
    spoilerLevel: 3,
    text: `
The Oblivion Machine is ultimately stopped before it can fully destroy London.
The city is saved at the last possible moment.
`.trim(),
  },

  {
    id: "kids_as_heroes",
    chapter: 14,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["heroes", "ending", "recognition"],
    spoilerLevel: 3,
    text: `
By the end of the story Maya, Ryan, and Ella are recognized as heroes of London.
Their courage and persistence become publicly visible.
`.trim(),
  },

  {
    id: "arnold_in_shadows",
    chapter: 14,
    characters: ["Arnold Jansen"],
    locations: ["London", "Croningen Water Tower"],
    topics: ["arnold", "ending", "shadows"],
    spoilerLevel: 3,
    text: `
Arnold remains a hidden figure rather than a public hero.
His contribution is real, but much of his work stays outside the spotlight.
`.trim(),
  },

  {
    id: "future_adventures_teased",
    chapter: 14,
    characters: ["Maya", "Ryan", "Ella"],
    locations: ["London"],
    topics: ["future", "series", "next mission"],
    spoilerLevel: 1,
    text: `
The ending clearly suggests that this is not the final Ridbusters mission.
The team has survived its first major case, and more adventures are still ahead.
`.trim(),
  },

  {
    id: "maya_emotional_arc",
    characters: ["Maya"],
    locations: ["London"],
    topics: ["maya", "feelings", "arc"],
    spoilerLevel: 2,
    text: `
Maya's emotional arc combines fear, intuition, and responsibility.
She is frightened at times, but she keeps moving and often turns panic into action.
`.trim(),
  },

  {
    id: "ryan_emotional_arc",
    characters: ["Ryan"],
    locations: ["London"],
    topics: ["ryan", "feelings", "arc"],
    spoilerLevel: 2,
    text: `
Ryan's emotional arc is expressed through concentration rather than dramatic speech.
When situations become critical, he focuses harder on logic, devices, timing, and structure.
`.trim(),
  },

  {
    id: "ella_emotional_arc",
    characters: ["Ella"],
    locations: ["London"],
    topics: ["ella", "feelings", "arc"],
    spoilerLevel: 2,
    text: `
Ella's emotional arc is vivid and outward.
She openly reacts to shock, fear, and hope, which gives the group emotional energy and honesty.
`.trim(),
  },

  {
    id: "pegas_symbolic_role",
    characters: ["Pegas", "Maya"],
    locations: ["dream space", "underground tunnels", "tower"],
    topics: ["pegas", "symbol", "guide"],
    spoilerLevel: 2,
    text: `
Pegas is more than a dog in the story.
He acts as a guide and a bridge between Maya's dream and reality.
`.trim(),
  },

  {
    id: "oblivion_machine_core_meaning",
    characters: ["Professor Verrard", "Verrard"],
    locations: ["Croningen Water Tower"],
    topics: ["oblivion machine", "meaning", "threat"],
    spoilerLevel: 2,
    text: `
The Oblivion Machine is both a technical weapon and a symbol of controlled destruction.
It represents an attempt to dominate an entire city through hidden infrastructure.
`.trim(),
  },

  {
    id: "story_genre_identity",
    characters: ["Maya", "Ryan", "Ella", "Arnold Jansen", "Nox", "Verrard"],
    locations: ["London"],
    topics: ["genre", "mystery", "adventure"],
    spoilerLevel: 1,
    text: `
Ridbusters: Mission London is a teen mystery adventure set in London.
It combines old documents, hidden infrastructure, underground routes, historical secrets, and a modern threat.
`.trim(),
  },
]