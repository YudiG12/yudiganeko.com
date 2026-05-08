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
    <div className="font-mono tracking-wide grid items-center min-h-screen xl:px-60 lg:px-30 md:px-10 px-10 pb-10">
      <main className="flex text-lg flex-col row-start-2">
        {/* Apresentação + Links */}
        <div className="flex min-h-screen text-lg flex-col row-start-2 items-center justify-center">
          <Image
            className="rounded-full object-cover mb-6"
            alt="Yudi Ganeko"
            src="/profile.png"
            width={120}
            height={120}
          />
          Oi! Eu sou o
          <h1 className="text-3xl sm:text-5xl mt-3 mb-5 text-center min-h-[2.5rem] sm:min-h-[3.5rem]">
            <NameAnimation />
          </h1>
          <p className="max-w-5xl text-base leading-7 text-center">
            <span className="text-yellow-600">Pessoas</span> são o propósito e{" "}
            <span className="text-yellow-600">paixão</span> é o combustível. ❤️‍🔥
          </p>
          <div className="mt-10 w-full max-w-2xl px-4">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 text-center">
              Projetos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://www.oquegastei.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 hover:border-yellow-600 dark:hover:border-yellow-600 transition-all duration-300 group"
              >
                <Image
                  className="dark:invert"
                  src="/link.svg"
                  alt="Link icon"
                  width={20}
                  height={20}
                />
                <span className="font-medium group-hover:text-yellow-500 transition-colors">
                  O Que Gastei
                </span>
              </a>
              <a
                href="https://www.salariodev.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 hover:border-green-500 dark:hover:border-green-500 transition-all duration-300 group"
              >
                <Image
                  className="dark:invert"
                  src="/link.svg"
                  alt="Link icon"
                  width={20}
                  height={20}
                />
                <span className="font-medium group-hover:text-green-500 transition-colors">
                  SalárioDev
                </span>
              </a>
            </div>
            <h2 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-8 mb-3 text-center">
              Redes sociais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="flex flex-col">
                <a
                  href="https://youtube.com/@yudiganeko"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 group"
                >
                  <Image
                    className="dark:invert"
                    src="/youtube.svg"
                    alt="Youtube icon"
                    width={20}
                    height={20}
                  />
                  <span className="font-medium group-hover:text-red-500 transition-colors">
                    YouTube
                  </span>
                </a>
                {youtubeSubscribers !== null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {formatCount(youtubeSubscribers)} inscritos
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <a
                  href="https://www.linkedin.com/in/lucas-yudi-ganeko-1ba3b3178"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 group"
                >
                  <Image
                    className="dark:invert"
                    src="/linkedin.svg"
                    alt="LinkedIn icon"
                    width={20}
                    height={20}
                  />
                  <span className="font-medium group-hover:text-blue-500 transition-colors">
                    LinkedIn
                  </span>
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  +12 mil seguidores
                </span>
              </div>
              <div className="flex flex-col">
                <a
                  href="https://instagram.com/ganekoyudi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-300 group"
                >
                  <Image
                    className="dark:invert"
                    src="/instagram.svg"
                    alt="Instagram icon"
                    width={20}
                    height={20}
                  />
                  <span className="font-medium group-hover:text-pink-500 transition-colors">
                    Instagram
                  </span>
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  +40 mil seguidores
                </span>
              </div>
            </div>
          </div>
          <div className="mt-12 animate-bounce">
            <svg
              className="w-6 h-6 text-gray-400 dark:text-gray-500"
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
