import gplay from 'google-play-scraper';
import appStore from 'app-store-scraper';
import fs from 'fs';

// All niches with search keywords
const niches = {
  // By Profession
  'servers-bartenders': {
    name: 'Servers / Bartenders / Hospitality',
    keywords: ['tip tracker', 'tip calculator server', 'waiter tips', 'bartender tips', 'server tip log', 'tip pooling']
  },
  'freelancers': {
    name: 'Freelancers / Gig Workers',
    keywords: ['freelance invoice', 'gig tracker', 'freelance time tracking', 'self employed expense', 'contractor mileage', '1099 tracker']
  },
  'truck-drivers': {
    name: 'Truck Drivers / Delivery',
    keywords: ['trucker log book', 'truck stop finder', 'weigh station app', 'trucker GPS offline', 'hours of service trucking']
  },
  'nurses': {
    name: 'Nurses / Healthcare Shift Workers',
    keywords: ['nurse schedule app', 'shift tracker nurse', 'nursing notes app', 'nurse overtime tracker']
  },
  'teachers': {
    name: 'Teachers / Tutors',
    keywords: ['classroom management app', 'grade book teacher', 'lesson planner teacher', 'student behavior tracker', 'classroom timer']
  },
  'photographers': {
    name: 'Photographers / Videographers',
    keywords: ['photo session planner', 'photography client management', 'golden hour calculator', 'shot list app', 'model release form']
  },
  'musicians': {
    name: 'Musicians / DJs',
    keywords: ['setlist maker', 'gig tracker musician', 'band schedule app', 'DJ playlist organizer', 'music practice tracker']
  },
  'personal-trainers': {
    name: 'Personal Trainers / Fitness Instructors',
    keywords: ['personal trainer client app', 'workout builder trainer', 'fitness client management', 'exercise demo app']
  },

  // By Life Situation
  'new-parents': {
    name: 'New Parents',
    keywords: ['baby tracker feeding', 'diaper tracker', 'baby sleep log', 'pumping tracker', 'baby milestone tracker']
  },
  'caregivers': {
    name: 'Caregivers for Elderly',
    keywords: ['caregiver schedule app', 'elderly care tracker', 'medication reminder elderly', 'caregiver log app']
  },
  'roommates': {
    name: 'Roommates / Shared Living',
    keywords: ['roommate expense splitter', 'chore tracker roommates', 'shared grocery list', 'rent split calculator']
  },
  'pet-owners': {
    name: 'Pet Owners',
    keywords: ['dog walk tracker', 'pet feeding schedule', 'vet appointment tracker', 'pet medication reminder', 'dog potty tracker']
  },
  'chronic-illness': {
    name: 'People with Chronic Illness',
    keywords: ['symptom tracker app', 'chronic pain diary', 'flare tracker', 'medication log chronic', 'doctor visit notes']
  },
  'night-shift': {
    name: 'Night Shift Workers',
    keywords: ['night shift schedule', 'sleep tracker night shift', 'shift work calendar', 'night worker sleep']
  },
  'digital-nomads': {
    name: 'Digital Nomads / Remote Workers',
    keywords: ['coworking space finder', 'timezone converter team', 'digital nomad community', 'remote work visa tracker']
  },

  // By Hobby/Interest
  'plant-parents': {
    name: 'Plant Parents',
    keywords: ['plant watering reminder', 'plant identifier care', 'garden planner app', 'plant journal app', 'houseplant tracker']
  },
  'home-brewers': {
    name: 'Home Brewers / Cocktail Enthusiasts',
    keywords: ['homebrew recipe app', 'beer brewing calculator', 'cocktail recipe maker', 'home bar inventory']
  },
  'board-gamers': {
    name: 'Board Game Collectors',
    keywords: ['board game collection tracker', 'board game scorer', 'game night organizer', 'BGG app']
  },
  'thrifters': {
    name: 'Thrifters / Vintage Shoppers',
    keywords: ['thrift store finder', 'reseller inventory app', 'poshmark listing helper', 'vintage price guide']
  },
  'meal-preppers': {
    name: 'Meal Preppers',
    keywords: ['meal prep planner', 'batch cooking app', 'recipe scaler', 'weekly meal prep', 'macro meal planner']
  },
  'journaling': {
    name: 'Journaling / Bullet Journaling',
    keywords: ['bullet journal app', 'daily journal prompts', 'gratitude journal app', 'mood tracker journal']
  },

  // By Specific Problem
  'subscription-tracking': {
    name: 'Subscription Tracking',
    keywords: ['subscription tracker app', 'recurring expense tracker', 'subscription manager', 'cancel subscription reminder']
  },
  'bill-splitting': {
    name: 'Bill Splitting',
    keywords: ['bill splitter app', 'receipt scanner split', 'group expense tracker', 'dinner bill calculator']
  },
  'medication-management': {
    name: 'Medication Management',
    keywords: ['pill reminder app', 'medication tracker', 'refill reminder app', 'drug interaction checker']
  },
  'habit-tracking': {
    name: 'Habit Tracking',
    keywords: ['habit tracker simple', 'streak tracker app', 'daily routine tracker', 'habit building app']
  },
  'warranty-tracking': {
    name: 'Warranty / Receipt Tracking',
    keywords: ['warranty tracker app', 'receipt organizer', 'product registration app', 'return reminder app']
  },
  'home-maintenance': {
    name: 'Home Maintenance',
    keywords: ['home maintenance schedule', 'appliance maintenance tracker', 'home repair log', 'hvac filter reminder']
  },

  // Underserved Demographics
  'adhd': {
    name: 'People with ADHD',
    keywords: ['adhd planner app', 'adhd task manager', 'focus timer adhd', 'adhd reminder app', 'body doubling app']
  },
  'introverts': {
    name: 'Introverts',
    keywords: ['social battery tracker', 'introvert planner', 'alone time tracker', 'social energy app']
  },
  'food-sensitivities': {
    name: 'Food Sensitivities / Allergies',
    keywords: ['allergy food scanner', 'ingredient checker app', 'fodmap tracker', 'gluten free finder', 'food diary allergy']
  }
};

async function searchGooglePlay(keyword, limit = 15) {
  try {
    const results = await gplay.search({
      term: keyword,
      num: limit,
      country: 'us',
      lang: 'en'
    });

    return results.map(app => ({
      source: 'google_play',
      appId: app.appId,
      name: app.title,
      developer: app.developer,
      description: app.summary,
      rating: app.score,
      reviews: app.reviews,
      installs: app.installs,
      url: app.url,
      icon: app.icon,
      free: app.free,
      price: app.price
    }));
  } catch (error) {
    console.error(`  Google Play failed for "${keyword}":`, error.message);
    return [];
  }
}

async function searchAppStore(keyword, limit = 15) {
  try {
    const results = await appStore.search({
      term: keyword,
      num: limit,
      country: 'us',
      lang: 'en-us'
    });

    return results.map(app => ({
      source: 'app_store',
      appId: String(app.id),
      name: app.title,
      developer: app.developer,
      description: app.description?.substring(0, 300),
      rating: app.score,
      reviews: app.reviews,
      url: app.url,
      icon: app.icon,
      free: app.free,
      price: app.price
    }));
  } catch (error) {
    console.error(`  App Store failed for "${keyword}":`, error.message);
    return [];
  }
}

async function discoverAppsForNiche(nicheKey, existingIds = new Set()) {
  const niche = niches[nicheKey];
  if (!niche) {
    console.error(`Niche "${nicheKey}" not found.`);
    return [];
  }

  console.log(`\n[${nicheKey}] ${niche.name}`);

  const allApps = [];
  const seenApps = new Set();

  for (const keyword of niche.keywords) {
    process.stdout.write(`  "${keyword}"...`);

    const [gplayResults, appStoreResults] = await Promise.all([
      searchGooglePlay(keyword),
      searchAppStore(keyword)
    ]);

    let added = 0;
    for (const app of [...gplayResults, ...appStoreResults]) {
      const key = app.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenApps.has(key) && !existingIds.has(app.appId)) {
        seenApps.add(key);
        allApps.push({
          ...app,
          searchKeyword: keyword,
          niche: nicheKey,
          nicheName: niche.name
        });
        added++;
      }
    }

    console.log(` +${added} apps`);
    await new Promise(r => setTimeout(r, 300));
  }

  return allApps;
}

async function discoverAll() {
  console.log('Starting full discovery across all niches...\n');

  const allApps = [];
  const existingIds = new Set();

  for (const nicheKey of Object.keys(niches)) {
    const nicheApps = await discoverAppsForNiche(nicheKey, existingIds);

    // Add new app IDs to prevent cross-niche duplicates
    for (const app of nicheApps) {
      existingIds.add(app.appId);
    }

    allApps.push(...nicheApps);

    // Delay between niches
    await new Promise(r => setTimeout(r, 1000));
  }

  // Save master pool
  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync('./data/master-pool.json', JSON.stringify(allApps, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total apps discovered: ${allApps.length}`);
  console.log(`Saved to: ./data/master-pool.json`);

  return allApps;
}

async function discoverSingleNiche(nicheKey) {
  const apps = await discoverAppsForNiche(nicheKey);

  fs.mkdirSync('./discoveries', { recursive: true });
  fs.writeFileSync(`./discoveries/${nicheKey}.json`, JSON.stringify(apps, null, 2));

  console.log(`\nDiscovered ${apps.length} apps`);
  console.log(`Saved to: ./discoveries/${nicheKey}.json`);

  return apps;
}

// CLI
const args = process.argv.slice(2);
if (args[0] === '--all') {
  discoverAll();
} else if (args[0] === '--list') {
  console.log('Available niches:\n');
  Object.entries(niches).forEach(([key, val]) => {
    console.log(`  ${key.padEnd(25)} ${val.name}`);
  });
} else if (args[0]) {
  discoverSingleNiche(args[0]);
} else {
  console.log('App Discovery Script');
  console.log('====================\n');
  console.log('Usage:');
  console.log('  node discover.js --all           Discover all niches');
  console.log('  node discover.js --list          List available niches');
  console.log('  node discover.js <niche-key>     Discover single niche\n');
}

export { niches, discoverAll, discoverSingleNiche };
