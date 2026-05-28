"use client";

import { TypeAnimation } from "react-type-animation";

export default function NameAnimation() {
  const longest = "Yudi Ganeko :)";
  return (
    <span className="relative inline-block">
      <span className="invisible whitespace-pre" aria-hidden="true">
        {longest}
      </span>
      <span className="absolute inset-0">
        <TypeAnimation sequence={[longest]} speed={10} />
      </span>
    </span>
  );
}
