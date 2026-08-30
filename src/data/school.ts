import logo from "@/assets/logo.png";
import img1 from "@/assets/1.jpg";
import img4 from "@/assets/4.jpg";
import img6 from "@/assets/6.jpg";
import ss2 from "@/assets/ss-2.jpg";
import post1 from "@/assets/post1.jpg";
import post2 from "@/assets/post2.jpg";
import post3 from "@/assets/post3.jpg";
import post4 from "@/assets/post4.jpg";
import post5 from "@/assets/post5.jpg";
import post6 from "@/assets/post6.jpg";
import aa from "@/assets/aa-2.jpg";
import aa3 from "@/assets/aa-3.jpg";
import ss from "@/assets/ss.jpg";
import g from "@/assets/g.jpg";
import video1 from "@/assets/1.mp4";

export const school = {
  name: "Escuela de Educación Secundaria N.º 6",
  shortName: "EES N.º 6",
  city: "Lobos, Buenos Aires",
  address: "San Martín N.º 57",
  foundedYear: 2006,
  foundedDate: "26 de mayo de 2006",
  buildingNote:
    "Actualmente funciona en San Martín 57, en un edificio alquilado a la Curia.",
  phone: "(02227) 42-0000",
  email: "secundaria6lobos@abc.gob.ar",
  instagram: "https://instagram.com/secundaria6lobos",
  instagramHandle: "@secundaria6lobos",
  facebook: "https://www.facebook.com/share/1HS1fYYA6g/",
  facebookHandle: "EES N.º 6 Lobos",
  // Horarios oficiales — editables
  hours: {
    entryGeneral: "13:14 hs (todos los cursos)",
    entryException: "6.º año: miércoles y viernes ingresa a las 12:10 hs",
    exitGeneral: "17:30 hs (todos los cursos)",
    exitExceptions: [
      "6.º año: los martes sale a las 18:30 hs",
      "5.º año: tiene extensión horaria la mayoría de los días",
    ],
  },
  logo: logo,
};

export const heroBackground = img4;

export type TimelineItem = {
  date: string;
  title: string;
  description: string;
};

export const history = {
  eyebrow: "Nuestra Escuela",
  title: "Historia, misión y valores",
  intro:
    "La Escuela de Educación Secundaria N.º 6 fue creada el 26 de mayo de 2006, fecha en la que se desvinculó formalmente de la E.E.S. N.º 1, de la cual funcionaba como Anexo. El 11 de noviembre de 2014 quedó conformada con su estructura institucional actual. Hoy funciona en San Martín 57, en un edificio alquilado a la Curia, acompañando a cada estudiante en su crecimiento académico y personal junto a la comunidad de Lobos.",
  timeline: [
    {
      date: "26/05/2006",
      title: "Creación de la institución",
      description:
        "Se crea la institución al desvincularse formalmente de la E.E.S. N.º 1, de la cual funcionaba como Anexo.",
    },
    {
      date: "11/11/2014",
      title: "Conformación institucional actual",
      description:
        "La institución queda conformada con su estructura institucional actual como Escuela de Educación Secundaria N.º 6.",
    },
    {
      date: "Actualidad",
      title: "Edificio de San Martín 57",
      description:
        "Funciona en San Martín 57, Lobos, en un edificio alquilado a la Curia, consolidando su espacio dentro de la comunidad educativa.",
    },
  ] as TimelineItem[],
  closing:
    "Agradecemos profundamente a todo el personal, estudiantes y familias que han sido y continúan siendo parte fundamental de esta historia, crecimiento y compromiso con la educación.",
  mission:
    "Brindar una educación pública, gratuita y de calidad que forme ciudadanos críticos, solidarios y comprometidos con su comunidad.",
  vision:
    "Ser una institución de referencia en Lobos, reconocida por la excelencia académica, la calidez humana y la construcción de proyectos con y para la comunidad.",
  values: [
    { title: "Compromiso", desc: "Con el aprendizaje y con la comunidad." },
    { title: "Respeto", desc: "Por la diversidad y la convivencia democrática." },
    { title: "Inclusión", desc: "Escuela abierta y para todos y todas." },
    { title: "Identidad", desc: "Orgullo por Lobos, su historia y su gente." },
  ],
};

export const anniversary = {
  eyebrow: "20.º Aniversario",
  title: "20 años de historia, crecimiento y compromiso",
  text:
    "Cada 26 de mayo la institución conmemora su aniversario, recordando su creación el 26 de mayo de 2006 y compartiendo su recorrido histórico junto a toda la comunidad educativa. Agradecemos a quienes fueron y son parte de estos años de dedicación, aprendizaje y valores.",
};

export type GalleryItem = {
  url: string;
  category: string;
  title: string;
  description: string;
};

// Publicaciones de Instagram (imagen limpia + título + descripción)
export const gallery: GalleryItem[] = [
  {
    url: post1,
    category: "Actos",
    title: "9 de Julio — Día de la Independencia",
    description:
      "¡Feliz Día de la Independencia! Estudiantes abanderados y escoltas representaron a la institución en el acto por una nueva conmemoración patria.",
  },
  {
    url: g,
    category: "Actos",
    title: "18 de Mayo — Día de la Escarapela",
    description:
      "Conmemoramos la creación de la escarapela nacional, uno de los primeros símbolos patrios de nuestro país.",
  },
  {
    url: ss,
    category: "Aniversarios",
    title: "224° Aniversario de Lobos",
    description:
      "Los estudiantes participaron de los festejos por un nuevo aniversario de la fundación de nuestra querida ciudad.",
  },
  {
    url: aa,
    category: "Salidas Educativas",
    title: "Encuentro con Veteranos de Malvinas",
    description:
      "5.º 1.ª visitó a los Veteranos de Malvinas de Lobos en el marco de la materia Comunicación, Cultura y Sociedad.",
  },
  {
    url: post2,
    category: "Proyectos",
    title: "Cuidados en Invierno",
    description:
      "Recomendaciones para cuidarnos con la llegada de las bajas temperaturas y disfrutar mejor de la estación.",
  },
  {
    url: post5,
    category: "Comunicados",
    title: "Período de Intensificación",
    description:
      "Del 6/7 al 17/7 se lleva a cabo el período de intensificación de aprendizajes. Es muy importante la asistencia.",
  },
];

export const news = [
  {
    image: img1,
    date: "9 de Julio, 2026",
    title: "Acto por el Día de la Independencia",
    excerpt:
      "La comunidad educativa celebró un nuevo aniversario de la Declaración de la Independencia con un emotivo acto.",
  },
  {
    image: aa3,
    date: "Junio, 2026",
    title: "Entrevista a Veteranos de Malvinas",
    excerpt:
      "Estudiantes de 5.º 1.ª compartieron un encuentro con veteranos de nuestra ciudad, cargado de historias, valores y emoción.",
  },
  {
    image: ss2,
    date: "2 de Junio, 2026",
    title: "224° Aniversario de Lobos",
    excerpt:
      "Participamos de los festejos por un nuevo aniversario de la fundación de nuestra ciudad, honrando nuestra historia.",
  },
];

export const events = [
  { date: "25/05", title: "Día de la Revolución de Mayo", type: "Fecha patria" },
  { date: "20/06", title: "Día de la Bandera", type: "Fecha patria" },
  { date: "06/07 - 17/07", title: "Período de Intensificación", type: "Académico" },
  { date: "09/07", title: "Día de la Independencia", type: "Fecha patria" },
  { date: "17/08", title: "Paso a la Inmortalidad del Gral. San Martín", type: "Fecha patria" },
  { date: "11/09", title: "Día del Maestro", type: "Institucional" },
  { date: "12/10", title: "Día del Respeto a la Diversidad Cultural", type: "Fecha patria" },
  { date: "20/11", title: "Día de la Soberanía Nacional", type: "Fecha patria" },
];

export const videos = [
  { url: video1, title: "Video institucional EES N.º 6" },
];

export type ChatOption = {
  id: string;
  icon: string;
  question: string;
  answer: string;
};

// Chat institucional — Preguntas frecuentes (editable)
export const chatbot: { title: string; subtitle: string; options: ChatOption[] } = {
  title: "Preguntas frecuentes",
  subtitle: "Elegí una consulta para ver la respuesta",
  options: [
    {
      id: "ubicacion",
      icon: "📍",
      question: "¿Dónde está ubicada la escuela?",
      answer:
        "La escuela está ubicada en San Martín N.º 57, en la ciudad de Lobos, Provincia de Buenos Aires.",
    },
    {
      id: "horarios",
      icon: "🕒",
      question: "Horarios de ingreso y salida",
      answer:
        "Ingreso general: 13:14 hs para todos los cursos. Excepción: 6.º año ingresa los miércoles y viernes a las 12:10 hs.\n\nSalida general: 17:30 hs para todos los cursos. Excepciones: 6.º año sale los martes a las 18:30 hs. 5.º año tiene extensión horaria la mayoría de los días.",
    },
    {
      id: "fundacion",
      icon: "🏫",
      question: "¿Cuándo fue inaugurada?",
      answer:
        "La institución fue creada el 26 de mayo de 2006, fecha en la que se desvinculó formalmente de la E.E.S. N.º 1, de la cual funcionaba como Anexo. El 11 de noviembre de 2014 quedó conformada con su estructura institucional actual.",
    },
    {
      id: "contacto",
      icon: "📞",
      question: "Información de contacto",
      answer:
        "Podés acercarte a San Martín N.º 57, Lobos. Teléfono: (02227) 42-0000. Correo: secundaria6lobos@abc.gob.ar. Instagram: @secundaria6lobos.",
    },
    {
      id: "otras",
      icon: "❓",
      question: "Otras consultas frecuentes",
      answer:
        "Para consultas sobre inscripciones, documentación o trámites académicos, comunicate directamente con la escuela en el horario de atención o seguinos en Instagram @secundaria6lobos para novedades.",
    },
  ],
};
