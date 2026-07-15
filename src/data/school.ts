import logo from "@/assets/7.jpg.asset.json";
import img1 from "@/assets/1.jpg.asset.json";
import img2 from "@/assets/2.jpg.asset.json";
import img3 from "@/assets/3.jpg.asset.json";
import img4 from "@/assets/4.jpg.asset.json";
import img5 from "@/assets/5.jpg.asset.json";
import img6 from "@/assets/6.jpg.asset.json";
import video1 from "@/assets/1.mp4.asset.json";

export const school = {
  name: "Escuela de Educación Secundaria N.º 6",
  shortName: "EES N.º 6",
  city: "Lobos, Buenos Aires",
  address: "San Martín N.º 57",
  foundedYear: 1980,
  phone: "(02227) 42-0000",
  email: "contacto@eesn6lobos.edu.ar",
  instagram: "https://instagram.com/secundaria6lobos",
  instagramHandle: "@secundaria6lobos",
  hours: {
    morning: "07:30 a 12:30 hs",
    afternoon: "13:00 a 18:00 hs",
  },
  mapEmbed:
    "https://www.google.com/maps?q=San+Martin+57,+Lobos,+Buenos+Aires,+Argentina&output=embed",
  logo: logo.url,
};

export const heroBackground = img4.url;

export const history = {
  title: "Nuestra Historia",
  body: `La Escuela de Educación Secundaria N.º 6 fue inaugurada en 1980 y forma parte activa de la comunidad educativa de Lobos. Desde entonces promueve la formación académica, el compromiso, el respeto, la inclusión y el desarrollo integral de sus estudiantes, acompañándolos en su tránsito hacia la vida adulta y ciudadana.`,
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

export type GalleryItem = {
  url: string;
  category: string;
  title: string;
  description: string;
};

export const gallery: GalleryItem[] = [
  {
    url: img1.url,
    category: "Actos",
    title: "9 de Julio — Día de la Independencia",
    description:
      "Estudiantes abanderados y escoltas participaron del acto por el Día de la Independencia representando a la institución.",
  },
  {
    url: img3.url,
    category: "Actos",
    title: "18 de Mayo — Día de la Escarapela",
    description:
      "Conmemoración del Día de la Escarapela Nacional, símbolo patrio creado en 1812.",
  },
  {
    url: img4.url,
    category: "Aniversarios",
    title: "224° Aniversario de Lobos",
    description:
      "Los estudiantes participaron de los festejos por un nuevo aniversario de la fundación de nuestra querida ciudad.",
  },
  {
    url: img6.url,
    category: "Salidas Educativas",
    title: "Encuentro con Veteranos de Malvinas",
    description:
      "5to 1ra visitó a los Veteranos de Malvinas de Lobos en el marco de la materia Comunicación, Cultura y Sociedad.",
  },
  {
    url: img2.url,
    category: "Proyectos",
    title: "Cuidados en Invierno",
    description:
      "Campaña institucional con recomendaciones para cuidarnos durante los meses fríos.",
  },
  {
    url: img5.url,
    category: "Comunicados",
    title: "Período de Intensificación",
    description:
      "Información para las familias sobre el período de intensificación de aprendizajes.",
  },
];

export const news = [
  {
    image: img1.url,
    date: "9 de Julio, 2026",
    title: "Acto por el Día de la Independencia",
    excerpt:
      "La comunidad educativa celebró un nuevo aniversario de la Declaración de la Independencia con un emotivo acto.",
  },
  {
    image: img6.url,
    date: "Junio, 2026",
    title: "Entrevista a Veteranos de Malvinas",
    excerpt:
      "Estudiantes de 5to 1ra compartieron un encuentro con veteranos de nuestra ciudad, cargado de historias, valores y emoción.",
  },
  {
    image: img4.url,
    date: "2 de Junio, 2026",
    title: "224° Aniversario de Lobos",
    excerpt:
      "Participamos de los festejos por un nuevo aniversario de la fundación de nuestra ciudad, honrando nuestra historia.",
  },
  {
    image: img5.url,
    date: "Junio, 2026",
    title: "Período de Intensificación",
    excerpt:
      "Del 6/7 al 17/7 se lleva a cabo el período de intensificación. Es muy importante la asistencia.",
  },
  {
    image: img2.url,
    date: "22 de Junio, 2026",
    title: "Comenzó el Invierno",
    excerpt:
      "Recomendaciones para cuidarnos con la llegada de las bajas temperaturas.",
  },
  {
    image: img3.url,
    date: "18 de Mayo, 2026",
    title: "Día de la Escarapela",
    excerpt:
      "Conmemoramos la creación de la escarapela nacional, uno de los primeros símbolos patrios del país.",
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
  { url: video1.url, title: "Video institucional EES N.º 6" },
];

export type ChatOption = {
  id: string;
  question: string;
  answer: string;
};

export const chatbot: { greeting: string; options: ChatOption[] } = {
  greeting:
    "¡Hola! Soy Lobi 🐺, el asistente de la EES N.º 6. ¿En qué puedo ayudarte hoy? Elegí una opción 👇",
  options: [
    {
      id: "ubicacion",
      question: "¿Dónde está ubicada la escuela?",
      answer:
        "📍 La escuela está ubicada en San Martín N.º 57, en la ciudad de Lobos, Provincia de Buenos Aires.",
    },
    {
      id: "ciudad",
      question: "¿En qué ciudad se encuentra?",
      answer:
        "🏙️ La EES N.º 6 se encuentra en la ciudad de Lobos, Provincia de Buenos Aires, Argentina.",
    },
    {
      id: "direccion",
      question: "¿Cuál es la dirección de la escuela?",
      answer:
        "🏫 La dirección es San Martín N.º 57, Lobos, Buenos Aires.",
    },
    {
      id: "fundacion",
      question: "¿Cuándo fue fundada / inaugurada?",
      answer:
        "🎉 La Escuela de Educación Secundaria N.º 6 fue inaugurada en el año 1980.",
    },
    {
      id: "horarios",
      question: "¿Cuáles son los horarios de ingreso y salida?",
      answer:
        "🕗 Turno mañana: 07:30 a 12:30 hs. Turno tarde: 13:00 a 18:00 hs.",
    },
    {
      id: "contacto",
      question: "¿Cómo me comunico con la escuela?",
      answer:
        "📞 Podés acercarte a San Martín N.º 57, escribirnos a contacto@eesn6lobos.edu.ar o seguirnos en Instagram @secundaria6lobos.",
    },
    {
      id: "actividades",
      question: "¿Qué actividades realiza la institución?",
      answer:
        "🎓 Realizamos actos patrios, salidas educativas, proyectos institucionales, encuentros con la comunidad, jornadas de convivencia y actividades culturales durante todo el año.",
    },
    {
      id: "faq",
      question: "Preguntas frecuentes",
      answer:
        "💬 Podés consultar nuestras redes o comunicarte directamente con la escuela para inscripciones, documentación y trámites académicos.",
    },
  ],
};