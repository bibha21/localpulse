/*
 * LocalPulse lightweight i18n.
 *
 * No build step - this file is loaded as a plain <script> before every page
 * script. It exposes:
 *   window.t(key, vars)   -> translated string ("{name}" placeholders filled from vars)
 *   window.currentLang    -> "en" | "fi" | "sv"
 *   window.applyI18n(root) -> (re)translate all [data-i18n*] nodes under root
 *
 * When the language changes it fires a "i18n:changed" event on window, so page
 * scripts that render dynamic content can re-render with the new language.
 *
 * Default language is English. The choice is remembered in localStorage under
 * "lp_lang" (same key the original index.html prototype used).
 *
 * Scope: this localizes the app's own UI chrome. Text that comes back from the
 * backend API (AI-generated area summaries, classifier categories, pulse
 * statuses) is left as the backend returns it.
 */
(function () {
  "use strict";

  const STRINGS = {
    en: {
      // --- shared: language names ---
      "lang.en": "English",
      "lang.fi": "Suomi",
      "lang.sv": "Svenska",
      "lang.aria": "Choose language",

      // Neighbourhood (Espoo district) filter
      "hood.label": "Neighbourhood",
      "hood.all": "All neighbourhoods",
      "hood.name.leppavaara": "Leppävaara",
      "hood.name.tapiola": "Tapiola",
      "hood.name.matinkyla": "Matinkylä",
      "hood.name.espoon_keskus": "Espoon keskus",
      "hood.name.espoonlahti": "Espoonlahti",
      "hood.name.kauklahti": "Kauklahti",
      "ideas.noHood": "No ideas pitched for {hood} yet.",
      "community.noHood": "No community initiatives in {hood} yet.",
      "pulse.noInitiativesHood": "No initiatives for {hood} yet.",
      "pulse.activityHoodEmpty": "No recent activity in {hood}.",

      // --- shared: header / nav / footer ---
      "header.eyebrow": "City of Espoo",
      "header.eyebrowPlanner": "City of Espoo · Planner view",
      "nav.pulse": "The Pulse",
      "nav.report": "Report",
      "nav.dashboard": "Planner dashboard",
      "nav.ideas": "Idea Incubator",
      "nav.community": "Community",
      "nav.topics": "City topics",
      "footer.tagline": "Built for a more connected, resilient Espoo - together with residents and the City of Espoo.",
      "footer.copy": "City of Espoo · LocalPulse prototype",

      // --- shared: report status labels (backend/database.py REPORT_STATUSES) ---
      "status.submitted": "Submitted",
      "status.received": "Received",
      "status.under_review": "Under Review",
      "status.assigned": "Assigned",
      "status.action_planned": "Action Planned",
      "status.completed": "Completed",

      // --- index.html ---
      "index.docTitle": "LocalPulse - Espoo | Report a concern",
      "index.heroH1": "Your Neighbourhood. Your Voice. Your Espoo.",
      "index.heroSubtitle": "Tell us what could make your neighbourhood safer, greener, more inclusive and more vibrant. AI helps turn your experience into ideas and actions - together with your community and the City of Espoo.",
      "index.subtitle": "Report a concern or idea in your neighbourhood",
      "index.ctaReport": "📍 Report an Issue",
      "index.ctaIdea": "💡 Share an Idea",
      "index.ctaCommunity": "🤝 Find Community Activities",
      "index.ctaMap": "🗺️ Explore Neighbourhood Map",
      "index.locateBtn": "📍 Use my location",
      "index.locating": "Locating...",
      "index.noteLabel": "What's going on?",
      "index.notePlaceholder": "e.g. Broken streetlight on Otaniementie",
      "index.voiceBtn": "🎤 Voice",
      "index.voiceBtnRecording": "⏹ Stop",
      "index.photoLabel": "Add a photo (optional)",
      "index.submitBtn": "Submit report",
      "index.privacyNote": "🔒 Your report is used to spot neighbourhood patterns for City of Espoo planners. Only aggregated, anonymised counts are shown on the planner dashboard - your exact location and note are never displayed publicly.",
      "index.myReportsH2": "You Reported It. What Happened?",
      "index.myReportsIntro": "Reports you've submitted from this browser, and where they stand.",
      "index.myReportsEmpty": "Reports you submit will show up here so you can track what happens next.",
      "index.reportsLoadFail": "Couldn't load your reports right now.",
      "index.reportCard": "Report #{id} -",
      "index.simulateBtn": "Simulate city update →",
      "index.pipelineComplete": "Pipeline complete",
      "index.tapMap": "Tap the map to mark where the issue is first.",
      "index.needSomething": "Add a description or a photo (at least one is needed).",
      "index.submitting": "Submitting...",
      "index.thankYou": "Reported as \"{category}\" (confidence {confidence}). Thank you!",
      "index.submitFail": "Couldn't submit that report - please check the details and try again.",
      "index.networkError": "Something went wrong - is the backend running?",
      "index.voiceUnsupported": "Voice input isn't supported in this browser.",
      "index.geoUnsupported": "Your browser doesn't support location lookup - tap the map instead.",
      "index.locateFound": "Location found - adjust the pin if needed, then describe the issue.",
      "index.locateFail": "Couldn't get your location - tap the map to mark it manually.",

      // --- dashboard.html ---
      "dash.docTitle": "LocalPulse - Espoo | Planner dashboard",
      "dash.h1": "LocalPulse - Planner view",
      "dash.headerSub": "Neighbourhood engagement patterns across Espoo",
      "dash.pulseH2": "Neighbourhood Pulse",
      "dash.pulseIntro": "A fast, district-level overview before drilling into the map below.",
      "dash.legendLow": "Low review need",
      "dash.legendHigh": "Higher review need",
      "dash.legendSize": "Circle size = report volume",
      "dash.showLowSignal": "Show low-signal areas (< 3 reports)",
      "dash.privacyNote": "🔒 This view only ever shows grid-cell or district-level aggregates - report counts and a plain-language summary. No individual report's exact location or note text is ever shown here.",
      "dash.reportsCount": "{count} reports",
      "dash.noAreas": "No reports yet - patterns will appear here once residents start reporting.",
      "dash.needsReview": "⚠ needs review",
      "dash.flaggedForReview": "{count} report(s) flagged for review",
      "dash.noDescription": "(no description)",
      "dash.needsReviewInline": "needs review",
      "dash.reportMeta": "confidence: {confidence} · reported: {date}",
      "dash.takeAction": "Take action → {status}",
      "dash.pipelineComplete": "Pipeline complete",
      "dash.updating": "Updating...",
      "dash.takeActionShort": "Take action →",
      "dash.pulseActivity": "{level} activity - {count} reports",
      "dash.topPriorities": "Top resident priorities",
      "dash.noDistrictActivity": "No district-level activity yet.",
      "dash.levelHigh": "High",
      "dash.levelMedium": "Medium",
      "dash.levelLow": "Low",

      // --- shared: AI insight block (dashboard + topics) ---
      "insight.generate": "🤖 Generate AI insight",
      "insight.generating": "Generating...",
      "insight.ideaLabel": "Idea:",
      "insight.aiUnavailable": "(AI unavailable right now - showing an automatic summary instead)",

      // --- ideas.html ---
      "ideas.docTitle": "LocalPulse - Espoo | Idea Incubator",
      "ideas.headerSub": "Report a concern or idea in your Espoo neighbourhood",
      "ideas.h2": "Idea Incubator",
      "ideas.intro": "Discover, support, and collaborate on fresh ideas pitched by your neighbours to improve our community spaces.",
      "ideas.sortRecent": "Recent",
      "ideas.sortMostSupported": "Most Supported",
      "ideas.sortUrgent": "Urgent Needs",
      "ideas.searchPlaceholder": "Search ideas by title or keyword...",
      "ideas.ctaTitle": "Have a bright idea?",
      "ideas.ctaBody": "Got a concept to improve our neighbourhood? Pitch it to the community and gather support.",
      "ideas.ctaBtn": "Pitch a New Idea",
      "ideas.badgeSeekingFunding": "Seeking Funding",
      "ideas.badgeEco": "Eco-Friendly",
      "ideas.badgeSocial": "High Social Value",
      "ideas.support": "Support",
      "ideas.supported": "✓ Supported",
      "ideas.volunteer": "Volunteer",
      "ideas.volunteersSuffix": "Volunteers",
      "ideas.budgetTBD": "Budget TBD",
      "ideas.noMatch": "No ideas match \"{term}\".",

      // --- pitch-idea.html ---
      "pitch.docTitle": "LocalPulse - Espoo | Pitch Your Idea",
      "pitch.h2": "Pitch Your Idea",
      "pitch.intro": "Don't worry about perfect phrasing. Describe your vision, and our AI will help refine it into an actionable community proposal.",
      "pitch.titleLabel": "Give your idea a short title",
      "pitch.titlePlaceholder": "e.g., Community garden on 4th street",
      "pitch.descLabel": "Describe your idea in plain language",
      "pitch.descPlaceholder": "e.g., I think we should turn the empty lot on 4th street into a community garden. We could have raised beds and a composting area...",
      "pitch.charCount": "{n} / 2000 characters",
      "pitch.aiReady": "AI is listening and ready to refine your idea...",
      "pitch.aiAnalyzing": "AI is analyzing your idea...",
      "pitch.aiUpdated": "Predictions updated based on your description.",
      "pitch.aiFail": "Couldn't reach the AI service - is the backend running?",
      "pitch.collabH3": "Collaboration Needs",
      "pitch.collabIntro": "What kind of support are you looking for?",
      "pitch.needVolunteers": "Looking for volunteers",
      "pitch.needMentor": "Need a mentor/expert advice",
      "pitch.needFunding": "Seeking funding/grants",
      "pitch.impactH3": "Impact Prediction",
      "pitch.impactIntro": "Based on similar community projects.",
      "pitch.socialConnectivity": "Social Connectivity",
      "pitch.environmental": "Environmental",
      "pitch.resourceH3": "Resource Estimation",
      "pitch.resourceIntro": "Preliminary estimates to help you plan.",
      "pitch.estBudget": "Est. Budget",
      "pitch.volunteersNeeded": "Volunteers Needed",
      "pitch.saveDraft": "Save Draft",
      "pitch.publish": "Publish to Incubator",
      "pitch.volunteersUnit": "{min}-{max} people",
      "pitch.needTitleDesc": "Please add a title and description first.",
      "pitch.savingDraft": "Saving draft...",
      "pitch.publishing": "Publishing...",
      "pitch.draftSaved": "Draft saved.",
      "pitch.published": "Published to the Idea Incubator!",
      "pitch.error": "Something went wrong - is the backend running?",

      // --- community.html ---
      "community.docTitle": "LocalPulse - Espoo | Community",
      "community.headerSub": "Find people and initiatives in your Espoo neighbourhood",
      "community.h2": "Find People & Community Initiatives",
      "community.intro": "Discover local associations, groups and activities near you, and reduce isolation by connecting with neighbours who share your interests.",
      "community.demoBanner": "🧪 <strong>Demo content.</strong> These are illustrative examples for the prototype, not real Espoo organisations. A production build would connect to the City of Espoo's community and association registries.",
      "community.searchPlaceholder": "Search by keyword...",
      "community.tabAll": "All",
      "community.interested": "✓ Interested",
      "community.imInterested": "I'm interested",
      "community.noMatch": "No community initiatives match your search.",
      "community.cat.Local associations": "Local associations",
      "community.cat.Sports groups": "Sports groups",
      "community.cat.Youth activities": "Youth activities",
      "community.cat.Volunteer opportunities": "Volunteer opportunities",
      "community.cat.Community events": "Community events",
      "community.cat.Cultural activities": "Cultural activities",
      "community.cat.Neighbourhood projects": "Neighbourhood projects",
      "community.cat.Environmental initiatives": "Environmental initiatives",

      // --- pulse.html ---
      "pulse.docTitle": "LocalPulse - Espoo | The Pulse",
      "pulse.headerSub": "Your neighbourhood, at a glance",
      "pulse.greetingMorning": "Good morning",
      "pulse.greetingAfternoon": "Good afternoon",
      "pulse.greetingEvening": "Good evening",
      "pulse.intro": "Connect with neighbours, help shape Espoo, and make your neighbourhood more vibrant, inclusive and resilient.",
      "pulse.npH3": "📊 Neighbourhood Pulse",
      "pulse.npIntro": "Aggregated insights turning local activity into neighbourhood intelligence.",
      "pulse.exchangeH3": "🔁 Community Exchange",
      "pulse.exchangeIntro": "Share resources, swap skills, and build a more sustainable neighbourhood together.",
      "pulse.exchangeDemoBanner": "🧪 <strong>Prototype scope.</strong> The four categories below are fixed for now, but \"Share / Ask\" posts are real and saved - a production build would add browsing, replies and moderation.",
      "pulse.featuredH3": "🌱 Featured Initiatives",
      "pulse.viewAllIdeas": "View All Ideas →",
      "pulse.featuredIntro": "The most-supported ideas pitched by your neighbours right now.",
      "pulse.shapeH3": "Shape Your Neighbourhood",
      "pulse.shapeBody": "Every resident knows their neighbourhood best. Share your local knowledge, pitch an idea, or flag something that needs attention.",
      "pulse.pitchBtn": "💡 Pitch an Idea",
      "pulse.reportBtn": "⚠️ Report an Issue",
      "pulse.recentH3": "Recent Activity",
      "pulse.recentIntro": "What's happening around your neighbourhood.",
      "pulse.viewAllActivity": "View All Activity →",
      "pulse.overviewFail": "Couldn't load the neighbourhood pulse right now.",
      "pulse.overview.safety": "Safety",
      "pulse.overview.greenspace": "Greenspace",
      "pulse.overview.connectivity": "Connectivity",
      // Backend-computed status/detail for the three Pulse overview cards
      // (keys from GET /api/dashboard/overview).
      "overview.status.no_reports": "No reports yet",
      "overview.status.needs_attention": "Needs Attention",
      "overview.status.improving": "Improving",
      "overview.status.high_interest": "High Interest",
      "overview.status.getting_started": "Getting Started",
      "overview.status.trending_up": "Trending Up",
      "overview.status.building_momentum": "Building Momentum",
      "overview.status.no_activity": "No Activity Yet",
      "overview.detail.safety_none": "No safety reports filed yet.",
      "overview.detail.safety_flagged": "{flagged} of {total} safety reports flagged for review.",
      "overview.detail.safety_improving": "{count} safety report(s) filed, mostly resolved.",
      "overview.detail.green_active": "{count} active green pitch(es).",
      "overview.detail.green_none": "No green-space ideas pitched yet.",
      "overview.detail.conn_avg": "+{pct}% average social connectivity across {count} idea(s).",
      "overview.detail.conn_none": "Pitch an idea to get started.",
      "pulse.initiativesFail": "Couldn't load featured initiatives right now.",
      "pulse.noPitchedIdeasPre": "No pitched ideas yet - be the first to ",
      "pulse.noPitchedIdeasLink": "share one",
      "pulse.volunteersLower": "volunteers",

      // --- shared: exchange categories (pulse + exchange-posts) ---
      "exchange.garden_share.title": "Garden Share",
      "exchange.garden_share.desc": "Share extra gardening samples and veggies for a kind gesture.",
      "exchange.skill_swap.title": "Skill Swap",
      "exchange.skill_swap.desc": "Exchange skills with neighbours, from coding to cooking.",
      "exchange.tool_library.title": "Tool Library",
      "exchange.tool_library.desc": "Share tools and equipment to reduce waste and help others.",
      "exchange.neighborly_help.title": "Neighborly Help",
      "exchange.neighborly_help.desc": "Offer help like mowing lawns or running errands for neighbours.",
      "exchange.fallbackTitle": "Community Exchange",
      "exchange.postsOne": "{count} post",
      "exchange.postsMany": "{count} posts",
      "exchange.viewPosts": "View posts",
      "exchange.shareAsk": "Share / Ask",

      // --- shared: neighbourhood rewards card (pulse + exchange-posts) ---
      "rewards.h3": "🏆 Neighbourhood Rewards",
      "rewards.tier.bronze": "Bronze Neighbour Badge",
      "rewards.tier.silver": "Silver Neighbour Badge",
      "rewards.tier.gold": "Gold Neighbour Badge",
      "rewards.cityGrant": "City of Espoo Community Grant - funding for a shared neighbourhood improvement",
      "rewards.intro": "Every completed exchange post earns the whole neighbourhood {points} points.",
      "rewards.totalPoints": "total points ({count} deeds)",
      "rewards.yearPoints": "points in {year} ({count} deeds)",
      "rewards.currentBadge": "🥉 Current badge:",
      "rewards.pointsToTier": "{count} points to {name}",
      "rewards.allTiers": "All badge tiers reached!",
      "rewards.cityUnlocked": "🎉 Unlocked for {year}: {reward}",
      "rewards.cityToGo": "{count} points to this year's City of Espoo reward",
      "rewards.loadFail": "Couldn't load neighbourhood rewards right now.",

      // --- shared: activity feed (pulse.js) ---
      "activity.verb.submitted": "was submitted",
      "activity.verb.received": "was received by the city",
      "activity.verb.under_review": "is under review",
      "activity.verb.assigned": "was assigned to a team",
      "activity.verb.action_planned": "has an action planned",
      "activity.verb.completed": "was resolved",
      "activity.verb.default": "was updated",
      "activity.reportLine": "{category} report {verb}.",
      "activity.ideaLine": "New idea pitched: {title}.",
      "activity.supportIt": "Support it →",
      "activity.none": "No activity yet - be the first to report or pitch something.",
      "activity.loadFail": "Couldn't load recent activity.",

      // --- shared: Share / Ask dialog (pulse + exchange-posts) ---
      "dialog.shareAsk": "Share / Ask",
      "dialog.titleLabel": "Short title",
      "dialog.titlePlaceholder": "e.g., Free tomato seedlings",
      "dialog.descLabel": "What are you offering or looking for?",
      "dialog.descPlaceholder": "Describe what you'd like to share or ask your neighbours for...",
      "dialog.contactLabel": "How should neighbours reach you? (optional)",
      "dialog.contactPlaceholder": "e.g., an email address, or a note about where to find you",
      "dialog.cancel": "Cancel",
      "dialog.post": "Post to neighbours",
      "dialog.posting": "Posting...",
      "dialog.posted": "Posted! Your neighbours can now see this.",
      "dialog.error": "Something went wrong - is the backend running?",

      // --- exchange-posts.html ---
      "exchangePosts.back": "← Back to The Pulse",
      "exchangePosts.newBtn": "+ Share / Ask",
      "exchangePosts.open": "Open",
      "exchangePosts.completed": "✅ Completed",
      "exchangePosts.markComplete": "Mark as complete",
      "exchangePosts.markingComplete": "Marking complete...",
      "exchangePosts.none": "No posts yet in {title} - be the first to share or ask.",
      "exchangePosts.noneHood": "No {title} posts in {hood} yet.",
      "exchangePosts.loadFail": "Couldn't load posts right now.",

      // --- topics.html ---
      "topics.docTitle": "LocalPulse - City topics",
      "topics.headerSub": "City-announced projects - share your feedback",
      "topics.commentPlaceholder": "Share your feedback or concern...",
      "topics.submit": "Submit",
      "topics.submitting": "Submitting...",
      "topics.thanksClassified": "Thanks! Classified as: {sentiment}.",
      "topics.error": "Something went wrong - is the backend running?",
      "topics.commentCount": "{area} · {count} comment(s)",
      "sentiment.positive": "positive",
      "sentiment.negative": "negative",
      "sentiment.neutral": "neutral",
      "sentiment.mixed": "mixed",

      // Report categories (backend classifier vocabulary).
      "category.infrastructure": "infrastructure",
      "category.safety": "safety",
      "category.cleanliness": "cleanliness",
      "category.accessibility": "accessibility",
      "category.other": "other",
    },

    fi: {
      "lang.en": "English",
      "lang.fi": "Suomi",
      "lang.sv": "Svenska",
      "lang.aria": "Valitse kieli",

      "hood.label": "Naapurusto",
      "hood.all": "Kaikki naapurustot",
      "hood.name.leppavaara": "Leppävaara",
      "hood.name.tapiola": "Tapiola",
      "hood.name.matinkyla": "Matinkylä",
      "hood.name.espoon_keskus": "Espoon keskus",
      "hood.name.espoonlahti": "Espoonlahti",
      "hood.name.kauklahti": "Kauklahti",
      "ideas.noHood": "Alueelle {hood} ei ole vielä ehdotettu ideoita.",
      "community.noHood": "Ei yhteisöaloitteita alueella {hood} vielä.",
      "pulse.noInitiativesHood": "Ei aloitteita alueella {hood} vielä.",
      "pulse.activityHoodEmpty": "Ei viimeaikaista toimintaa alueella {hood}.",

      "header.eyebrow": "Espoon kaupunki",
      "header.eyebrowPlanner": "Espoon kaupunki · Suunnittelijan näkymä",
      "nav.pulse": "Pulssi",
      "nav.report": "Ilmoita",
      "nav.dashboard": "Suunnittelijan näkymä",
      "nav.ideas": "Ideahautomo",
      "nav.community": "Yhteisö",
      "nav.topics": "Kaupungin aiheet",
      "footer.tagline": "Rakennettu yhtenäisempää ja kestävämpää Espoota varten - yhdessä asukkaiden ja Espoon kaupungin kanssa.",
      "footer.copy": "Espoon kaupunki · LocalPulse-prototyyppi",

      "status.submitted": "Lähetetty",
      "status.received": "Vastaanotettu",
      "status.under_review": "Arvioitavana",
      "status.assigned": "Osoitettu käsittelijälle",
      "status.action_planned": "Toimenpide suunniteltu",
      "status.completed": "Valmis",

      "index.docTitle": "LocalPulse - Espoo | Ilmoita huolenaihe",
      "index.heroH1": "Sinun naapurustosi. Sinun äänesi. Sinun Espoosi.",
      "index.heroSubtitle": "Kerro meille, mikä tekisi naapurustostasi turvallisemman, vihreämmän, osallistavamman ja elävämmän. Tekoäly auttaa muuttamaan kokemuksesi ideoiksi ja teoiksi - yhdessä yhteisösi ja Espoon kaupungin kanssa.",
      "index.subtitle": "Ilmoita huolenaihe tai idea naapurustossasi",
      "index.ctaReport": "📍 Ilmoita ongelmasta",
      "index.ctaIdea": "💡 Jaa idea",
      "index.ctaCommunity": "🤝 Etsi yhteisötoimintaa",
      "index.ctaMap": "🗺️ Tutki naapuruston karttaa",
      "index.locateBtn": "📍 Käytä sijaintiani",
      "index.locating": "Paikannetaan...",
      "index.noteLabel": "Mistä on kyse?",
      "index.notePlaceholder": "esim. Rikkinäinen katuvalo Otaniementiellä",
      "index.voiceBtn": "🎤 Puhu",
      "index.voiceBtnRecording": "⏹ Pysäytä",
      "index.photoLabel": "Lisää kuva (valinnainen)",
      "index.submitBtn": "Lähetä ilmoitus",
      "index.privacyNote": "🔒 Ilmoitustasi käytetään naapuruston ilmiöiden tunnistamiseen Espoon kaupungin suunnittelijoita varten. Suunnittelijan näkymässä esitetään vain koottuja, anonymisoituja lukumääriä - tarkkaa sijaintiasi tai muistiinpanoasi ei koskaan näytetä julkisesti.",
      "index.myReportsH2": "Teit ilmoituksen. Mitä tapahtui?",
      "index.myReportsIntro": "Tästä selaimesta lähettämäsi ilmoitukset ja niiden tilanne.",
      "index.myReportsEmpty": "Lähettämäsi ilmoitukset näkyvät tässä, jotta voit seurata mitä seuraavaksi tapahtuu.",
      "index.reportsLoadFail": "Ilmoituksiasi ei voitu ladata juuri nyt.",
      "index.reportCard": "Ilmoitus #{id} -",
      "index.simulateBtn": "Simuloi kaupungin päivitys →",
      "index.pipelineComplete": "Prosessi valmis",
      "index.tapMap": "Napauta ensin karttaa merkitäksesi ongelman sijainnin.",
      "index.needSomething": "Lisää kuvaus tai kuva (vähintään toinen tarvitaan).",
      "index.submitting": "Lähetetään...",
      "index.thankYou": "Ilmoitettu luokkaan \"{category}\" (luottamus {confidence}). Kiitos!",
      "index.submitFail": "Ilmoitusta ei voitu lähettää - tarkista tiedot ja yritä uudelleen.",
      "index.networkError": "Jotain meni pieleen - onko taustajärjestelmä käynnissä?",
      "index.voiceUnsupported": "Äänisyöttöä ei tueta tässä selaimessa.",
      "index.geoUnsupported": "Selaimesi ei tue sijainnin hakua - napauta karttaa sen sijaan.",
      "index.locateFound": "Sijainti löytyi - säädä nasta tarvittaessa ja kuvaile ongelma.",
      "index.locateFail": "Sijaintiasi ei saatu - napauta karttaa merkitäksesi sen käsin.",

      "dash.docTitle": "LocalPulse - Espoo | Suunnittelijan näkymä",
      "dash.h1": "LocalPulse - Suunnittelijan näkymä",
      "dash.headerSub": "Naapurustojen osallistumisen ilmiöt Espoossa",
      "dash.pulseH2": "Naapuruston pulssi",
      "dash.pulseIntro": "Nopea, suuralueittainen yleiskatsaus ennen kartan tarkastelua.",
      "dash.legendLow": "Vähäinen tarkistustarve",
      "dash.legendHigh": "Suurempi tarkistustarve",
      "dash.legendSize": "Ympyrän koko = ilmoitusten määrä",
      "dash.showLowSignal": "Näytä vähäisen signaalin alueet (< 3 ilmoitusta)",
      "dash.privacyNote": "🔒 Tämä näkymä esittää vain ruutu- tai suuraluetason koosteita - ilmoitusmääriä ja selkokielisen tiivistelmän. Yksittäisen ilmoituksen tarkkaa sijaintia tai tekstiä ei koskaan näytetä tässä.",
      "dash.reportsCount": "{count} ilmoitusta",
      "dash.noAreas": "Ei vielä ilmoituksia - ilmiöt näkyvät tässä, kun asukkaat alkavat ilmoittaa.",
      "dash.needsReview": "⚠ vaatii tarkistusta",
      "dash.flaggedForReview": "{count} ilmoitusta merkitty tarkistettavaksi",
      "dash.noDescription": "(ei kuvausta)",
      "dash.needsReviewInline": "vaatii tarkistusta",
      "dash.reportMeta": "luottamus: {confidence} · ilmoitettu: {date}",
      "dash.takeAction": "Toimi → {status}",
      "dash.pipelineComplete": "Prosessi valmis",
      "dash.updating": "Päivitetään...",
      "dash.takeActionShort": "Toimi →",
      "dash.pulseActivity": "{level} aktiivisuus - {count} ilmoitusta",
      "dash.topPriorities": "Asukkaiden tärkeimmät painopisteet",
      "dash.noDistrictActivity": "Ei vielä suuraluetason aktiivisuutta.",
      "dash.levelHigh": "Korkea",
      "dash.levelMedium": "Keskitaso",
      "dash.levelLow": "Matala",

      "insight.generate": "🤖 Luo tekoälyn näkemys",
      "insight.generating": "Luodaan...",
      "insight.ideaLabel": "Idea:",
      "insight.aiUnavailable": "(Tekoäly ei ole nyt käytettävissä - näytetään automaattinen tiivistelmä)",

      "ideas.docTitle": "LocalPulse - Espoo | Ideahautomo",
      "ideas.headerSub": "Ilmoita huolenaihe tai idea Espoon naapurustossasi",
      "ideas.h2": "Ideahautomo",
      "ideas.intro": "Löydä, tue ja kehitä yhdessä naapureidesi ehdottamia tuoreita ideoita yhteisten tilojen parantamiseksi.",
      "ideas.sortRecent": "Uusimmat",
      "ideas.sortMostSupported": "Eniten tuettu",
      "ideas.sortUrgent": "Kiireelliset tarpeet",
      "ideas.searchPlaceholder": "Hae ideoita otsikolla tai avainsanalla...",
      "ideas.ctaTitle": "Onko sinulla hyvä idea?",
      "ideas.ctaBody": "Onko sinulla ajatus naapuruston parantamiseksi? Esittele se yhteisölle ja kerää tukea.",
      "ideas.ctaBtn": "Ehdota uutta ideaa",
      "ideas.badgeSeekingFunding": "Etsii rahoitusta",
      "ideas.badgeEco": "Ympäristöystävällinen",
      "ideas.badgeSocial": "Korkea sosiaalinen arvo",
      "ideas.support": "Tue",
      "ideas.supported": "✓ Tuettu",
      "ideas.volunteer": "Ilmoittaudu vapaaehtoiseksi",
      "ideas.volunteersSuffix": "vapaaehtoista",
      "ideas.budgetTBD": "Budjetti avoin",
      "ideas.noMatch": "Yksikään idea ei vastaa hakua \"{term}\".",

      "pitch.docTitle": "LocalPulse - Espoo | Ehdota ideaasi",
      "pitch.h2": "Ehdota ideaasi",
      "pitch.intro": "Älä huoli täydellisestä muotoilusta. Kuvaa visiosi, niin tekoäly auttaa muokkaamaan siitä toteutuskelpoisen yhteisöehdotuksen.",
      "pitch.titleLabel": "Anna ideallesi lyhyt otsikko",
      "pitch.titlePlaceholder": "esim. Yhteisöpuutarha 4. kadulle",
      "pitch.descLabel": "Kuvaa ideasi selkokielellä",
      "pitch.descPlaceholder": "esim. Mielestäni meidän pitäisi muuttaa 4. kadun tyhjä tontti yhteisöpuutarhaksi. Voisimme rakentaa korotettuja kasvualustoja ja kompostointialueen...",
      "pitch.charCount": "{n} / 2000 merkkiä",
      "pitch.aiReady": "Tekoäly kuuntelee ja on valmis hiomaan ideaasi...",
      "pitch.aiAnalyzing": "Tekoäly analysoi ideaasi...",
      "pitch.aiUpdated": "Ennusteet päivitetty kuvauksesi perusteella.",
      "pitch.aiFail": "Tekoälypalveluun ei saatu yhteyttä - onko taustajärjestelmä käynnissä?",
      "pitch.collabH3": "Yhteistyötarpeet",
      "pitch.collabIntro": "Millaista tukea etsit?",
      "pitch.needVolunteers": "Etsii vapaaehtoisia",
      "pitch.needMentor": "Tarvitsee mentorin/asiantuntijan neuvoja",
      "pitch.needFunding": "Etsii rahoitusta/avustuksia",
      "pitch.impactH3": "Vaikutusennuste",
      "pitch.impactIntro": "Perustuu vastaaviin yhteisöhankkeisiin.",
      "pitch.socialConnectivity": "Sosiaalinen yhteenkuuluvuus",
      "pitch.environmental": "Ympäristövaikutus",
      "pitch.resourceH3": "Resurssiarvio",
      "pitch.resourceIntro": "Alustavia arvioita suunnittelun tueksi.",
      "pitch.estBudget": "Arvioitu budjetti",
      "pitch.volunteersNeeded": "Vapaaehtoisia tarvitaan",
      "pitch.saveDraft": "Tallenna luonnos",
      "pitch.publish": "Julkaise hautomoon",
      "pitch.volunteersUnit": "{min}-{max} henkilöä",
      "pitch.needTitleDesc": "Lisää ensin otsikko ja kuvaus.",
      "pitch.savingDraft": "Tallennetaan luonnosta...",
      "pitch.publishing": "Julkaistaan...",
      "pitch.draftSaved": "Luonnos tallennettu.",
      "pitch.published": "Julkaistu Ideahautomoon!",
      "pitch.error": "Jotain meni pieleen - onko taustajärjestelmä käynnissä?",

      "community.docTitle": "LocalPulse - Espoo | Yhteisö",
      "community.headerSub": "Löydä ihmisiä ja aloitteita Espoon naapurustossasi",
      "community.h2": "Löydä ihmisiä ja yhteisöaloitteita",
      "community.intro": "Löydä paikallisia yhdistyksiä, ryhmiä ja toimintaa läheltäsi ja vähennä yksinäisyyttä tapaamalla samoista asioista kiinnostuneita naapureita.",
      "community.demoBanner": "🧪 <strong>Esimerkkisisältöä.</strong> Nämä ovat prototyypin havainnollistavia esimerkkejä, eivät oikeita espoolaisia organisaatioita. Tuotantoversio yhdistyisi Espoon kaupungin yhteisö- ja yhdistysrekistereihin.",
      "community.searchPlaceholder": "Hae avainsanalla...",
      "community.tabAll": "Kaikki",
      "community.interested": "✓ Kiinnostunut",
      "community.imInterested": "Olen kiinnostunut",
      "community.noMatch": "Yksikään yhteisöaloite ei vastaa hakuasi.",
      "community.cat.Local associations": "Paikalliset yhdistykset",
      "community.cat.Sports groups": "Urheiluryhmät",
      "community.cat.Youth activities": "Nuorten toiminta",
      "community.cat.Volunteer opportunities": "Vapaaehtoistyömahdollisuudet",
      "community.cat.Community events": "Yhteisötapahtumat",
      "community.cat.Cultural activities": "Kulttuuritoiminta",
      "community.cat.Neighbourhood projects": "Naapurustohankkeet",
      "community.cat.Environmental initiatives": "Ympäristöaloitteet",

      "pulse.docTitle": "LocalPulse - Espoo | Pulssi",
      "pulse.headerSub": "Naapurustosi yhdellä silmäyksellä",
      "pulse.greetingMorning": "Hyvää huomenta",
      "pulse.greetingAfternoon": "Hyvää päivää",
      "pulse.greetingEvening": "Hyvää iltaa",
      "pulse.intro": "Tapaa naapureita, ole mukana kehittämässä Espoota ja tee naapurustostasi elävämpi, osallistavampi ja kestävämpi.",
      "pulse.npH3": "📊 Naapuruston pulssi",
      "pulse.npIntro": "Koottuja näkemyksiä, jotka muuttavat paikallisen toiminnan naapurustotiedoksi.",
      "pulse.exchangeH3": "🔁 Yhteisövaihto",
      "pulse.exchangeIntro": "Jaa resursseja, vaihda taitoja ja rakenna kestävämpi naapurusto yhdessä.",
      "pulse.exchangeDemoBanner": "🧪 <strong>Prototyypin laajuus.</strong> Alla olevat neljä luokkaa ovat toistaiseksi kiinteät, mutta \"Jaa / Kysy\" -julkaisut ovat aitoja ja tallennetaan - tuotantoversio lisäisi selailun, vastaukset ja moderoinnin.",
      "pulse.featuredH3": "🌱 Esiin nostetut aloitteet",
      "pulse.viewAllIdeas": "Katso kaikki ideat →",
      "pulse.featuredIntro": "Naapureidesi juuri nyt eniten tukemat ideat.",
      "pulse.shapeH3": "Muokkaa naapurustoasi",
      "pulse.shapeBody": "Jokainen asukas tuntee oman naapurustonsa parhaiten. Jaa paikallistietosi, ehdota idea tai nosta esiin jotain, joka vaatii huomiota.",
      "pulse.pitchBtn": "💡 Ehdota idea",
      "pulse.reportBtn": "⚠️ Ilmoita ongelmasta",
      "pulse.recentH3": "Viimeaikainen toiminta",
      "pulse.recentIntro": "Mitä naapurustossasi tapahtuu.",
      "pulse.viewAllActivity": "Katso kaikki toiminta →",
      "pulse.overviewFail": "Naapuruston pulssia ei voitu ladata juuri nyt.",
      "pulse.overview.safety": "Turvallisuus",
      "pulse.overview.greenspace": "Viheralueet",
      "pulse.overview.connectivity": "Yhteydet",
      "overview.status.no_reports": "Ei vielä ilmoituksia",
      "overview.status.needs_attention": "Vaatii huomiota",
      "overview.status.improving": "Paranemassa",
      "overview.status.high_interest": "Suuri kiinnostus",
      "overview.status.getting_started": "Alkuvaiheessa",
      "overview.status.trending_up": "Nousussa",
      "overview.status.building_momentum": "Vauhtia keräämässä",
      "overview.status.no_activity": "Ei vielä toimintaa",
      "overview.detail.safety_none": "Turvallisuusilmoituksia ei ole vielä tehty.",
      "overview.detail.safety_flagged": "{flagged}/{total} turvallisuusilmoitusta merkitty tarkistettavaksi.",
      "overview.detail.safety_improving": "{count} turvallisuusilmoitusta tehty, suurin osa ratkaistu.",
      "overview.detail.green_active": "{count} aktiivista vihreää ehdotusta.",
      "overview.detail.green_none": "Viheralue-ideoita ei ole vielä ehdotettu.",
      "overview.detail.conn_avg": "+{pct}% keskimääräinen sosiaalinen yhteenkuuluvuus {count} idean osalta.",
      "overview.detail.conn_none": "Ehdota idea päästäksesi alkuun.",
      "pulse.initiativesFail": "Esiin nostettuja aloitteita ei voitu ladata juuri nyt.",
      "pulse.noPitchedIdeasPre": "Ei vielä ehdotettuja ideoita - ole ensimmäinen ja ",
      "pulse.noPitchedIdeasLink": "jaa oma",
      "pulse.volunteersLower": "vapaaehtoista",

      "exchange.garden_share.title": "Puutarhajako",
      "exchange.garden_share.desc": "Jaa ylimääräisiä taimia ja vihanneksia hyvän hengen nimissä.",
      "exchange.skill_swap.title": "Taitojen vaihto",
      "exchange.skill_swap.desc": "Vaihda taitoja naapureiden kanssa, koodauksesta ruoanlaittoon.",
      "exchange.tool_library.title": "Työkalulainaamo",
      "exchange.tool_library.desc": "Jaa työkaluja ja välineitä, vähentääksesi jätettä ja auttaaksesi muita.",
      "exchange.neighborly_help.title": "Naapuriapu",
      "exchange.neighborly_help.desc": "Tarjoa apua, kuten nurmikon leikkuuta tai asiointia naapureille.",
      "exchange.fallbackTitle": "Yhteisövaihto",
      "exchange.postsOne": "{count} julkaisu",
      "exchange.postsMany": "{count} julkaisua",
      "exchange.viewPosts": "Katso julkaisut",
      "exchange.shareAsk": "Jaa / Kysy",

      "rewards.h3": "🏆 Naapuruston palkinnot",
      "rewards.tier.bronze": "Pronssinen naapurimerkki",
      "rewards.tier.silver": "Hopeinen naapurimerkki",
      "rewards.tier.gold": "Kultainen naapurimerkki",
      "rewards.cityGrant": "Espoon kaupungin yhteisöavustus - rahoitusta yhteiseen naapuruston parannukseen",
      "rewards.intro": "Jokainen valmis vaihtojulkaisu ansaitsee koko naapurustolle {points} pistettä.",
      "rewards.totalPoints": "pistettä yhteensä ({count} tekoa)",
      "rewards.yearPoints": "pistettä vuonna {year} ({count} tekoa)",
      "rewards.currentBadge": "🥉 Nykyinen merkki:",
      "rewards.pointsToTier": "{count} pistettä tasolle {name}",
      "rewards.allTiers": "Kaikki merkkitasot saavutettu!",
      "rewards.cityUnlocked": "🎉 Avattu vuodelle {year}: {reward}",
      "rewards.cityToGo": "{count} pistettä tämän vuoden Espoon kaupungin palkintoon",
      "rewards.loadFail": "Naapuruston palkintoja ei voitu ladata juuri nyt.",

      "activity.verb.submitted": "lähetettiin",
      "activity.verb.received": "vastaanotettiin kaupungilla",
      "activity.verb.under_review": "on arvioitavana",
      "activity.verb.assigned": "osoitettiin tiimille",
      "activity.verb.action_planned": "sai suunnitellun toimenpiteen",
      "activity.verb.completed": "ratkaistiin",
      "activity.verb.default": "päivitettiin",
      "activity.reportLine": "{category}-ilmoitus {verb}.",
      "activity.ideaLine": "Uusi idea ehdotettu: {title}.",
      "activity.supportIt": "Tue sitä →",
      "activity.none": "Ei vielä toimintaa - ole ensimmäinen, joka ilmoittaa tai ehdottaa jotain.",
      "activity.loadFail": "Viimeaikaista toimintaa ei voitu ladata.",

      "dialog.shareAsk": "Jaa / Kysy",
      "dialog.titleLabel": "Lyhyt otsikko",
      "dialog.titlePlaceholder": "esim. Ilmaisia tomaatintaimia",
      "dialog.descLabel": "Mitä tarjoat tai etsit?",
      "dialog.descPlaceholder": "Kuvaile, mitä haluaisit jakaa tai pyytää naapureiltasi...",
      "dialog.contactLabel": "Miten naapurit tavoittavat sinut? (valinnainen)",
      "dialog.contactPlaceholder": "esim. sähköpostiosoite tai vinkki mistä sinut löytää",
      "dialog.cancel": "Peruuta",
      "dialog.post": "Julkaise naapureille",
      "dialog.posting": "Julkaistaan...",
      "dialog.posted": "Julkaistu! Naapurisi näkevät tämän nyt.",
      "dialog.error": "Jotain meni pieleen - onko taustajärjestelmä käynnissä?",

      "exchangePosts.back": "← Takaisin Pulssiin",
      "exchangePosts.newBtn": "+ Jaa / Kysy",
      "exchangePosts.open": "Avoin",
      "exchangePosts.completed": "✅ Valmis",
      "exchangePosts.markComplete": "Merkitse valmiiksi",
      "exchangePosts.markingComplete": "Merkitään valmiiksi...",
      "exchangePosts.none": "Ei vielä julkaisuja luokassa {title} - ole ensimmäinen, joka jakaa tai kysyy.",
      "exchangePosts.noneHood": "Ei {title}-julkaisuja alueella {hood} vielä.",
      "exchangePosts.loadFail": "Julkaisuja ei voitu ladata juuri nyt.",

      "topics.docTitle": "LocalPulse - Kaupungin aiheet",
      "topics.headerSub": "Kaupungin ilmoittamat hankkeet - jaa palautteesi",
      "topics.commentPlaceholder": "Jaa palautteesi tai huolenaiheesi...",
      "topics.submit": "Lähetä",
      "topics.submitting": "Lähetetään...",
      "topics.thanksClassified": "Kiitos! Luokiteltu: {sentiment}.",
      "topics.error": "Jotain meni pieleen - onko taustajärjestelmä käynnissä?",
      "topics.commentCount": "{area} · {count} kommenttia",
      "sentiment.positive": "myönteinen",
      "sentiment.negative": "kielteinen",
      "sentiment.neutral": "neutraali",
      "sentiment.mixed": "ristiriitainen",
      "category.infrastructure": "infrastruktuuri",
      "category.safety": "turvallisuus",
      "category.cleanliness": "siisteys",
      "category.accessibility": "esteettömyys",
      "category.other": "muu",
    },

    sv: {
      "lang.en": "English",
      "lang.fi": "Suomi",
      "lang.sv": "Svenska",
      "lang.aria": "Välj språk",

      "hood.label": "Grannskap",
      "hood.all": "Alla grannskap",
      "hood.name.leppavaara": "Alberga",
      "hood.name.tapiola": "Hagalund",
      "hood.name.matinkyla": "Mattby",
      "hood.name.espoon_keskus": "Esbo centrum",
      "hood.name.espoonlahti": "Esboviken",
      "hood.name.kauklahti": "Köklax",
      "ideas.noHood": "Inga idéer föreslagna för {hood} än.",
      "community.noHood": "Inga gemenskapsinitiativ i {hood} än.",
      "pulse.noInitiativesHood": "Inga initiativ för {hood} än.",
      "pulse.activityHoodEmpty": "Ingen aktivitet nyligen i {hood}.",

      "header.eyebrow": "Esbo stad",
      "header.eyebrowPlanner": "Esbo stad · Planerarvy",
      "nav.pulse": "Pulsen",
      "nav.report": "Rapportera",
      "nav.dashboard": "Planerarvy",
      "nav.ideas": "Idékuvösen",
      "nav.community": "Gemenskap",
      "nav.topics": "Stadens ämnen",
      "footer.tagline": "Byggd för ett mer sammanlänkat och motståndskraftigt Esbo - tillsammans med invånarna och Esbo stad.",
      "footer.copy": "Esbo stad · LocalPulse-prototyp",

      "status.submitted": "Inskickad",
      "status.received": "Mottagen",
      "status.under_review": "Under granskning",
      "status.assigned": "Tilldelad",
      "status.action_planned": "Åtgärd planerad",
      "status.completed": "Slutförd",

      "index.docTitle": "LocalPulse - Esbo | Rapportera ett problem",
      "index.heroH1": "Ditt grannskap. Din röst. Ditt Esbo.",
      "index.heroSubtitle": "Berätta vad som skulle göra ditt grannskap säkrare, grönare, mer inkluderande och mer levande. AI hjälper till att omvandla din upplevelse till idéer och åtgärder - tillsammans med din gemenskap och Esbo stad.",
      "index.subtitle": "Rapportera ett problem eller en idé i ditt grannskap",
      "index.ctaReport": "📍 Rapportera ett problem",
      "index.ctaIdea": "💡 Dela en idé",
      "index.ctaCommunity": "🤝 Hitta gemenskapsaktiviteter",
      "index.ctaMap": "🗺️ Utforska grannskapskartan",
      "index.locateBtn": "📍 Använd min plats",
      "index.locating": "Lokaliserar...",
      "index.noteLabel": "Vad handlar det om?",
      "index.notePlaceholder": "t.ex. Trasig gatlykta på Otsvängen",
      "index.voiceBtn": "🎤 Tala",
      "index.voiceBtnRecording": "⏹ Stoppa",
      "index.photoLabel": "Lägg till ett foto (valfritt)",
      "index.submitBtn": "Skicka rapport",
      "index.privacyNote": "🔒 Din rapport används för att upptäcka mönster i grannskapet för Esbo stads planerare. Endast sammanställda, anonymiserade antal visas i planerarvyn - din exakta plats eller anteckning visas aldrig offentligt.",
      "index.myReportsH2": "Du rapporterade det. Vad hände?",
      "index.myReportsIntro": "Rapporter du skickat från den här webbläsaren och deras status.",
      "index.myReportsEmpty": "Rapporter du skickar visas här så att du kan följa vad som händer härnäst.",
      "index.reportsLoadFail": "Dina rapporter kunde inte laddas just nu.",
      "index.reportCard": "Rapport #{id} -",
      "index.simulateBtn": "Simulera stadens uppdatering →",
      "index.pipelineComplete": "Processen klar",
      "index.tapMap": "Tryck först på kartan för att markera var problemet finns.",
      "index.needSomething": "Lägg till en beskrivning eller ett foto (minst ett behövs).",
      "index.submitting": "Skickar...",
      "index.thankYou": "Rapporterad som \"{category}\" (säkerhet {confidence}). Tack!",
      "index.submitFail": "Rapporten kunde inte skickas - kontrollera uppgifterna och försök igen.",
      "index.networkError": "Något gick fel - körs backend?",
      "index.voiceUnsupported": "Röstinmatning stöds inte i den här webbläsaren.",
      "index.geoUnsupported": "Din webbläsare stöder inte platssökning - tryck på kartan i stället.",
      "index.locateFound": "Plats hittad - justera nålen vid behov och beskriv problemet.",
      "index.locateFail": "Din plats kunde inte hämtas - tryck på kartan för att markera den manuellt.",

      "dash.docTitle": "LocalPulse - Esbo | Planerarvy",
      "dash.h1": "LocalPulse - Planerarvy",
      "dash.headerSub": "Mönster i grannskapens engagemang i Esbo",
      "dash.pulseH2": "Grannskapets puls",
      "dash.pulseIntro": "En snabb översikt på distriktsnivå innan du går ner i kartan nedan.",
      "dash.legendLow": "Lågt granskningsbehov",
      "dash.legendHigh": "Högre granskningsbehov",
      "dash.legendSize": "Cirkelns storlek = antal rapporter",
      "dash.showLowSignal": "Visa områden med svag signal (< 3 rapporter)",
      "dash.privacyNote": "🔒 Den här vyn visar endast aggregat på rutnäts- eller distriktsnivå - antal rapporter och en sammanfattning i klarspråk. En enskild rapports exakta plats eller text visas aldrig här.",
      "dash.reportsCount": "{count} rapporter",
      "dash.noAreas": "Inga rapporter än - mönster visas här när invånarna börjar rapportera.",
      "dash.needsReview": "⚠ kräver granskning",
      "dash.flaggedForReview": "{count} rapport(er) markerade för granskning",
      "dash.noDescription": "(ingen beskrivning)",
      "dash.needsReviewInline": "kräver granskning",
      "dash.reportMeta": "säkerhet: {confidence} · rapporterad: {date}",
      "dash.takeAction": "Vidta åtgärd → {status}",
      "dash.pipelineComplete": "Processen klar",
      "dash.updating": "Uppdaterar...",
      "dash.takeActionShort": "Vidta åtgärd →",
      "dash.pulseActivity": "{level} aktivitet - {count} rapporter",
      "dash.topPriorities": "Invånarnas främsta prioriteringar",
      "dash.noDistrictActivity": "Ingen aktivitet på distriktsnivå än.",
      "dash.levelHigh": "Hög",
      "dash.levelMedium": "Medel",
      "dash.levelLow": "Låg",

      "insight.generate": "🤖 Skapa AI-insikt",
      "insight.generating": "Skapar...",
      "insight.ideaLabel": "Idé:",
      "insight.aiUnavailable": "(AI är inte tillgänglig just nu - visar en automatisk sammanfattning istället)",

      "ideas.docTitle": "LocalPulse - Esbo | Idékuvösen",
      "ideas.headerSub": "Rapportera ett problem eller en idé i ditt grannskap i Esbo",
      "ideas.h2": "Idékuvösen",
      "ideas.intro": "Upptäck, stöd och samarbeta kring nya idéer från dina grannar för att förbättra våra gemensamma ytor.",
      "ideas.sortRecent": "Senaste",
      "ideas.sortMostSupported": "Mest stödda",
      "ideas.sortUrgent": "Brådskande behov",
      "ideas.searchPlaceholder": "Sök idéer efter titel eller nyckelord...",
      "ideas.ctaTitle": "Har du en bra idé?",
      "ideas.ctaBody": "Har du ett koncept för att förbättra vårt grannskap? Presentera det för gemenskapen och samla stöd.",
      "ideas.ctaBtn": "Presentera en ny idé",
      "ideas.badgeSeekingFunding": "Söker finansiering",
      "ideas.badgeEco": "Miljövänlig",
      "ideas.badgeSocial": "Högt socialt värde",
      "ideas.support": "Stöd",
      "ideas.supported": "✓ Stödd",
      "ideas.volunteer": "Ställ upp som volontär",
      "ideas.volunteersSuffix": "volontärer",
      "ideas.budgetTBD": "Budget ej fastställd",
      "ideas.noMatch": "Inga idéer matchar \"{term}\".",

      "pitch.docTitle": "LocalPulse - Esbo | Presentera din idé",
      "pitch.h2": "Presentera din idé",
      "pitch.intro": "Oroa dig inte för perfekt formulering. Beskriv din vision, så hjälper vår AI att förfina den till ett genomförbart gemenskapsförslag.",
      "pitch.titleLabel": "Ge din idé en kort titel",
      "pitch.titlePlaceholder": "t.ex. Gemensam trädgård på 4:e gatan",
      "pitch.descLabel": "Beskriv din idé i klarspråk",
      "pitch.descPlaceholder": "t.ex. Jag tycker att vi borde förvandla den tomma tomten på 4:e gatan till en gemensam trädgård. Vi skulle kunna ha uppdragna bäddar och en komposteringsyta...",
      "pitch.charCount": "{n} / 2000 tecken",
      "pitch.aiReady": "AI lyssnar och är redo att förfina din idé...",
      "pitch.aiAnalyzing": "AI analyserar din idé...",
      "pitch.aiUpdated": "Prognoser uppdaterade utifrån din beskrivning.",
      "pitch.aiFail": "Kunde inte nå AI-tjänsten - körs backend?",
      "pitch.collabH3": "Samarbetsbehov",
      "pitch.collabIntro": "Vilken typ av stöd söker du?",
      "pitch.needVolunteers": "Söker volontärer",
      "pitch.needMentor": "Behöver en mentor/expertråd",
      "pitch.needFunding": "Söker finansiering/bidrag",
      "pitch.impactH3": "Effektprognos",
      "pitch.impactIntro": "Baserat på liknande gemenskapsprojekt.",
      "pitch.socialConnectivity": "Social sammanhållning",
      "pitch.environmental": "Miljö",
      "pitch.resourceH3": "Resursuppskattning",
      "pitch.resourceIntro": "Preliminära uppskattningar som hjälper dig planera.",
      "pitch.estBudget": "Beräknad budget",
      "pitch.volunteersNeeded": "Volontärer som behövs",
      "pitch.saveDraft": "Spara utkast",
      "pitch.publish": "Publicera till kuvösen",
      "pitch.volunteersUnit": "{min}-{max} personer",
      "pitch.needTitleDesc": "Lägg till en titel och beskrivning först.",
      "pitch.savingDraft": "Sparar utkast...",
      "pitch.publishing": "Publicerar...",
      "pitch.draftSaved": "Utkast sparat.",
      "pitch.published": "Publicerad till Idékuvösen!",
      "pitch.error": "Något gick fel - körs backend?",

      "community.docTitle": "LocalPulse - Esbo | Gemenskap",
      "community.headerSub": "Hitta personer och initiativ i ditt grannskap i Esbo",
      "community.h2": "Hitta personer och gemenskapsinitiativ",
      "community.intro": "Upptäck lokala föreningar, grupper och aktiviteter nära dig och minska isolering genom att få kontakt med grannar som delar dina intressen.",
      "community.demoBanner": "🧪 <strong>Demoinnehåll.</strong> Detta är illustrativa exempel för prototypen, inte riktiga Esbo-organisationer. En produktionsversion skulle anslutas till Esbo stads gemenskaps- och föreningsregister.",
      "community.searchPlaceholder": "Sök med nyckelord...",
      "community.tabAll": "Alla",
      "community.interested": "✓ Intresserad",
      "community.imInterested": "Jag är intresserad",
      "community.noMatch": "Inga gemenskapsinitiativ matchar din sökning.",
      "community.cat.Local associations": "Lokala föreningar",
      "community.cat.Sports groups": "Idrottsgrupper",
      "community.cat.Youth activities": "Ungdomsverksamhet",
      "community.cat.Volunteer opportunities": "Volontärmöjligheter",
      "community.cat.Community events": "Gemenskapsevenemang",
      "community.cat.Cultural activities": "Kulturverksamhet",
      "community.cat.Neighbourhood projects": "Grannskapsprojekt",
      "community.cat.Environmental initiatives": "Miljöinitiativ",

      "pulse.docTitle": "LocalPulse - Esbo | Pulsen",
      "pulse.headerSub": "Ditt grannskap i ett ögonkast",
      "pulse.greetingMorning": "God morgon",
      "pulse.greetingAfternoon": "God eftermiddag",
      "pulse.greetingEvening": "God kväll",
      "pulse.intro": "Få kontakt med grannar, var med och forma Esbo och gör ditt grannskap mer levande, inkluderande och motståndskraftigt.",
      "pulse.npH3": "📊 Grannskapets puls",
      "pulse.npIntro": "Sammanställda insikter som förvandlar lokal aktivitet till grannskapskunskap.",
      "pulse.exchangeH3": "🔁 Gemenskapsutbyte",
      "pulse.exchangeIntro": "Dela resurser, byt färdigheter och bygg ett mer hållbart grannskap tillsammans.",
      "pulse.exchangeDemoBanner": "🧪 <strong>Prototypens omfattning.</strong> De fyra kategorierna nedan är fasta tills vidare, men \"Dela / Fråga\"-inlägg är äkta och sparas - en produktionsversion skulle lägga till bläddring, svar och moderering.",
      "pulse.featuredH3": "🌱 Utvalda initiativ",
      "pulse.viewAllIdeas": "Visa alla idéer →",
      "pulse.featuredIntro": "De mest stödda idéerna från dina grannar just nu.",
      "pulse.shapeH3": "Forma ditt grannskap",
      "pulse.shapeBody": "Varje invånare känner sitt grannskap bäst. Dela din lokalkännedom, presentera en idé eller flagga något som behöver uppmärksamhet.",
      "pulse.pitchBtn": "💡 Presentera en idé",
      "pulse.reportBtn": "⚠️ Rapportera ett problem",
      "pulse.recentH3": "Senaste aktivitet",
      "pulse.recentIntro": "Vad som händer runt ditt grannskap.",
      "pulse.viewAllActivity": "Visa all aktivitet →",
      "pulse.overviewFail": "Grannskapets puls kunde inte laddas just nu.",
      "pulse.overview.safety": "Säkerhet",
      "pulse.overview.greenspace": "Grönområden",
      "pulse.overview.connectivity": "Uppkoppling",
      "overview.status.no_reports": "Inga rapporter än",
      "overview.status.needs_attention": "Kräver uppmärksamhet",
      "overview.status.improving": "Förbättras",
      "overview.status.high_interest": "Stort intresse",
      "overview.status.getting_started": "Kommer igång",
      "overview.status.trending_up": "Uppåtgående trend",
      "overview.status.building_momentum": "Bygger momentum",
      "overview.status.no_activity": "Ingen aktivitet än",
      "overview.detail.safety_none": "Inga säkerhetsrapporter har lämnats in än.",
      "overview.detail.safety_flagged": "{flagged} av {total} säkerhetsrapporter markerade för granskning.",
      "overview.detail.safety_improving": "{count} säkerhetsrapport(er) inlämnade, mestadels lösta.",
      "overview.detail.green_active": "{count} aktiva gröna förslag.",
      "overview.detail.green_none": "Inga grönområdesidéer har presenterats än.",
      "overview.detail.conn_avg": "+{pct}% genomsnittlig social sammanhållning över {count} idé(er).",
      "overview.detail.conn_none": "Presentera en idé för att komma igång.",
      "pulse.initiativesFail": "Utvalda initiativ kunde inte laddas just nu.",
      "pulse.noPitchedIdeasPre": "Inga presenterade idéer än - var först med att ",
      "pulse.noPitchedIdeasLink": "dela en",
      "pulse.volunteersLower": "volontärer",

      "exchange.garden_share.title": "Trädgårdsdelning",
      "exchange.garden_share.desc": "Dela med dig av extra plantor och grönsaker som en vänlig gest.",
      "exchange.skill_swap.title": "Färdighetsbyte",
      "exchange.skill_swap.desc": "Byt färdigheter med grannar, från kodning till matlagning.",
      "exchange.tool_library.title": "Verktygsbibliotek",
      "exchange.tool_library.desc": "Dela verktyg och utrustning för att minska avfall och hjälpa andra.",
      "exchange.neighborly_help.title": "Grannhjälp",
      "exchange.neighborly_help.desc": "Erbjud hjälp som gräsklippning eller ärenden åt grannar.",
      "exchange.fallbackTitle": "Gemenskapsutbyte",
      "exchange.postsOne": "{count} inlägg",
      "exchange.postsMany": "{count} inlägg",
      "exchange.viewPosts": "Visa inlägg",
      "exchange.shareAsk": "Dela / Fråga",

      "rewards.h3": "🏆 Grannskapsbelöningar",
      "rewards.tier.bronze": "Brons grannemärke",
      "rewards.tier.silver": "Silver grannemärke",
      "rewards.tier.gold": "Guld grannemärke",
      "rewards.cityGrant": "Esbo stads gemenskapsbidrag - finansiering för en gemensam grannskapsförbättring",
      "rewards.intro": "Varje slutfört utbytesinlägg ger hela grannskapet {points} poäng.",
      "rewards.totalPoints": "poäng totalt ({count} gärningar)",
      "rewards.yearPoints": "poäng {year} ({count} gärningar)",
      "rewards.currentBadge": "🥉 Nuvarande märke:",
      "rewards.pointsToTier": "{count} poäng till {name}",
      "rewards.allTiers": "Alla märkesnivåer uppnådda!",
      "rewards.cityUnlocked": "🎉 Upplåst för {year}: {reward}",
      "rewards.cityToGo": "{count} poäng till årets belöning från Esbo stad",
      "rewards.loadFail": "Grannskapsbelöningar kunde inte laddas just nu.",

      "activity.verb.submitted": "skickades in",
      "activity.verb.received": "togs emot av staden",
      "activity.verb.under_review": "är under granskning",
      "activity.verb.assigned": "tilldelades ett team",
      "activity.verb.action_planned": "har en planerad åtgärd",
      "activity.verb.completed": "löstes",
      "activity.verb.default": "uppdaterades",
      "activity.reportLine": "{category}-rapport {verb}.",
      "activity.ideaLine": "Ny idé presenterad: {title}.",
      "activity.supportIt": "Stöd den →",
      "activity.none": "Ingen aktivitet än - var först med att rapportera eller presentera något.",
      "activity.loadFail": "Senaste aktivitet kunde inte laddas.",

      "dialog.shareAsk": "Dela / Fråga",
      "dialog.titleLabel": "Kort titel",
      "dialog.titlePlaceholder": "t.ex. Gratis tomatplantor",
      "dialog.descLabel": "Vad erbjuder du eller vad söker du?",
      "dialog.descPlaceholder": "Beskriv vad du vill dela med dig av eller be dina grannar om...",
      "dialog.contactLabel": "Hur ska grannar nå dig? (valfritt)",
      "dialog.contactPlaceholder": "t.ex. en e-postadress eller en notis om var man hittar dig",
      "dialog.cancel": "Avbryt",
      "dialog.post": "Publicera till grannar",
      "dialog.posting": "Publicerar...",
      "dialog.posted": "Publicerat! Dina grannar kan nu se det här.",
      "dialog.error": "Något gick fel - körs backend?",

      "exchangePosts.back": "← Tillbaka till Pulsen",
      "exchangePosts.newBtn": "+ Dela / Fråga",
      "exchangePosts.open": "Öppen",
      "exchangePosts.completed": "✅ Slutförd",
      "exchangePosts.markComplete": "Markera som slutförd",
      "exchangePosts.markingComplete": "Markerar som slutförd...",
      "exchangePosts.none": "Inga inlägg än i {title} - var först med att dela eller fråga.",
      "exchangePosts.noneHood": "Inga {title}-inlägg i {hood} än.",
      "exchangePosts.loadFail": "Inlägg kunde inte laddas just nu.",

      "topics.docTitle": "LocalPulse - Stadens ämnen",
      "topics.headerSub": "Stadens annonserade projekt - dela din återkoppling",
      "topics.commentPlaceholder": "Dela din återkoppling eller oro...",
      "topics.submit": "Skicka",
      "topics.submitting": "Skickar...",
      "topics.thanksClassified": "Tack! Klassificerad som: {sentiment}.",
      "topics.error": "Något gick fel - körs backend?",
      "topics.commentCount": "{area} · {count} kommentar(er)",
      "sentiment.positive": "positiv",
      "sentiment.negative": "negativ",
      "sentiment.neutral": "neutral",
      "sentiment.mixed": "blandad",
      "category.infrastructure": "infrastruktur",
      "category.safety": "säkerhet",
      "category.cleanliness": "renlighet",
      "category.accessibility": "tillgänglighet",
      "category.other": "övrigt",
    },
  };

  const SUPPORTED = ["en", "fi", "sv"];
  const DEFAULT_LANG = "en";
  const STORAGE_KEY = "lp_lang";

  function readLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (e) {
      /* localStorage may be unavailable - fall through to default */
    }
    return DEFAULT_LANG;
  }

  let currentLang = readLang();

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) =>
      Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
    );
  }

  // t(key, vars) - returns the translation for the current language, falling
  // back to English, then to the key itself so a missing string is obvious.
  function t(key, vars) {
    const table = STRINGS[currentLang] || STRINGS[DEFAULT_LANG];
    let str = table[key];
    if (str === undefined) str = STRINGS[DEFAULT_LANG][key];
    if (str === undefined) return key;
    return interpolate(str, vars);
  }

  const ATTR_MAP = {
    "data-i18n": "text",
    "data-i18n-html": "html",
    "data-i18n-placeholder": "placeholder",
    "data-i18n-title": "title",
    "data-i18n-aria-label": "aria-label",
  };

  function applyI18n(root) {
    root = root || document;

    Object.keys(ATTR_MAP).forEach((attr) => {
      root.querySelectorAll("[" + attr + "]").forEach((el) => {
        const key = el.getAttribute(attr);
        if (!key) return;
        const value = t(key);
        switch (ATTR_MAP[attr]) {
          case "text":
            el.textContent = value;
            break;
          case "html":
            el.innerHTML = value;
            break;
          default:
            el.setAttribute(ATTR_MAP[attr], value);
        }
      });
    });

    // Document <title>: <body data-i18n-doctitle="key">
    const dt = document.body && document.body.getAttribute("data-i18n-doctitle");
    if (dt) document.title = t(dt);

    document.documentElement.setAttribute("lang", currentLang);
  }

  // Puts a language <select> in the page header. If the page already ships one
  // (index.html does, inside .header-top), we reuse it; otherwise we insert a
  // floating switcher in the top-right of the header.
  function ensureSwitcher() {
    let select = document.getElementById("language");
    if (!select) {
      const header = document.querySelector("header");
      if (!header) return null;
      const wrap = document.createElement("div");
      wrap.className = "lang-switcher";
      select = document.createElement("select");
      select.id = "language";
      wrap.appendChild(select);
      header.insertBefore(wrap, header.firstChild);
    }
    if (!select.options.length) {
      SUPPORTED.forEach((code) => {
        const opt = document.createElement("option");
        opt.value = code;
        select.appendChild(opt);
      });
    }
    // (Re)label options in their own language name, set aria-label, sync value.
    Array.from(select.options).forEach((opt) => {
      opt.textContent = t("lang." + opt.value);
    });
    select.setAttribute("aria-label", t("lang.aria"));
    select.value = currentLang;
    return select;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore - choice just won't persist */
    }
    window.currentLang = currentLang;
    ensureSwitcher();
    applyI18n(document);
    window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
  }

  function init() {
    const select = ensureSwitcher();
    if (select) {
      select.addEventListener("change", (e) => setLang(e.target.value));
    }
    applyI18n(document);
  }

  // Expose API.
  window.t = t;
  window.applyI18n = applyI18n;
  window.currentLang = currentLang;
  Object.defineProperty(window, "i18nLang", { get: () => currentLang });
  window.setLang = setLang;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
