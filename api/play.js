// Yaredharmoney EV: lesson access check and video signing.
// Runs on Vercel as a serverless function. Secrets come from Vercel
// Environment Variables, never from this file:
//   ACCESS_CODES     comma-separated list of valid customer codes
//   BUNNY_TOKEN_KEY  the "Token authentication key" from Bunny > Library > Security
const crypto = require("crypto");

const BUNNY_LIBRARY_ID = "664298";
const LINK_LIFETIME_SECONDS = 4 * 60 * 60; // each video link works for 4 hours

const LESSONS = {
  "l1b": {
    "free": true,
    "videoId": "6bb5f77f-7ca9-487a-b9a0-cedcb1de5fe3"
  },
  "l1c": {
    "free": true,
    "videoId": "d8be9f12-07bd-4e3b-9a75-3adbdad51824"
  },
  "l1": {
    "free": true,
    "content": "Electric vehicles have gone from a niche experiment to a mainstream shift in less than a decade. Major manufacturers — from established automakers to newer EV-focused brands — now produce electric models across nearly every price range and vehicle type.\n\nThis shift is driven by falling battery costs, tightening emissions regulations in many countries, and growing consumer demand for lower running costs. Compared to combustion engines, EVs are simpler mechanically, with far fewer moving parts to wear out or maintain.\n\nBy the end of this course, you'll understand not just how EVs work, but how to buy, import, and maintain one here in Ethiopia."
  },
  "l2": {
    "free": true,
    "content": "Ethiopia has seen a fast-growing wave of EV imports in recent years, with brands like Changan, BYD, Neta, Chery, and Dongfeng becoming increasingly common on the road — all vehicles you'll study in detail later in this course.\n\nGovernment policy has played a role in this growth, with import incentives making EVs more price-competitive than in many other markets. At the same time, charging infrastructure is still developing, and local technical expertise is limited.\n\nThat gap — between growing EV ownership and the knowledge needed to service and maintain these vehicles — is exactly what this course is built to close."
  },
  "l3": {
    "free": false,
    "content": "One of the strongest arguments for EV ownership is long-term cost. Electricity costs significantly less per kilometer than fuel, and EVs require far less routine maintenance — no oil changes, fewer fluids, and simpler drivetrains with fewer parts that wear out.\n\nThe upfront purchase price is often higher, but this gap narrows over the vehicle's lifetime through fuel and maintenance savings.\n\nThe one major long-term cost to plan for is eventual battery replacement — a real consideration, but typically only relevant after many years of use."
  },
  "l4": {
    "free": false,
    "content": "Every EV drivetrain follows the same basic path: the battery stores energy, the inverter converts that stored DC (direct current) power into AC (alternating current), and the motor uses that AC power to turn the wheels.\n\nThe battery is the largest and most expensive component in the vehicle. The inverter acts as a translator between the battery and motor, since motors need alternating current to spin efficiently. The motor itself converts electrical energy into mechanical motion.\n\nIn the lessons that follow, we'll go deep into each of these systems individually, including the on-board charger, DC-DC converter, and battery management system."
  },
  "l4a": {
    "free": false,
    "videoId": "9ba7659d-0a9e-4211-8e7f-f038a3deedb9"
  },
  "l4a1": {
    "free": false,
    "videoId": "4a106ab1-65ef-4993-8433-56b86b8a0c11"
  },
  "l4a2": {
    "free": false,
    "videoId": "2451c469-6bc4-400f-a843-92fc5f3fb66b"
  },
  "l4a3": {
    "free": false,
    "videoId": "88dcda9e-53fb-4a76-b2a7-5836504eac7c"
  },
  "l4thermal": {
    "free": false,
    "content": "Batteries and motors generate heat during use, and heat is one of the biggest threats to both performance and lifespan. Without proper thermal management, batteries degrade faster, lose range, and in extreme cases can become unsafe.\n\nMost modern EVs use liquid cooling loops that circulate coolant around the battery pack and motor to keep temperatures in a safe range, though some systems rely on air cooling instead.\n\nAs a technician, checking the cooling system — coolant levels, pump function, and radiator condition — should be part of any thorough EV inspection, especially for vehicles operating in hot climates."
  },
  "l4b": {
    "free": false,
    "videoId": "4da69748-f42e-4728-b5d2-4e7513a31c47"
  },
  "l4q": {
    "free": false,
    "videoId": "e9979f3e-c4c8-41c3-8863-6ef164bfc874"
  },
  "l4g": {
    "free": false,
    "videoId": "72eb1e0e-4628-4b4e-b3ac-b02e8c6daeb0"
  },
  "l4g2": {
    "free": false,
    "videoId": "0a3be9e5-eac8-43a5-852e-ccab5059299a"
  },
  "l5": {
    "free": false,
    "content": "EV charging comes in a few distinct speeds. Level 1 charging uses a standard household outlet and is the slowest option, suitable mainly for overnight top-ups. Level 2 charging uses higher-voltage AC power, common in home charging stations and public chargers, and is significantly faster.\n\nDC fast charging skips the vehicle's onboard charger entirely and feeds power directly to the battery, allowing an 80% charge in well under an hour for many vehicles — though it requires dedicated fast-charging infrastructure.\n\nFor most EV owners in Ethiopia today, Level 1 and Level 2 home charging are the most realistic options, with fast charging becoming more relevant as public infrastructure expands."
  },
  "l6": {
    "free": false,
    "content": "An EV's real-world range is almost always lower than its official rated range, and understanding why helps set realistic expectations for owners.\n\nCold and hot weather both reduce range — cold temperatures slow chemical reactions inside the battery, while heat increases the energy needed for cooling systems and cabin climate control. Aggressive driving, highway speeds, and hilly terrain also increase energy consumption.\n\nNone of this means EVs aren't practical for daily use — it simply means planning trips with a buffer and adjusting driving habits when maximizing range matters."
  },
  "l4c": {
    "free": false,
    "videoId": "ec2bd1de-a1fa-45b0-920f-9f44abb7bd6e"
  },
  "l4j": {
    "free": false,
    "videoId": "74d8bed8-2af2-414f-8dff-7bffc0c33a43"
  },
  "l4f": {
    "free": false,
    "videoId": "56491b24-0555-476d-b525-48229b17cc13"
  },
  "l4p": {
    "free": false,
    "videoId": "d079a6f7-fb87-4e6d-b90f-38909746efc8"
  },
  "l4d": {
    "free": false,
    "videoId": "4f6b4e11-50d2-4ea4-943b-3d8950d6b958"
  },
  "l4h": {
    "free": false,
    "videoId": "7872e73a-0a87-42ba-a0d8-c4056c40a554"
  },
  "l4i": {
    "free": false,
    "videoId": "399cc07c-6ac5-4b19-8777-5e1f02cff01d"
  },
  "l4e": {
    "free": false,
    "videoId": "b6c38df7-3129-4c34-875f-2d02a7eac270"
  },
  "l4k": {
    "free": false,
    "videoId": "bfb015ff-4742-4ce3-a2b7-e0fe5224d6ae"
  },
  "l4l": {
    "free": false,
    "videoId": "a71573c4-4ad5-49f5-9d80-d38070ba50db"
  },
  "l4m": {
    "free": false,
    "videoId": "b7b70d0d-0b64-41c0-a120-6c569cd81416"
  },
  "l4n": {
    "free": false,
    "videoId": "a7d8a7b6-054b-414e-a1cf-61b78e2b0dd6"
  },
  "l4o": {
    "free": false,
    "videoId": "42a7f7af-ace4-403b-9e5d-5167cb329804"
  },
  "l7": {
    "free": false,
    "content": "Importing an EV into Ethiopia involves navigating specific customs duties, documentation requirements, and registration steps that differ from importing a combustion vehicle. Rates and incentives can change, so always verify current requirements with official government sources before advising a customer.\n\nCommon documentation includes proof of purchase, vehicle specifications, and compliance certificates. Missing or incorrect paperwork is one of the most frequent causes of delays at customs.\n\nStaying current on import regulations — and knowing where to find authoritative, up-to-date information — is a valuable skill for anyone helping customers navigate this process."
  },
  "l8": {
    "free": false,
    "content": "Charging access is often the biggest practical concern for new EV owners, especially in markets where public charging infrastructure is still developing. Home charging remains the most reliable option for most owners today, provided the electrical setup can safely support it.\n\nPublic charging networks are gradually expanding, and staying aware of new stations and their locations is genuinely useful advice for customers weighing an EV purchase.\n\nSetting realistic expectations upfront — rather than promising charging convenience that doesn't yet exist everywhere — builds trust and helps new owners plan their routines successfully."
  },
  "l9": {
    "free": false,
    "content": "EVs need less routine maintenance than combustion vehicles, but they aren't maintenance-free. Tires, brakes, cabin air filters, and cooling systems all still require regular attention.\n\nBattery health deserves special focus. Avoiding regularly charging to 100% or letting the battery sit near empty for long periods helps extend its usable lifespan. Extreme temperatures and frequent fast-charging can also accelerate degradation.\n\nKnowing the warning signs of battery or system issues — reduced range, unusual charging behavior, warning lights — and when a vehicle needs professional service closes out a well-rounded EV education."
  }
};

// Reads the code list from Vercel. Tolerates commas, spaces, line breaks and quote marks.
function validCodes() {
  return (process.env.ACCESS_CODES || "")
    .split(/[,;\s]+/)
    .map((c) => c.replace(/["'`]/g, "").trim().toUpperCase())
    .filter(Boolean);
}

function codeIsValid(code) {
  if (typeof code !== "string") return false;
  const given = code.trim().toUpperCase();
  if (given.length < 6 || given.length > 64) return false;
  const valid = validCodes();
  const givenBuf = Buffer.from(given);
  let ok = false;
  for (const v of valid) {
    const vBuf = Buffer.from(v);
    if (vBuf.length === givenBuf.length && crypto.timingSafeEqual(vBuf, givenBuf)) ok = true;
  }
  return ok;
}

function signedEmbedUrl(videoId) {
  const key = process.env.BUNNY_TOKEN_KEY || "";
  const expires = Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS;
  const token = crypto.createHash("sha256").update(key + videoId + expires).digest("hex");
  return (
    "https://player.mediadelivery.net/embed/" + BUNNY_LIBRARY_ID + "/" + videoId +
    "?token=" + token + "&expires=" + expires + "&autoplay=false&preload=false"
  );
}

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    // Visiting the address in a browser: shows only counts, never secrets.
    res.status(200).json({ codes_loaded: validCodes().length, bunny_key_set: !!process.env.BUNNY_TOKEN_KEY });
    return;
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { code, lessonId } = body;

  // Code check only (used by the Unlock screen)
  if (!lessonId) {
    if (codeIsValid(code)) res.status(200).json({ ok: true });
    else res.status(401).json({ error: "bad_code" });
    return;
  }

  const lesson = Object.prototype.hasOwnProperty.call(LESSONS, lessonId) ? LESSONS[lessonId] : null;
  if (!lesson) {
    res.status(404).json({ error: "no_such_lesson" });
    return;
  }
  if (!lesson.free && !codeIsValid(code)) {
    res.status(401).json({ error: "bad_code" });
    return;
  }
  if (lesson.videoId) {
    if (!process.env.BUNNY_TOKEN_KEY) {
      res.status(500).json({ error: "server_not_configured" });
      return;
    }
    res.status(200).json({ url: signedEmbedUrl(lesson.videoId) });
    return;
  }
  if (lesson.content) {
    res.status(200).json({ content: lesson.content });
    return;
  }
  res.status(200).json({ empty: true });
};
