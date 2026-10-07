// Section hub pages mirroring the structure of the current district site.
// Topic names come from the public navigation; all wording is written for this demonstration.
const P = '2026-10-07T12:00:00Z';
const S = (title, titleEs, body, bodyEs) => ({ type: 'text', title, titleEs, body, bodyEs });
const A = (title, titleEs, linkUrl, linkLabel, linkLabelEs) => ({ type: 'action', title, titleEs, body: '', bodyEs: '', linkUrl, linkLabel, linkLabelEs });
const LIVE = S('On the live site', 'En el sitio en vivo',
  'Each topic above becomes its own page, owned and updated by the department responsible for it, and migrated from the current site with district authorization.',
  'Cada tema se convierte en su propia página, administrada por el departamento responsable y migrada desde el sitio actual con autorización del distrito.');
const page = (id, title, titleEs, body, bodyEs, sections) => ({ id, kind: 'page', scope: 'district', publishedAt: P, title, titleEs, body, bodyEs, sections: [...sections, LIVE] });

export const moreItems = [
page('academics', 'Academics & learning', 'Académicos y aprendizaje',
  'From early literacy to college credit, learning in District 11 is built around the skills students need for whatever comes next.',
  'Desde la lectoescritura temprana hasta los créditos universitarios, el aprendizaje en el Distrito 11 se centra en las habilidades que los estudiantes necesitan para lo que venga después.',
  [S('Topics', 'Temas',
    'Curriculum and academic standards\nColorado READ Act and early literacy\nGraduate profile\nAcademic pathways and STEM\nInstructional materials approval\nWhole-student learning\nStudy abroad\nPeak Experience\nJROTC\nHomeschool options\nProfessional learning for staff\n5Essentials school climate survey',
    'Currículo y estándares académicos\nLey READ de Colorado y lectoescritura temprana\nPerfil del graduado\nTrayectorias académicas y STEM\nAprobación de materiales didácticos\nAprendizaje integral\nEstudios en el extranjero\nPeak Experience\nJROTC\nOpciones de educación en casa\nAprendizaje profesional del personal\nEncuesta de clima escolar 5Essentials')]),

page('college-career', 'College & career readiness', 'Preparación universitaria y profesional',
  'Students can earn college credit, industry certifications and real work experience before they graduate.',
  'Los estudiantes pueden obtener créditos universitarios, certificaciones de la industria y experiencia laboral real antes de graduarse.',
  [S('Topics', 'Temas',
    'Career & technical education (CTE)\nDual and concurrent enrollment\nCollege credit and certifications through CTE\nWork-based learning and internships\nFuture Ready Hub\nIndustry partners\nScholarships and financial aid\nSchool counseling and individual career plans',
    'Educación técnica y profesional (CTE)\nInscripción doble y concurrente\nCréditos universitarios y certificaciones por CTE\nAprendizaje basado en el trabajo y pasantías\nFuture Ready Hub\nSocios de la industria\nBecas y ayuda financiera\nConsejería escolar y planes profesionales individuales'),
   A('Explore schools', 'Explorar escuelas', 'schools.html', 'Find high schools & academies', 'Buscar preparatorias y academias')]),

page('student-support', 'Student support services', 'Servicios de apoyo estudiantil',
  'Every student deserves the support to learn and thrive. Start with your school office, which can connect you with the right team.',
  'Todo estudiante merece el apoyo para aprender y prosperar. Comience con la oficina escolar, que puede conectarle con el equipo adecuado.',
  [S('Topics', 'Temas',
    'Special education\nGifted and talented\nMultilingual learners\nDyslexia support\nSchool nursing and health services\nCounseling and mental health resources\nAmerican Indian education\nMcKinney-Vento support for students in transition\nMilitary-connected families',
    'Educación especial\nDotados y talentosos\nEstudiantes multilingües\nApoyo para la dislexia\nEnfermería y servicios de salud escolar\nConsejería y recursos de salud mental\nEducación para indígenas americanos\nApoyo McKinney-Vento para estudiantes en transición\nFamilias vinculadas al ejército')]),

page('students', 'For students', 'Para estudiantes',
  'Quick links to the things students look for most during the school year.',
  'Accesos rápidos a lo que los estudiantes buscan con más frecuencia durante el año escolar.',
  [S('Topics', 'Temas',
    'Graduation requirements\nRecords and transcripts\nScholarships\nCollege and career planning\nCell phone policy\nStudent data privacy\nAthletics and activities\nClassroom learning in Schoology',
    'Requisitos de graduación\nExpedientes y certificados de estudios\nBecas\nPlanificación universitaria y profesional\nPolítica de teléfonos celulares\nPrivacidad de los datos estudiantiles\nAtletismo y actividades\nAprendizaje en clase en Schoology'),
   A('Learning tools', 'Herramientas de aprendizaje', 'page.html?id=schoology', 'Schoology & learning at home', 'Schoology y aprendizaje en casa')]),

page('athletics', 'Athletics & activities', 'Atletismo y actividades',
  'Sports, clubs and the arts give students a place to belong. Schedules, eligibility and registration are handled through each school.',
  'Los deportes, clubes y las artes dan a los estudiantes un lugar al que pertenecer. Los horarios, la elegibilidad y la inscripción se gestionan en cada escuela.',
  [S('Topics', 'Temas',
    'High school and middle school athletics\nVisual and performing arts\nClubs and activities\nGame schedules and venues\nAthletic eligibility and physicals',
    'Atletismo de preparatoria y secundaria\nArtes visuales y escénicas\nClubes y actividades\nCalendarios de partidos y sedes\nElegibilidad deportiva y exámenes físicos')]),

page('departments', 'Departments', 'Departamentos',
  'The district departments that keep schools running. On the new platform, each of the District’s roughly 50–60 department, program and initiative sites is built in: its own section, pages, editors and look, included in the flat rate at no extra cost.',
  'Los departamentos del distrito que mantienen las escuelas en funcionamiento. En la nueva plataforma, cada uno de los 50 a 60 sitios de departamentos, programas e iniciativas del distrito está incluido: su propia sección, páginas, editores y diseño, dentro de la tarifa fija sin costo adicional.',
  [S('Departments', 'Departamentos',
    'Superintendent’s office\nFinancial services\nTalent management and human resources\nEnrollment and choice\nFood and nutrition services\nTransportation\nCapital program and facilities\nInformation technology\nTitle I and federal programs\nGrants\nAssessment and education insights\nCommunications and engagement\nEqual opportunity',
    'Oficina del superintendente\nServicios financieros\nGestión de talento y recursos humanos\nInscripción y elección\nNutrición\nTransporte\nPrograma de capital e instalaciones\nTecnología de la información\nTítulo I y programas federales\nSubvenciones\nEvaluación y datos educativos\nComunicaciones y participación\nIgualdad de oportunidades'),
   A('Main line', 'Línea principal', 'page.html?id=about-d11', 'District office contacts', 'Contactos de la oficina del distrito')]),

page('new-families', 'New to District 11', 'Nuevo en el Distrito 11',
  'Moving to Colorado Springs or starting school for the first time? Here is where to begin.',
  '¿Se muda a Colorado Springs o comienza la escuela por primera vez? Aquí es donde empezar.',
  [S('Your first steps', 'Sus primeros pasos',
    '1. Find your school\n2. Gather enrollment documents\n3. Enroll online or with the enrollment team\n4. Set up MyPowerHub\n5. Check bus and meal information\n6. Mark the district calendar',
    '1. Encuentre su escuela\n2. Reúna los documentos de inscripción\n3. Inscríbase en línea o con el equipo de inscripción\n4. Configure MyPowerHub\n5. Revise el transporte y las comidas\n6. Consulte el calendario del distrito'),
   S('Also helpful', 'También útil', 'Back-to-school checklist\nSchool supply lists\nRelocation guide\nVolunteering', 'Lista para el regreso a clases\nListas de útiles\nGuía de reubicación\nVoluntariado'),
   A('Start here', 'Comience aquí', 'page.html?id=enrollment', 'Enrollment & school choice', 'Inscripción y elección de escuela')]),

page('safety-weather', 'Safety, delays & closures', 'Seguridad, retrasos y cierres',
  'When weather or an emergency changes the school day, the district posts it here, on every school homepage and through SchoolMessenger at the same time.',
  'Cuando el clima o una emergencia cambia la jornada escolar, el distrito lo publica aquí, en cada página escolar y por SchoolMessenger al mismo tiempo.',
  [S('Topics', 'Temas',
    'Inclement weather procedures\nDelay and closure announcements\nSchool safety and security\nReunification information for families',
    'Procedimientos por mal tiempo\nAnuncios de retrasos y cierres\nSeguridad escolar\nInformación de reunificación familiar'),
   S('Try it', 'Pruébelo', 'In the staff workspace demo, publish a districtwide alert and watch it appear on all 58 school sites at once.', 'En la demo del espacio del personal, publique un aviso para todo el distrito y véalo aparecer en los 58 sitios a la vez.'),
   A('Demo', 'Demo', 'staff.html#try', 'Publish a test alert', 'Publicar un aviso de prueba')]),

page('records', 'Records & transcripts', 'Expedientes y certificados',
  'Current and former students can request transcripts and records. Public records requests are handled separately.',
  'Los estudiantes actuales y anteriores pueden solicitar certificados y expedientes. Las solicitudes de registros públicos se gestionan por separado.',
  [S('Topics', 'Temas', 'Transcript requests\nStudent records\nRecords retention\nOpen records requests (CORA)', 'Solicitudes de certificados de estudios\nExpedientes estudiantiles\nConservación de registros\nSolicitudes de registros públicos (CORA)')]),

page('transparency', 'Transparency & accountability', 'Transparencia y rendición de cuentas',
  'How the district plans, spends and reports to the community.',
  'Cómo el distrito planifica, gasta e informa a la comunidad.',
  [S('Topics', 'Temas',
    'Budget and financial transparency\nBond planning\nMill levy override and oversight committee\nSchool capacity information\nDistrict Accountability Committee\nOrganizational charts\nAccessibility',
    'Presupuesto y transparencia financiera\nPlanificación de bonos\nImpuesto MLO y comité de supervisión\nInformación sobre capacidad escolar\nComité de Rendición de Cuentas del Distrito\nOrganigramas\nAccesibilidad'),
   A('Board', 'Junta', 'page.html?id=board', 'Board of Education', 'Junta de Educación')]),
];
