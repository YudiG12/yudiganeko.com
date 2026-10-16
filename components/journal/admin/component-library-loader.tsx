"use client";

import dynamic from "next/dynamic";

const ComponentLibrary = dynamic(() => import("./component-library"), { ssr: false });
export default ComponentLibrary;
