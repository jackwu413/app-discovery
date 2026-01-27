import fs from 'fs';
import crypto from 'crypto';

const CONFIG = {
  feedSize: 60,           // Number of apps to show
  maxReviews: 5000,       // Filter out mainstream apps
  minRating: 3.5,         // Minimum quality threshold
  diversityPerNiche: 3    // Max apps per niche to ensure variety
};

// Map of category icons
const categoryIcons = {
  'servers-bartenders': '🍽️',
  'freelancers': '💼',
  'truck-drivers': '🚚',
  'nurses': '🏥',
  'teachers': '📚',
  'photographers': '📷',
  'musicians': '🎵',
  'personal-trainers': '💪',
  'new-parents': '👶',
  'caregivers': '🤝',
  'roommates': '🏠',
  'pet-owners': '🐾',
  'chronic-illness': '💊',
  'night-shift': '🌙',
  'digital-nomads': '🌍',
  'plant-parents': '🌱',
  'home-brewers': '🍺',
  'board-gamers': '🎲',
  'thrifters': '👗',
  'meal-preppers': '🥗',
  'journaling': '📔',
  'subscription-tracking': '💳',
  'bill-splitting': '🧾',
  'medication-management': '💉',
  'habit-tracking': '✅',
  'warranty-tracking': '📋',
  'home-maintenance': '🔧',
  'adhd': '🧠',
  'introverts': '🔋',
  'food-sensitivities': '🥜'
};

function loadMasterPool() {
  try {
    const data = fs.readFileSync('./data/master-pool.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Master pool not found. Run: node discover.js --all');
    process.exit(1);
  }
}

function filterHiddenGems(apps) {
  return apps.filter(app => {
    // Must have a rating
    if (!app.rating || app.rating < CONFIG.minRating) return false;

    // Filter out mainstream apps (too many reviews = already well-known)
    if (app.reviews && app.reviews > CONFIG.maxReviews) return false;

    // Must have a description
    if (!app.description || app.description.length < 20) return false;

    // Filter out obvious non-app results
    const lowerName = app.name.toLowerCase();
    if (lowerName.includes('wallpaper') || lowerName.includes('ringtone')) return false;

    return true;
  });
}

function selectDiverseFeed(apps, size) {
  // Group by niche
  const byNiche = {};
  for (const app of apps) {
    if (!byNiche[app.niche]) byNiche[app.niche] = [];
    byNiche[app.niche].push(app);
  }

  // Sort each niche by a quality score (rating * log(reviews + 1))
  for (const niche of Object.keys(byNiche)) {
    byNiche[niche].sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log((a.reviews || 0) + 10);
      const scoreB = (b.rating || 0) * Math.log((b.reviews || 0) + 10);
      return scoreB - scoreA;
    });
  }

  // Use date-based seed for reproducible daily randomness
  const today = new Date();
  const seed = `${today.getFullYear()}-${today.getMonth()}-${Math.floor(today.getDate() / 3)}`;
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const seedNum = parseInt(hash.substring(0, 8), 16);

  // Seeded random function
  let randState = seedNum;
  const seededRandom = () => {
    randState = (randState * 1103515245 + 12345) & 0x7fffffff;
    return randState / 0x7fffffff;
  };

  // Shuffle niches
  const nicheKeys = Object.keys(byNiche);
  for (let i = nicheKeys.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [nicheKeys[i], nicheKeys[j]] = [nicheKeys[j], nicheKeys[i]];
  }

  // Select apps ensuring diversity
  const selected = [];
  const usedIds = new Set();

  // First pass: take top apps from each niche
  for (const niche of nicheKeys) {
    const nicheApps = byNiche[niche];
    let count = 0;
    for (const app of nicheApps) {
      if (count >= CONFIG.diversityPerNiche) break;
      if (usedIds.has(app.appId)) continue;

      selected.push(app);
      usedIds.add(app.appId);
      count++;

      if (selected.length >= size) break;
    }
    if (selected.length >= size) break;
  }

  // Second pass: fill remaining slots with best remaining apps
  if (selected.length < size) {
    const remaining = apps
      .filter(app => !usedIds.has(app.appId))
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log((a.reviews || 0) + 10);
        const scoreB = (b.rating || 0) * Math.log((b.reviews || 0) + 10);
        return scoreB - scoreA;
      });

    for (const app of remaining) {
      if (selected.length >= size) break;
      selected.push(app);
    }
  }

  // Shuffle final selection
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

function formatForFrontend(apps) {
  return apps.map((app, index) => ({
    id: index + 1,
    name: app.name,
    tagline: app.description?.substring(0, 80) + (app.description?.length > 80 ? '...' : ''),
    description: app.description,
    category: app.nicheName,
    tags: [app.searchKeyword, app.source === 'google_play' ? 'Android' : 'iOS'].filter(Boolean),
    url: app.url,
    icon: categoryIcons[app.niche] || '📱',
    rating: app.rating,
    reviews: app.reviews,
    developer: app.developer
  }));
}

function buildFeed() {
  console.log('Building feed...\n');

  // Load master pool
  const masterPool = loadMasterPool();
  console.log(`Master pool: ${masterPool.length} apps`);

  // Filter for hidden gems
  const hiddenGems = filterHiddenGems(masterPool);
  console.log(`Hidden gems: ${hiddenGems.length} apps (after filtering)`);

  // Select diverse feed
  const feed = selectDiverseFeed(hiddenGems, CONFIG.feedSize);
  console.log(`Selected: ${feed.length} apps for feed`);

  // Format for frontend
  const formatted = formatForFrontend(feed);

  // Save feed
  fs.writeFileSync('./apps.json', JSON.stringify(formatted, null, 2));
  console.log(`\nFeed saved to: ./apps.json`);

  // Log niche distribution
  const nicheCounts = {};
  for (const app of feed) {
    nicheCounts[app.nicheName] = (nicheCounts[app.nicheName] || 0) + 1;
  }
  console.log('\nNiche distribution:');
  Object.entries(nicheCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([niche, count]) => {
      console.log(`  ${niche}: ${count}`);
    });
}

buildFeed();
