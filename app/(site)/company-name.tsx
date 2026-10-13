import Image from "next/image";

export type Company = "iFood" | "Boticário" | "C6 Bank" | "Revolut";

// Logo + cor de cada empresa. Os ícones são dimensionados em `em`,
// então acompanham o tamanho da fonte de onde forem usados.
export default function CompanyName({ company, label }: { company: Company; label?: string }) {
  const text = label ?? company;

  switch (company) {
    case "iFood":
      return (
        <span className="text-red-600 dark:text-red-500 whitespace-nowrap">
          <Image
            src="/ifood.svg"
            alt=""
            width={18}
            height={18}
            className="inline-block align-text-bottom mr-[0.25em] h-[1.15em] w-[1.15em]"
          />
          {text}
        </span>
      );
    case "Boticário":
      return (
        <span className="text-green-700 dark:text-green-500 whitespace-nowrap">
          <Image
            src="/boticario.jpeg"
            alt=""
            width={18}
            height={18}
            className="inline-block align-middle mr-[0.25em] -mt-[0.15em] rounded h-[1.15em] w-[1.15em]"
          />
          {text}
        </span>
      );
    case "C6 Bank":
      return (
        <span className="text-truffle-trouble dark:text-burning-flame whitespace-nowrap">
          <svg
            viewBox="0 0 32 32"
            width={22}
            height={22}
            className="inline-block align-middle mr-[0.25em] -mt-[0.15em] h-[1.4em] w-[1.4em]"
            fill="currentColor"
            aria-hidden="true"
          >
            <text x="16" y="23" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="900">
              C6
            </text>
          </svg>
          {text}
        </span>
      );
    case "Revolut":
      return (
        <span className="text-gray-900 dark:text-gray-100 whitespace-nowrap">
          <Image
            src="/revolut.svg"
            alt=""
            width={14}
            height={14}
            className="inline-block align-middle mr-[0.25em] -mt-[0.15em] dark:invert h-[0.9em] w-[0.9em]"
          />
          {text} 🇪🇺
        </span>
      );
  }
}
