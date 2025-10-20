import type { Section } from "@shared/schema";

export interface SectionNode {
  section: Section;
  children: SectionNode[];
}

export interface SectionHierarchy {
  tree: SectionNode[];
  trails: Map<string, Section[]>;
}

export function buildSectionHierarchy(sections: Section[]): SectionHierarchy {
  if (sections.length === 0) {
    return { tree: [], trails: new Map() };
  }

  const baseLevel = Math.min(...sections.map((section) => section.level ?? 0));
  const tree: SectionNode[] = [];
  const trails = new Map<string, Section[]>();
  const stack: SectionNode[] = [];

  sections.forEach((section) => {
    const normalizedLevel = section.level ?? baseLevel;
    const depth = Math.max(normalizedLevel - baseLevel, 0);
    const node: SectionNode = { section, children: [] };

    if (depth === 0 || stack.length === 0) {
      tree.push(node);
    } else {
      const parent = stack[depth - 1] ?? stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        tree.push(node);
      }
    }

    stack[depth] = node;
    stack.length = depth + 1;

    const ancestors = stack.slice(0, depth).map((entry) => entry.section);
    trails.set(section.id, ancestors);
  });

  return { tree, trails };
}
