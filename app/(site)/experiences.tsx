import CompanyName, { type Company } from "./company-name";
import PhotoGallery, { type Photo } from "./photo-gallery";

const c6Photos = [
  { src: "/experiences/c6.jpg", width: 1400, height: 1040 },
  { src: "/experiences/c6-3.jpg", width: 787, height: 1400 },
  { src: "/experiences/c6-4.jpg", width: 1050, height: 1400 },
  { src: "/experiences/c6-5.jpg", width: 787, height: 1400 },
];

type Experience = {
  company: string;
  brand?: Company;
  team?: string;
  photos?: Photo[];
  role: string;
  period: string;
  highlights: string[];
};

const experiences: Experience[] = [
  {
    company: "Revolut",
    photos: [
      { src: "/experiences/revolut.jpg", width: 788, height: 1400 },
      { src: "/experiences/revolut-2.jpg", width: 1400, height: 821 },
    ],
    role: "Software Engineer",
    period: "ABR 2025 - SET 2025",
    highlights: [
      "Refatorei jobs de reconciliação de transações, reduzindo em 96% a quantidade de conexões ao nosso banco de dados.",
      "Migrei os arquivos estáticos para outro bucket, garantindo zero downtime, controlado por rollout de desenvolvimento e segmentação de usuários específicos para testes controlados.",
    ],
  },
  {
    company: "iFood",
    photos: [
      { src: "/experiences/ifood.jpg", width: 1400, height: 788 },
      { src: "/experiences/ifood-2.jpg", width: 788, height: 1400 },
      { src: "/experiences/ifood-3.jpg", width: 788, height: 1400 },
      { src: "/experiences/ifood-4.jpg", width: 788, height: 1400 },
    ],
    role: "Software Engineer",
    period: "NOV 2024 - ABR 2025",
    highlights: [
      "Criei a solução centralizada de métricas para o sistema de pedidos utilizando Java, Kafka e Databricks para lidar com mais de 3 milhões de pedidos diários, aumentando a observabilidade do ciclo de vida dos pedidos.",
      "Trabalhei com mais de 100 milhões de pedidos mensais em soluções de alta concorrência utilizando Java, Kotlin, Kafka, AWS Amazon SQS e Spring.",
      "Resolvi a falta de documentação criando um gerador automatizado de documentação que lê o código e gera documentos no Confluence, usando Python e Gitlab CI.",
    ],
  },
  {
    company: "Grupo Boticário",
    brand: "Boticário",
    photos: [
      { src: "/experiences/boticario-1.jpg", width: 788, height: 1400 },
      { src: "/experiences/boticario-2.jpg", width: 1050, height: 1400 },
      { src: "/experiences/boticario-3.jpg", width: 788, height: 1400 },
      { src: "/experiences/boticario-4.jpg", width: 788, height: 1400 },
    ],
    role: "Software Engineer",
    period: "MAR 2023 - NOV 2024",
    highlights: [
      "Otimizei a estratégia do sistema e a lógica de requisições ao banco de dados, alcançando uma redução de 98% no tempo de resposta (de 97 segundos para 1,7 segundos), utilizando SQL, Postgres e replicação de banco.",
      "Eliminei 2 horas diárias de trabalho manual dos engenheiros ao desenvolver a solução de cancelamento e edição de pedidos, melhorando a experiência de usuários e engenheiros ao remover a necessidade de editar e cancelar mais de 30.000 itens manualmente por dia. A solução utilizou Kotlin, Spring, Kafka, RabbitMQ e PostgreSQL na infraestrutura AWS.",
      "Desenvolvi padrões de documentação, logs e arquitetura para serem utilizados pelos mais de 100 desenvolvedores da empresa. A solução utilizou o framework C4 Model, draw.io e GDrive. Fui chamado para essa responsabilidade estrutural de produto por ser reconhecido pelas minhas habilidades organizacionais.",
      "Introduzi testes de mutação para mais de 100 desenvolvedores, pioneirando o uso e compartilhando em uma apresentação detalhada com conceito e prática para adoção. A solução utilizou pitest para Kotlin.",
      "Atuei como mentor, criando um plano de desenvolvimento pessoal para apoiar um colega durante uma transição de carreira técnica.",
      "Criei soluções de observabilidade utilizando New Relic e notificações no Slack.",
    ],
  },
  {
    company: "C6 Bank",
    photos: c6Photos,
    role: "Software Engineer",
    period: "JAN 2022 - MAR 2023",
    highlights: [
      "Recriei do zero o sistema de transações de fundos de investimento utilizando arquitetura hexagonal, atuando na arquitetura de microsserviços, desenvolvimento e manutenção. Utilizei Kotlin, Spring, Kafka e RabbitMQ.",
      "Pensando em escalabilidade, estabilidade, observabilidade e evolução do sistema, criei aplicações totalmente novas em Kotlin.",
      "Realizei manutenção e refatoração de sistemas legados.",
    ],
  },
  {
    company: "C6 Bank",
    role: "Data Engineer",
    team: "Time de Dados",
    period: "JAN 2019 - JAN 2022",
    highlights: [
      "Arquitetei e desenvolvi soluções cloud-native utilizando diversos serviços da GCP.",
      "Trabalhei principalmente com serviços da GCP: BigQuery, Cloud Run Functions, Compute Engine, Storage, Logging e Data Catalog.",
      "Arquitetei, desenvolvi e monitorei aplicações de Big Data, mantendo nosso Datalake e Datawarehouse.",
      "Criei soluções serverless, arquitetando e desenvolvendo todos os processos.",
      "Atuei na criação de sistemas de ETL de dados, análise, catalogação, segurança e governança.",
      "Criei sistemas do zero, arquitetando extrações e transformações de dados.",
      "Desenvolvi processamento de dados serverless.",
      "Criei arquitetura corporativa de catálogo de dados.",
    ],
  },
];

// Agrupa cargos consecutivos na mesma empresa (ex: C6 Bank) num único bloco.
const companies = experiences.reduce<{ company: string; brand: Company; photos: Photo[]; roles: Experience[] }[]>(
  (groups, exp) => {
    const last = groups[groups.length - 1];
    if (last?.company === exp.company) last.roles.push(exp);
    else
      groups.push({
        company: exp.company,
        brand: exp.brand ?? (exp.company as Company),
        photos: exp.photos ?? [],
        roles: [exp],
      });
    return groups;
  },
  []
);

export default function ExperienceList() {
  return (
    <ol className="relative flex flex-col">
      {companies.map(({ company, brand, photos, roles }) => (
        <li
          key={company}
          className="group relative grid gap-4 md:grid-cols-[14rem_1fr] md:gap-10 border-l-2 md:border-l-0 border-oatmeal/60 dark:border-blue-fantastic pl-6 sm:pl-8 md:pl-0 pb-14 md:pb-0 last:pb-0"
        >
          <span
            aria-hidden="true"
            className="md:hidden absolute -left-[7px] top-2.5 h-3 w-3 rounded-full bg-burning-flame ring-4 ring-white dark:ring-abyssal"
          />
          {/* Coluna da linha do tempo: fica fixa enquanto o bloco da empresa rola */}
          <div className="md:text-right md:sticky md:top-24 md:self-start">
            <h3 className="text-xl font-bold">
              <CompanyName company={brand} label={company} />
            </h3>
            <div className="text-xs sm:text-sm text-blue-fantastic/60 dark:text-palladian/60 mt-1">
              {roles[roles.length - 1].period.split(" - ")[0]} – {roles[0].period.split(" - ")[1]}
            </div>
          </div>

          <div className="relative md:border-l-2 border-oatmeal/60 dark:border-blue-fantastic md:pl-8 md:pb-16 md:group-last:pb-0 min-w-0">
            <span
              aria-hidden="true"
              className="hidden md:block absolute -left-[7px] top-2.5 h-3 w-3 rounded-full bg-burning-flame ring-4 ring-white dark:ring-abyssal"
            />

            {photos.length > 0 && (
              <div className="mb-6">
                <PhotoGallery photos={photos} alt={`Yudi na ${company}`} />
              </div>
            )}

            <div className="flex flex-col gap-8">
              {roles.map((exp) => (
                <div key={exp.role + exp.period}>
                  <h4 className="text-lg font-bold text-blue-fantastic dark:text-palladian">
                    {exp.role}
                    {exp.team && (
                      <span className="font-normal text-blue-fantastic/60 dark:text-palladian/60"> · {exp.team}</span>
                    )}
                  </h4>
                  <div className="text-xs sm:text-sm text-blue-fantastic/60 dark:text-palladian/60 mb-3">
                    {exp.period}
                  </div>
                  <ul className="text-sm leading-7 space-y-3">
                    {exp.highlights.map((item, i) => (
                      <li key={i} className="flex items-start text-blue-fantastic/80 dark:text-palladian/80">
                        <span className="text-burning-flame mr-3">▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
