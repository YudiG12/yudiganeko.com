import Image from "next/image";
import ExperienceList from "./experiences";
import NameAnimation from "./name-animation";

async function getYoutubeSubscribers(): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=@yudiganeko&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const count = data?.items?.[0]?.statistics?.subscriberCount;
    return count ? Number(count) : null;
  } catch {
    return null;
  }
}

function formatCount(n: number): string {
  const truncated = Math.floor(n / 10) * 10;
  if (truncated >= 1_000) {
    return `+${(truncated / 1_000).toString().replace(".", ",")} mil`;
  }
  return `+${truncated}`;
}

export default async function Home() {
  const youtubeSubscribers = await getYoutubeSubscribers();

  return (
    <div className="font-mono tracking-wide grid items-center min-h-screen xl:px-60 lg:px-30 md:px-10 px-4 pb-10">
      <main className="flex text-lg flex-col row-start-2">
        {/* Apresentação + Links */}
        <div className="flex min-h-screen text-lg flex-col row-start-2 items-center justify-center">
          <div className="flex items-center gap-3 sm:gap-5">
            <Image
              className="rounded-full object-cover shrink-0 w-14 h-14 sm:w-20 sm:h-20"
              alt="Yudi Ganeko"
              src="/profile.png"
              width={80}
              height={80}
            />
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <span className="text-xs sm:text-sm">Oi! Eu sou o</span>
              <h1 className="text-lg sm:text-3xl min-h-[1.5rem] sm:min-h-[2.5rem] whitespace-nowrap">
                <NameAnimation />
              </h1>
            </div>
          </div>
          <div className="mt-8 sm:mt-16 w-full max-w-3xl px-0 sm:px-4 flex flex-col gap-6 sm:gap-10">
            <p className="text-sm sm:text-base text-center leading-7 sm:leading-8">
              Já trabalhei pro{" "}
              <span className="text-red-600 dark:text-red-500 whitespace-nowrap">
                <Image
                  src="/ifood.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="inline-block align-text-bottom mr-1"
                />
                iFood
              </span>
              ,{" "}
              <span className="text-green-700 dark:text-green-500 whitespace-nowrap">
                <Image
                  src="/boticario.jpeg"
                  alt=""
                  width={18}
                  height={18}
                  className="inline-block align-middle mr-1 -mt-0.5 rounded"
                />
                Boticário
              </span>
              ,{" "}
              <span className="text-amber-500 dark:text-amber-400 whitespace-nowrap">
                <svg
                  viewBox="0 0 32 32"
                  width={22}
                  height={22}
                  className="inline-block align-middle mr-1 -mt-0.5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <text
                    x="16"
                    y="23"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                    fontSize="20"
                    fontWeight="900"
                  >
                    C6
                  </text>
                </svg>
                C6 Bank
              </span>{" "}
              e{" "}
              <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">
                <Image
                  src="/revolut.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="inline-block align-middle mr-1 -mt-0.5 dark:invert"
                />
                Revolut 🇪🇺
              </span>
              .
            </p>
            <p className="text-sm sm:text-base text-center">
              Hoje, crio sites e apps:
            </p>
            <div className="flex items-start justify-center gap-2 sm:gap-6">
              <a
                href="https://www.oquegastei.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-yellow-600 dark:group-hover:border-yellow-600 transition-all duration-300">
                  <Image
                    src="/oquegastei.svg"
                    alt="O Que Gastei"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 transition-colors text-center">
                  O Que Gastei
                </span>
              </a>
              <a
                href="https://www.salariodev.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-green-500 dark:group-hover:border-green-500 transition-all duration-300">
                  <Image
                    src="/salariodev.svg"
                    alt="SalárioDev"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-green-500 transition-colors text-center">
                  SalárioDev
                </span>
              </a>
              <a
                href="https://www.generatethumb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-purple-500 dark:group-hover:border-purple-500 transition-all duration-300">
                  <Image
                    src="/generatethumb.svg"
                    alt="Generate Thumb"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-purple-500 transition-colors text-center">
                  Generate Thumb
                </span>
              </a>
            </div>
            <p className="text-sm sm:text-base text-center">
              E crio conteúdo sobre minha história:
            </p>
            <div className="flex items-start justify-center gap-2 sm:gap-6">
              <a
                href="https://youtube.com/@yudiganeko"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-red-500 dark:group-hover:border-red-500 transition-all duration-300">
                  <Image
                    src="/youtube.svg"
                    alt="YouTube"
                    width={28}
                    height={28}
                  />
                </span>
                {youtubeSubscribers !== null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {formatCount(youtubeSubscribers)} inscritos
                  </span>
                )}
              </a>
              <a
                href="https://www.linkedin.com/in/lucas-yudi-ganeko-1ba3b3178"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-all duration-300">
                  <Image
                    src="/linkedin.svg"
                    alt="LinkedIn"
                    width={28}
                    height={28}
                  />
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +12 mil seguidores
                </span>
              </a>
              <a
                href="https://instagram.com/ganekoyudi"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="flex flex-col items-center gap-2 sm:gap-3 w-16 sm:w-24 group"
              >
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700/70 group-hover:border-violet-500 dark:group-hover:border-violet-500 transition-all duration-300">
                  <Image
                    src="/instagram.svg"
                    alt="Instagram"
                    width={28}
                    height={28}
                  />
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +40 mil seguidores
                </span>
              </a>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 animate-bounce">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-left font-bold text-2xl">Sobre mim:</h1>
        <div className="flex flex-col sm:flex-row mb-10 items-center sm:items-start">
          <p className="my-10 leading-7 sm:mr-15 text-base text-left">
            Tenho 7 anos de experiência profissional como{" "}
            <span className="text-yellow-600"> Engenheiro de Software</span>
            , trabalhando para empresas multibilionárias e pro exterior.
            <br />
            <br />
            Sou <span className="text-yellow-600">otimista</span> e busco viver
            a vida aproveitando a jornada.
            <br />
            <br />
            Nascido e crescido em São Paulo, sou descendente de
            <span className="text-yellow-600"> Okinawa, Japão</span>
            🇯🇵.
            <br />
            <br />
            Estou numa jornada de criar meus
            <span className="text-yellow-600"> próprios produtos </span>
            na internet. 🚀
          </p>
          <Image
            className="rounded-lg object-cover"
            alt="Yudi Ganeko"
            src="/yudi.png"
            width={300}
            height={200}
          />
        </div>
        <h1 className="text-left mb-10 font-bold text-2xl">
          Minha experiência:
        </h1>
        <ExperienceList />
        <footer className="text-center text-sm text-gray-500 mt-20">
          Criado por Yudi Ganeko usando NextJs e TailwindCSS.
          <br /> © Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
