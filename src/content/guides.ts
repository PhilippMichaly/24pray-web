import type { Locale } from '@/lib/i18n';

/**
 * Ratgeberseiten — Langtexte für Suchanfragen wie „Gebetskette organisieren".
 *
 * Bewusst NICHT im i18n-Katalog: der ist für kurze UI-Strings gebaut und verlangt jeden Key
 * in allen fünf Sprachen. Die Ratgeber gibt es vorerst nur auf de/en/es; he/ar folgen erst
 * mit Muttersprachler-Review (dieselbe Regel wie für die übrigen he/ar-Texte). Eine Sprache
 * ohne Ratgeber bekommt weder Liste noch Link noch Sitemap-Eintrag — und hreflang verweist
 * nur auf Sprachen, in denen der Artikel wirklich existiert.
 */

export type GuideLocale = 'de' | 'en' | 'es';

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type GuideText = {
  slug: string;
  title: string;
  /** Meta-Description: ~150 Zeichen, steht so im Suchergebnis. */
  description: string;
  intro: string;
  sections: GuideSection[];
};

export type Guide = {
  id: string;
  /** ISO-Datum der letzten inhaltlichen Änderung (dateModified im JSON-LD). */
  updated: string;
  text: Record<GuideLocale, GuideText>;
};

export type GuideUi = {
  indexTitle: string;
  indexDescription: string;
  indexIntro: string;
  readMore: string;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  watchesLink: string;
  moreGuides: string;
  updated: string;
  backToGuides: string;
  /** Kurzer Linktext für die Startseite. */
  navLabel: string;
};

export const GUIDE_UI: Record<GuideLocale, GuideUi> = {
  de: {
    indexTitle: 'Ratgeber: Gebetswachen und Gebetsketten organisieren',
    indexDescription:
      'Praktische Anleitungen für Gebetsketten, 24-Stunden-Gebet und Gebetswochen in Gemeinde, Hauskreis und Familie — Schritt für Schritt.',
    indexIntro:
      'Hier findest du praktische Anleitungen rund ums gemeinsame Beten: wie man eine Gebetskette aufzieht, ein 24-Stunden-Gebet plant oder eine Gebetswoche in der Gemeinde vorbereitet.',
    readMore: 'Weiterlesen',
    ctaHeading: 'Bereit für eure Gebetswache?',
    ctaBody:
      'Mit 24pray legst du die Wache in wenigen Minuten an, teilst den Link und siehst jederzeit, welche Stunden noch frei sind. Kostenlos, werbefrei, Mitbeten ohne Konto.',
    ctaButton: 'Gebetswache anlegen',
    watchesLink: 'Offene Gebetswachen ansehen',
    moreGuides: 'Weitere Ratgeber',
    updated: 'Aktualisiert',
    backToGuides: 'Alle Ratgeber',
    navLabel: 'Ratgeber: Gebetskette, 24-Stunden-Gebet, Gebetswoche',
  },
  en: {
    indexTitle: 'Guides: organising prayer watches and prayer chains',
    indexDescription:
      'Practical guides for prayer chains, 24-hour prayer and weeks of prayer in churches, small groups and families — step by step.',
    indexIntro:
      'Practical guides for praying together: how to set up a prayer chain, plan 24 hours of prayer, or prepare a week of prayer in your church.',
    readMore: 'Read more',
    ctaHeading: 'Ready for your prayer watch?',
    ctaBody:
      'With 24pray you create the watch in a few minutes, share the link and always see which hours are still open. Free, no ads, and nobody needs an account to pray along.',
    ctaButton: 'Create a prayer watch',
    watchesLink: 'See open prayer watches',
    moreGuides: 'More guides',
    updated: 'Updated',
    backToGuides: 'All guides',
    navLabel: 'Guides: prayer chain, 24 hours of prayer, week of prayer',
  },
  es: {
    indexTitle: 'Guías: organizar vigilias y cadenas de oración',
    indexDescription:
      'Guías prácticas para cadenas de oración, oración de 24 horas y semanas de oración en la iglesia, el grupo y la familia — paso a paso.',
    indexIntro:
      'Guías prácticas para orar juntos: cómo montar una cadena de oración, planificar 24 horas de oración o preparar una semana de oración en tu iglesia.',
    readMore: 'Leer más',
    ctaHeading: '¿Listos para vuestra vigilia de oración?',
    ctaBody:
      'Con 24pray creas la vigilia en pocos minutos, compartes el enlace y ves en todo momento qué horas siguen libres. Gratis, sin anuncios y sin cuenta para orar.',
    ctaButton: 'Crear una vigilia de oración',
    watchesLink: 'Ver vigilias abiertas',
    moreGuides: 'Más guías',
    updated: 'Actualizado',
    backToGuides: 'Todas las guías',
    navLabel: 'Guías: cadena de oración, 24 horas de oración, semana de oración',
  },
};

export const GUIDES: Guide[] = [
  {
    id: 'prayer-chain',
    updated: '2026-10-12',
    text: {
      de: {
        slug: 'gebetskette-organisieren',
        title: 'Gebetskette organisieren: Schritt für Schritt',
        description:
          'So organisierst du eine Gebetskette in Gemeinde, Hauskreis oder Familie: Anliegen, Zeitraum, Stunden verteilen, Erinnerungen — mit Checkliste.',
        intro:
          'Eine Gebetskette ist schnell ausgerufen — und genauso schnell wieder eingeschlafen, wenn niemand weiß, wer wann dran ist. Mit ein wenig Vorbereitung wird daraus eine Kette, die trägt. Diese Anleitung führt dich durch die Schritte, die sich in Gemeinden, Hauskreisen und Familien bewährt haben.',
        sections: [
          {
            heading: 'Was ist eine Gebetskette?',
            paragraphs: [
              'Bei einer Gebetskette teilen sich mehrere Menschen einen Zeitraum auf, sodass ohne Unterbrechung für ein gemeinsames Anliegen gebetet wird. Jeder übernimmt einen Abschnitt — meist eine Stunde —, und wo einer aufhört, fängt der nächste an.',
              'Anlass kann vieles sein: eine Krankheit in der Gemeinde, eine Prüfung, eine Evangelisation, eine Entscheidung, Frieden in einer Region oder einfach der Wunsch, gemeinsam dranzubleiben. Ob die Kette einen Tag, eine Woche oder 40 Tage läuft, hängt vom Anliegen und von der Zahl der Beter ab.',
            ],
          },
          {
            heading: '1. Das Anliegen klar formulieren',
            paragraphs: [
              'Schreib in zwei, drei Sätzen auf, wofür ihr betet. Je konkreter das Anliegen, desto leichter fällt es den Betern, ihre Stunde zu füllen. Bei persönlichen Anliegen — etwa einer Krankheit — vorher klären, was die betroffene Person geteilt haben möchte.',
              'Hilfreich ist ein kurzer Absatz mit Gebetsimpulsen: ein Bibelvers, zwei, drei konkrete Bitten, ein Dank. Wer zum ersten Mal eine ganze Stunde betet, ist für einen roten Faden dankbar.',
            ],
          },
          {
            heading: '2. Zeitraum und Länge der Abschnitte festlegen',
            paragraphs: [
              'Rechne ehrlich: Eine 24-Stunden-Kette braucht 24 Beter, wenn jeder genau eine Stunde übernimmt. Kleine Gruppen fangen besser mit 12 Stunden (zum Beispiel 8 bis 20 Uhr) oder einer Kette über mehrere Tage an, bei der jeder einen ganzen Tag übernimmt.',
              'Stunden sind die gängige Einheit, weil sie sich leicht merken und gut verteilen lassen. Bei längeren Aktionen wie einer Fastenzeit oder 40 Tagen Gebet funktionieren ganze Tage oft besser.',
            ],
          },
          {
            heading: '3. Die Stunden verteilen',
            paragraphs: [
              'Der häufigste Fehler ist die Verteilung per Zuruf oder in einem langen Chatverlauf: Doppelbelegungen fallen nicht auf, Lücken auch nicht. Besser ist eine Liste, in die sich jeder selbst einträgt und die für alle sichtbar zeigt, welche Stunden noch frei sind.',
              'Gib den Leuten die Freiheit, ihre Stunde selbst zu wählen. Wer sich seine Zeit aussucht, hält sie auch ein. Die Nachtstunden füllen sich meist zuletzt — sprich gezielt Menschen an, die ohnehin früh aufstehen oder spät ins Bett gehen.',
            ],
          },
          {
            heading: '4. An die Stunde erinnern',
            paragraphs: [
              'Die meisten Lücken entstehen nicht aus Unwillen, sondern aus Vergessen. Eine Erinnerung kurz vor der eigenen Stunde macht hier den größten Unterschied. Plane sie von Anfang an mit ein, statt am Tag selbst hinterherzutelefonieren.',
            ],
          },
          {
            heading: '5. Während der Kette: sichtbar bleiben',
            paragraphs: [
              'Teile zwischendurch Neuigkeiten zum Anliegen — eine Gebetserhörung, eine neue Bitte. Das motiviert und hilft den späteren Betern, aktuell zu beten. Und behalte die Lücken im Blick: Eine freundliche Nachricht in die Gruppe („Für heute Nacht 2 bis 4 Uhr suchen wir noch jemanden") füllt sie oft innerhalb weniger Minuten.',
            ],
          },
          {
            heading: 'Checkliste',
            paragraphs: ['Bevor du den Link verschickst, sollten diese Punkte stehen:'],
            list: [
              'Anliegen in zwei, drei Sätzen, mit Gebetsimpulsen',
              'Zeitraum und Länge der Abschnitte (Stunden oder Tage)',
              'Eine Liste, in der jeder seine Zeit selbst einträgt und Lücken sichtbar sind',
              'Erinnerung vor jeder Stunde',
              'Ein Weg, Neuigkeiten mit allen Betern zu teilen',
              'Bei sensiblen Anliegen: Kette nur per Einladung, nicht öffentlich',
            ],
          },
        ],
      },
      en: {
        slug: 'organize-a-prayer-chain',
        title: 'How to organise a prayer chain: step by step',
        description:
          'How to organise a prayer chain in your church, small group or family: the request, the time span, sharing out the hours, reminders — with a checklist.',
        intro:
          'A prayer chain is quickly announced — and just as quickly forgotten when nobody knows who is on when. With a little preparation it becomes a chain that holds. This guide walks you through the steps that work in churches, small groups and families.',
        sections: [
          {
            heading: 'What is a prayer chain?',
            paragraphs: [
              'In a prayer chain several people share out a period of time so that a common request is prayed for without interruption. Everyone takes a slot — usually an hour — and where one stops, the next begins.',
              'The reason can be anything: an illness in the church, an exam, an outreach, a decision, peace in a region, or simply the wish to keep going together. Whether the chain runs for a day, a week or 40 days depends on the request and on how many people pray.',
            ],
          },
          {
            heading: '1. Put the request into words',
            paragraphs: [
              'Write down in two or three sentences what you are praying for. The more concrete the request, the easier it is for people to fill their hour. For personal matters — an illness, for example — check first what the person concerned is happy to share.',
              'A short paragraph of prompts helps: a Bible verse, two or three specific requests, a thanksgiving. Anyone praying for a whole hour for the first time is grateful for a thread to follow.',
            ],
          },
          {
            heading: '2. Decide the time span and slot length',
            paragraphs: [
              'Be honest with the numbers: a 24-hour chain needs 24 people if everyone takes exactly one hour. Small groups do better starting with 12 hours (say 8 am to 8 pm) or a chain over several days where each person takes a whole day.',
              'Hours are the usual unit because they are easy to remember and easy to share out. For longer seasons such as Lent or 40 days of prayer, whole days often work better.',
            ],
          },
          {
            heading: '3. Share out the hours',
            paragraphs: [
              'The most common mistake is assigning slots by word of mouth or in a long chat thread: double bookings go unnoticed, and so do gaps. A list everyone signs up to themselves, showing all open hours at a glance, works far better.',
              'Let people choose their own hour. Those who pick their time keep it. Night hours usually fill last — ask people who get up early or go to bed late anyway.',
            ],
          },
          {
            heading: '4. Remind people of their hour',
            paragraphs: [
              'Most gaps are not caused by unwillingness but by forgetting. A reminder shortly before someone’s hour makes the biggest difference. Plan it in from the start instead of chasing people on the day.',
            ],
          },
          {
            heading: '5. During the chain: stay visible',
            paragraphs: [
              'Share news about the request along the way — an answered prayer, a new need. It encourages people and helps later pray-ers pray into the current situation. And keep an eye on the gaps: a friendly message to the group (“We still need someone for 2–4 am tonight”) often fills them within minutes.',
            ],
          },
          {
            heading: 'Checklist',
            paragraphs: ['Before you send the link, have these in place:'],
            list: [
              'The request in two or three sentences, with prayer prompts',
              'Time span and slot length (hours or days)',
              'A list where everyone signs up themselves and gaps are visible',
              'A reminder before each hour',
              'A way to share news with everyone praying',
              'For sensitive requests: invitation only, not public',
            ],
          },
        ],
      },
      es: {
        slug: 'organizar-cadena-de-oracion',
        title: 'Cómo organizar una cadena de oración paso a paso',
        description:
          'Cómo organizar una cadena de oración en tu iglesia, grupo o familia: el motivo, el periodo, repartir las horas, recordatorios — con lista de control.',
        intro:
          'Una cadena de oración se convoca rápido — y se apaga igual de rápido si nadie sabe a quién le toca cuándo. Con un poco de preparación se convierte en una cadena que se sostiene. Esta guía te lleva por los pasos que funcionan en iglesias, grupos y familias.',
        sections: [
          {
            heading: '¿Qué es una cadena de oración?',
            paragraphs: [
              'En una cadena de oración varias personas se reparten un periodo de tiempo para que se ore sin interrupción por un motivo común. Cada uno asume un turno — normalmente una hora — y donde uno termina, empieza el siguiente.',
              'El motivo puede ser muy variado: una enfermedad en la iglesia, un examen, una campaña evangelística, una decisión, la paz en una región o simplemente el deseo de perseverar juntos. Que la cadena dure un día, una semana o 40 días depende del motivo y de cuántas personas oren.',
            ],
          },
          {
            heading: '1. Formular el motivo con claridad',
            paragraphs: [
              'Escribe en dos o tres frases por qué oráis. Cuanto más concreto sea el motivo, más fácil será para cada uno llenar su hora. En asuntos personales — una enfermedad, por ejemplo — aclara antes qué quiere compartir la persona afectada.',
              'Ayuda un breve párrafo con pautas: un versículo, dos o tres peticiones concretas, un motivo de gratitud. Quien ora una hora entera por primera vez agradece tener un hilo conductor.',
            ],
          },
          {
            heading: '2. Fijar el periodo y la duración de los turnos',
            paragraphs: [
              'Haz cuentas con honestidad: una cadena de 24 horas necesita 24 personas si cada una asume exactamente una hora. Los grupos pequeños empiezan mejor con 12 horas (por ejemplo de 8 a 20 h) o con una cadena de varios días en la que cada persona asume un día entero.',
              'Las horas son la unidad habitual porque se recuerdan y se reparten fácilmente. Para tiempos más largos, como la Cuaresma o 40 días de oración, suelen funcionar mejor los días completos.',
            ],
          },
          {
            heading: '3. Repartir las horas',
            paragraphs: [
              'El error más común es repartir los turnos de palabra o en un largo hilo de chat: no se notan los turnos duplicados ni los huecos. Funciona mucho mejor una lista en la que cada uno se apunta y que muestra a todos qué horas siguen libres.',
              'Deja que cada persona elija su hora. Quien elige su horario, lo cumple. Las horas de la madrugada suelen llenarse al final — pregunta a quienes de todos modos madrugan o se acuestan tarde.',
            ],
          },
          {
            heading: '4. Recordar a cada uno su hora',
            paragraphs: [
              'La mayoría de los huecos no se deben a falta de ganas, sino al olvido. Un recordatorio poco antes de la propia hora marca la mayor diferencia. Tenlo previsto desde el principio en lugar de ir llamando a la gente el mismo día.',
            ],
          },
          {
            heading: '5. Durante la cadena: mantenerse visibles',
            paragraphs: [
              'Comparte novedades sobre el motivo — una oración contestada, una nueva petición. Anima y ayuda a quienes oran más tarde a orar por la situación actual. Y vigila los huecos: un mensaje amable al grupo («Esta noche aún buscamos a alguien de 2 a 4 h») suele llenarlos en pocos minutos.',
            ],
          },
          {
            heading: 'Lista de control',
            paragraphs: ['Antes de enviar el enlace, ten esto listo:'],
            list: [
              'El motivo en dos o tres frases, con pautas de oración',
              'Periodo y duración de los turnos (horas o días)',
              'Una lista en la que cada uno se apunta y se ven los huecos',
              'Un recordatorio antes de cada hora',
              'Una forma de compartir novedades con todos',
              'Para motivos delicados: solo por invitación, no pública',
            ],
          },
        ],
      },
    },
  },
  {
    id: '24-hour-prayer',
    updated: '2026-10-12',
    text: {
      de: {
        slug: '24-stunden-gebet-planen',
        title: '24-Stunden-Gebet planen: Ablauf, Stundenplan und Tipps',
        description:
          '24 Stunden Gebet ohne Unterbrechung: wie viele Beter du brauchst, wie du die Nachtstunden füllst, Ideen für die Gebetsstunde und ein Beispiel-Ablauf.',
        intro:
          'Einen ganzen Tag und eine ganze Nacht ohne Unterbrechung beten — das ist für viele Gruppen ein besonderes Erlebnis. Damit die 24 Stunden wirklich voll werden, braucht es etwas Planung. Hier steht, worauf es ankommt.',
        sections: [
          {
            heading: 'Wie viele Beter braucht man?',
            paragraphs: [
              'Rein rechnerisch 24 — einen pro Stunde. In der Praxis lohnt es sich, mit etwas mehr Menschen zu planen: Manche Stunden übernehmen zwei oder drei Leute gemeinsam, und für die Nacht ist es gut, Ersatz zu haben. Eine Gruppe von 15 Leuten schafft 24 Stunden, wenn einige bereit sind, zwei Stunden zu übernehmen.',
              'Wer weniger ist, muss nicht verzichten: Auch 12 Stunden am Stück oder eine Kette über mehrere Tage mit ganzen Tagen pro Person sind ein starkes Zeichen.',
            ],
          },
          {
            heading: 'Ort: zu Hause oder gemeinsam?',
            paragraphs: [
              'Viele 24-Stunden-Gebete laufen dezentral: Jeder betet in seiner Stunde dort, wo er gerade ist. Das senkt die Hürde enorm, gerade nachts. Andere richten einen Gebetsraum in der Gemeinde ein, der rund um die Uhr offen ist. Beides lässt sich kombinieren — tagsüber im Gebetsraum, nachts von zu Hause.',
              'Wenn ihr einen Raum nutzt: Schlüsselübergabe, Licht, Heizung und eine Liste mit Notfallnummern vorher klären.',
            ],
          },
          {
            heading: 'Die Nachtstunden füllen',
            paragraphs: [
              'Die Stunden zwischen 1 und 5 Uhr sind fast immer die letzten Lücken. Ein paar Wege, die sich bewährt haben:',
            ],
            list: [
              'Gezielt Frühaufsteher und Nachteulen ansprechen, statt allgemein zu fragen',
              'Schichtarbeiter, Studenten und junge Eltern fragen — sie sind nachts oft ohnehin wach',
              'Die Nacht zu zweit übernehmen lassen, jeder eine halbe Stunde',
              'Freie Stunden kurz vorher noch einmal konkret in die Gruppe posten',
            ],
          },
          {
            heading: 'Ideen für die eigene Gebetsstunde',
            paragraphs: [
              'Eine Stunde allein zu beten, ist für viele ungewohnt. Ein einfacher Rahmen hilft, zum Beispiel in vier Viertelstunden:',
            ],
            list: [
              'Ankommen: Stille, ein Psalm, Dank für das, was gut ist',
              'Das Hauptanliegen der Wache: konkret und mit eigenen Worten',
              'Fürbitte weiter gefasst: Gemeinde, Stadt, Land, Verfolgte',
              'Hören und Abschluss: Stille, Vaterunser, ein Segen für den nächsten Beter',
            ],
          },
          {
            heading: 'Beispiel-Ablauf',
            paragraphs: [
              'Start am Freitag um 18 Uhr mit einem gemeinsamen Gebet, dann übernimmt Stunde für Stunde jemand anderes. Am Samstag um 18 Uhr trefft ihr euch wieder, teilt, was ihr erlebt habt, und schließt gemeinsam ab. Ein gemeinsamer Anfang und ein gemeinsames Ende geben den 24 Stunden einen Rahmen, auch wenn dazwischen jeder für sich betet.',
            ],
          },
          {
            heading: 'Organisation mit 24pray',
            paragraphs: [
              '24pray teilt den Zeitraum automatisch in Stunden, zeigt allen, welche noch frei sind, und erinnert jeden Beter vor seiner Stunde per E-Mail oder Push. Mitbeten geht ohne Konto — ein Name genügt, die E-Mail-Adresse für die Erinnerung ist freiwillig. Bei Teilnehmern in verschiedenen Ländern zeigt die Seite die Zeiten zusätzlich in der eigenen Zeitzone an.',
            ],
          },
        ],
      },
      en: {
        slug: 'plan-24-hours-of-prayer',
        title: 'Planning 24 hours of prayer: schedule, flow and tips',
        description:
          '24 hours of non-stop prayer: how many people you need, how to fill the night hours, ideas for your prayer hour and a sample schedule.',
        intro:
          'Praying through a whole day and a whole night without a break is a special experience for many groups. For the 24 hours to really fill up, it takes some planning. Here is what matters.',
        sections: [
          {
            heading: 'How many people do you need?',
            paragraphs: [
              'Strictly speaking 24 — one per hour. In practice it pays to plan with a few more: some hours are taken by two or three people together, and it is good to have back-up for the night. A group of 15 can cover 24 hours if a few are willing to take two hours.',
              'Smaller groups need not miss out: 12 hours in a row, or a chain over several days with one whole day per person, is a strong sign too.',
            ],
          },
          {
            heading: 'Where: at home or together?',
            paragraphs: [
              'Many 24-hour prayer events are decentralised: everyone prays during their hour wherever they are. That lowers the barrier enormously, especially at night. Others set up a prayer room at church that stays open round the clock. You can combine both — the prayer room by day, at home by night.',
              'If you use a room, sort out keys, lights, heating and a list of emergency numbers beforehand.',
            ],
          },
          {
            heading: 'Filling the night hours',
            paragraphs: ['The hours between 1 and 5 am are almost always the last gaps. A few approaches that work:'],
            list: [
              'Ask early risers and night owls directly instead of asking everyone',
              'Ask shift workers, students and young parents — they are often awake at night anyway',
              'Let two people share a night hour, half an hour each',
              'Post the open hours to the group again, specifically, shortly before',
            ],
          },
          {
            heading: 'Ideas for your own prayer hour',
            paragraphs: ['Praying alone for an hour is unfamiliar to many. A simple frame helps, for example in four quarters:'],
            list: [
              'Arriving: silence, a psalm, thanks for what is good',
              'The main request of the watch: concretely and in your own words',
              'Wider intercession: church, city, country, the persecuted',
              'Listening and closing: silence, the Lord’s Prayer, a blessing for the next person',
            ],
          },
          {
            heading: 'Sample schedule',
            paragraphs: [
              'Start on Friday at 6 pm with a prayer together, then someone else takes over each hour. On Saturday at 6 pm you meet again, share what you experienced and close together. A shared beginning and end give the 24 hours a frame, even if everyone prays on their own in between.',
            ],
          },
          {
            heading: 'Organising it with 24pray',
            paragraphs: [
              '24pray splits the time span into hours automatically, shows everyone which are still open, and reminds each person before their hour by email or push. Praying along needs no account — a name is enough, the email address for the reminder is optional. When people join from different countries, the page also shows the times in their own time zone.',
            ],
          },
        ],
      },
      es: {
        slug: 'planificar-24-horas-de-oracion',
        title: 'Planificar 24 horas de oración: horario, desarrollo y consejos',
        description:
          '24 horas de oración sin interrupción: cuántas personas necesitas, cómo cubrir las horas de la noche, ideas para tu hora de oración y un horario de ejemplo.',
        intro:
          'Orar un día entero y una noche entera sin interrupción es una experiencia especial para muchos grupos. Para que las 24 horas se llenen de verdad hace falta algo de planificación. Aquí tienes lo esencial.',
        sections: [
          {
            heading: '¿Cuántas personas hacen falta?',
            paragraphs: [
              'En teoría 24 — una por hora. En la práctica conviene contar con algunas más: algunas horas las asumen dos o tres personas juntas, y para la noche es bueno tener suplentes. Un grupo de 15 personas puede cubrir 24 horas si algunos están dispuestos a asumir dos horas.',
              'Los grupos más pequeños no tienen por qué renunciar: 12 horas seguidas, o una cadena de varios días con un día entero por persona, también son una señal fuerte.',
            ],
          },
          {
            heading: '¿Dónde: en casa o juntos?',
            paragraphs: [
              'Muchas jornadas de 24 horas son descentralizadas: cada uno ora en su hora allí donde esté. Eso baja mucho el umbral, sobre todo de noche. Otros preparan una sala de oración en la iglesia abierta las 24 horas. Se pueden combinar ambas cosas — de día en la sala, de noche desde casa.',
              'Si usáis una sala, aclarad antes las llaves, la luz, la calefacción y una lista de teléfonos de emergencia.',
            ],
          },
          {
            heading: 'Cubrir las horas de la noche',
            paragraphs: ['Las horas entre la 1 y las 5 de la madrugada casi siempre son los últimos huecos. Algunas ideas que funcionan:'],
            list: [
              'Pregunta directamente a quienes madrugan o trasnochan, en lugar de preguntar a todos',
              'Pregunta a quienes trabajan por turnos, a estudiantes y a padres jóvenes — de noche suelen estar despiertos',
              'Deja que dos personas compartan una hora nocturna, media hora cada una',
              'Publica de nuevo en el grupo, poco antes y de forma concreta, las horas libres',
            ],
          },
          {
            heading: 'Ideas para tu propia hora de oración',
            paragraphs: ['Orar una hora a solas no es habitual para muchos. Ayuda un marco sencillo, por ejemplo en cuatro cuartos de hora:'],
            list: [
              'Llegar: silencio, un salmo, gratitud por lo bueno',
              'El motivo principal de la vigilia: en concreto y con tus palabras',
              'Intercesión más amplia: iglesia, ciudad, país, los perseguidos',
              'Escuchar y cerrar: silencio, el Padrenuestro, una bendición para la siguiente persona',
            ],
          },
          {
            heading: 'Horario de ejemplo',
            paragraphs: [
              'Empezáis el viernes a las 18 h con una oración juntos; después, cada hora asume otra persona. El sábado a las 18 h os volvéis a reunir, compartís lo vivido y cerráis juntos. Un comienzo y un final en común dan un marco a las 24 horas, aunque entre medias cada uno ore por su cuenta.',
            ],
          },
          {
            heading: 'Organizarlo con 24pray',
            paragraphs: [
              '24pray divide el periodo en horas automáticamente, muestra a todos cuáles siguen libres y recuerda a cada persona su hora con antelación por correo o notificación push. Para orar no hace falta cuenta — basta con un nombre; el correo para el recordatorio es opcional. Si participan personas de distintos países, la página muestra además los horarios en su propia zona horaria.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'week-of-prayer',
    updated: '2026-10-12',
    text: {
      de: {
        slug: 'gebetswoche-gemeinde-vorbereiten',
        title: 'Gebetswoche in der Gemeinde vorbereiten',
        description:
          'Eine Gebetswoche in der Gemeinde vorbereiten: Termin, Thema, Tagesimpulse, Gebetskette über die ganze Woche und wie möglichst viele mitmachen.',
        intro:
          'Eine Gebetswoche bringt eine Gemeinde für ein paar Tage gezielt ins Gebet — ob zur Allianzgebetswoche im Januar, vor Ostern oder vor einem besonderen Vorhaben. Die Woche gelingt am besten, wenn sie zwei Ebenen hat: gemeinsame Treffen und ein durchgehendes Gebet dazwischen.',
        sections: [
          {
            heading: 'Termin und Thema',
            paragraphs: [
              'Wähle eine Woche ohne Konkurrenz durch Ferien oder große Gemeindeveranstaltungen. Ein klares Thema hält die Woche zusammen: ein Bibeltext, ein Anliegen der Gemeinde oder ein Schwerpunkt pro Tag — etwa Familie, Stadt, Mission, verfolgte Christen, Einheit.',
              'Viele Gemeinden schließen sich auch einer bestehenden Gebetswoche an, etwa der Allianzgebetswoche Anfang Januar, und nutzen deren Tagesthemen.',
            ],
          },
          {
            heading: 'Gemeinsame Treffen',
            paragraphs: [
              'Ein bis zwei gemeinsame Gebetsabende in der Woche geben Halt. Halte sie kurz und einfach: ein Impuls von fünf Minuten, dann Gebet in kleinen Gruppen. Wer offene Gebetsrunden nicht gewohnt ist, fühlt sich in Dreiergruppen wohler als im großen Kreis.',
            ],
          },
          {
            heading: 'Durchgehendes Gebet zwischen den Treffen',
            paragraphs: [
              'Zwischen den Abenden betet jeder dort, wo er ist — verteilt über eine Gebetskette. Bei einer Woche hat man die Wahl: Rund um die Uhr in Stunden aufteilen (168 Stunden, für größere Gemeinden), nur tagsüber, oder jedem Tag einen Hauskreis oder eine Familie zuordnen.',
              'Wichtig ist, dass jeder sieht, wo noch Lücken sind, und dass niemand seine Zeit vergisst. Eine Liste zum Selbsteintragen mit Erinnerung vor der eigenen Zeit ist hier deutlich verlässlicher als ein Zettel am Infotisch.',
            ],
          },
          {
            heading: 'Tagesimpulse',
            paragraphs: [
              'Ein kurzer Impuls pro Tag — Bibelvers, zwei Sätze Gedanken, drei konkrete Gebetsanliegen — gibt allen denselben roten Faden. Er kann gedruckt ausliegen und gleichzeitig online geteilt werden, damit auch Menschen mitbeten, die nicht zu den Treffen kommen.',
            ],
          },
          {
            heading: 'Möglichst viele beteiligen',
            list: [
              'Im Gottesdienst zwei Wochen vorher ankündigen und den Link zeigen (QR-Code auf der Leinwand)',
              'Hauskreisleiter bitten, gemeinsam einen Abschnitt zu übernehmen',
              'Kinder und Jugendliche mit eigenen, kürzeren Zeiten einbinden',
              'Ältere Gemeindemitglieder gezielt ansprechen — viele beten ohnehin täglich und tragen sich gern ein',
              'Am Ende der Woche Gebetserhörungen und Erlebnisse teilen',
            ],
            paragraphs: [],
          },
        ],
      },
      en: {
        slug: 'prepare-a-week-of-prayer',
        title: 'How to prepare a week of prayer in your church',
        description:
          'Preparing a week of prayer in your church: dates, theme, daily prompts, a prayer chain across the whole week and how to get as many people as possible involved.',
        intro:
          'A week of prayer focuses a church on prayer for a few days — whether for the Week of Prayer in January, before Easter or ahead of a special venture. The week works best when it has two layers: gatherings together, and continuous prayer in between.',
        sections: [
          {
            heading: 'Dates and theme',
            paragraphs: [
              'Choose a week that does not compete with holidays or big church events. A clear theme holds the week together: a Bible passage, a need in the church, or one focus per day — family, city, mission, persecuted Christians, unity.',
              'Many churches also join an existing week of prayer, such as the Evangelical Alliance Week of Prayer in early January, and use its daily themes.',
            ],
          },
          {
            heading: 'Gathering together',
            paragraphs: [
              'One or two prayer evenings during the week give it shape. Keep them short and simple: a five-minute thought, then prayer in small groups. People not used to open prayer feel more at ease in threes than in a big circle.',
            ],
          },
          {
            heading: 'Continuous prayer between gatherings',
            paragraphs: [
              'Between the evenings everyone prays wherever they are — shared out through a prayer chain. For a week you have options: round the clock in hours (168 hours, for larger churches), daytime only, or one small group or family per day.',
              'What matters is that everyone can see where the gaps are and nobody forgets their slot. A sign-up list with a reminder before each slot is far more reliable than a sheet on the welcome desk.',
            ],
          },
          {
            heading: 'Daily prompts',
            paragraphs: [
              'A short prompt each day — a Bible verse, two sentences of reflection, three concrete prayer points — gives everyone the same thread. Print it and share it online at the same time, so that people who cannot come to the gatherings can pray along too.',
            ],
          },
          {
            heading: 'Getting as many people involved as possible',
            paragraphs: [],
            list: [
              'Announce it in the service two weeks ahead and show the link (QR code on the screen)',
              'Ask small-group leaders to take a slot together',
              'Include children and young people with their own, shorter slots',
              'Ask older members directly — many pray daily anyway and are glad to sign up',
              'At the end of the week, share answered prayers and stories',
            ],
          },
        ],
      },
      es: {
        slug: 'preparar-semana-de-oracion',
        title: 'Cómo preparar una semana de oración en la iglesia',
        description:
          'Preparar una semana de oración en la iglesia: fechas, tema, pautas diarias, una cadena de oración durante toda la semana y cómo lograr que participen muchos.',
        intro:
          'Una semana de oración centra a una iglesia en la oración durante unos días — ya sea en la Semana de Oración de enero, antes de Semana Santa o antes de un proyecto especial. La semana funciona mejor cuando tiene dos niveles: encuentros comunes y oración continua entre medias.',
        sections: [
          {
            heading: 'Fechas y tema',
            paragraphs: [
              'Elige una semana que no compita con vacaciones ni con grandes eventos de la iglesia. Un tema claro mantiene unida la semana: un pasaje bíblico, una necesidad de la iglesia o un enfoque por día — familia, ciudad, misión, cristianos perseguidos, unidad.',
              'Muchas iglesias se unen también a una semana de oración ya existente, como la Semana Unida de Oración de la Alianza Evangélica a principios de enero, y usan sus temas diarios.',
            ],
          },
          {
            heading: 'Encuentros comunes',
            paragraphs: [
              'Una o dos noches de oración durante la semana le dan estructura. Mantenlas cortas y sencillas: una reflexión de cinco minutos y luego oración en grupos pequeños. Quien no está acostumbrado a orar en voz alta se siente más cómodo en grupos de tres que en un gran círculo.',
            ],
          },
          {
            heading: 'Oración continua entre los encuentros',
            paragraphs: [
              'Entre las noches, cada uno ora allí donde esté — repartido mediante una cadena de oración. Para una semana hay opciones: las 24 horas por turnos de una hora (168 horas, para iglesias grandes), solo durante el día, o un grupo o una familia por día.',
              'Lo importante es que todos vean dónde quedan huecos y que nadie olvide su turno. Una lista en la que cada uno se apunta, con recordatorio antes del turno, es mucho más fiable que una hoja en la mesa de bienvenida.',
            ],
          },
          {
            heading: 'Pautas diarias',
            paragraphs: [
              'Una breve pauta cada día — un versículo, dos frases de reflexión, tres motivos concretos — da a todos el mismo hilo conductor. Imprímela y compártela también en línea, para que puedan orar quienes no vienen a los encuentros.',
            ],
          },
          {
            heading: 'Que participen muchos',
            paragraphs: [],
            list: [
              'Anunciarlo en el culto dos semanas antes y mostrar el enlace (código QR en la pantalla)',
              'Pedir a los líderes de grupos que asuman un turno juntos',
              'Incluir a niños y jóvenes con turnos propios más cortos',
              'Preguntar directamente a los mayores — muchos oran a diario y se apuntan con gusto',
              'Al final de la semana, compartir oraciones contestadas y vivencias',
            ],
          },
        ],
      },
    },
  },
];

export function isGuideLocale(locale: Locale): locale is GuideLocale {
  return locale === 'de' || locale === 'en' || locale === 'es';
}

export const GUIDE_LOCALES: readonly GuideLocale[] = ['de', 'en', 'es'];

export function findGuide(locale: GuideLocale, slug: string): Guide | null {
  return GUIDES.find((g) => g.text[locale].slug === slug) ?? null;
}
