/**
 * tours.js - Guided Tours System
 * Narrative storytelling mode for the Second Brain
 */

// ========== TOUR DATA ==========

const TOURS = [
  {
    id: 'road-to-wwi',
    title: 'The Road to WWI',
    description: 'How a single assassination ignited a global war through a web of alliances and miscalculations',
    duration: '~3 min',
    color: '#f87171',
    icon: '💥',
    stops: [
      {
        title: 'Sarajevo, June 28, 1914',
        location: { lat: 43.8563, lon: 18.4131 },
        camera: { distance: 150, altitude: 30, angle: 0 },
        narration: 'Archduke Franz Ferdinand of Austria is assassinated in Sarajevo by Gavrilo Princip, a Serbian nationalist. What seems like a regional incident will, in just 37 days, plunge the world into the deadliest war humanity has ever seen.',
        duration: 18,
        context: {
          title: 'The Spark',
          content: `**Assassination in Sarajevo**

**June 28, 1914** - Archduke Franz Ferdinand and his wife Sophie are shot dead by 19-year-old Gavrilo Princip.

**The Conspirators:**
- Young Serbian nationalists
- Backed by the Black Hand secret society
- Wanted Bosnia freed from Austria-Hungary

**Why it mattered:**
Austria-Hungary saw this as an existential threat. Serbia was challenging the empire's control of the Balkans. This wasn't just murder—it was a declaration.`
        }
      },
      {
        title: 'The Alliance Web',
        location: { lat: 50.8503, lon: 4.3517 }, // Brussels (neutral)
        camera: { distance: 300, altitude: 80, angle: 45 },
        narration: 'Europe in 1914 was a powder keg of interlocking alliances. The Triple Alliance—Germany, Austria-Hungary, and Italy—faced the Triple Entente—France, Russia, and Britain. An attack on one meant war with all. What started as Austria versus Serbia would cascade into a continental nightmare.',
        duration: 20,
        context: {
          title: 'The Alliance System',
          content: `**Two Armed Camps**

**Triple Alliance:**
🇦🇹 Austria-Hungary
🇩🇪 German Empire
🇮🇹 Italy (later switched sides)

**Triple Entente:**
🇷🇺 Russian Empire
🇫🇷 France
🇬🇧 Britain

**Why it was dangerous:**
- Designed for deterrence, created automaticity
- No single power could de-escalate alone
- Honor and credibility meant alliance commitments were sacred
- Mobilization schedules were inflexible—once started, couldn't stop`
        }
      },
      {
        title: 'The July Crisis',
        location: { lat: 48.2082, lon: 16.3738 }, // Vienna
        camera: { distance: 180, altitude: 40, angle: 30 },
        narration: 'Austria-Hungary, backed by Germany's "blank check," issues an ultimatum to Serbia so harsh it's designed to be rejected. Serbia accepts most terms but hedges on one. Austria declares war on July 28. Russia mobilizes to defend Serbia. Germany declares war on Russia, then France. The dominoes are falling.',
        duration: 22,
        context: {
          title: 'The July Crisis',
          content: `**37 Days to Catastrophe**

**July 23** - Austria's ultimatum to Serbia
**July 25** - Serbia's reply (accepts 8 of 10 demands)
**July 28** - Austria declares war on Serbia
**July 30** - Russia mobilizes its army
**August 1** - Germany declares war on Russia
**August 3** - Germany declares war on France
**August 4** - Germany invades Belgium; Britain declares war

**The Blank Check:**
Germany promised Austria-Hungary unconditional support, emboldening Vienna to issue impossible demands.

**The Mobilization Trap:**
Military plans (like Germany's Schlieffen Plan) required rapid mobilization. Once started, generals said it couldn't be stopped without leaving the country defenseless.`
        }
      },
      {
        title: 'The Schlieffen Plan',
        location: { lat: 50.5039, lon: 4.4699 }, // Belgium
        camera: { distance: 200, altitude: 50, angle: 15 },
        narration: 'Germany's war plan requires invading neutral Belgium to quickly defeat France before Russia can fully mobilize. When German troops cross the Belgian border on August 4, Britain—guarantor of Belgian neutrality—declares war. A regional conflict has become a world war.',
        duration: 20,
        context: {
          title: 'Invasion of Belgium',
          content: `**The Schlieffen Plan**

Germany's strategy:
1. Knock out France in 6 weeks via Belgium
2. Then turn full force to Russia
3. Avoid a two-front war

**Why Belgium mattered:**
- Declared neutral since 1839
- Britain was treaty-bound to defend it
- Germany gambled Britain wouldn't fight

**The gamble failed:**
Britain entered the war, bringing the British Empire (Canada, Australia, India) with it. What was meant to be a quick victory became a four-year bloodbath.`
        }
      },
      {
        title: 'The Great War Begins',
        location: { lat: 50.0755, lon: 14.4378 }, // Prague (Central Europe)
        camera: { distance: 400, altitude: 100, angle: 60 },
        narration: 'By mid-August 1914, all the great powers of Europe are at war. Millions of men are marching to the front, expecting to be home by Christmas. Instead, they will fight for four years in trenches, with machine guns, poison gas, and artillery. Ten million soldiers will die. Empires will collapse. The world will never be the same.',
        duration: 25,
        context: {
          title: 'The Great War',
          content: `**Total War**

**The Combatants:**
- 70 million soldiers mobilized
- 60+ million European population involved
- Empires on every continent

**The Horrors:**
- Trench warfare (1915-1918)
- First use of poison gas, tanks, aircraft
- Battle of the Somme: 1 million casualties
- Battle of Verdun: 700,000 casualties

**The Aftermath:**
- 10 million soldiers dead
- 7 million civilians dead
- 4 empires destroyed (German, Austro-Hungarian, Russian, Ottoman)
- Treaty of Versailles (1919) set the stage for WWII

**The Lesson:**
A single assassination + rigid alliances + inflexible military plans + a failure of diplomacy = the end of the old world order.`
        }
      }
    ]
  },

  {
    id: 'appeasement-to-wwii',
    title: 'Appeasement to WWII',
    description: 'How Britain and France tried to avoid war by giving Hitler what he wanted—and got war anyway',
    duration: '~3 min',
    color: '#fbbf24',
    icon: '📜',
    stops: [
      {
        title: 'Rhineland, March 1936',
        location: { lat: 50.9375, lon: 6.9603 }, // Cologne
        camera: { distance: 160, altitude: 35, angle: 20 },
        narration: 'Hitler sends troops into the demilitarized Rhineland, violating the Treaty of Versailles. France and Britain protest but do nothing. Hitler later said if they had resisted, German forces would have retreated with their tails between their legs. Instead, he learned that the democracies would not fight.',
        duration: 20,
        context: {
          title: 'The Rhineland Crisis',
          content: `**Hitler's First Gamble**

**March 7, 1936** - German troops march into the Rhineland

**Why it was illegal:**
- Treaty of Versailles (1919) demilitarized the Rhineland
- Locarno Treaties (1925) confirmed it
- Hitler's own generals opposed the move

**Why Britain/France didn't act:**
- Still traumatized by WWI
- Public opinion opposed war
- France wouldn't move without Britain
- Britain saw it as "Germany's backyard"

**Hitler's takeaway:**
"The world belongs to the bold." He would test the democracies again and again.`
        }
      },
      {
        title: 'Anschluss, March 1938',
        location: { lat: 48.2082, lon: 16.3738 }, // Vienna
        camera: { distance: 180, altitude: 40, angle: 25 },
        narration: 'Hitler annexes Austria in a bloodless takeover. Austrian Nazis welcome German troops. Britain and France again condemn but take no action. Austria, the nation whose Archduke's death started World War I, ceases to exist without a shot fired.',
        duration: 18,
        context: {
          title: 'The Anschluss',
          content: `**Austria Absorbed**

**March 12, 1938** - German troops enter Austria

**How it happened:**
- Austrian Nazis staged rallies demanding union with Germany
- Austrian chancellor pressured to resign
- Hitler claimed he was "restoring order"
- Austrians held a plebiscite: 99.7% voted yes (under Nazi supervision)

**Why no one stopped it:**
- Many saw it as Germans uniting with Germans
- Austria had a large Nazi movement
- Treaty of Versailles had forbidden Anschluss, but who would enforce it?

**The cost:**
Austria's Jews faced immediate persecution. Within months, Kristallnacht. Within years, the Holocaust.`
        }
      },
      {
        title: 'Munich, September 1938',
        location: { lat: 48.1351, lon: 11.5820 }, // Munich
        camera: { distance: 170, altitude: 38, angle: 30 },
        narration: 'Hitler demands the Sudetenland, the German-speaking region of Czechoslovakia. Britain's Chamberlain flies to Munich and agrees to partition Czechoslovakia without even consulting the Czechs. Chamberlain returns to London declaring "peace for our time." Churchill calls it a defeat.',
        duration: 22,
        context: {
          title: 'Munich Agreement',
          content: `**"Peace for Our Time"**

**September 30, 1938** - Britain, France, Germany, Italy agree to give Hitler the Sudetenland

**The Players:**
- 🇬🇧 Neville Chamberlain (UK Prime Minister)
- 🇫🇷 Édouard Daladier (French PM)
- 🇩🇪 Adolf Hitler
- 🇮🇹 Benito Mussolini
- 🇨🇿 Czechoslovakia (not invited)

**Chamberlain's logic:**
"We cannot go to war over a dispute in a faraway country between people of whom we know nothing."

**Churchill's response:**
"You were given the choice between war and dishonor. You chose dishonor, and you will have war."

**The betrayal:**
Czechoslovakia lost its defenses, its industry, and its will to fight. Within 6 months, Hitler would take the rest.`
        }
      },
      {
        title: 'Prague, March 1939',
        location: { lat: 50.0755, lon: 14.4378 }, // Prague
        camera: { distance: 165, altitude: 36, angle: 22 },
        narration: 'Hitler tears up the Munich Agreement and occupies the rest of Czechoslovakia. This time he's not even claiming to unite Germans—he's conquering Slavs. Appeasement is dead. Britain and France finally realize Hitler's promises are worthless. They guarantee Poland's independence.',
        duration: 20,
        context: {
          title: 'The End of Appeasement',
          content: `**March 15, 1939** - German troops occupy Prague

**Why this was different:**
- Hitler had promised Munich was his "last territorial demand"
- The Sudetenland was German-speaking; Czechs are Slavs
- This proved Hitler wanted empire, not just ethnic unity

**The turning point:**
Britain and France finally understood Hitler would never be satisfied. Appeasement had failed.

**New policy:**
- March 31: Britain guarantees Poland
- April 6: France reaffirms alliance with Poland
- Message to Hitler: "This far, no further"

**But Hitler didn't believe them.** They'd given him everything he wanted for three years. Why would they fight now?`
        }
      },
      {
        title: 'Poland, September 1939',
        location: { lat: 52.2297, lon: 19.5156 }, // Poland (center)
        camera: { distance: 250, altitude: 65, angle: 50 },
        narration: 'On September 1, 1939, Hitler invades Poland. Two days later, Britain and France declare war. World War II has begun. Over the next six years, 70 million people will die. Appeasement, meant to prevent war, only delayed it—and made it worse when it came.',
        duration: 23,
        context: {
          title: 'World War II Begins',
          content: `**September 1, 1939** - Germany invades Poland

**Blitzkrieg:**
- 1.5 million German troops
- Tanks, aircraft, coordinated assault
- Poland overwhelmed in 5 weeks

**September 3** - Britain and France declare war

**The Appeasement Paradox:**
Chamberlain tried to prevent war by giving Hitler what he wanted. But:
1. Every concession made Hitler stronger
2. Every concession convinced Hitler the democracies were weak
3. When war finally came, Germany was more powerful and the democracies less prepared

**The Cost:**
- 70-85 million dead worldwide
- Holocaust: 6 million Jews murdered
- Atomic weapons used
- Europe in ruins
- The British Empire collapses

**The Lesson:**
Appeasing dictators doesn't prevent war. It ensures war happens on their terms, not yours.`
        }
      }
    ]
  },

  {
    id: 'nuclear-brinkmanship',
    title: 'Nuclear Brinkmanship',
    description: 'Three times the world came within minutes of nuclear war—and how we barely survived',
    duration: '~3 min',
    color: '#818cf8',
    icon: '☢️',
    stops: [
      {
        title: 'Cuban Missile Crisis, October 1962',
        location: { lat: 21.5218, lon: -77.7812 }, // Cuba
        camera: { distance: 200, altitude: 50, angle: 35 },
        narration: 'Soviet nuclear missiles in Cuba. American blockade. Khrushchev and Kennedy staring each other down. For 13 days, the world holds its breath. On October 27, a Soviet submarine commander named Vasily Arkhipov refuses to launch a nuclear torpedo. One man's decision saves the world.',
        duration: 25,
        context: {
          title: 'Cuban Missile Crisis',
          content: `**October 16-28, 1962** - 13 Days on the Brink

**The Setup:**
- USSR secretly places nuclear missiles in Cuba (90 miles from Florida)
- US spy planes discover the sites
- Kennedy imposes naval blockade
- Khrushchev refuses to back down

**The Breaking Point - October 27:**
US Navy drops depth charges on Soviet submarine B-59 (didn't know it carried nuclear torpedoes)

**The three officers who could launch:**
- Captain Savitsky: "We're going to blast them now!"
- Political Officer Maslennikov: Agreed
- **Vasily Arkhipov** (second captain): **Refused**

**Rules required unanimous consent.** Arkhipov said no. The torpedo wasn't launched.

**How close we came:**
- SAC bombers armed and airborne
- Soviet ships approaching blockade
- One US U2 shot down over Cuba
- Another strayed into Soviet airspace

**Resolution:**
Secret deal—USSR removes missiles from Cuba, US removes missiles from Turkey. But the world didn't know how close we came until decades later.`
        }
      },
      {
        title: 'Able Archer 83, November 1983',
        location: { lat: 50.1109, lon: 8.6821 }, // Frankfurt (NATO HQ region)
        camera: { distance: 190, altitude: 45, angle: 30 },
        narration: 'NATO runs a nuclear war exercise called Able Archer 83. But the Soviets think it might be cover for a real first strike. The KGB goes on high alert. Soviet nuclear forces prepare to launch. Then, a Soviet intelligence officer named Stanislav Petrov sees what looks like incoming American missiles—and decides it's a false alarm. He's right. Another unknown hero.',
        duration: 26,
        context: {
          title: 'Able Archer 83',
          content: `**November 7-11, 1983** - The War That Almost Was

**The Context:**
- Reagan called USSR "evil empire"
- US deployed Pershing II missiles in Europe (10-min flight time to Moscow)
- KGB convinced US was planning first strike
- Andropov (Soviet leader) was paranoid and dying

**Able Archer 83:**
NATO's annual command post exercise simulating nuclear war

**Why Soviets panicked:**
- Exercise used new encrypted comms
- Practiced transitioning to DEFCON 1
- High-ranking officials participated (unusual)
- Coincided with US troops on alert in Europe

**Soviet response:**
- Nuclear forces placed on high alert
- Aircraft armed with nuclear weapons
- Readied to launch preemptive strike

**Why it didn't happen:**
- British intelligence (Oleg Gordievsky) warned the West
- NATO didn't realize Soviets were serious
- Exercise ended before escalation

**Petrov's Role (Sept 26, 1983):**
Two months earlier, Soviet early warning system detected 5 US ICBMs launching. Lt. Col. Stanislav Petrov suspected malfunction, reported it as false alarm. He was right—satellites had mistaken sunlight for missiles.

**Two near-misses in 8 weeks.**`
        }
      },
      {
        title: 'North Korea Today',
        location: { lat: 39.0392, lon: 125.7625 }, // Pyongyang
        camera: { distance: 180, altitude: 42, angle: 28 },
        narration: 'In 2017, Trump threatens "fire and fury" as North Korea tests ICBMs. Kim Jong Un threatens to nuke Guam. The rhetoric escalates. Today, North Korea has an estimated 30-40 nuclear warheads and missiles that can reach the US mainland. The danger hasn't gone away—it's multiplied.',
        duration: 22,
        context: {
          title: 'The New Nuclear Age',
          content: `**North Korea's Nuclear Program**

**2017 Crisis:**
- North Korea tests Hwasong-15 ICBM (range: US mainland)
- Trump: "Fire and fury like the world has never seen"
- Kim: "Nuclear button is on my desk"
- Threats of preventive strikes

**Current Status (2024-2026):**
- 30-40 nuclear warheads (estimated)
- ICBMs, SLBMs, tactical nukes
- Solid-fuel missiles (harder to detect)
- Growing arsenal despite sanctions

**Why It's Dangerous:**
1. **Unpredictable leadership** - Kim's regime is isolated and erratic
2. **No hotline** - US and NK have no direct crisis communication
3. **Short warning time** - Missiles from NK to Seoul: 3 minutes
4. **Regional instability** - China, Russia, Japan, SK all involved

**The Nightmare Scenario:**
Misinterpreted military exercise + aggressive rhetoric + short decision time = accidental war

**The Lesson:**
The Cold War is over, but the nuclear danger isn't. It's fragmented, unpredictable, and spreading.`
        }
      }
    ]
  },

  {
    id: 'echoes-2026',
    title: '2026: Echoes of History',
    description: 'Iran vs. Israel, great power alignments, and the shadows of 1914 and 1939',
    duration: '~3 min',
    color: '#22d3ee',
    icon: '🌍',
    stops: [
      {
        title: 'The Alliance Map, 2026',
        location: { lat: 31.7683, lon: 35.2137 }, // Jerusalem
        camera: { distance: 300, altitude: 75, angle: 50 },
        narration: 'Look at the Middle East in 2026. Israel, backed by the US and increasingly by Sunni Arab states. Iran, supported by Russia, China, and Shia militias across the region. Sound familiar? It's the alliance web of 1914, redrawn for the 21st century. An attack on one could cascade into a regional or global war.',
        duration: 24,
        context: {
          title: 'The New Alliance System',
          content: `**Two Armed Camps (Sound Familiar?)**

**Bloc 1:**
🇮🇱 Israel
🇺🇸 United States
🇸🇦 Saudi Arabia (tacit)
🇦🇪 UAE
🇧🇭 Bahrain

**Bloc 2:**
🇮🇷 Iran
🇷🇺 Russia
🇨🇳 China (economic/diplomatic)
🇸🇾 Syria
🇱🇧 Hezbollah
🇾🇪 Houthis
🇮🇶 Shia militias

**The 1914 Parallel:**
- Rigid alliances ✓
- Arms buildups ✓
- Mutual defense commitments ✓
- Nationalist fervor ✓
- Leaders locked into positions ✓

**The Danger:**
Regional conflict (Israel vs. Iran) → US intervention → Russian/Chinese response → great power war

**The Difference:**
Nuclear weapons. In 1914, the great powers stumbled into war. In 2026, they would stumble into nuclear war.`
        }
      },
      {
        title: 'The Appeasement Question',
        location: { lat: 35.6892, lon: 51.3890 }, // Tehran
        camera: { distance: 190, altitude: 45, angle: 32 },
        narration: 'Iran is months away from a nuclear weapon. Israel wants to strike now. The US wants diplomacy. Does engagement with Iran prevent war, or does it give them time to go nuclear? Is the Iran nuclear deal appeasement, or smart statecraft? Chamberlain faced the same question in 1938. He chose wrong.',
        duration: 23,
        context: {
          title: 'The Iran Nuclear Dilemma',
          content: `**The Appeasement Parallel**

**1938: Hitler and Czechoslovakia**
Chamberlain: "Give him the Sudetenland to avoid war"
Churchill: "You're making him stronger"
Result: War came anyway, and Germany was stronger

**2026: Iran's Nuclear Program**
Diplomats: "Negotiate limits, avoid war"
Hawks: "They'll cheat, build the bomb, then we're screwed"

**Current Status:**
- Iran enriching uranium to 60% (90% is weapons-grade)
- Advanced centrifuges installed
- IAEA inspectors restricted
- Breakout time: weeks to months

**The Debate:**
**Engagement camp:** Deal is imperfect but war is worse. Keep talking.
**Pressure camp:** Iran is playing for time. Strike before they go nuclear.

**The Risk:**
If engagement fails and Iran gets the bomb, the Middle East becomes a nuclear powderkeg. If strikes happen, Iran retaliates via proxies, oil prices spike, regional war.

**The Question:**
Is this 1938 (appeasement leading to worse war), or is military action the reckless choice? History doesn't repeat, but it rhymes.`
        }
      },
      {
        title: 'Trigger Points',
        location: { lat: 27.9506, lon: 34.3305 }, // Strait of Tiran
        camera: { distance: 220, altitude: 55, angle: 40 },
        narration: 'Just like Sarajevo in 1914, there are flashpoints today. A Hezbollah rocket barrage. An Israeli strike on Iranian nuclear sites. A US Navy ship hit in the Gulf. Any of these could be the Archduke moment—a spark that ignites the powder keg. The question is not if there will be a crisis, but whether leaders will be wise enough to step back.',
        duration: 25,
        context: {
          title: 'The Sarajevo Scenarios',
          content: `**Modern Flashpoints**

**Scenario 1: The Nuclear Strike**
Israel bombs Iranian nuclear facilities → Iran retaliates via Hezbollah, Houthis → US drawn in → Russia/China respond

**Scenario 2: The Proxy Escalation**
Hezbollah launches massive rocket attack → Israel invades Lebanon → Syria and Iran intervene → regional war

**Scenario 3: The Gulf Incident**
Iran sinks/damages US Navy ship (mines, drones, proxy attack) → US strikes Iranian military → Iran closes Strait of Hormuz → global oil shock → war

**Scenario 4: The Terror Wildcard**
Major attack attributed to Iran (assassination, dirty bomb, cyber) → demands for retaliation → pressure to strike

**The 1914 Parallel:**
In July 1914, leaders had multiple off-ramps. They didn't take them because:
- Alliance commitments locked them in
- Mobilization schedules created deadlines
- Domestic politics demanded toughness
- No one believed the other side would really fight

**Today:**
Same dynamics. Leaders locked in by alliances, deterrence credibility, domestic politics, and the belief that the other side is bluffing.

**The Difference:**
In 1914, they had weeks to decide. Today, missiles travel in minutes. There's no time for the kind of diplomacy that could have stopped WWI.`
        }
      },
      {
        title: 'The Choice',
        location: { lat: 40.7128, lon: -74.0060 }, // New York (UN)
        camera: { distance: 280, altitude: 70, angle: 55 },
        narration: 'History doesn't repeat, but it echoes. The alliance traps of 1914. The appeasement failures of 1938. The nuclear near-misses of the Cold War. We've learned these lessons before—but each generation has to choose whether to remember them. In 2026, the choice is ours. Let's hope we choose wisely.',
        duration: 24,
        context: {
          title: 'Lessons from History',
          content: `**What We Should Have Learned**

**From 1914:**
- Rigid alliances turn local conflicts into world wars
- Mobilization schedules create artificial deadlines
- Leaders locked into positions can't back down
- Belief that war is inevitable makes it so

**From 1938:**
- Appeasement emboldens aggressors
- Kicking the can down the road often makes things worse
- Deterrence only works if you're willing to follow through

**From 1962-1983:**
- Nuclear war can happen by accident
- Early warning systems fail
- Human judgment (Arkhipov, Petrov) can save the world
- Crisis communication and de-escalation mechanisms matter

**The 2026 Test:**
Can we learn from history without repeating it?

**What gives hope:**
- Hotlines between nuclear powers (US-Russia, US-China)
- Institutional memory of past crises
- Economic interdependence (more than 1914)
- Public awareness of nuclear danger

**What worries:**
- Fragmented nuclear landscape (NK, Pakistan, soon Iran?)
- Social media accelerating crises
- Domestic politics incentivizing toughness over compromise
- Declining trust in international institutions

**The Bottom Line:**
The past teaches, but it doesn't decide. We do. Every day, leaders choose whether to escalate or de-escalate, threaten or talk, double down or step back.

**History is watching. Let's not give it a reason to repeat.**`
        }
      }
    ]
  }
];

// ========== TOUR ENGINE ==========

class TourEngine {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.currentTour = null;
    this.currentStopIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.narrationRate = 1.0;
    this.autoAdvanceTimer = null;
    this.speechSynth = window.speechSynthesis;
    this.currentUtterance = null;
    this.audioElement = null;
    this.onComplete = null;
  }

  startTour(tourId, onComplete = null) {
    this.currentTour = TOURS.find(t => t.id === tourId);
    if (!this.currentTour) {
      console.error('Tour not found:', tourId);
      return;
    }

    this.currentStopIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.onComplete = onComplete;

    // Hide tour menu, show tour controls
    this.showTourUI();
    
    // Start first stop
    this.goToStop(0);
  }

  goToStop(index) {
    if (!this.currentTour || index < 0 || index >= this.currentTour.stops.length) return;

    this.currentStopIndex = index;
    const stop = this.currentTour.stops[index];

    // Update UI
    this.updateProgressBar();
    this.updateStopTitle(stop.title);

    // Fly camera to location
    this.flyToLocation(stop);

    // Show context panel
    this.showContextPanel(stop.context);

    // Start narration
    if (!this.isPaused) {
      this.speak(stop.narration);
    }

    // Auto-advance after duration
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.autoAdvanceTimer = setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.nextStop();
      }
    }, stop.duration * 1000 / this.narrationRate);
  }

  flyToLocation(stop) {
    const { lat, lon } = stop.location;
    const cam = stop.camera || { distance: 200, altitude: 50, angle: 30 };

    // Convert lat/lon to 3D position
    const radius = 100; // Earth radius in scene units
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const targetX = -(radius * Math.sin(phi) * Math.cos(theta));
    const targetY = radius * Math.cos(phi);
    const targetZ = radius * Math.sin(phi) * Math.sin(theta);

    // Camera offset
    const camDist = cam.distance;
    const camAngle = cam.angle * (Math.PI / 180);
    const camAlt = cam.altitude;

    const cameraX = targetX - camDist * Math.sin(camAngle);
    const cameraY = targetY + camAlt;
    const cameraZ = targetZ - camDist * Math.cos(camAngle);

    // Animate camera
    this.animateCamera(
      { x: cameraX, y: cameraY, z: cameraZ },
      { x: targetX, y: targetY, z: targetZ },
      2000 // 2 second transition
    );
  }

  animateCamera(targetPos, lookAtPos, duration) {
    const startPos = { ...this.camera.position };
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      this.camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
      this.camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
      this.camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;

      this.camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  speak(text) {
    // Cancel any ongoing speech
    this.speechSynth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.narrationRate;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Try to use a good voice
    const voices = this.speechSynth.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US'
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    this.currentUtterance = utterance;
    this.speechSynth.speak(utterance);
  }

  nextStop() {
    if (this.currentStopIndex < this.currentTour.stops.length - 1) {
      this.goToStop(this.currentStopIndex + 1);
    } else {
      this.endTour();
    }
  }

  previousStop() {
    if (this.currentStopIndex > 0) {
      this.goToStop(this.currentStopIndex - 1);
    }
  }

  pause() {
    this.isPaused = true;
    this.speechSynth.pause();
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
    }
  }

  resume() {
    this.isPaused = false;
    this.speechSynth.resume();
    
    // Restart auto-advance with remaining time
    const stop = this.currentTour.stops[this.currentStopIndex];
    this.autoAdvanceTimer = setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.nextStop();
      }
    }, stop.duration * 1000 / this.narrationRate);
  }

  setSpeed(rate) {
    this.narrationRate = rate;
    // Restart current narration at new speed
    if (this.isPlaying && !this.isPaused) {
      const stop = this.currentTour.stops[this.currentStopIndex];
      this.speak(stop.narration);
    }
  }

  endTour() {
    this.isPlaying = false;
    this.speechSynth.cancel();
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    
    // Hide tour UI
    this.hideTourUI();
    
    // Call completion callback
    if (this.onComplete) this.onComplete();
    
    // Save progress
    this.saveProgress();
  }

  // UI methods (implementations depend on DOM structure)
  showTourUI() {
    const menu = document.getElementById('tour-menu');
    const controls = document.getElementById('tour-controls');
    if (menu) menu.style.display = 'none';
    if (controls) controls.style.display = 'flex';
  }

  hideTourUI() {
    const menu = document.getElementById('tour-menu');
    const controls = document.getElementById('tour-controls');
    if (menu) menu.style.display = 'grid';
    if (controls) controls.style.display = 'none';
  }

  updateProgressBar() {
    const progress = document.getElementById('tour-progress-bar');
    const text = document.getElementById('tour-progress-text');
    if (progress && this.currentTour) {
      const pct = ((this.currentStopIndex + 1) / this.currentTour.stops.length) * 100;
      progress.style.width = `${pct}%`;
    }
    if (text && this.currentTour) {
      text.textContent = `${this.currentStopIndex + 1} / ${this.currentTour.stops.length}`;
    }
  }

  updateStopTitle(title) {
    const el = document.getElementById('tour-stop-title');
    if (el) el.textContent = title;
  }

  showContextPanel(context) {
    const panel = document.getElementById('tour-context-panel');
    if (!panel) return;

    const title = panel.querySelector('.context-title');
    const content = panel.querySelector('.context-content');
    
    if (title) title.textContent = context.title;
    if (content) content.innerHTML = this.markdownToHTML(context.content);
    
    panel.classList.add('visible');
  }

  markdownToHTML(md) {
    return md
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>');
  }

  saveProgress() {
    if (!this.currentTour) return;
    const progress = {
      tourId: this.currentTour.id,
      stopIndex: this.currentStopIndex,
      timestamp: Date.now()
    };
    localStorage.setItem('tour-progress', JSON.stringify(progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('tour-progress');
    return saved ? JSON.parse(saved) : null;
  }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOURS, TourEngine };
}
