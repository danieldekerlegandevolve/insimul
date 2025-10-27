/**
 * Seed Grammars - Ported from Kismet
 *
 * These are pre-built Tracery grammars for various narrative themes.
 * Originally from the Kismet engine's barbarians.tracery, fantasy.tracery,
 * edwardian.tracery, and north_america.tracery files.
 */

export const seedGrammars = [
  {
    name: "barbarian_names",
    description: "Syllable-based barbarian name generation",
    grammar: {
      origin: ["#names#"],
      names: ["#firstNames# #lastNames#"],
      firstNames: ["#syllable.capitalize##syllable#", "#syllable.capitalize##syllable##syllable#"],
      syllable: ["tor", "rag", "dar", "nan", "dor", "dag", "tar", "nor", "nag", "nar", "sul", "kul", "kin", "sin", "kas", "ras", "hil", "hul", "hun"],
      lastNames: ["#syllable.capitalize##syllable#", "#syllable.capitalize##syllable##syllable#", "of #firstNames#", "the #animal#"],
      animal: ["Spider", "Lion", "Tiger", "Shrew", "Hawk", "Mongoose", "Wombat", "Bear", "Fox", "Wolf", "Fawn"]
    },
    tags: ["names", "barbarian", "fantasy"],
    isActive: true
  },

  {
    name: "fantasy_names",
    description: "Fantasy-themed name generation with weather, colors, and syllables",
    grammar: {
      origin: ["#firstNames# #lastNames#"],
      firstNames: ["#1900s#", "#weather#", "#syllable1##syllable2#", "#syllable1##syllable2#", "#syllable1##syllable2#"],
      lastNames: ["#1900s#", "#adjnoun#", "#syllable1##syllable2#", "#syllable1##syllable2#", "#syllable1##syllable2#"],
      syllable1: ["Ban", "Bai", "Bar", "Pal", "Por", "Kef", "Sef", "Seif", "Zem", "Zer", "Ry", "Tell", "Vi", "Qui", "Frey", "Ro", "Bran", "Co", "Ka", "Ce", "Ka", "Ter", "Stra", "Cel", "Sha", "Sa", "Cy", "Ga", "Mo", "Se", "Da", "Le", "Let", "Atre", "Tif", "Aer", "Bar", "Uma", "Go", "Zi", "Stein", "Ri", "Sel", "Quis", "Ki", "Ed", "Ad", "Od", "Yu", "Ti", "Wa", "Ri", "Au", "Va", "Fr", "Pen", "Ash", "Ow", "Chadar"],
      syllable2: ["on", "gan", "om", "om", "ka", "er", "oth", "us", "omu", "dia", "ah", "vi", "na", "a", "sa", "ford", "le", "in", "cil", "ang", "ra", "go", "es", "dow", "bin", "an", "au", "og", "tzer", "ryl", "o", "a", "ah", "yu", "ides", "a", "ith", "is", "rett", "ro", "go", "dane", "er", "noa", "phie", "tis", "ros", "ea", "el", "ine", "na", "dus", "ka", "ku", "an", "an", "elo", "elia", "zer", "nook"],
      "1900s": ["Solis", "Pylae", "Floresta", "Silva", "Morte", "Vida", "Vita", "Arvore", "Arbor", "Rocha", "Saxum", "Mons", "Ocea", "Cielo", "Ceu", "Caelum", "Russet", "Tawny", "Abalone", "Jade", "Carmine", "Mortuum", "Falu", "Pearl", "Umber", "Ochre", "Ecru", "Saffron", "Eigengrau", "Fuchsia", "Scarlet", "Maroon", "Rosewood", "Magnolia", "Chiffon", "Alabaster", "Heliotrope", "Byanztium", "Chiffon", "Powder", "Sand", "Rust", "Jasper", "Calamine", "Thistle", "Cerise", "Tyrian", "Azure", "Cerulean", "Aegean", "Chatreuse", "Viridian", "Laurel", "Sable", "Fallow", "Citrine", "Persimmon", "Argent", "Pewter", "Sepia", "Damask", "Smalt", "Cattleya", "Jacaranda", "Puce", "Titian", "Verdigris", "Feldgrau", "Skobeloff", "Vermillion", "Mauve", "Coquelicot", "Gamboge", "Burlywood", "Aureolin", "Celadon", "Glaucous"],
      adjnoun: ["#adjective##noun#", "#animal##noun#"],
      adjective: ["Caelum", "Pylae", "Morte", "Death", "Life", "High", "Clear", "Bright", "Shining", "Dark", "Night", "Nox", "Luna", "Noct", "Sol", "Terra", "Earth", "Tree", "Arbor"],
      noun: ["moon", "wind", "sun", "hart", "heart", "soul", "walker", "runner", "hunter", "venator", "ingredior", "cursor", "stalker", "fighter"],
      animal: ["Adel", "Adler", "Andor", "Aqualina", "Ari", "Ariella", "Aries", "Arno", "Arva", "Ava", "Ayala", "Barend", "Barrett", "Berend", "Bertram", "Bram", "Brena", "Bronco", "Calandra", "Castor", "Colt", "Columbine", "Conall", "Corbett", "Delphine", "Dolf", "Dorcas", "Dov", "Drake", "Eden", "Falk", "Fox", "Gawain", "Hawk", "Hawkins", "Hinda", "Jackal", "Lark", "Leandra", "Leo", "Leona", "Lionel", "Loni", "Merle", "Merlyn", "Newt", "Orpah", "Orsa", "Orsen", "Osborn", "Paloma", "Raynard", "Roswald", "Tahatan", "Ursel", "Wolfe"],
      weather: ["Aero", "Air", "Alto", "Anvil", "Blizzard", "Blow", "Breeze", "Calm", "Chill", "Cirro", "Cirrus", "Col", "Coriolis", "Crest", "Cumulo", "Cumulus", "Cyclone", "Derecho", "Dew", "Doldrum", "Downburst", "Drizzle", "Drought", "Eddy", "Flood", "Flumen", "Flurry", "Fog", "Fractus", "Freeze", "Front", "Frost", "Frost", "Gale", "Graupel", "Gust", "Hail", "Haze", "Hurricane", "Ice", "Jet", "Monsoon", "Murus", "Nacreous", "Nimbus", "Pannus", "Pileus", "Polar", "Rain", "Rainbow", "Raindrop", "Reshabar", "Ridge", "Rime", "Shower", "Sleet", "Slush", "Spindrift", "Storm", "Stratus", "Stream", "Thunder", "Tornado", "Typhoon", "Updraft", "Vapor", "Virga", "Wave", "Whirlwind", "Wind"]
    },
    tags: ["names", "fantasy", "weather"],
    isActive: true
  },

  {
    name: "fantasy_towns",
    description: "Fantasy town name generation",
    grammar: {
      origin: ["#town#"],
      town: ["#town_syllable1##town_syllable2#"],
      town_syllable1: ["Eag", "Za", "Gari", "Lio", "Go", "Lim", "Zelt", "Rio", "Yar", "Les", "Dor", "Alfi", "Reb", "Summer", "Gy", "Pal", "Al", "Alt", "Lest", "Tene", "Mel", "Gal", "Ga", "Nal", "Bhu", "Nar", "Fig", "Mob", "Nik", "Koh", "Jid", "Mar", "Zo", "Al", "Vec", "Tha", "Jun", "Nibel", "Wu", "Mid", "Bar", "Kai", "Fa", "Eb", "Kar", "Bal", "Shu", "Es", "Dol", "Lind", "Tre", "Bur", "Be", "Be", "Bod", "E", "Ja", "Ar", "Yus", "Pol"],
      town_syllable2: ["rose", "land", "land", "nel", "ug", "berry", "ennia", "vanes", "drow", "talia", "ter", "taria", "ena", "ville", "sahl", "oom", "tair", "tissia", "allum", "brae", "dacio", "din", "trea", "bina", "jerba", "she", "aro", "liz", "eah", "lingen", "oor", "anda", "zo", "brook", "tor", "masa", "on", "heim", "tai", "gar", "on", "po", "bul", "lan", "nak", "amb", "mi", "thar", "let", "blum", "no", "mecia", "said", "velle", "ham", "den", "gd", "yas", "naan", "tae"]
    },
    tags: ["places", "fantasy", "towns"],
    isActive: true
  },

  {
    name: "edwardian_names",
    description: "Edwardian-era historical names (male and female)",
    grammar: {
      origin: ["#firstNames# #lastNames#"],
      firstNames: ["Adela", "Adelaide", "Adeline", "Alexia", "Aline", "Alison", "Alma", "Althea", "Amabel", "Angela", "Annette", "Antoinette", "Audry", "Aveline", "Avice", "Babette", "Barbara", "Beatrice", "Beatrix", "Belinda", "Bernadine", "Bertha", "Beryl", "Blanche", "Brenda", "Bridget", "Bride", "Camilla", "Camille", "Carlina", "Carmela", "Catherine", "Cecile", "Cecilia", "Celia", "Celine", "Clarissa", "Charity", "Christabel", "Christina", "Clair", "Clare", "Claribel", "Clarice", "Clarimond", "Claudia", "Claudine", "Clementine", "Clothilde", "Colinette", "Cordelia", "Coriana", "Cornelia", "Cynthia", "Deborah", "Dinah", "Decima", "Diana", "Delora", "Dolores", "Dorette", "Dorothea", "Drusilla", "Dulce", "Dulcibella", "Dulcima", "Edna", "Eileen", "Aileen", "Eirene", "Irene", "Elaine", "Ellinor", "Eleonora", "Elfrida", "Elizabeth", "Elise", "Elissa", "Ella", "Elsa", "Elspeth", "Emeline", "Emelye", "Enid", "Ernestine", "Esmeralda", "Estelle", "Esther", "Ethelwyne", "Eugenia", "Eunice", "Evangeline", "Eve", "Evaline", "Evelyn", "Faith", "Franchette", "Felicia", "Felicity", "Fenella", "Feodora", "Flavia", "Florinda", "Floredice", "Floria", "Florise", "Florentina", "Francelia", "Frances", "Gabrielle", "Genevieve", "Gillian", "Ginevra", "Giralda", "Gladys", "Gretchen", "Griselda", "Gwendolen", "Gwyneth", "Gwynne", "Helen", "Hero", "Hermia", "Hermione", "Hilda", "Hildegarde", "Honor", "Hope", "Hortense", "Imorgen", "Inez", "Iris", "Irmentrude", "Ivy", "Janet", "Jean", "Joan", "Jocelyn", "Jessica", "Joyce", "Judith", "Julia", "Juliet", "Kathleen", "Karina", "Laura", "Laurette", "Lavinia", "Leila", "Lena", "Lenora", "Leonore", "Letitia", "Lettice", "Lilias", "Lilith", "Lisbet", "Lisette", "Lois", "Lola", "Lucia", "Lucille", "Lucinda", "Lucretia", "Lydia", "Mabel", "Madeline", "Magdalen", "Maisie", "Marcella", "Marcia", "Margaret", "Margherita", "Mariana", "Maureen", "Meta", "Meg", "Melina", "Melissa", "Melusine", "Mercy", "Mildred", "Milicent", "Minna", "Mona", "Monica", "Muriel", "Myra", "Myrtle", "Nancy", "Narisse", "Naomi", "Nina", "Nora", "Octavia", "Olga", "Olive", "Olivia", "Pamela", "Patience", "Patricia", "Patty", "Paula", "Paulette", "Pauline", "Peggy", "Penelope", "Petronia", "Philippa", "Phyllis", "Pleasance", "Portia", "Prudence", "Rachel", "Regina", "Rhoda", "Rita", "Robina", "Robinetta", "Romola", "Rosabel", "Rosalie", "Rosaline", "Rosalynd", "Rosana", "Rosette", "Rosina", "Rosemary", "Ruby", "Ruperta", "Ruth", "Sabina", "Sadie", "Salome", "Sapphire", "Sara", "Selina", "Serene", "Sheelah", "Sheila", "Sibyl", "Sibila", "Sylvia", "Sophia", "Stella", "Suzanne", "Suzette", "Teresa", "Theodora", "Trixy", "Ulrica", "Una", "Ursula", "Venetia", "Vera", "Veronica", "Victorine", "Viola", "Violette", "Virginia", "Virgine", "Vivia", "Vyvian", "Winifred", "Wilhemina", "Yoldande", "Zoe", "Zara", "Alaric", "Alban", "Aldred", "Alfric", "Allan", "Almeric", "Alphonse", "Alvan", "Alwyn", "Ambrose", "Andrew", "Angus", "Anthony", "Archibald", "Athelstan", "Aubrey", "Austin", "Augustus", "Baldwin", "Bardolph", "Basil", "Bernard", "Bertram", "Brian", "Bruno", "Caspar", "Cedric", "Christopher", "Clarence", "Claud", "Claudius", "Clement", "Constant", "Conrad", "Cuthbert", "Cyril", "Damian", "Dan", "David", "Denis", "Desmond", "Donald", "Duncan", "Dunstan", "Edgar", "Egbert", "Emanuel", "Eric", "Esmond", "Eugene", "Eustace", "Evan", "Everard", "Everemond", "Fabian", "Felix", "Francis", "Ferdinand", "Gabriel", "Gaspar", "Gaston", "Geoffrey", "Gerald", "Gerard", "Germain", "Gideon", "Gilbert", "Godfrey", "Godwin", "Gregory", "Griffith", "Guy", "Harold", "Hector", "Herbert", "Hildebert", "Hildebrand", "Hilary", "Horace", "Hubert", "Humbert", "Hugo", "Humphrey", "Ivan", "Jerome", "Justin", "Kenneth", "Lambert", "Lancelot", "Lawrence", "Leopold", "Lionel", "Lucian", "Manfred", "Marcus", "Mark", "Martin", "Marmaduke", "Maurice", "Max", "Meredith", "Michael", "Mervyn", "Miles", "Morgan", "Neil", "Nicholas", "Nigel", "Noel", "Norman", "Olaf", "Oliver", "Orlando", "Oscar", "Osmond", "Oswald", "Otho", "Patrick", "Paul", "Peter", "Philip", "Pietro", "Ralph", "Randal", "Randolph", "Raphael", "Raymond", "Reginald", "Reuben", "Reynard", "Richard", "Robin", "Rodolph", "Roderick", "Roger", "Roland", "Rufus", "Rupert", "Stephen", "Sylvester", "Silas", "Terence", "Theobald", "Theodore", "Timothy", "Trystan", "Ulric", "Urban", "Valentine", "Vibert", "Vincent", "Vernon", "Victor", "Vivian", "Waldemar", "Wilfred"],
      lastNames: ["#prefix##postfix#"],
      prefix: ["Chester", "Wimple", "Hart", "Down", "Clear", "Clare", "Har", "Here", "Somer", "Pol", "Ald", "Alf", "Ame", "Ather", "Attle", "Bed", "Berk", "Black", "White", "Brad", "Brown", "Brom", "Bucking", "Cole", "Com", "Ed", "Farn", "Kirk", "Leo", "Mel", "Nor", "Sut", "Pen", "Pont", "Sax", "Sand", "Stam", "Stal", "Tewk", "Wal", "Wel"],
      postfix: ["ton", "field", "ham", "ridge", "stock", "sfel", "shire", "hall", "ville", "ford", "ritch", "ditch", "borough", "mont", "ling", "sbury", "tham"]
    },
    tags: ["names", "historical", "edwardian"],
    isActive: true
  },

  {
    name: "american_names",
    description: "Contemporary American names",
    grammar: {
      origin: ["#firstNames# #lastNames#"],
      firstNames: ["James", "Robert", "John", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Gregory", "Frank", "Alexander", "Raymond", "Patrick", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam", "Henry", "Nathan", "Douglas", "Zachary", "Peter", "Kyle", "Walter", "Ethan", "Jeremy", "Harold", "Keith", "Christian", "Roger", "Noah", "Gerald", "Carl", "Terry", "Sean", "Austin", "Arthur", "Lawrence", "Jesse", "Dylan", "Bryan", "Joe", "Jordan", "Billy", "Bruce", "Albert", "Willie", "Gabriel", "Logan", "Alan", "Juan", "Wayne", "Roy", "Ralph", "Randy", "Eugene", "Vincent", "Russell", "Elijah", "Louis", "Bobby", "Philip", "Johnny", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Dorothy", "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Shirley", "Angela", "Helen", "Anna", "Brenda", "Pamela", "Nicole", "Emma", "Samantha", "Katherine", "Christine", "Debra", "Rachel", "Catherine", "Carolyn", "Janet", "Ruth", "Maria", "Heather", "Diane", "Virginia", "Julie", "Joyce", "Victoria", "Olivia", "Kelly", "Christina", "Lauren", "Joan", "Evelyn", "Judith", "Megan", "Cheryl", "Andrea", "Hannah", "Martha", "Jacqueline", "Frances", "Gloria", "Ann", "Teresa", "Kathryn", "Sara", "Janice", "Jean", "Alice", "Madison", "Doris", "Abigail", "Julia", "Judy", "Grace", "Denise", "Amber", "Marilyn", "Beverly", "Danielle", "Theresa", "Sophia", "Marie", "Diana", "Brittany", "Natalie", "Isabella", "Charlotte", "Rose", "Alexis", "Kayla"],
      lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzales", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennet", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"]
    },
    tags: ["names", "american", "contemporary"],
    isActive: true
  },

  {
    name: "succession_ceremony",
    description: "Example narrative for noble succession ceremonies",
    grammar: {
      origin: ["#heir# is crowned the new ruler of #realm#. The ceremony is #adjective# and #adjective#."],
      realm: ["Aldermere", "the Northern Reaches", "the Silver Kingdom", "Thornhaven", "the Western Marches"],
      adjective: ["grand", "solemn", "magnificent", "austere", "joyous", "subdued", "elaborate", "simple"]
    },
    tags: ["narrative", "nobility", "ceremony"],
    isActive: true
  }
];
