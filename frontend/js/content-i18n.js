/*
 * Demo content translations for LocalPulse.
 *
 * The seed scripts (backend/seed_*.py, backend/topics/database.py) insert
 * example ideas / exchange posts / reports / topics in English so the demo
 * has something to show. This file provides Finnish and Swedish versions of
 * that seed text, keyed by the exact English string.
 *
 *   window.tc(text)         -> translated seed text, or `text` unchanged
 *   window.catLabel(slug)   -> localized report-category label
 *
 * Anything not in the map (a real resident submission typed into the UI) is
 * returned as-is - the same way a resident's own note is never machine
 * translated.
 *
 * Load order: after js/i18n.js (needs window.i18nLang), before the page script.
 */
(function () {
  "use strict";

  const CONTENT = {
    fi: {
      // ---- Idea Incubator (backend/seed_ideas.py) ----
      "Solar Powered Street Lights on Elm Path":
        "Aurinkovoimalla toimivat katuvalot Jalavapolulla",
      "Installing smart, solar-powered lighting along the main pedestrian path connecting Elm Street to the central park, improving safety for evening walkers and cyclists.":
        "Älykkäiden, aurinkovoimalla toimivien valojen asentaminen Jalavakadun ja keskuspuiston yhdistävälle pääkävelytielle, mikä parantaa iltakävelijöiden ja pyöräilijöiden turvallisuutta.",
      "Weekend Pop-up Art Market": "Viikonlopun pop up -taidemarkkinat",
      "Utilizing the empty plaza space on weekends to host local artists and makers. Aims to boost the local economy and bring neighbors together around a shared community event.":
        "Tyhjän aukion hyödyntäminen viikonloppuisin paikallisten taiteilijoiden ja käsityöläisten esittelytilana. Tavoitteena on vahvistaa paikallistaloutta ja tuoda naapureita yhteen yhteisen tapahtuman ääreen.",
      "Community Garden on 4th Street": "Yhteisöpuutarha 4. kadulle",
      "Turn the empty lot on 4th street into a community garden with raised beds and a composting area, giving residents a shared green space to grow food and meet neighbors.":
        "Muutetaan 4. kadun tyhjä tontti yhteisöpuutarhaksi, jossa on korotettuja kasvualustoja ja kompostointialue. Näin asukkaat saavat yhteisen viheralueen ruoan kasvattamiseen ja naapureiden tapaamiseen.",
      "Neighborhood Tool Library": "Naapuruston työkalulainaamo",
      "A small shed where residents can borrow gardening and home-repair tools instead of buying them. Needs starter funding for equipment and a volunteer to manage checkouts.":
        "Pieni vaja, josta asukkaat voivat lainata puutarha- ja kodinkorjaustyökaluja ostamisen sijaan. Tarvitsee alkurahoituksen välineisiin ja vapaaehtoisen hoitamaan lainauksia.",
      "Free Little Library Boxes": "Ilmaiset pikkukirjastolaatikot",
      "Build and install a handful of free little library boxes around the neighbourhood so residents can share books with each other on their daily walks.":
        "Rakennetaan ja asennetaan naapurustoon muutama ilmainen pikkukirjastolaatikko, jotta asukkaat voivat jakaa kirjoja keskenään päivittäisillä kävelyillään.",

      // ---- Community Exchange (backend/seed_exchange.py) ----
      "Free tomato & basil seedlings": "Ilmaisia tomaatin- ja basilikantaimia",
      "Balcony garden overflowing again this year - happy to give away extra tomato and basil seedlings while they last.":
        "Parvekepuutarha pursuaa taas tänä vuonna - jaan mielelläni ylimääräiset tomaatin- ja basilikantaimet niin kauan kuin niitä riittää.",
      "Leave a note in the Elm Path mailbox #12":
        "Jätä viesti Jalavapolun postilaatikkoon #12",
      "Looking for compost bin advice": "Etsin neuvoja kompostoriin",
      "First time setting up a compost bin on a small balcony - would love tips from anyone who's done it in an apartment.":
        "Perustan ensimmäistä kertaa kompostoria pienelle parvekkeelle - otan mielelläni vinkkejä keneltä tahansa, joka on tehnyt sen kerrostalossa.",
      "Offering: beginner guitar lessons": "Tarjolla: kitaratunteja aloittelijoille",
      "Been playing for 15 years and would love to teach a neighbour the basics in exchange for help with my Finnish.":
        "Olen soittanut 15 vuotta ja opettaisin mielelläni naapurille perusteet vastineeksi avusta suomen kielen kanssa.",
      "Need help setting up a website for my hobby project":
        "Tarvitsen apua verkkosivujen tekemiseen harrasteprojektilleni",
      "Looking for someone who knows basic web design to help set up a simple site - happy to trade baking lessons.":
        "Etsin jotakuta, joka osaa web-suunnittelun perusteet auttamaan yksinkertaisen sivuston kanssa - vaihdan mielelläni leivontatunteja.",
      "Pressure washer available to borrow": "Painepesuri lainattavissa",
      "Have a pressure washer that mostly sits in storage - happy to lend it out for a weekend at a time.":
        "Minulla on painepesuri, joka on enimmäkseen varastossa - lainaan sitä mielelläni viikonlopuksi kerrallaan.",
      "Text 040-555-0102": "Tekstaa 040-555-0102",
      "Does anyone have a ladder I could borrow?":
        "Onko kenelläkään tikkaita, joita voisin lainata?",
      "Need a tall ladder to clean out the gutters this weekend - will return it in the same condition.":
        "Tarvitsen korkeat tikkaat sadevesikourujen puhdistamiseen tänä viikonloppuna - palautan ne samassa kunnossa.",
      "Can help with grocery runs on Tuesdays": "Voin auttaa ruokaostoksilla tiistaisin",
      "I drive past the Prisma every Tuesday afternoon and have room in the car if anyone needs groceries picked up.":
        "Ajan Prisman ohi joka tiistai-iltapäivä ja autossa on tilaa, jos joku tarvitsee ruokaostosten hakemista.",
      "Looking for someone to walk my dog next week":
        "Etsin koiranulkoiluttajaa ensi viikoksi",
      "Traveling for work Mon-Wed next week and need someone to walk Nunu (friendly labrador) twice a day.":
        "Matkustan työn takia ensi viikon ma-ke ja tarvitsen jonkun ulkoiluttamaan Nunua (ystävällinen labradori) kahdesti päivässä.",

      // ---- Resident reports (backend/seed_reports.py) ----
      "Streetlight has been out for two weeks on Lintuvaarantie.":
        "Katuvalo on ollut pimeänä kaksi viikkoa Lintuvaarantiellä.",
      "Crosswalk near the train station feels unsafe at night - poor lighting.":
        "Juna-aseman lähellä oleva suojatie tuntuu turvattomalta öisin - huono valaistus.",
      "Overflowing trash cans by the Sello shopping centre bus stop.":
        "Ylitäydet roskikset Sellon kauppakeskuksen bussipysäkillä.",
      "Pothole growing bigger on Karhusuontie, already scraped a bike tire.":
        "Kuoppa kasvaa Karhusuontiellä, raapaisi jo pyörän renkaan.",
      "Wheelchair ramp at the library entrance is too steep to use safely.":
        "Kirjaston sisäänkäynnin pyörätuoliramppi on liian jyrkkä turvalliseen käyttöön.",
      "Litter piling up along the Tapiolan puisto walking path.":
        "Roskia kasautuu Tapiolan puiston kävelytien varrelle.",
      "Bike lane merges dangerously with car traffic near Ahertajantie.":
        "Pyörätie yhtyy vaarallisesti autoliikenteeseen Ahertajantien lähellä.",
      "Broken elevator at the metro station - been out for days.":
        "Rikkinäinen hissi metroasemalla - ollut epäkunnossa päiviä.",
      "Would be great to have more benches along the shoreline path.":
        "Olisi hienoa saada lisää penkkejä rantareitin varrelle.",
      "Graffiti on the underpass wall near the swimming hall.":
        "Graffiteja alikulun seinässä uimahallin lähellä.",
      "Poor lighting around the church park makes evening walks feel unsafe.":
        "Kirkkopuiston huono valaistus tekee iltakävelyistä turvattoman tuntuisia.",
      "Traffic light stuck on red at the main intersection during rush hour.":
        "Liikennevalo jumissa punaisella pääristeyksessä ruuhka-aikaan.",
      "No tactile paving at the pedestrian crossing near the station.":
        "Aseman lähellä olevalla suojatiellä ei ole huomiolaattoja.",
      "Dog waste bags not being restocked at the beach entrance.":
        "Koirankakkapusseja ei täydennetä uimarannan sisäänkäynnillä.",
      "Icy steps by the harbour aren't salted often enough in winter.":
        "Sataman jäisiä portaita ei hiekoiteta tarpeeksi usein talvella.",
      "Broken fence around the playground near the train station.":
        "Rikkinäinen aita leikkipuiston ympärillä juna-aseman lähellä.",
      "Would love a community noticeboard near the Kauklahti market square.":
        "Toivoisin yhteisön ilmoitustaulua Kauklahden torin lähelle.",

      // ---- Critical reports (backend/seed_critical_reports.py) ----
      "Strong gas smell near the Tapiola metro entrance, seems to be getting stronger.":
        "Voimakas kaasun haju Tapiolan metron sisäänkäynnin lähellä, tuntuu voimistuvan.",
      "Downed power line across the footpath on Kauniaistentie after last night's storm.":
        "Maahan pudonnut sähkölinja kävelytien poikki Kauniaistentiellä viime yön myrskyn jäljiltä.",
      "Large section of sidewalk has collapsed near the school crossing on Koulupolku.":
        "Suuri osa jalkakäytävästä on romahtanut koulun suojatien lähellä Koulupolulla.",
      "Guardrail is broken and hanging loose on the bridge over Gräsanoja - risk of falling.":
        "Kaide on rikki ja roikkuu irrallaan Gräsanojan ylittävällä sillalla - putoamisvaara.",
      "Playground swing set chain snapped - sharp broken edge exposed at child height.":
        "Leikkipuiston keinun ketju katkesi - terävä rikkoutunut reuna lapsen korkeudella.",
      "Manhole cover is missing on Kauklahdenväylä, leaving a deep hole exposed in the road.":
        "Viemärikaivon kansi puuttuu Kauklahdenväylältä, jättäen syvän aukon tielle.",

      // ---- City topics (backend/topics/database.py + seed_topics.py) ----
      "New tram track - Suurpelto": "Uusi raitiotielinja - Suurpelto",
      "The City of Espoo has announced plans to build a new tram track through Suurpelto. Share your feedback, concerns, or support for this project.":
        "Espoon kaupunki on ilmoittanut suunnitelmista rakentaa uusi raitiotielinja Suurpellon läpi. Jaa palautteesi, huolesi tai tukesi tälle hankkeelle.",
      "Extended cycling network - Leppävaara to Otaniemi":
        "Laajennettu pyörätieverkosto - Leppävaarasta Otaniemeen",
      "The City of Espoo is planning a protected cycling route connecting Leppävaara to Otaniemi, aiming to make the daily commute safer and car-free. Share your feedback, concerns, or support for this project.":
        "Espoon kaupunki suunnittelee suojattua pyöräreittiä, joka yhdistää Leppävaaran Otaniemeen ja jonka tavoitteena on tehdä päivittäisestä työmatkasta turvallisempi ja autoton. Jaa palautteesi, huolesi tai tukesi tälle hankkeelle.",
      "New multi-purpose sports hall - Matinkylä":
        "Uusi monitoimiurheiluhalli - Matinkylä",
      "A new sports hall is proposed for Matinkylä, offering space for badminton, futsal, and community events. Share your feedback, concerns, or support for this project.":
        "Matinkylään ehdotetaan uutta urheiluhallia, joka tarjoaa tilaa sulkapallolle, futsalille ja yhteisötapahtumille. Jaa palautteesi, huolesi tai tukesi tälle hankkeelle.",

      // ---- Planner dashboard low-signal summary (routers/dashboard.py) ----
      "Low report volume - not enough signal yet.":
        "Vähän ilmoituksia - ei vielä tarpeeksi signaalia.",

      // ---- Community directory (frontend/js/community.js DEMO_INITIATIVES) ----
      "Kauklahti Residents Association (example)":
        "Kauklahden asukasyhdistys (esimerkki)",
      "A neighbourhood association organising resident meetings and local advocacy.":
        "Naapuruston yhdistys, joka järjestää asukastapaamisia ja paikallista edunvalvontaa.",
      "Matinkylä Running Club (example)": "Matinkylän juoksukerho (esimerkki)",
      "Weekly group runs along the Matinkylä coastal path, all paces welcome.":
        "Viikoittaiset yhteislenkit Matinkylän rantareittiä pitkin, kaikki vauhdit tervetulleita.",
      "Leppävaara Youth Evening Meetups (example)":
        "Leppävaaran nuorten iltatapaamiset (esimerkki)",
      "A safe, supervised evening space for teenagers to hang out and play games.":
        "Turvallinen, valvottu iltatila, jossa teini-ikäiset voivat viettää aikaa ja pelata.",
      "Espoonlahti Beach Cleanup Volunteers (example)":
        "Espoonlahden rannansiivousvapaaehtoiset (esimerkki)",
      "Seasonal volunteer cleanups along the Espoonlahti shoreline.":
        "Kausittaisia vapaaehtoisten siivoustalkoita Espoonlahden rantaviivalla.",
      "Tapiola Summer Market (example)": "Tapiolan kesätori (esimerkki)",
      "A recurring outdoor market for local makers, food stalls and live music.":
        "Toistuvat ulkoilmamarkkinat paikallisille tekijöille, ruokakojuille ja livemusiikille.",
      "Espoon keskus Cultural Circle (example)":
        "Espoon keskuksen kulttuuripiiri (esimerkki)",
      "Monthly gatherings celebrating Espoo's multicultural resident community.":
        "Kuukausittaisia kokoontumisia, jotka juhlistavat Espoon monikulttuurista asukasyhteisöä.",
      "Kauklahti Community Garden Project (example)":
        "Kauklahden yhteisöpuutarhahanke (esimerkki)",
      "Turning an unused lot into raised-bed community gardens and a composting area.":
        "Käyttämättömän tontin muuttaminen korotettujen kasvualustojen yhteisöpuutarhaksi ja kompostointialueeksi.",
      "Leppävaara Tree-Planting Initiative (example)":
        "Leppävaaran puidenistutusaloite (esimerkki)",
      "Resident-led tree planting days to green up shared courtyards and roadside verges.":
        "Asukasvetoisia puidenistutuspäiviä yhteispihojen ja tienvarsien vehreyttämiseksi.",
      "120 members": "120 jäsentä",
      "45 members": "45 jäsentä",
      "60 regular attendees": "60 vakiokävijää",
      "30 volunteers": "30 vapaaehtoista",
      "Open to all": "Avoin kaikille",
      "80 members": "80 jäsentä",
      "25 gardeners": "25 puutarhuria",
      "40 volunteers": "40 vapaaehtoista",
    },

    sv: {
      // ---- Idea Incubator ----
      "Solar Powered Street Lights on Elm Path":
        "Solcellsdrivna gatlyktor på Almstigen",
      "Installing smart, solar-powered lighting along the main pedestrian path connecting Elm Street to the central park, improving safety for evening walkers and cyclists.":
        "Installation av smart, solcellsdriven belysning längs den huvudsakliga gångvägen som förbinder Almgatan med centralparken, vilket förbättrar säkerheten för kvällspromenerare och cyklister.",
      "Weekend Pop-up Art Market": "Pop up-konstmarknad på helgen",
      "Utilizing the empty plaza space on weekends to host local artists and makers. Aims to boost the local economy and bring neighbors together around a shared community event.":
        "Att använda den tomma torgytan på helgerna för lokala konstnärer och hantverkare. Syftet är att stärka den lokala ekonomin och föra samman grannar kring ett gemensamt evenemang.",
      "Community Garden on 4th Street": "Gemensam trädgård på 4:e gatan",
      "Turn the empty lot on 4th street into a community garden with raised beds and a composting area, giving residents a shared green space to grow food and meet neighbors.":
        "Förvandla den tomma tomten på 4:e gatan till en gemensam trädgård med upphöjda odlingsbäddar och en komposteringsyta, så att invånarna får en gemensam grön yta för att odla mat och träffa grannar.",
      "Neighborhood Tool Library": "Grannskapets verktygsbibliotek",
      "A small shed where residents can borrow gardening and home-repair tools instead of buying them. Needs starter funding for equipment and a volunteer to manage checkouts.":
        "Ett litet skjul där invånare kan låna trädgårds- och hemreparationsverktyg i stället för att köpa dem. Behöver startfinansiering för utrustning och en volontär som sköter utlåningen.",
      "Free Little Library Boxes": "Gratis små bokskåp",
      "Build and install a handful of free little library boxes around the neighbourhood so residents can share books with each other on their daily walks.":
        "Bygg och sätt upp ett antal gratis små bokskåp runt om i grannskapet så att invånare kan dela böcker med varandra under sina dagliga promenader.",

      // ---- Community Exchange ----
      "Free tomato & basil seedlings": "Gratis tomat- och basilikaplantor",
      "Balcony garden overflowing again this year - happy to give away extra tomato and basil seedlings while they last.":
        "Balkongträdgården svämmar över igen i år - delar gärna med mig av extra tomat- och basilikaplantor så länge de räcker.",
      "Leave a note in the Elm Path mailbox #12":
        "Lämna en lapp i brevlådan #12 på Almstigen",
      "Looking for compost bin advice": "Söker råd om kompostbehållare",
      "First time setting up a compost bin on a small balcony - would love tips from anyone who's done it in an apartment.":
        "Första gången jag sätter upp en kompostbehållare på en liten balkong - tar gärna emot tips från någon som gjort det i en lägenhet.",
      "Offering: beginner guitar lessons": "Erbjuder: gitarrlektioner för nybörjare",
      "Been playing for 15 years and would love to teach a neighbour the basics in exchange for help with my Finnish.":
        "Har spelat i 15 år och skulle gärna lära en granne grunderna i utbyte mot hjälp med min finska.",
      "Need help setting up a website for my hobby project":
        "Behöver hjälp med att sätta upp en webbplats för mitt hobbyprojekt",
      "Looking for someone who knows basic web design to help set up a simple site - happy to trade baking lessons.":
        "Söker någon som kan grunderna i webbdesign för att hjälpa till med en enkel webbplats - byter gärna mot bakningslektioner.",
      "Pressure washer available to borrow": "Högtryckstvätt att låna",
      "Have a pressure washer that mostly sits in storage - happy to lend it out for a weekend at a time.":
        "Har en högtryckstvätt som mest står i förrådet - lånar gärna ut den en helg i taget.",
      "Text 040-555-0102": "Sms:a 040-555-0102",
      "Does anyone have a ladder I could borrow?": "Har någon en stege jag kan låna?",
      "Need a tall ladder to clean out the gutters this weekend - will return it in the same condition.":
        "Behöver en hög stege för att rensa hängrännorna i helgen - lämnar tillbaka den i samma skick.",
      "Can help with grocery runs on Tuesdays":
        "Kan hjälpa till med matinköp på tisdagar",
      "I drive past the Prisma every Tuesday afternoon and have room in the car if anyone needs groceries picked up.":
        "Jag kör förbi Prisma varje tisdag eftermiddag och har plats i bilen om någon behöver få matvaror hämtade.",
      "Looking for someone to walk my dog next week":
        "Söker någon som kan rasta min hund nästa vecka",
      "Traveling for work Mon-Wed next week and need someone to walk Nunu (friendly labrador) twice a day.":
        "Reser i jobbet mån-ons nästa vecka och behöver någon som rastar Nunu (vänlig labrador) två gånger om dagen.",

      // ---- Resident reports ----
      "Streetlight has been out for two weeks on Lintuvaarantie.":
        "Gatlyktan har varit släckt i två veckor på Lintuvaaravägen.",
      "Crosswalk near the train station feels unsafe at night - poor lighting.":
        "Övergångsstället nära tågstationen känns otryggt på natten - dålig belysning.",
      "Overflowing trash cans by the Sello shopping centre bus stop.":
        "Överfulla soptunnor vid busshållplatsen vid köpcentret Sello.",
      "Pothole growing bigger on Karhusuontie, already scraped a bike tire.":
        "Potthålet växer på Karhusuovägen, har redan skrapat ett cykeldäck.",
      "Wheelchair ramp at the library entrance is too steep to use safely.":
        "Rullstolsrampen vid bibliotekets entré är för brant för att användas säkert.",
      "Litter piling up along the Tapiolan puisto walking path.":
        "Skräp samlas längs gångvägen i Hagalunds park.",
      "Bike lane merges dangerously with car traffic near Ahertajantie.":
        "Cykelbanan går farligt ihop med biltrafiken nära Ahertajavägen.",
      "Broken elevator at the metro station - been out for days.":
        "Trasig hiss vid metrostationen - har varit ur funktion i flera dagar.",
      "Would be great to have more benches along the shoreline path.":
        "Det vore bra med fler bänkar längs strandpromenaden.",
      "Graffiti on the underpass wall near the swimming hall.":
        "Klotter på tunnelns vägg nära simhallen.",
      "Poor lighting around the church park makes evening walks feel unsafe.":
        "Dålig belysning runt kyrkparken gör kvällspromenader otrygga.",
      "Traffic light stuck on red at the main intersection during rush hour.":
        "Trafikljuset har fastnat på rött i huvudkorsningen under rusningstid.",
      "No tactile paving at the pedestrian crossing near the station.":
        "Ingen taktil markbeläggning vid övergångsstället nära stationen.",
      "Dog waste bags not being restocked at the beach entrance.":
        "Hundbajspåsarna fylls inte på vid strandingången.",
      "Icy steps by the harbour aren't salted often enough in winter.":
        "De isiga trapporna vid hamnen saltas inte tillräckligt ofta på vintern.",
      "Broken fence around the playground near the train station.":
        "Trasigt staket runt lekplatsen nära tågstationen.",
      "Would love a community noticeboard near the Kauklahti market square.":
        "Skulle önska en anslagstavla för gemenskapen nära Köklax torg.",

      // ---- Critical reports ----
      "Strong gas smell near the Tapiola metro entrance, seems to be getting stronger.":
        "Stark gaslukt nära Hagalunds metroentré, verkar bli starkare.",
      "Downed power line across the footpath on Kauniaistentie after last night's storm.":
        "Nedfallen elledning tvärs över gångvägen på Grankullavägen efter nattens storm.",
      "Large section of sidewalk has collapsed near the school crossing on Koulupolku.":
        "En stor del av trottoaren har rasat nära skolövergången på Koulupolku.",
      "Guardrail is broken and hanging loose on the bridge over Gräsanoja - risk of falling.":
        "Räcket är trasigt och hänger löst på bron över Gräsaån - risk för fall.",
      "Playground swing set chain snapped - sharp broken edge exposed at child height.":
        "Kedjan på lekplatsens gunga har gått av - vass trasig kant i barnhöjd.",
      "Manhole cover is missing on Kauklahdenväylä, leaving a deep hole exposed in the road.":
        "Ett brunnslock saknas på Köklaxleden, vilket lämnar ett djupt hål i vägen.",

      // ---- City topics ----
      "New tram track - Suurpelto": "Ny spårväg - Storåkern",
      "The City of Espoo has announced plans to build a new tram track through Suurpelto. Share your feedback, concerns, or support for this project.":
        "Esbo stad har meddelat planer på att bygga en ny spårväg genom Storåkern. Dela din återkoppling, dina farhågor eller ditt stöd för projektet.",
      "Extended cycling network - Leppävaara to Otaniemi":
        "Utbyggt cykelnät - Alberga till Otnäs",
      "The City of Espoo is planning a protected cycling route connecting Leppävaara to Otaniemi, aiming to make the daily commute safer and car-free. Share your feedback, concerns, or support for this project.":
        "Esbo stad planerar en skyddad cykelrutt som förbinder Alberga med Otnäs, med målet att göra den dagliga pendlingen säkrare och bilfri. Dela din återkoppling, dina farhågor eller ditt stöd för projektet.",
      "New multi-purpose sports hall - Matinkylä": "Ny allaktivitetshall - Mattby",
      "A new sports hall is proposed for Matinkylä, offering space for badminton, futsal, and community events. Share your feedback, concerns, or support for this project.":
        "En ny idrottshall föreslås för Mattby, med utrymme för badminton, futsal och gemenskapsevenemang. Dela din återkoppling, dina farhågor eller ditt stöd för projektet.",

      // ---- Planner dashboard low-signal summary ----
      "Low report volume - not enough signal yet.":
        "Låg rapportvolym - inte tillräckligt med signal än.",

      // ---- Community directory ----
      "Kauklahti Residents Association (example)":
        "Köklax invånarförening (exempel)",
      "A neighbourhood association organising resident meetings and local advocacy.":
        "En grannskapsförening som ordnar invånarmöten och lokal intressebevakning.",
      "Matinkylä Running Club (example)": "Mattby löparklubb (exempel)",
      "Weekly group runs along the Matinkylä coastal path, all paces welcome.":
        "Veckovisa gemensamma löprundor längs Mattbys kuststig, alla tempon välkomna.",
      "Leppävaara Youth Evening Meetups (example)":
        "Alberga ungdomars kvällsträffar (exempel)",
      "A safe, supervised evening space for teenagers to hang out and play games.":
        "En trygg, övervakad kvällsplats där tonåringar kan umgås och spela spel.",
      "Espoonlahti Beach Cleanup Volunteers (example)":
        "Esboviken strandstädningsvolontärer (exempel)",
      "Seasonal volunteer cleanups along the Espoonlahti shoreline.":
        "Säsongsvisa frivilliga städinsatser längs Esbovikens strandlinje.",
      "Tapiola Summer Market (example)": "Hagalunds sommarmarknad (exempel)",
      "A recurring outdoor market for local makers, food stalls and live music.":
        "En återkommande utomhusmarknad för lokala hantverkare, matstånd och livemusik.",
      "Espoon keskus Cultural Circle (example)": "Esbo centrum kulturkrets (exempel)",
      "Monthly gatherings celebrating Espoo's multicultural resident community.":
        "Månatliga träffar som firar Esbos mångkulturella invånargemenskap.",
      "Kauklahti Community Garden Project (example)":
        "Köklax gemensamma trädgårdsprojekt (exempel)",
      "Turning an unused lot into raised-bed community gardens and a composting area.":
        "Att förvandla en oanvänd tomt till gemensamma trädgårdar med upphöjda bäddar och en komposteringsyta.",
      "Leppävaara Tree-Planting Initiative (example)":
        "Alberga trädplanteringsinitiativ (exempel)",
      "Resident-led tree planting days to green up shared courtyards and roadside verges.":
        "Invånarledda trädplanteringsdagar för att göra gemensamma gårdar och vägkanter grönare.",
      "120 members": "120 medlemmar",
      "45 members": "45 medlemmar",
      "60 regular attendees": "60 stamgäster",
      "30 volunteers": "30 volontärer",
      "Open to all": "Öppet för alla",
      "80 members": "80 medlemmar",
      "25 gardeners": "25 trädgårdsodlare",
      "40 volunteers": "40 volontärer",
    },
  };

  function currentLang() {
    return window.i18nLang || "en";
  }

  // tc(text): translated seed text for the active language, or `text` as-is
  // (English, or a real resident submission not in the map).
  function tc(text) {
    const lang = currentLang();
    if (lang === "en" || text == null) return text;
    const table = CONTENT[lang];
    return (table && table[text]) || text;
  }

  // catLabel(slug): localized report-category label (keys live in i18n.js as
  // "category.<slug>"). Unknown slugs fall back to the slug itself.
  const KNOWN_CATEGORIES = ["infrastructure", "safety", "cleanliness", "accessibility", "other"];
  function catLabel(slug) {
    const key = String(slug || "").toLowerCase();
    if (KNOWN_CATEGORIES.includes(key) && typeof window.t === "function") {
      return window.t("category." + key);
    }
    return slug;
  }

  window.tc = tc;
  window.catLabel = catLabel;
})();
