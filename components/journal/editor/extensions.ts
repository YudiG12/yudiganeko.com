"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { lowlight } from "../code-block";
import CalloutView from "./callout-view";
import CodeBlockView from "./code-block-view";
import DiagramView from "./diagram-view";
import ImageView from "./image-view";
import InteractiveView from "./interactive-view";
import YoutubeView from "./youtube-view";

const json = (v: unknown) => JSON.stringify(v);

export const ImageBlock = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
      rounded: { default: true },
      width: { default: "column" },
      // Largura livre em px (arrastando as alças); null = usa o preset de `width`.
      size: { default: null },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
}).configure({ inline: false, allowBase64: false });

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes() {
    return { tone: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes({ "data-callout": "" }, HTMLAttributes), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

export const Youtube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { videoId: { default: "" }, title: { default: "" }, start: { default: 0 } };
  },
  parseHTML() {
    return [{ tag: "div[data-youtube]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-youtube": "" }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeView);
  },
});

export const Diagram = Node.create({
  name: "diagram",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { code: { default: "" }, caption: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-diagram]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-diagram": "" }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DiagramView);
  },
});

export const Interactive = Node.create({
  name: "interactive",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      html: { default: "" },
      name: { default: "" },
      componentId: { default: null },
      width: { default: "wide" },
      height: { default: "auto" },
      align: { default: "center" },
      caption: { default: "" },
      showReset: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-interactive]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-interactive": json(HTMLAttributes.name ?? "") })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(InteractiveView);
  },
});

export function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      codeBlock: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer" } },
    }),
    Placeholder.configure({
      includeChildren: false,
      placeholder: ({ node }) => {
        if (node.type.name === "heading") return "Título da seção";
        return "Escreva, ou digite / para inserir um bloco…";
      },
    }),
    Highlight,
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
      },
    }).configure({ lowlight, defaultLanguage: "plaintext" }),
    TableKit.configure({ table: { resizable: false } }),
    ImageBlock,
    Callout,
    Youtube,
    Diagram,
    Interactive,
  ];
}
