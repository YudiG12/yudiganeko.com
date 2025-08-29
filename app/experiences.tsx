"use client";

import { useState } from "react";

const experiences = [
  {
    company: "Revolut",
    role: "Software Engineer",
    period: "ABR 2025 - SET 2025",
    highlights: [
      "Refatorei jobs de reconciliação de transações, reduzindo em 96% a quantidade de conexões ao nosso banco de dados.",
      "Migrei os arquivos estáticos para outro bucket, garantindo zero downtime, controlado por rollout de desenvolvimento e segmentação de usuários específicos para testes controlados.",
    ],
  },
  {
    company: "IFood",
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
    role: "Software Engineer",
    period: "JAN 2022 - MAR 2023",
    highlights: [
      "Recriei do zero o sistema de transações de fundos de investimento utilizando arquitetura hexagonal, atuando na arquitetura de microsserviços, desenvolvimento e manutenção. Utilizei Kotlin, Spring, Kafka e RabbitMQ.",
      "Pensando em escalabilidade, estabilidade, observabilidade e evolução do sistema, criei aplicações totalmente novas em Kotlin.",
      "Realizei manutenção e refatoração de sistemas legados.",
    ],
  },
  {
    company: "C6 Bank (Data Team)",
    role: "Data Engineer",
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

export default function ExperienceList() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex flex-col sm:flex-row">
      <ul className="flex flex-col py-8 px-2">
        {experiences.map((exp, idx) => (
          <li
            key={exp.company}
            className={`text-base cursor-pointer px-4 py-2 mb-2 transition-all
              ${
                selected === idx
                  ? "text-yellow-600 border-l-2 border-yellow-600 bg-[#192133]"
                  : "text-gray-400 hover:text-yellow-600"
              }
            `}
            onClick={() => setSelected(idx)}
          >
            {exp.company}
          </li>
        ))}
      </ul>
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-1">
          {experiences[selected].role}{" "}
          <span className="text-yellow-600">
            @ {experiences[selected].company}
          </span>
        </h2>
        <div className="text-gray-400 mb-6">{experiences[selected].period}</div>
        <ul className="text-sm leading-7 space-y-4">
          {experiences[selected].highlights.map((item, i) => (
            <li key={i} className="flex items-start text-gray-300">
              <span className="text-yellow-600 mr-3">▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
