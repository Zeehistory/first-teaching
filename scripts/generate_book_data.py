from __future__ import annotations

import html
import json
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import xml.etree.ElementTree as ET


NAMESPACE = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
REL_NAMESPACE = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


@dataclass
class Block:
  kind: str  # "paragraph", "blockquote", "list-item"
  html_text: str
  footnote_ids: Set[int] = field(default_factory=set)
  list_type: Optional[str] = None  # "ul" or "ol"
  list_level: int = 0


@dataclass
class HeadingNode:
  level: int
  title: str
  blocks: List[Block] = field(default_factory=list)
  children: List["HeadingNode"] = field(default_factory=list)
  parent: Optional["HeadingNode"] = None
  order_index: int = 0


def slugify(text: str) -> str:
  text = text.strip().lower()
  text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
  text = re.sub(r"[\s_-]+", "-", text)
  return text.strip("-") or "section"


def parse_relationships(docx_path: Path) -> Dict[str, str]:
  with zipfile.ZipFile(docx_path) as zf:
    try:
      rels_data = zf.read("word/_rels/document.xml.rels")
    except KeyError:
      return {}
  rels_root = ET.fromstring(rels_data)
  rels: Dict[str, str] = {}
  for rel in rels_root.findall("rel:Relationship", REL_NAMESPACE):
    r_id = rel.attrib.get("Id")
    target = rel.attrib.get("Target")
    if r_id and target:
      rels[r_id] = target
  return rels


def parse_numbering(docx_path: Path) -> Dict[Tuple[str, str], str]:
  """Return mapping of (numId, ilvl) -> list type ('ul' or 'ol')."""
  with zipfile.ZipFile(docx_path) as zf:
    try:
      numbering_data = zf.read("word/numbering.xml")
    except KeyError:
      return {}

  root = ET.fromstring(numbering_data)
  abstract_map: Dict[str, Dict[str, str]] = {}
  for abstract in root.findall("w:abstractNum", NAMESPACE):
    abstract_id = abstract.attrib.get(f"{{{NAMESPACE['w']}}}abstractNumId")
    if not abstract_id:
      continue
    level_map: Dict[str, str] = {}
    for lvl in abstract.findall("w:lvl", NAMESPACE):
      ilvl = lvl.attrib.get(f"{{{NAMESPACE['w']}}}ilvl", "0")
      num_fmt = lvl.find("w:numFmt", NAMESPACE)
      if num_fmt is not None:
        fmt_val = num_fmt.attrib.get(f"{{{NAMESPACE['w']}}}val", "bullet")
        level_map[ilvl] = "ol" if fmt_val != "bullet" else "ul"
      else:
        level_map[ilvl] = "ul"
    abstract_map[abstract_id] = level_map

  numbering_map: Dict[Tuple[str, str], str] = {}
  for num in root.findall("w:num", NAMESPACE):
    num_id = num.attrib.get(f"{{{NAMESPACE['w']}}}numId")
    if not num_id:
      continue
    abstract_ref = num.find("w:abstractNumId", NAMESPACE)
    if abstract_ref is None:
      continue
    abstract_id = abstract_ref.attrib.get(f"{{{NAMESPACE['w']}}}val")
    if not abstract_id:
      continue
    level_map = abstract_map.get(abstract_id, {})
    for ilvl, list_type in level_map.items():
      numbering_map[(num_id, ilvl)] = list_type

  return numbering_map


def parse_footnotes(docx_path: Path) -> Dict[int, str]:
  with zipfile.ZipFile(docx_path) as zf:
    try:
      footnote_data = zf.read("word/footnotes.xml")
    except KeyError:
      return {}

  root = ET.fromstring(footnote_data)

  def convert_paragraph(p: ET.Element) -> str:
    parts: List[str] = []
    for run in p.findall("w:r", NAMESPACE):
      parts.append(convert_run(run))
    return "".join(parts)

  footnotes: Dict[int, str] = {}
  for footnote in root.findall("w:footnote", NAMESPACE):
    fid = footnote.attrib.get(f"{{{NAMESPACE['w']}}}id")
    if not fid or not fid.isdigit():
      continue
    number = int(fid)
    if number <= 0:
      continue
    paragraphs = []
    for p in footnote.findall("w:p", NAMESPACE):
      paragraphs.append(convert_paragraph(p))
    footnotes[number] = "<br/>".join(paragraphs)
  return footnotes


def get_text_elements(parent: ET.Element) -> List[str]:
  texts: List[str] = []
  for t in parent.findall(".//w:t", NAMESPACE):
    if t.text:
      texts.append(t.text)
  return texts


def convert_run(run: ET.Element, rels: Optional[Dict[str, str]] = None) -> str:
  texts: List[str] = []
  footnote_ref = run.find("w:footnoteReference", NAMESPACE)
  if footnote_ref is not None:
    fid = footnote_ref.attrib.get(f"{{{NAMESPACE['w']}}}id")
    if fid and fid.isdigit():
      number = int(fid)
      return f'<sup data-footnote="{number}">{number}</sup>'

  for br in run.findall("w:br", NAMESPACE):
    texts.append("<br/>")

  for child in run:
    if child.tag == f"{{{NAMESPACE['w']}}}t":
      raw = child.text or ""
      xml_space = child.attrib.get("{http://www.w3.org/XML/1998/namespace}space")
      if xml_space == "preserve":
        leading = len(raw) - len(raw.lstrip(" "))
        trailing = len(raw) - len(raw.rstrip(" "))
        core = raw.strip(" ")
        escaped_core = html.escape(core)
        text = ""
        if leading:
          text += "&nbsp;" * leading
        text += escaped_core
        if trailing:
          text += "&nbsp;" * trailing
        if not core and (leading or trailing):
          text = "&nbsp;" * max(leading, trailing)
        texts.append(text)
      else:
        texts.append(html.escape(raw))
    elif child.tag == f"{{{NAMESPACE['w']}}}tab":
      texts.append("&emsp;")
    elif child.tag == f"{{{NAMESPACE['w']}}}sym":
      sym_char = child.attrib.get(f"{{{NAMESPACE['w']}}}char", "")
      texts.append(sym_char)

  if not texts:
    return ""

  result = "".join(texts)

  rpr = run.find("w:rPr", NAMESPACE)
  if rpr is not None:
    if rpr.find("w:smallCaps", NAMESPACE) is not None:
      result = f"<span class=\"small-caps\">{result}</span>"
    if rpr.find("w:u", NAMESPACE) is not None:
      result = f"<u>{result}</u>"
    if rpr.find("w:i", NAMESPACE) is not None or rpr.find("w:iCs", NAMESPACE) is not None:
      result = f"<em>{result}</em>"
    if rpr.find("w:b", NAMESPACE) is not None or rpr.find("w:bCs", NAMESPACE) is not None:
      result = f"<strong>{result}</strong>"
    vert_align = rpr.find("w:vertAlign", NAMESPACE)
    if vert_align is not None:
      val = vert_align.attrib.get(f"{{{NAMESPACE['w']}}}val")
      if val == "superscript":
        result = f"<sup>{result}</sup>"
      elif val == "subscript":
        result = f"<sub>{result}</sub>"

  hyperlink = run.find("w:fldSimple", NAMESPACE)
  if hyperlink is not None and rels:
    instruction = hyperlink.attrib.get(f"{{{NAMESPACE['w']}}}instr")
    if instruction and "HYPERLINK" in instruction:
      match = re.search(r'"(.+?)"', instruction)
      if match:
        target = match.group(1)
        return f'<a href="{html.escape(target)}">{result}</a>'

  return result


def convert_paragraph_to_block(
  paragraph: ET.Element,
  rels: Dict[str, str],
  numbering_map: Dict[Tuple[str, str], str],
) -> Block:
  footnote_ids: Set[int] = set()
  parts: List[str] = []
  for element in paragraph:
    if element.tag == f"{{{NAMESPACE['w']}}}r":
      run_html = convert_run(element, rels)
      parts.append(run_html)
      footnote_ids.update(extract_footnote_ids(run_html))
    elif element.tag == f"{{{NAMESPACE['w']}}}hyperlink":
      href = element.attrib.get(f"{{{NAMESPACE['w']}}}id")
      child_parts: List[str] = []
      for run in element.findall("w:r", NAMESPACE):
        run_html = convert_run(run, rels)
        child_parts.append(run_html)
        footnote_ids.update(extract_footnote_ids(run_html))
      text = "".join(child_parts)
      if href and href in rels:
        target = html.escape(rels[href])
        parts.append(f'<a href="{target}">{text}</a>')
      else:
        parts.append(text)
    elif element.tag == f"{{{NAMESPACE['w']}}}proofErr":
      continue

  text_html = "".join(parts).strip()

  p_style = paragraph.find("w:pPr/w:pStyle", NAMESPACE)
  style_val = p_style.attrib.get(f"{{{NAMESPACE['w']}}}val") if p_style is not None else ""

  block_type = "paragraph"
  if style_val in {"Quote", "BlockText", "Block Quote"}:
    block_type = "blockquote"

  list_type: Optional[str] = None
  list_level = 0
  num_pr = paragraph.find("w:pPr/w:numPr", NAMESPACE)
  if num_pr is not None:
    num_id_el = num_pr.find("w:numId", NAMESPACE)
    ilvl_el = num_pr.find("w:ilvl", NAMESPACE)
    num_id = num_id_el.attrib.get(f"{{{NAMESPACE['w']}}}val") if num_id_el is not None else None
    ilvl = ilvl_el.attrib.get(f"{{{NAMESPACE['w']}}}val") if ilvl_el is not None else "0"
    if num_id:
      list_type = numbering_map.get((num_id, ilvl), "ul")
      block_type = "list-item"
      list_level = int(ilvl or 0)

  return Block(kind=block_type, html_text=text_html, footnote_ids=footnote_ids, list_type=list_type, list_level=list_level)


FOOTNOTE_PATTERN = re.compile(r'data-footnote="(\d+)"')


def extract_footnote_ids(html_fragment: str) -> Set[int]:
  ids = set()
  for match in FOOTNOTE_PATTERN.finditer(html_fragment):
    ids.add(int(match.group(1)))
  return ids


def build_heading_tree(docx_path: Path) -> Tuple[HeadingNode, Dict[int, str]]:
  relationships = parse_relationships(docx_path)
  numbering_map = parse_numbering(docx_path)
  footnotes = parse_footnotes(docx_path)

  with zipfile.ZipFile(docx_path) as zf:
    document_root = ET.fromstring(zf.read("word/document.xml"))

  root = HeadingNode(level=0, title="root")
  stack: List[HeadingNode] = [root]
  order = 0

  def heading_level(style_value: Optional[str]) -> Optional[int]:
    if not style_value or not style_value.startswith("Heading"):
      return None
    try:
      return int(style_value[len("Heading"):])
    except ValueError:
      return None

  for paragraph in document_root.findall("w:body/w:p", NAMESPACE):
    p_style_element = paragraph.find("w:pPr/w:pStyle", NAMESPACE)
    style_val = p_style_element.attrib.get(f"{{{NAMESPACE['w']}}}val") if p_style_element is not None else None
    level = heading_level(style_val)

    if level is not None:
      texts = get_text_elements(paragraph)
      title = "".join(texts).strip()
      if not title:
        continue
      while stack and stack[-1].level >= level:
        stack.pop()
      node = HeadingNode(level=level, title=title, parent=stack[-1], order_index=order)
      order += 1
      stack[-1].children.append(node)
      stack.append(node)
    else:
      block = convert_paragraph_to_block(paragraph, relationships, numbering_map)
      if block.html_text:
        stack[-1].blocks.append(block)

  return root, footnotes


def blocks_to_html(blocks: List[Block]) -> Tuple[str, Set[int]]:
  html_parts: List[str] = []
  collected_footnotes: Set[int] = set()
  i = 0
  while i < len(blocks):
    block = blocks[i]
    if block.kind == "list-item" and block.list_type:
      list_type = block.list_type
      level = block.list_level
      list_items: List[str] = []
      while i < len(blocks) and blocks[i].kind == "list-item" and blocks[i].list_type == list_type and blocks[i].list_level == level:
        list_items.append(f"<li>{blocks[i].html_text}</li>")
        collected_footnotes.update(blocks[i].footnote_ids)
        i += 1
      class_attr = f' class="list-level-{level}"' if level else ""
      html_parts.append(f"<{list_type}{class_attr}>" + "".join(list_items) + f"</{list_type}>")
      continue
    elif block.kind == "blockquote":
      html_parts.append(f"<blockquote>{block.html_text}</blockquote>")
    else:
      html_parts.append(f"<p>{block.html_text}</p>")
    collected_footnotes.update(block.footnote_ids)
    i += 1
  return "\n".join(html_parts), collected_footnotes


def create_section(node: HeadingNode) -> Tuple[Dict, Set[int]]:
  html_content, footnote_ids = blocks_to_html(node.blocks)
  section = {
    "id": slugify(node.title),
    "title": node.title,
    "level": node.level,
    "content": html_content,
    "footnotes": [],
    "parentId": None,
  }
  return section, footnote_ids


def build_sections_flat(
  chapter_node: HeadingNode,
  footnote_map: Dict[int, str],
) -> List[Dict]:
  sections: List[Dict] = []

  def add_section(node: HeadingNode, parent_id: Optional[str]) -> None:
    section, footnote_ids = create_section(node)
    section["parentId"] = parent_id
    section["footnotes"] = [
      {
        "id": f"fn-{section['id']}-{fid}",
        "number": fid,
        "content": footnote_map.get(fid, ""),
        "sectionId": section["id"],
      }
      for fid in sorted(footnote_ids)
    ]
    sections.append(section)

    for child in node.children:
      if is_chapter_node(child):
        continue
      add_section(child, section["id"])

  intro_parent: Optional[str] = None
  if chapter_node.blocks:
    add_section(chapter_node, None)
    intro_parent = sections[-1]["id"]

  for child in chapter_node.children:
    if is_chapter_node(child):
      continue
    add_section(child, intro_parent)

  if not sections:
    section = {
      "id": slugify(chapter_node.title),
      "title": chapter_node.title,
      "level": chapter_node.level,
      "content": "",
      "footnotes": [],
      "parentId": None,
    }
    sections.append(section)

  return sections


def is_chapter_node(node: HeadingNode) -> bool:
  if node.level == 2:
    return True
  parent = node.parent
  parent_level = parent.level if parent else 0
  if node.level == 3 and parent_level <= 1:
    return True
  return False


def chapter_description_from_sections(sections: List[Dict]) -> str:
  for section in sections:
    text = re.sub(r"<[^>]+>", " ", section.get("content", ""))
    text = html.unescape(re.sub(r"\s+", " ", text)).replace("\u00a0", " ").strip()
    if text:
      return text[:240] + ("…" if len(text) > 240 else "")
  return ""


def generate_book_data(docx_path: Path) -> Dict:
  root, footnotes = build_heading_tree(docx_path)

  series_title = "First Teaching of the Last Message"
  series_subtitle = "The Divine Science & Its Six Pillars"
  volume_title = "Speaking the Truth with Love"

  chapters: List[Dict] = []
  chapter_number = 1

  def traverse(node: HeadingNode):
    nonlocal chapter_number
    if is_chapter_node(node):
      sections = build_sections_flat(node, footnotes)
      chapter_id = slugify(node.title)
      chapter = {
        "id": chapter_id,
        "number": chapter_number,
        "title": node.title,
        "description": chapter_description_from_sections(sections),
        "sections": sections,
      }
      chapters.append(chapter)
      chapter_number += 1
    for child in node.children:
      traverse(child)

  for child in root.children:
    traverse(child)

  return {
    "volumeNumber": 1,
    "volumeTitle": volume_title,
    "seriesTitle": series_title,
    "seriesSubtitle": series_subtitle,
    "author": "Umar F. Abd-Allah Wymann-Landgraf",
    "introduction": "This digital companion reproduces the complete text of Volume 1 with preserved inline formatting, cross references, and footnotes.",
    "totalVolumes": 18,
    "chapters": chapters,
  }


def main() -> None:
  docx_path = Path("Volume1_Speaking the Truth with Love copy.docx")
  if not docx_path.exists():
    raise FileNotFoundError(f"Unable to locate DOCX at {docx_path}")

  data = generate_book_data(docx_path)
  output_path = Path("client/src/lib/bookContent.ts")
  output_path.parent.mkdir(parents=True, exist_ok=True)
  with output_path.open("w", encoding="utf-8") as f:
    f.write('import type { BookData } from "@shared/schema";\n\n')
    f.write("export const completeBookData: BookData = ")
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write(";\n")


if __name__ == "__main__":
  main()
