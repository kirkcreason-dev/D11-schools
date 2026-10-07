// Static content for the GitHub Pages edition of the Creaso-Norse D11 concept.
// Written for this demonstration from public facts (names, addresses, phone numbers, program names).
// Nothing here is copied from district pages; production content would be migrated with district authorization.
const P = '2026-10-07T03:00:00Z';
const S = (title, titleEs, body, bodyEs, extra = {}) => ({ type: 'text', title, titleEs, body, bodyEs, ...extra });
const A = (title, titleEs, linkUrl, linkLabel, linkLabelEs, body = '', bodyEs = '') => ({ type: 'action', title, titleEs, body, bodyEs, linkUrl, linkLabel, linkLabelEs });

export const staticItems = [
// ───────── District-wide alert shown on the district home and every school home
{ id: 'demo-notice', kind: 'alert', scope: 'all', publishedAt: P,
  title: 'Concept demonstration for D11 RFI S2026-0019',
  titleEs: 'Demostración conceptual para la RFI S2026-0019 de D11',
  body: 'This site is a proposal concept by Creaso-Norse Technologies. It is not the official Colorado Springs School District 11 website. For official information visit the district office or call 719-520-2000.',
  bodyEs: 'Este sitio es un concepto de propuesta de Creaso-Norse Technologies. No es el sitio oficial del Distrito Escolar 11 de Colorado Springs. Para información oficial, comuníquese con la oficina del distrito al 719-520-2000.',
  linkUrl: 'page.html?id=about-this-demo', linkLabel: 'About this demonstration', linkLabelEs: 'Acerca de esta demostración' },

// ───────── District news (platform showcase items, clearly framed as demo content)
{ id: 'news-customize', kind: 'news', scope: 'district', publishedAt: P,
  title: 'Your site, your way: we will customize it any way you want',
  titleEs: 'Su sitio, a su manera: lo personalizamos como usted quiera',
  body: 'Anything you see on this demo can change: colors, layouts, menus, new sections, school-specific features and connections to the tools you already use. Requests go straight to the owner and are handled the same day, with no change-order fees.',
  bodyEs: 'Todo lo que ve en esta demo puede cambiar: colores, diseños, menús, secciones nuevas, funciones para cada escuela y conexiones con las herramientas que ya usa. Las solicitudes van directo al propietario y se atienden el mismo día, sin cargos por cambios.',
  linkUrl: 'page.html?id=customize', linkLabel: 'What we can customize', linkLabelEs: 'Qué podemos personalizar' },
{ id: 'news-proposal', kind: 'news', scope: 'district', publishedAt: P,
  title: 'Our proposal: every school site, one flat rate',
  titleEs: 'Nuestra propuesta: todos los sitios escolares, una tarifa fija',
  body: 'Creaso-Norse Technologies’ response to RFI S2026-0019: the district site and all 58 school sites, with design, migration, hosting, training and support, for $60,000 per year.',
  bodyEs: 'La respuesta de Creaso-Norse Technologies a la RFI S2026-0019: el sitio del distrito y los 58 sitios escolares, con diseño, migración, alojamiento, capacitación y soporte, por $60,000 al año.',
  linkUrl: 'proposal.html', linkLabel: 'Read the proposal', linkLabelEs: 'Leer la propuesta' },
{ id: 'news-one-platform', kind: 'news', scope: 'district', publishedAt: P,
  title: 'One platform for the district and all 58 school sites',
  titleEs: 'Una plataforma para el distrito y los 58 sitios escolares',
  body: 'Every school in this concept shares one design system, one search and one bilingual publishing workflow, while keeping its own name, colors and identity. A districtwide notice can reach all 58 sites in one step.',
  bodyEs: 'Cada escuela de este concepto comparte un sistema de diseño, una búsqueda y un flujo de publicación bilingüe, manteniendo su propio nombre, colores e identidad. Un aviso del distrito puede llegar a los 58 sitios en un solo paso.' },
{ id: 'news-bilingual', kind: 'news', scope: 'district', publishedAt: P,
  title: 'English and Spanish, side by side',
  titleEs: 'Inglés y español, lado a lado',
  body: 'Choose Español at the top of any page. Staff write both languages in the same editor, and content cannot be published until both are complete.',
  bodyEs: 'Seleccione English en la parte superior de cualquier página. El personal escribe ambos idiomas en el mismo editor y el contenido no se publica hasta que ambos estén completos.' },
{ id: 'news-migration', kind: 'news', scope: 'district', publishedAt: P,
  title: 'How every current page finds a new home',
  titleEs: 'Cómo cada página actual encuentra su nuevo lugar',
  body: 'The migration map shows where each section of the current district site lands in the new structure, which outside systems stay connected, and how old addresses redirect so bookmarks keep working.',
  bodyEs: 'El mapa de migración muestra dónde se ubica cada sección del sitio actual en la nueva estructura, qué sistemas externos siguen conectados y cómo se redirigen las direcciones antiguas para que los marcadores sigan funcionando.',
  linkUrl: 'page.html?id=migration-map', linkLabel: 'View the migration map', linkLabelEs: 'Ver el mapa de migración' },

// ───────── District information pages
{ id: 'customize', kind: 'page', scope: 'district', publishedAt: P,
  title: 'We will customize it any way you want', titleEs: 'Lo personalizamos como usted quiera',
  body: 'This demo is a starting point, not a template you are stuck with. District 11 decides how its websites look and work, and Creaso-Norse Technologies builds it. Requests go directly to the owner and are handled the same day, included in the flat rate.',
  bodyEs: 'Esta demo es un punto de partida, no una plantilla fija. El Distrito 11 decide cómo se ven y funcionan sus sitios, y Creaso-Norse Technologies lo construye. Las solicitudes van directo al propietario y se atienden el mismo día, incluidas en la tarifa fija.',
  sections: [
    S('Look and feel', 'Apariencia', 'District and school colors, fonts and logos\nHomepage layouts for the district and each school\nPhoto galleries, video and featured stories\nMenus and navigation organized the way families search', 'Colores, tipografías y logotipos del distrito y de cada escuela\nDiseños de inicio para el distrito y cada escuela\nGalerías de fotos, video e historias destacadas\nMenús organizados como buscan las familias'),
    S('Features', 'Funciones', 'New page types and sections whenever you need them\nSchool-specific tools: athletics schedules, bell schedules, clubs, staff directories\nForms, sign-ups and surveys\nLanguages beyond English and Spanish', 'Nuevos tipos de página y secciones cuando los necesite\nHerramientas por escuela: horarios deportivos, horarios de timbre, clubes, directorios del personal\nFormularios, inscripciones y encuestas\nIdiomas además de inglés y español'),
    S('Connections', 'Conexiones', 'PowerSchool, SchoolMessenger, Schoology and district sign-on\nCalendars, menus, bus information and board systems the district already uses\nAnything else the district wants connected, scoped together', 'PowerSchool, SchoolMessenger, Schoology y el acceso del distrito\nCalendarios, menús, transporte y sistemas de la junta que el distrito ya usa\nCualquier otra conexión que el distrito quiera, definida en conjunto'),
    S('How requests work', 'Cómo funcionan las solicitudes', '1. Tell the owner what you want: call, email or a quick note\n2. Most changes are done the same day\n3. No change orders, no surprise invoices; it is included in the flat rate', '1. Dígale al propietario lo que quiere: llamada, correo o una nota\n2. La mayoría de los cambios se hacen el mismo día\n3. Sin órdenes de cambio ni facturas sorpresa; está incluido en la tarifa fija'),
    A('See the pricing', 'Ver los precios', 'proposal.html', 'Read our proposal', 'Leer nuestra propuesta')
  ] },

{ id: 'about-d11', kind: 'page', scope: 'district', publishedAt: P,
  title: 'About District 11', titleEs: 'Acerca del Distrito 11',
  body: 'Colorado Springs School District 11 is the central public school system in Colorado Springs, serving about 23,000 students across 58 school and program sites, from preschool through high school, online learning and adult education.',
  bodyEs: 'El Distrito Escolar 11 de Colorado Springs es el sistema escolar público central de Colorado Springs y atiende a unos 23.000 estudiantes en 58 sitios escolares y programas, desde preescolar hasta preparatoria, aprendizaje en línea y educación para adultos.',
  sections: [
    S('District office', 'Oficina del distrito', '1115 N. El Paso Street\nColorado Springs, CO 80903\nMain line: 719-520-2000', '1115 N. El Paso Street\nColorado Springs, CO 80903\nLínea principal: 719-520-2000'),
    S('Schools at a glance', 'Escuelas de un vistazo', '33 elementary schools\n10 middle schools\n5 comprehensive high schools\nPreschool, online academies, opportunity academies and specialty programs', '33 escuelas primarias\n10 escuelas secundarias\n5 preparatorias integrales\nPreescolar, academias en línea, academias de oportunidad y programas especializados'),
    A('Find a school', 'Buscar una escuela', 'schools.html', 'Browse all 58 sites', 'Ver los 58 sitios')
  ] },

{ id: 'enrollment', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Enrollment & school choice', titleEs: 'Inscripción y elección de escuela',
  body: 'New to District 11 or changing schools? Start with the school you want to attend, then complete the enrollment application. The enrollment team can help at 719-520-2297.',
  bodyEs: '¿Es nuevo en el Distrito 11 o cambia de escuela? Comience con la escuela a la que desea asistir y luego complete la solicitud de inscripción. El equipo de inscripción puede ayudarle al 719-520-2297.',
  sections: [
    S('Have these ready', 'Tenga esto listo', 'Parent or guardian identification\nProof of your child’s date of birth\nImmunization records\nProof of residency\nCustody or special education paperwork, if it applies', 'Identificación del padre, madre o tutor\nComprobante de la fecha de nacimiento\nRegistro de vacunas\nComprobante de domicilio\nDocumentos de custodia o de educación especial, si corresponden'),
    S('Paths into District 11', 'Formas de ingresar al Distrito 11', 'Neighborhood enrollment\nSchool choice for a school outside your neighborhood\nKindergarten enrollment\nPreschool enrollment\nOnline and opportunity academies\nAdult and family education', 'Inscripción en la escuela del vecindario\nElección de una escuela fuera de su vecindario\nInscripción en kínder\nInscripción en preescolar\nAcademias en línea y de oportunidad\nEducación para adultos y familias'),
    S('In production', 'En producción', 'The live platform hosts the enrollment guide, FAQs, course catalogs, residency and immunization requirements, and team contacts as editable pages owned by the enrollment office.', 'La plataforma en vivo aloja la guía de inscripción, preguntas frecuentes, catálogos de cursos, requisitos de domicilio y vacunas, y contactos del equipo como páginas editables administradas por la oficina de inscripción.'),
    A('Need help?', '¿Necesita ayuda?', 'schools.html', 'Find your school', 'Encuentre su escuela', 'Call 719-520-2297 or contact the school you want to attend.', 'Llame al 719-520-2297 o comuníquese con la escuela que desea.')
  ] },

{ id: 'meals', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Meals & nutrition', titleEs: 'Comidas y nutrición',
  body: 'District 11 Food and Nutrition Services serves breakfast and lunch at schools across the district. Schools it serves take part in Colorado’s Healthy School Meals for All program.',
  bodyEs: 'Nutrición del Distrito 11 sirve desayuno y almuerzo en escuelas de todo el distrito. Las escuelas que atiende participan en el programa Healthy School Meals for All de Colorado.',
  sections: [
    S('What you’ll find here in production', 'Lo que encontrará aquí en producción', 'Monthly breakfast and lunch menus\nMeal benefit applications\nSpecial diet and food allergy forms\nMeal account information', 'Menús mensuales de desayuno y almuerzo\nSolicitudes de beneficios de comidas\nFormularios de dietas especiales y alergias\nInformación de cuentas de comidas'),
    S('Why fill out a benefit application?', '¿Por qué llenar una solicitud de beneficios?', 'Even when meals are free, an application can help your family qualify for reduced fees and other services.', 'Aunque las comidas sean gratuitas, una solicitud puede ayudar a su familia a calificar para cuotas reducidas y otros servicios.'),
    S('Food allergies', 'Alergias alimentarias', 'Talk with your school office and school nurse first so they can coordinate a plan with Food and Nutrition Services.', 'Hable primero con la oficina escolar y la enfermera para coordinar un plan con Nutrición.')
  ] },

{ id: 'transportation', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Transportation', titleEs: 'Transporte',
  body: 'Bus eligibility and stops depend on your student’s school and address. Confirm your student’s school and current bus arrangements before the first day.',
  bodyEs: 'La elegibilidad y las paradas de autobús dependen de la escuela y la dirección de su estudiante. Confirme la escuela y el transporte actual antes del primer día.',
  sections: [
    S('Bus stop lookup', 'Búsqueda de paradas', 'In production, the bus stop finder the district already uses is embedded on this page so families never leave the site.', 'En producción, el buscador de paradas que ya usa el distrito se integra en esta página para que las familias no tengan que salir del sitio.'),
    S('Delays and closures', 'Retrasos y cierres', 'Weather delays post here and on every school homepage at once, and go out through SchoolMessenger.', 'Los retrasos por clima se publican aquí y en cada página escolar a la vez, y se envían por SchoolMessenger.'),
    A('Questions?', '¿Preguntas?', 'schools.html', 'Call your school office', 'Llame a la oficina escolar')
  ] },

{ id: 'powerschool', kind: 'page', scope: 'district', publishedAt: P,
  title: 'MyPowerHub, PowerSchool & SchoolMessenger', titleEs: 'MyPowerHub, PowerSchool y SchoolMessenger',
  body: 'District 11 keeps PowerSchool, MyPowerHub and SchoolMessenger. This platform is built to work alongside them, not replace them.',
  bodyEs: 'El Distrito 11 mantiene PowerSchool, MyPowerHub y SchoolMessenger. Esta plataforma está diseñada para funcionar junto a ellos, no para reemplazarlos.',
  sections: [
    S('Families', 'Familias', 'MyPowerHub uses your existing PowerSchool parent sign-in. On the live site, this page hands you off to the district’s own sign-in so your password is never entered on the website.', 'MyPowerHub usa su acceso de padre o tutor de PowerSchool. En el sitio en vivo, esta página lo dirige al inicio de sesión del distrito para que su contraseña nunca se ingrese en el sitio web.'),
    S('Messages', 'Mensajes', 'SchoolMessenger stays the district’s tool for calls, texts and email. Alerts published here can be mirrored to SchoolMessenger so families see the same message everywhere.', 'SchoolMessenger sigue siendo la herramienta del distrito para llamadas, textos y correos. Los avisos publicados aquí pueden reflejarse en SchoolMessenger para que las familias vean el mismo mensaje en todas partes.'),
    S('Staff', 'Personal', 'Staff sign in once with district single sign-on. School editors only see the schools they are assigned to.', 'El personal inicia sesión una vez con el acceso único del distrito. Los editores escolares solo ven las escuelas asignadas.'),
    S('Demonstration note', 'Nota de demostración', 'No sign-in forms are reproduced in this concept. The hand-off is shown during the live demonstration.', 'Este concepto no reproduce formularios de acceso. El traspaso se muestra durante la demostración en vivo.')
  ] },

{ id: 'schoology', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Schoology & learning at home', titleEs: 'Schoology y aprendizaje en casa',
  body: 'Schoology is where students and families follow classroom learning. For assignments, grades or access, contact the teacher or school office.',
  bodyEs: 'Schoology es donde estudiantes y familias siguen el aprendizaje en clase. Para tareas, calificaciones o acceso, comuníquese con el docente o la oficina escolar.',
  sections: [
    S('On the live site', 'En el sitio en vivo', 'This page connects to Schoology through the district’s sign-in, alongside how-to guides written by the district in English and Spanish.', 'Esta página se conecta a Schoology mediante el acceso del distrito, junto con guías del distrito en inglés y español.')
  ] },

{ id: 'district-calendar', kind: 'page', scope: 'district', publishedAt: P,
  title: 'District calendar', titleEs: 'Calendario del distrito',
  body: 'Key district dates for families. Times are Mountain Time. Confirm school-specific schedules with your school.',
  bodyEs: 'Fechas clave del distrito para las familias. Las horas están en horario de la Montaña. Confirme los horarios con su escuela.',
  sections: [
    S('October 2026', 'Octubre de 2026', 'Oct 9 · Teacher work day, no students\nOct 16 · Parent–teacher conferences, no students\nOct 19–23 · Fall Break, no school', '9 oct · Día de trabajo docente, sin estudiantes\n16 oct · Conferencias familiares, sin estudiantes\n19–23 oct · Vacaciones de otoño, sin clases'),
    S('One calendar, every school', 'Un calendario, todas las escuelas', 'In production, every school calendar, the board calendar, graduations, open houses and the arts calendar live here as filters, and any of them can be added to a phone calendar.', 'En producción, todos los calendarios escolares, el de la junta, graduaciones, puertas abiertas y artes están aquí como filtros, y cualquiera puede agregarse al calendario del teléfono.'),
    A('Open the calendar', 'Abrir el calendario', 'calendar.html', 'View & download dates', 'Ver y descargar fechas')
  ] },

{ id: 'board', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Board of Education', titleEs: 'Junta de Educación',
  body: 'District 11 is governed by an elected Board of Education. Meetings are open to the public and are broadcast live.',
  bodyEs: 'El Distrito 11 está gobernado por una Junta de Educación electa. Las reuniones son públicas y se transmiten en vivo.',
  sections: [
    S('On the live site', 'En el sitio en vivo', 'Board members, meeting calendar, agendas and minutes, public comment, policies, resolutions and board communications, all searchable alongside the rest of the site. Agenda and policy systems the board already uses stay connected through approved integrations.', 'Miembros, calendario de reuniones, agendas y actas, comentarios públicos, políticas, resoluciones y comunicaciones, todo con búsqueda junto al resto del sitio. Los sistemas de agendas y políticas que ya usa la junta siguen conectados mediante integraciones aprobadas.')
  ] },

{ id: 'staff-hub', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Employee resources', titleEs: 'Recursos para empleados',
  body: 'Careers, hiring events, professional learning and staff tools. Internal staff pages stay behind district sign-on and are migrated separately from the public site.',
  bodyEs: 'Empleos, eventos de contratación, aprendizaje profesional y herramientas del personal. Las páginas internas permanecen detrás del acceso del distrito y se migran por separado del sitio público.' },

{ id: 'about-this-demo', kind: 'page', scope: 'district', publishedAt: P,
  title: 'About this demonstration', titleEs: 'Acerca de esta demostración',
  body: 'This site is a concept prepared by Creaso-Norse Technologies in response to Colorado Springs School District 11 Request for Information S2026-0019, District and School Website Services. It is not the official District 11 website and is not affiliated with or endorsed by the district.',
  bodyEs: 'Este sitio es un concepto preparado por Creaso-Norse Technologies en respuesta a la Solicitud de Información S2026-0019 del Distrito Escolar 11 de Colorado Springs, Servicios de Sitios Web del Distrito y las Escuelas. No es el sitio oficial del Distrito 11 ni está afiliado al distrito.',
  sections: [
    S('What is real', 'Qué es real', 'School names, addresses, phone numbers, grade levels and school identities come from public district directories. Logos belong to their owners and appear only for this proposal.', 'Los nombres, direcciones, teléfonos, niveles y emblemas de las escuelas provienen de directorios públicos del distrito. Los logotipos pertenecen a sus dueños y aparecen solo para esta propuesta.'),
    S('What is demonstration', 'Qué es demostración', 'Page text in this concept was written for the demonstration. Full content migration of the district and school sites happens after award, with district authorization.', 'El texto de este concepto se escribió para la demostración. La migración completa del contenido ocurre después de la adjudicación, con autorización del distrito.'),
    S('Live demonstration', 'Demostración en vivo', 'The staff publishing workspace, family messaging, migration tools, permissions and content recovery are shown live during the informational demonstration.', 'El espacio de publicación, la mensajería familiar, las herramientas de migración, los permisos y la recuperación de contenido se muestran en vivo durante la demostración informativa.'),
    A('Contact', 'Contacto', 'page.html?id=migration-map', 'See the migration map', 'Ver el mapa de migración', 'Creaso-Norse Technologies', 'Creaso-Norse Technologies')
  ] },

// ───────── Migration map (built from the current site's public navigation)
{ id: 'migration-map', kind: 'page', scope: 'district', publishedAt: P,
  title: 'Migration map: every current section, a new home', titleEs: 'Mapa de migración: cada sección actual, un nuevo lugar',
  body: 'This map takes the current district site’s public navigation (14 top-level areas, roughly 250 linked pages) plus 54 school and program subsites, and shows where each lands on the new platform. Old addresses redirect to the new ones so bookmarks, printed flyers and search results keep working.',
  bodyEs: 'Este mapa toma la navegación pública del sitio actual (14 áreas principales, unas 250 páginas enlazadas) y 54 subsitios escolares, y muestra dónde se ubica cada uno en la nueva plataforma. Las direcciones antiguas se redirigen para que los marcadores, volantes impresos y resultados de búsqueda sigan funcionando.',
  sections: [
    S('About D11 → About District 11', 'Acerca de D11 → Acerca del Distrito 11', 'Overview, facts, transparency, capacity, bond planning, careers, accountability committee, district operations (finance, HR, equal opportunity, capital program, Title I, grants, athletics), mill levy override, org charts, superintendent, D11 TV, contact.', 'Resumen, datos, transparencia, capacidad, bonos, empleos, comité de rendición de cuentas, operaciones (finanzas, RR. HH., igualdad, capital, Título I, subvenciones, atletismo), impuesto MLO, organigramas, superintendente, D11 TV, contacto.'),
    S('Academics → Learning', 'Académicos → Aprendizaje', '5Essentials survey, academic pathways and STEM, school counseling, career & technical education, work-based learning, curriculum, concurrent enrollment, Future Ready Hub, homeschool, professional learning, student success services (nursing, gifted, special education, multilingual learners, dyslexia), JROTC.', 'Encuesta 5Essentials, trayectorias y STEM, consejería, educación técnica, aprendizaje basado en el trabajo, currículo, inscripción concurrente, Future Ready Hub, educación en casa, aprendizaje profesional, servicios estudiantiles (enfermería, dotados, educación especial, multilingües, dislexia), JROTC.'),
    S('Calendars → one filterable calendar', 'Calendarios → un calendario con filtros', 'District, assessment, board, preschool, professional learning, graduations, open houses and arts calendars become filters on one calendar with phone-calendar downloads. Scheduling tools already in use stay connected.', 'Los calendarios del distrito, evaluaciones, junta, preescolar, aprendizaje profesional, graduaciones, puertas abiertas y artes se convierten en filtros de un solo calendario con descarga al teléfono. Las herramientas actuales siguen conectadas.'),
    S('Families & Community → Families', 'Familias y comunidad → Familias', 'Enrollment (choice, kindergarten, preschool, residency, immunizations, course catalogs, FAQs), new parent hub, back to school, delays and closures, food allergies, McKinney-Vento, military families, Purple Star schools, rentals, school supplies, volunteering, transportation.', 'Inscripción (elección, kínder, preescolar, domicilio, vacunas, catálogos, preguntas), centro para nuevos padres, regreso a clases, retrasos y cierres, alergias, McKinney-Vento, familias militares, escuelas Purple Star, alquileres, útiles, voluntariado, transporte.'),
    S('School Board → Board of Education', 'Junta escolar → Junta de Educación', 'Welcome, members, contact, meetings and public comment, broadcasts, communications, legislative agenda, operating procedures, policies, resolutions, Spotlight on Excellence. Agenda and policy systems stay connected.', 'Bienvenida, miembros, contacto, reuniones y comentarios, transmisiones, comunicaciones, agenda legislativa, procedimientos, políticas, resoluciones, Spotlight on Excellence. Los sistemas de agendas y políticas siguen conectados.'),
    S('Students → Students', 'Estudiantes → Estudiantes', 'Athletics, graduation requirements and graduate profile, Future Ready Hub, cell phone policy, D11 Promise, records and transcripts, scholarships and counseling, student data privacy.', 'Atletismo, requisitos de graduación y perfil del graduado, Future Ready Hub, política de celulares, D11 Promise, expedientes, becas y consejería, privacidad de datos.'),
    S('Departments & Education Insights → Departments', 'Departamentos y Education Insights → Departamentos', 'Department directory, assessment office, external research, records and transcripts, retention schedules, open records (CORA).', 'Directorio de departamentos, evaluación, investigación externa, expedientes, retención de registros, registros abiertos (CORA).'),
    S('Select a School → 58 school sites', 'Seleccionar escuela → 58 sitios escolares', 'Preschool, 33 elementary, 10 middle, 5 comprehensive high schools, online and opportunity academies, Base Camp, the technology school and charter information. Each school subsite moves onto the shared platform with its own identity.', 'Preescolar, 33 primarias, 10 secundarias, 5 preparatorias, academias en línea y de oportunidad, Base Camp, la escuela de tecnología e información de escuelas chárter. Cada subsitio pasa a la plataforma compartida con su propia identidad.'),
    S('Stays where it is, connected', 'Se mantiene, conectado', 'PowerSchool / MyPowerHub, SchoolMessenger, Schoology, Office 365, staff hub single sign-on, board agenda and policy portals, scheduling tools, bus stop finder, digital flyers, meal accounts, college and career planning. These are integrations, not content to copy.', 'PowerSchool / MyPowerHub, SchoolMessenger, Schoology, Office 365, acceso único del personal, portales de agendas y políticas, programación, buscador de paradas, volantes digitales, cuentas de comidas, planificación universitaria. Son integraciones, no contenido para copiar.'),
    S('How migration runs', 'Cómo se realiza la migración', '1. Full crawl and inventory of the district site and every school site, with district authorization\n2. Content owners mark each page keep, merge, rewrite or retire\n3. Automated import into page templates, plus documents and images\n4. Every old address gets a redirect; broken links are reported before launch\n5. Accessibility check on every migrated page\n6. Principals review their school site, and everything goes live within one week of receiving the District’s content', '1. Rastreo e inventario completo del sitio del distrito y de cada escuela, con autorización\n2. Los responsables marcan cada página: conservar, unir, reescribir o retirar\n3. Importación automática a plantillas, con documentos e imágenes\n4. Cada dirección antigua se redirige; los enlaces rotos se reportan antes del lanzamiento\n5. Revisión de accesibilidad de cada página\n6. Los directores revisan el sitio de su escuela y todo se publica en una semana tras recibir el contenido del distrito')
  ] }
];

// Search-only entries pointing at existing concept pages
export const staticResources = [
  { id: 'families', title: 'Family resources', titleEs: 'Recursos familiares', body: 'Enrollment, meals, transportation, MyPowerHub, Schoology and who to call.', bodyEs: 'Inscripción, comidas, transporte, MyPowerHub, Schoology y a quién llamar.', href: 'families.html' },
  { id: 'calendar', title: 'Calendar', titleEs: 'Calendario', body: 'District dates and downloadable calendars.', bodyEs: 'Fechas del distrito y calendarios descargables.', href: 'calendar.html' },
  { id: 'schools', title: 'Find a school', titleEs: 'Buscar una escuela', body: 'All 58 school and program sites.', bodyEs: 'Los 58 sitios escolares y programas.', href: 'schools.html' },
  { id: 'sources', title: 'Sources & accessibility', titleEs: 'Fuentes y accesibilidad', body: 'Where the information on this concept comes from.', bodyEs: 'De dónde proviene la información de este concepto.', href: 'sources.html' }
];
