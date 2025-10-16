"use client";

import { TypeAnimation } from "react-type-animation";

export default function NameAnimation() {
  const longest = "Yudi Ganeko :D";
  return <TypeAnimation sequence={["Yudi Ganeko :)"]} speed={10} />;
}
