import crypto from "crypto";

export interface RuleModel {
  id: string;
  pattern: string;
  matchType: string;
  categoryId: string;
  isSubscription: boolean;
  priority: number;
}

export interface CategoryModel {
  id: string;
  name: string;
  color: string;
  icon: string;
  isIncome: boolean;
}

export function generateTransactionHash(
  accountId: string,
  date: string | Date,
  amount: number,
  text: string
): string {
  const d = typeof date === "string" ? date.split("T")[0] : date.toISOString().split("T")[0];
  const raw = `${accountId}|${d}|${amount.toFixed(2)}|${text.trim().toLowerCase()}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function classifyTransaction(
  text: string,
  counterparty: string | null | undefined,
  amount: number,
  rules: (RuleModel & { category: CategoryModel })[],
  categories: CategoryModel[]
): { categoryId: string | null; isSubscription: boolean } {
  const combined = `${text} ${counterparty || ""}`.toLowerCase();

  // Sort rules by priority descending
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const pattern = rule.pattern.toLowerCase();
    let matched = false;

    if (rule.matchType === "exact") {
      matched = combined.trim() === pattern.trim();
    } else if (rule.matchType === "regex") {
      try {
        const re = new RegExp(rule.pattern, "i");
        matched = re.test(combined);
      } catch (e) {
        matched = false;
      }
    } else {
      // contains
      matched = combined.includes(pattern);
    }

    if (matched) {
      return {
        categoryId: rule.categoryId,
        isSubscription: rule.isSubscription,
      };
    }
  }

  // Fallback defaults
  if (amount > 0) {
    const incomeCat = categories.find((c) => c.isIncome || c.name.toLowerCase().includes("løn") || c.name.toLowerCase().includes("indkomst"));
    if (incomeCat) return { categoryId: incomeCat.id, isSubscription: false };
  }

  const otherCat = categories.find((c) => c.name.toLowerCase().includes("andet") || c.name.toLowerCase().includes("diverse"));
  return {
    categoryId: otherCat ? otherCat.id : null,
    isSubscription: false,
  };
}

export interface DetectedSubscription {
  name: string;
  amount: number;
  interval: "weekly" | "monthly" | "quarterly" | "yearly";
  categoryId: string | null;
  lastPaymentDate: Date;
  nextPaymentDate: Date;
  occurrences: number;
  status: "active" | "inactive";
  isInactive?: boolean;
}

export function cleanMerchantKey(raw: string): string {
  let s = (raw || "").toLowerCase();

  // Strip transaction ID prefixes (e.g. MobilePay SCTI2TX...)
  s = s.replace(/scti[a-z0-9]+\s+/gi, "");

  // Strip payment method and standard prefixes
  s = s
    .replace(/mobilepay\s+mobilepay\s+/gi, "")
    .replace(/mobilepay\s+/gi, "")
    .replace(/reference\s+[0-9a-z]+/gi, "")
    .replace(/meddelnr\.\s*[0-9]+/gi, "")
    .replace(/dankort[- ]nota\s+/gi, "")
    .replace(/visa køb\s+(dkk|eur|usd|sek|nok|gbp)\s+[\d\.,]+/gi, "")
    .replace(/visa køb\s+/gi, "")
    .replace(/bs\s+[bb]etaling\s+/gi, "")
    .replace(/zettle\s*[\*\-]\s*/gi, "")
    .replace(/wl\s*\*\s*/gi, "")
    .replace(/paypal\s*\*\s*/gi, "")
    .replace(/udenl\.\s*overf\.\s*/gi, "")
    .replace(/(dkk|eur|usd|sek|nok|gbp)\s+[\d\.,]+/gi, "")
    .replace(/den\s+\d\d\.\d\d/gi, "");

  // Strip common corporate entity suffixes (be careful not to strip Danish word 'is' as in ice cream)
  s = s.replace(/\b(a\/s|a\.s\.|aps|a\.p\.s\.|i\/s|i\.s\.|gmbh|ltd|plc|ab)\b/gi, "");

  // Clean special characters and reference numbers
  s = s
    .replace(/\b\d{4,}[a-z0-9]*\b/gi, "")
    .replace(/[\*\_\#\/\-\.]/g, " ");

  const citiesAndNoise = [
    "london",
    "buchare",
    "stockholm",
    "koebenha",
    "koebenhavn",
    "kobenhavn",
    "københavn",
    "copenhagen",
    "dublin",
    "amsterdam",
    "paris",
    "berlin",
    "soborg",
    "søborg",
    "gladsaxe",
    "gladsa",
    "sobor",
    "lyngby",
    "kongens",
    "kgs",
    "herlev",
    "buddinge",
    "vejby",
    "vesterbro",
    "tisvildel",
    "tisvildeleje",
    "bagsvaerd",
    "bagsværd",
    "bagsv",
    "denmark",
    "usa",
    "holding",
    "se",
    "dk",
  ];

  let words = s.split(/\s+/).filter((w) => w.length > 0);
  // Remove duplicate adjacent words e.g. 'google google one' -> 'google one'
  words = words.filter((w, i) => i === 0 || w !== words[i - 1]);
  // Remove noise/city words at the end
  while (words.length > 1 && citiesAndNoise.includes(words[words.length - 1])) {
    words.pop();
  }

  let cleaned = words.join(" ").trim();

  // Normalize specific patterns & substrings
  if (cleaned.includes("hafniensis")) cleaned = "hafniensis";
  if (cleaned.startsWith("google google ")) cleaned = cleaned.replace("google google ", "google ");
  if (cleaned.startsWith("youtube memb") || cleaned.startsWith("google youtube memb")) cleaned = "youtube membership";
  if (
    cleaned.startsWith("google youtube premi") ||
    cleaned.startsWith("google youtubepremi") ||
    cleaned.startsWith("youtube premi") ||
    cleaned.startsWith("youtubepremi")
  ) {
    cleaned = "youtube premium";
  }
  if (cleaned === "google google one" || cleaned === "google one") cleaned = "google one";
  if (cleaned.startsWith("disneyplus")) cleaned = "disneyplus";
  if (cleaned.startsWith("apple com bill") || cleaned.startsWith("applecombill")) cleaned = "apple";
  if (cleaned.startsWith("openai") || cleaned.startsWith("chatgpt")) cleaned = "openai chatgpt";
  if (cleaned.startsWith("steam games") || cleaned === "steam") cleaned = "steam games";
  if (cleaned.startsWith("netflix")) cleaned = "netflix";
  if (cleaned.startsWith("mofibo")) cleaned = "mofibo";
  if (cleaned.startsWith("audible")) cleaned = "audible";
  if (cleaned.startsWith("patreon")) cleaned = "patreon";
  if (cleaned.startsWith("7 eleven") || cleaned.startsWith("dsb 7 eleven")) cleaned = "7 eleven";
  if (cleaned.startsWith("lagkagehuset")) cleaned = "lagkagehuset";
  if (cleaned.startsWith("emmerys")) cleaned = "emmerys";
  if (cleaned.startsWith("mealo") || cleaned.startsWith("meal4u")) cleaned = "mealo";
  if (cleaned.startsWith("nordisk film biograf") || cleaned.startsWith("nfb")) cleaned = "nordisk film biografer";
  if (cleaned.startsWith("mcd") || cleaned.startsWith("mcdonald")) cleaned = "mcdonalds";
  if (cleaned.startsWith("dcc energi mobility")) cleaned = "dcc energi mobility";
  else if (cleaned.startsWith("dcc energi")) cleaned = "dcc energi";
  if (cleaned.startsWith("andel energi")) cleaned = "andel energi";
  if (cleaned.startsWith("curreriserv") || cleaned.startsWith("curreri")) cleaned = "curreri viaggi";
  if (cleaned.startsWith("hilton")) cleaned = "hilton sorrento palace";
  if (cleaned.startsWith("tower bridge")) cleaned = "tower bridge";
  if (cleaned.startsWith("is salonen")) cleaned = "issalonen";
  if (cleaned.startsWith("bagsværd apote") || cleaned.startsWith("bagsvaerd apote") || cleaned.startsWith("bagsva rd apote") || cleaned.startsWith("bagsværd apotek")) cleaned = "bagsværd apotek";
  if (cleaned.startsWith("aldershvile")) cleaned = "aldershvile planteskole";
  if (cleaned.startsWith("bagsværd bloms") || cleaned.startsWith("bagsvaerd bloms")) cleaned = "bagsværd blomster";
  if (cleaned.startsWith("bagsværd svømm") || cleaned.startsWith("bagsvaerd svømm")) cleaned = "bagsværd svømmehal";
  if (cleaned.startsWith("bagt tisvildel")) cleaned = "bagt tisvildeleje";
  if (cleaned.startsWith("bauhaus")) cleaned = "bauhaus";
  if (cleaned.startsWith("brugsen")) cleaned = "brugsen vesterbro";
  if (cleaned.startsWith("circle k")) cleaned = "circle k";
  if (cleaned.startsWith("computersalg")) cleaned = "computersalg";
  if (cleaned.startsWith("den lille skole")) cleaned = "den lille skole";
  if (cleaned.startsWith("festogfarver") || cleaned.startsWith("fest og farver")) cleaned = "fest og farver";
  if (cleaned.startsWith("gladsaxe karat")) cleaned = "gladsaxe karat";
  if (cleaned.startsWith("granny")) cleaned = "grannys house";
  if (cleaned.startsWith("imerco")) cleaned = "imerco home";
  if (cleaned.startsWith("information")) cleaned = "information";
  if (cleaned.startsWith("infoteria")) cleaned = "infoteria";
  if (cleaned.startsWith("legekæden") || cleaned.startsWith("legekaeden")) cleaned = "legekæden";
  if (cleaned.startsWith("lyngby sko")) cleaned = "lyngby sko og noegl";
  if (cleaned.startsWith("peter beier")) cleaned = "peter beier";
  if (cleaned.startsWith("harald nyborg")) cleaned = "harald nyborg";
  if (cleaned.startsWith("synoptik")) cleaned = "synoptik";
  if (cleaned.startsWith("next forsikring")) cleaned = "next forsikring";
  if (cleaned.startsWith("nordea kredit")) cleaned = "nordea kredit";
  if (cleaned.startsWith("espegården") || cleaned.startsWith("espegaarden")) cleaned = "espegårdens grf";
  if (cleaned.startsWith("evida")) cleaned = "evida";
  if (cleaned.startsWith("novafos")) cleaned = "novafos";
  if (cleaned.startsWith("topdanmark")) cleaned = "topdanmark";
  if (cleaned.startsWith("tryg")) cleaned = "tryg";
  if (cleaned.startsWith("vindstød") || cleaned.startsWith("vindstoed") || cleaned.includes("vindstød") || cleaned.includes("vindstoed")) cleaned = "vindstød";
  if (cleaned.startsWith("warner bros") || cleaned.startsWith("warnerbros") || cleaned.startsWith("wb studio")) cleaned = "warner bros studio tour";
  if (cleaned.startsWith("british museum")) cleaned = "british museum";
  if (cleaned.startsWith("aros")) cleaned = "aros";
  if (cleaned.startsWith("audible")) cleaned = "audible";
  if (cleaned.startsWith("historic royal palac")) cleaned = "historic royal palac";
  if (cleaned.startsWith("historiska museet")) cleaned = "historiska museet";
  if (cleaned.startsWith("imperial war museum") || cleaned.startsWith("iwm")) cleaned = "imperial war museum";
  if (cleaned.startsWith("natural history museum") || cleaned.startsWith("nhm")) cleaned = "natural history museum";
  if (cleaned.startsWith("science museum")) cleaned = "science museum";
  if (cleaned.startsWith("zoologisk have") || cleaned.startsWith("zoo")) cleaned = "zoologisk have";
  if (cleaned.startsWith("den gamle by")) cleaned = "den gamle by";
  if (cleaned.startsWith("den gamle have")) cleaned = "den gamle have";
  if (cleaned.startsWith("dr koncerthuset") || cleaned.startsWith("dr koncerthuse")) cleaned = "dr koncerthuset";
  if (cleaned.startsWith("radisson")) cleaned = "radisson";
  if (cleaned.startsWith("norwegian")) cleaned = "norwegian";
  if (cleaned.startsWith("sas")) cleaned = "sas";
  if (cleaned.startsWith("molslinjen")) cleaned = "molslinjen";
  if (cleaned.startsWith("oresundsbron") || cleaned.startsWith("øresundsbron")) cleaned = "oresundsbron";
  if (cleaned.startsWith("storebælt") || cleaned.startsWith("storebaelt")) cleaned = "storebaelt";

  return cleaned;
}

export function cleanMerchantName(raw: string): string {
  const key = cleanMerchantKey(raw);
  const map: { [k: string]: string } = {
    "google one": "Google One",
    "youtube premium": "YouTube Premium",
    "google youtube premium": "YouTube Premium",
    "youtube membership": "YouTube Membership",
    "google youtube membership": "YouTube Membership",
    disneyplus: "Disney+",
    apple: "Apple Services",
    "apple com bill": "Apple Services",
    applecombill: "Apple Services",
    "openai chatgpt": "OpenAI (ChatGPT)",
    openai: "OpenAI (ChatGPT)",
    boosteroid: "Boosteroid",
    "steam games": "Steam Games",
    netflix: "Netflix",
    mofibo: "Mofibo",
    audible: "Audible",
    patreon: "Patreon",
    blinkist: "Blinkist",
    "7 eleven": "7-Eleven",
    "dsb 7 eleven": "DSB 7-Eleven",
    "aldershvile pl": "Aldershvile Planteskole",
    "aldershvile planteskole": "Aldershvile Planteskole",
    "bagsvaerd apote": "Bagsværd Apotek",
    "bagsva rd apotek": "Bagsværd Apotek",
    "bagsværd apotek": "Bagsværd Apotek",
    "bagsværd bloms": "Bagsværd Blomster",
    "bagsværd svømm": "Bagsværd Svømmehal",
    "bagsværd svømmehal": "Bagsværd Svømmehal",
    "bagt tisvildel": "Bagt Tisvildeleje",
    "bagt tisvildeleje": "Bagt Tisvildeleje",
    "bagsvaerd lakrids": "Bagsværd Lakrids",
    "bagsværd lakrids": "Bagsværd Lakrids",
    bauhaus: "Bauhaus",
    "bauhaus gladsa": "Bauhaus",
    "brugsen vesterbro": "Brugsen Vesterbro",
    brugsenvesterb: "Brugsen Vesterbro",
    "circle k": "Circle K",
    "circle k glads": "Circle K",
    computersalg: "ComputerSalg",
    "computersalg a": "ComputerSalg",
    "den lille skole": "Den Lille Skole",
    "elverbørn": "Elverbørn",
    "elverboern": "Elverbørn",
    emmerys: "Emmerys",
    "festogfarver": "Fest og Farver",
    "gladsaxe karat": "Gladsaxe Karat",
    "grannys house": "Granny's House",
    "granny s house": "Granny's House",
    hyggeonkel: "Hyggeonkel",
    "il terrazzo": "Il Terrazzo",
    "imerco home": "Imerco Home",
    "imerco home ly": "Imerco Home",
    "information": "Dagbladet Information",
    infoteria: "Infoteria",
    "infoteria lill": "Infoteria",
    lagkagehuset: "Lagkagehuset",
    "legekæden": "Legekæden",
    "legekaeden": "Legekæden",
    "lyngby sko og noegl": "Lyngby Sko- og Nøgleservice",
    "lyngvig fyr": "Lyngvig Fyr",
    mealo: "Mealo Takeaway",
    meny: "Meny",
    "nemlig com": "Nemlig.com",
    nemlig: "Nemlig.com",
    netto: "Netto",
    "nordisk film biografer": "Nordisk Film Biografer",
    "peter beier": "Peter Beier Chokolade",
    "paw sko": "Paw Sko",
    "silvan": "Silvan",
    "sport 24 outlet": "Sport 24 Outlet",
    "sport 24": "Sport 24",
    "harald nyborg": "Harald Nyborg",
    "hp instant ink": "HP Instant Ink",
    "frisør zento": "Frisør Zento",
    "frisoer zento": "Frisør Zento",
    "tandlægeselskabet": "Tandlægeselskabet",
    "tandlaegeselskabet": "Tandlægeselskabet",
    "andel energi": "Andel Energi",
    "dcc energi": "DCC Energi",
    "dcc energi mobility": "DCC Energi Mobility",
    "espegårdens grf": "Espegårdens Grundejerforening",
    "espegaardens grf": "Espegårdens Grundejerforening",
    evida: "Evida",
    "evida service nord a": "Evida",
    "gladsaxe kommune": "Gladsaxe Kommune",
    "next forsikring": "Next Forsikring",
    "nordea kredit real": "Nordea Kredit - Real",
    "nordea kredit": "Nordea Kredit",
    novafos: "Novafos",
    synoptik: "Synoptik A/S",
    topdanmark: "Topdanmark Forsikring",
    tryg: "Tryg",
    rejsekort: "Rejsekort",
    easypark: "EasyPark",
    "taxa 4x35": "Taxa 4x35",
    fdm: "FDM",
    withings: "Withings",
    airbnb: "Airbnb",
    elgiganten: "Elgiganten",
    kickstarter: "Kickstarter",
    backerkit: "BackerKit",
    fantasywelt: "Fantasywelt",
    flaconi: "Flaconi",
    "itch io": "itch.io",
    "meta platforms": "Meta Platforms",
    "metaplatform": "Meta Platforms",
    nintendo: "Nintendo",
    "paddle net": "Paddle.net",
    uber: "Uber",
    uberpayment: "Uber",
    "curreri viaggi": "Curreri Viaggi",
    "hilton sorrento palace": "Hilton Sorrento Palace",
    "hotel millenium": "Hotel Millenium",
    "lufthansa": "Lufthansa",
    "tower bridge": "Tower Bridge",
    issalonen: "Issalonen",
    "wild burgers": "Wild Burgers",
    antrophia: "Antrophia",
    bibser: "Bibser",
    "generator hostel": "Generator Hostel",
    "t shirttryk": "T-Shirttryk",
    hafniensis: "Hafniensis",
    "3 danmark": "3 Danmark",
    vindstød: "Vindstød",
    "warner bros studio tour": "Warner Bros. Studio Tour",
    "british museum": "British Museum",
    "science museum": "Science Museum London",
    "imperial war museum": "Imperial War Museum",
    "natural history museum": "Natural History Museum",
    "den gamle by": "Den Gamle By Aarhus",
    "den sorte diamant": "Den Sorte Diamant",
    "dr koncerthuset": "DR Koncerthuset",
    "hotel cecil": "Hotel Cecil",
    "royal arena": "Royal Arena",
    "nationalmuseet": "Nationalmuseet",
    frilandsmuseet: "Frilandsmuseet",
    "steno museet": "Steno Museet",
    "danmarks tekniske museum": "Danmarks Tekniske Museum",
    "zoologisk have": "Zoologisk Have",
    tivoli: "Tivoli",
    louisiana: "Louisiana",
    aros: "ARoS Kunstmuseum",
    radisson: "Radisson Blu",
    norwegian: "Norwegian",
    sas: "SAS",
    molslinjen: "Molslinjen",
    oresundsbron: "Øresundsbron",
    storebaelt: "Storebæltsforbindelsen",
    backblaze: "Backblaze",
    lastpass: "LastPass",
    openrouter: "OpenRouter",
    remarkable: "reMarkable",
    shadow: "Shadow",
    simply: "Simply.com",
    hetzner: "Hetzner",
    proshop: "Proshop",
    avxperten: "AVXperten",
    teknikdele: "Teknikdele",
    zalando: "Zalando",
    stylemann: "Stylemann",
    "jack jones": "Jack & Jones",
    "basic more": "Basic & More",
    "24hshop": "24HShop",
    "prime video": "Prime Video",
    zetland: "Zetland",
    wolt: "Wolt",
    "madklubben": "Madklubben",
    halifax: "Halifax",
    "burger king": "Burger King",
    "max burgers": "Max Burgers",
    "joe the juice": "Joe & The Juice",
    dunkin: "Dunkin'",
    starbucks: "Starbucks",
    "byens ismejeri": "Byens Ismejeri",
    "emmas ismejeri": "Emmas Ismejeri",
    "hansens is": "Hansens Is",
    "isbaren liseleje": "Isbaren Liseleje",
    "bagerdygtigt": "Bagerdygtigt",
    "bodenhoff": "Bodenhoff Bageri",
    "canaria pizza": "Canaria Pizza",
    "parma pasta": "Parma & Pasta",
    "kawasaki sushi": "Kawasaki Sushi",
    "youmi sushi": "Youmi Sushi",
    "babysam": "BabySam",
    "oenskeboern": "Ønskebørn",
    "klub 144": "Klub 144",
    "skolefoto": "Skolefoto",
    "sommerferieaktiviteter": "Sommerferieaktiviteter",
    "unf sommerskole": "UNF Sommerskole",
    "apopro": "Apopro Online Apotek",
    "audika": "Audika",
    "scanovus": "Scanovus",
    "byens rens": "Byens Rens",
    "falck": "Falck",
  };

  if (map[key]) return map[key];

  return (
    key
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || raw
  );
}

export function detectSubscriptionsFromTransactions(
  transactions: {
    id: string;
    amount: number;
    date: Date | string;
    text: string;
    counterparty?: string | null;
    categoryId?: string | null;
  }[]
): DetectedSubscription[] {
  // Only consider expense transactions
  const expenses = transactions
    .filter((tx) => tx.amount < 0)
    .map((tx) => ({
      ...tx,
      dateObj: typeof tx.date === "string" ? new Date(tx.date) : tx.date,
    }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Group by normalized merchant/name
  const groups: { [key: string]: typeof expenses } = {};

  for (const tx of expenses) {
    const raw = tx.counterparty || tx.text;
    const cleanKey = cleanMerchantKey(raw);
    if (!cleanKey || cleanKey.length < 2) continue;

    if (!groups[cleanKey]) groups[cleanKey] = [];
    groups[cleanKey].push(tx);
  }

  const results: DetectedSubscription[] = [];

  for (const [key, txList] of Object.entries(groups)) {
    if (txList.length < 2) continue;

    // Calculate intervals between occurrences in days
    const intervals: number[] = [];
    const amounts = txList.map((t) => Math.abs(t.amount));

    for (let i = 1; i < txList.length; i++) {
      const diffDays = Math.round(
        (txList[i].dateObj.getTime() - txList[i - 1].dateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(diffDays);
    }

    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariation = Math.max(...amounts) - Math.min(...amounts);

    // Strict amount consistency: relative variation <= 15% OR (for small foreign currency/fee charges) <= 15 DKK
    const isAmountConsistent = (amountVariation <= avgAmount * 0.15) || (amountVariation <= 15 && avgAmount < 150);

    // Consistency of intervals: at least 60% of intervals must fall in the expected window
    let intervalType: "weekly" | "monthly" | "quarterly" | "yearly" | null = null;
    let daysToAdd = 30;

    const totalIntervals = intervals.length;
    const weeklyCount = intervals.filter((d) => d >= 5 && d <= 9).length;
    const monthlyCount = intervals.filter((d) => d >= 25 && d <= 36).length;
    const quarterlyCount = intervals.filter((d) => d >= 80 && d <= 100).length;
    const yearlyCount = intervals.filter((d) => d >= 340 && d <= 390).length;

    if (monthlyCount / totalIntervals >= 0.6 || (totalIntervals === 1 && monthlyCount === 1)) {
      intervalType = "monthly";
      daysToAdd = 30;
    } else if (quarterlyCount / totalIntervals >= 0.6 || (totalIntervals === 1 && quarterlyCount === 1)) {
      intervalType = "quarterly";
      daysToAdd = 90;
    } else if (yearlyCount / totalIntervals >= 0.6 || (totalIntervals === 1 && yearlyCount === 1)) {
      intervalType = "yearly";
      daysToAdd = 365;
    } else if (weeklyCount / totalIntervals >= 0.6 || (totalIntervals === 1 && weeklyCount === 1)) {
      intervalType = "weekly";
      daysToAdd = 7;
    }

    const minRequiredOccurrences = intervalType === "yearly" ? 2 : 3;
    const hasEnoughOccurrences = txList.length >= minRequiredOccurrences;

    if (intervalType && isAmountConsistent && hasEnoughOccurrences) {
      const lastTx = txList[txList.length - 1];
      const nextDate = new Date(lastTx.dateObj);
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      // Clean merchant display name
      const displayName = cleanMerchantName(lastTx.counterparty || lastTx.text);

      // Inactivity detection based on elapsed days since last payment
      const latestRefDate = expenses.length > 0 ? expenses[expenses.length - 1].dateObj : new Date();
      const daysSinceLastPayment = Math.round(
        (latestRefDate.getTime() - lastTx.dateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      let thresholdDays = 60; // monthly default
      if (intervalType === "weekly") thresholdDays = 21;
      if (intervalType === "quarterly") thresholdDays = 150;
      if (intervalType === "yearly") thresholdDays = 450;

      const isInactive = daysSinceLastPayment > thresholdDays;
      const status: "active" | "inactive" = isInactive ? "inactive" : "active";

      results.push({
        name: displayName,
        amount: Math.round(avgAmount * 100) / 100,
        interval: intervalType,
        categoryId: lastTx.categoryId || null,
        lastPaymentDate: lastTx.dateObj,
        nextPaymentDate: nextDate,
        occurrences: txList.length,
        status,
        isInactive,
      });
    }
  }

  return results;
}
