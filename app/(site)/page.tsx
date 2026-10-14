import Image from "next/image";
import CompanyName from "./company-name";
import ExperienceList from "./experiences";
import NameAnimation from "./name-animation";
import RoadmapEmbed from "./roadmap-embed";
import TiltImage from "./tilt-image";

// Em dev aponta pro roadmap rodando local (`next dev -p 3001` no repo ganeko-roadmap).
const ROADMAP_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://ganeko-roadmap.vercel.app";

const studyResources = [
  {
    name: "CODERS",
    href: "https://radar.coders.com.br/l/m7hrnk",
    logo: "/partners/coders.png",
    description: "Pra conquistar meu próximo emprego em dólar.",
  },
  {
    name: "curso.dev",
    href: "https://hotm.io/deschamps",
    logo: "/partners/curso-dev.png",
    description: "Onde estou estudando programação.",
  },
];

export default function Home() {
  return (
    <div className="font-mono tracking-wide grid items-center min-h-screen xl:px-60 lg:px-30 md:px-10 px-4 pb-10">
      <main className="flex text-lg flex-col row-start-2 min-w-0">
        {/* Apresentação + Links */}
        <div className="flex min-h-screen text-lg flex-col lg:flex-row row-start-2 items-center justify-center gap-8 lg:gap-14 xl:-mx-32 pt-16 sm:pt-20 lg:pt-0">
          <div className="flex shrink-0 flex-row sm:flex-col items-center gap-4 sm:gap-6">
            <TiltImage
              className="rounded-2xl sm:rounded-3xl object-cover w-24 sm:w-80 lg:w-72 xl:w-80 aspect-[4/5] shadow-md sm:shadow-xl"
              alt="Yudi Ganeko"
              src="/hero-portrait.jpg"
              width={880}
              height={1100}
              sizes="(max-width: 640px) 96px, 320px"
              priority
            />
            <div className="flex flex-col items-start sm:items-center gap-0.5 sm:gap-1 text-left sm:text-center">
              <span className="text-xs sm:text-sm">Oi! Eu sou o</span>
              <h1 className="text-xl sm:text-3xl min-h-[1.75rem] sm:min-h-[2.5rem] whitespace-nowrap">
                <NameAnimation />
              </h1>
              <span className="text-xs sm:text-sm text-blue-fantastic/70 dark:text-palladian/70">
                dev há 8 anos 👨‍💻
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center w-full max-w-3xl min-w-0">
            <div className="w-full px-0 sm:px-4 flex flex-col gap-6 sm:gap-10">
              <div className="flex flex-col gap-1 sm:gap-2">
                <p className="text-sm sm:text-base xl:text-[15px] xl:whitespace-nowrap text-center leading-7 sm:leading-8">
                  Já trabalhei pro{" "}
                  <CompanyName company="iFood" />,{" "}
                  <CompanyName company="Boticário" />,{" "}
                  <CompanyName company="C6 Bank" /> e{" "}
                  <CompanyName company="Revolut" />
                  .
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col">
                  <p className="text-sm sm:text-base text-center leading-7 sm:leading-8">
                    Hoje, estou em busca do{" "}
                    <strong className="font-semibold text-truffle-trouble">
                      meu próximo emprego <span className="whitespace-nowrap">em dólar 💵</span>
                    </strong>
                    ,
                  </p>
                  <p className="text-sm sm:text-base text-center leading-7 sm:leading-8">
                    documentando essa jornada no:
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/watch?v=E8pAURoUcIE&t=654s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full max-w-md"
                >
                  <span className="relative block aspect-video overflow-hidden rounded-2xl shadow-lg ring-1 ring-oatmeal/60">
                    <Image
                      src="/youtube-thumb-3.jpg"
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 448px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-3 pt-10 text-left text-sm sm:text-base font-medium leading-snug text-white">
                      ESTOU VOLTANDO pra CLT (deu tudo errado?)
                    </span>
                    <span className="absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm sm:text-base font-semibold text-blue-fantastic shadow-md backdrop-blur-sm">
                      <Image src="/youtube.svg" alt="" width={24} height={24} />
                      YouTube
                    </span>
                  </span>
                </a>
                <p className="text-center text-xs sm:text-sm text-blue-fantastic/70">
                  E também no{" "}
                  <a
                    href="https://instagram.com/ganekoyudi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 align-middle font-medium text-truffle-trouble underline underline-offset-4 decoration-truffle-trouble/40 hover:decoration-truffle-trouble transition-colors"
                  >
                    <Image src="/instagram.svg" alt="" width={16} height={16} />
                    Instagram
                  </a>{" "}
                  e{" "}
                  <a
                    href="https://www.linkedin.com/in/lucas-yudi-ganeko-1ba3b3178"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 align-middle font-medium text-truffle-trouble underline underline-offset-4 decoration-truffle-trouble/40 hover:decoration-truffle-trouble transition-colors"
                  >
                    <Image src="/linkedin.svg" alt="" width={16} height={16} />
                    LinkedIn
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <section id="roadmap" className="mt-16 lg:mt-0 mb-20 scroll-mt-10 text-center">
          <h2 className="font-bold text-2xl text-blue-fantastic">Meu roadmap de estudos</h2>
          <p className="mt-2 mb-8 text-sm sm:text-base text-blue-fantastic/70">
            Tudo o que estou estudando pra entrevistas de backend com Java.
          </p>
          <RoadmapEmbed baseUrl={ROADMAP_URL} />
        </section>
        <section id="como-estudo" className="mb-20 scroll-mt-10 text-center">
          <h2 className="font-bold text-2xl text-blue-fantastic">Como estou estudando</h2>
          <p className="mt-2 mb-8 text-sm sm:text-base text-blue-fantastic/70">
            O que estou usando pra me realocar no mercado.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 text-left">
            {studyResources.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-2 rounded-2xl bg-white p-5 ring-1 ring-oatmeal/60 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-oatmeal"
                >
                  <Image
                    src={r.logo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg ring-1 ring-oatmeal/60"
                  />
                  <span className="text-base font-semibold text-blue-fantastic group-hover:text-truffle-trouble transition-colors">
                    {r.name} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                  <span className="text-sm leading-6 text-blue-fantastic/70">{r.description}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs sm:text-sm leading-6 text-blue-fantastic/60">
            Sou cliente de <strong className="font-semibold">todos</strong>: paguei,
            consumi e gostei, antes mesmo de ter meu canal. Sinceramente, na minha opinião, são os melhores em cada um
            dos seus nichos.
          </p>
        </section>
        <h1 className="text-left font-bold text-2xl text-blue-fantastic dark:text-palladian">Sobre mim:</h1>
        <div className="flex flex-col sm:flex-row mb-10 items-center sm:items-start">
          <p className="my-10 leading-7 sm:mr-15 text-base text-left">
            Tenho 8 anos de experiência profissional como{" "}
            <span className="text-truffle-trouble dark:text-burning-flame font-medium"> Engenheiro de Software</span>
            , trabalhando para empresas multibilionárias e pro exterior.
            <br />
            <br />
            Sou <span className="text-truffle-trouble dark:text-burning-flame font-medium">otimista</span> e busco viver
            a vida aproveitando a jornada.
            <br />
            <br />
            Nascido e crescido em São Paulo, sou descendente de
            <span className="text-truffle-trouble dark:text-burning-flame font-medium"> Okinawa, Japão</span>
            🇯🇵.
          </p>
          <TiltImage
            className="rounded-lg object-cover"
            alt="Yudi Ganeko"
            src="/yudi.png"
            width={300}
            height={200}
          />
        </div>
        <h1 id="experiencia" className="text-left mb-10 font-bold text-2xl text-blue-fantastic dark:text-palladian scroll-mt-10">
          Minha experiência:
        </h1>
        <ExperienceList />
        <footer className="text-center text-sm text-blue-fantastic/50 dark:text-palladian/50 mt-20">
          Criado por Yudi Ganeko usando NextJs e TailwindCSS.
          <br /> © Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
