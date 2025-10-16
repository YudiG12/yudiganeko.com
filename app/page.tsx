import Image from "next/image";
import ExperienceList from "./experiences";
import NameAnimation from "./name-animation";

export default function Home() {
  return (
    <div className="font-mono tracking-wide grid items-center min-h-screen xl:px-60 lg:px-30 md:px-10 px-10 pb-10">
      <nav className="w-full py-4 flex gap-[24px] flex-wrap items-center justify-center fixed top-0 left-0 bg-background z-50">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://youtube.com/@yudiganeko"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="dark:invert sm:w-4 sm:h-4"
            aria-hidden
            src="/youtube.svg"
            alt="Youtube icon"
            width={20}
            height={20}
          />
          <span className="hidden sm:block">Youtube</span>
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://instagram.com/ganekoyudi"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="dark:invert sm:w-4 sm:h-4"
            aria-hidden
            src="/instagram.svg"
            alt="Instagram icon"
            width={20}
            height={20}
          />
          <span className="hidden sm:block">Instagram</span>
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.linkedin.com/in/lucas-yudi-ganeko-1ba3b3178"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="dark:invert sm:w-4 sm:h-4"
            aria-hidden
            src="/linkedin.svg"
            alt="Linkedin icon"
            width={20}
            height={20}
          />
          <span className="hidden sm:block">Linkedin</span>
        </a>
      </nav>

      <main className="flex text-lg flex-col row-start-2">
        <div className="flex min-h-screen text-lg flex-col row-start-2 items-center justify-center">
          Oi! Eu sou o
          <h1 className="text-5xl mt-3 mb-5 text-center">
            <NameAnimation />
          </h1>
          <p className="max-w-5xl text-base leading-7 text-center">
            Um Engenheiro de Software ajudando pessoas na internet.
            <br />
            <span className="text-yellow-600">Pessoas</span> são o propósito e{" "}
            <span className="text-yellow-600">paixão</span> é o combustível. ❤️‍🔥
          </p>
          <div className="flex mt-15 gap-4 items-center flex-col sm:flex-row">
            <a
              className="rounded-md border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="mailto:contato@yudiganeko.com"
            >
              <Image alt="Mail icon" src="/mail.svg" width={25} height={25} />
              Me envie um e-mail!
            </a>
          </div>
        </div>
        <h1 className="text-left font-bold text-2xl">Sobre mim:</h1>
        <div className="flex flex-col sm:flex-row mb-10 items-center sm:items-start">
          <p className="my-10 leading-7 sm:mr-15 text-base text-left">
            Tenho 7 anos de experiência como{" "}
            <span className="text-yellow-600"> Engenheiro de Software</span>
            , trabalhando para empresas multibilionárias.
            <br />
            <br />
            Sou <span className="text-yellow-600">otimista</span> e busco viver
            a vida aproveitando a jornada.
            <br />
            <br />
            Nascido e crescido em São Paulo, sou descendente de Okinawa, Japão
            🇯🇵.
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
