import importlib.util
import re
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

from docx import Document
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "public/Joshua_Nwachinemere_CV.docx"
PDF = ROOT / "public/Joshua_Nwachinemere_CV.pdf"
BUILD_CV_SPEC = importlib.util.spec_from_file_location("build_cv", ROOT / "scripts/build_cv.py")
if BUILD_CV_SPEC is None or BUILD_CV_SPEC.loader is None:
    raise RuntimeError("Unable to load scripts/build_cv.py")
BUILD_CV = importlib.util.module_from_spec(BUILD_CV_SPEC)
BUILD_CV_SPEC.loader.exec_module(BUILD_CV)
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
EXPECTED_HEADINGS = [
    "PROFILE", "CORE SKILLS", "INDEPENDENT PRODUCT & ENGINEERING WORK",
    "TECHNICAL TRAINING", "OPEN-SOURCE CONTRIBUTIONS", "SELECTED PROJECTS",
    "CERTIFICATIONS", "EDUCATION",
]


def xml_part(name):
    with zipfile.ZipFile(DOCX) as archive:
        return ET.fromstring(archive.read(name))


def doc_text(root):
    return " ".join(node.text or "" for node in root.findall(f".//{W}t"))


class CvArtifactTests(unittest.TestCase):
    def test_major_sections_use_heading_one_outline_semantics(self):
        root = xml_part("word/document.xml")
        found = {}
        for paragraph in root.findall(f".//{W}p"):
            text = "".join(paragraph.itertext()).strip()
            if text in EXPECTED_HEADINGS:
                ppr = paragraph.find(f"{W}pPr")
                style = ppr.find(f"{W}pStyle") if ppr is not None else None
                found[text] = style.get(f"{W}val") if style is not None else None
        self.assertEqual(set(found), set(EXPECTED_HEADINGS))
        self.assertTrue(all(style == "Heading1" for style in found.values()), found)

    def test_bullets_use_native_numbering(self):
        root = xml_part("word/document.xml")
        numbered = root.findall(f".//{W}pPr/{W}numPr")
        self.assertGreaterEqual(len(numbered), 20)

    def test_numbering_ids_are_unique_and_resolve(self):
        numbering = xml_part("word/numbering.xml")
        abstracts = numbering.findall(f"{W}abstractNum")
        nums = numbering.findall(f"{W}num")
        abstract_ids = [a.get(f"{W}abstractNumId") for a in abstracts]
        num_ids = [n.get(f"{W}numId") for n in nums]
        self.assertEqual(len(abstract_ids), len(set(abstract_ids)))
        self.assertEqual(len(num_ids), len(set(num_ids)))
        definitions = set(abstract_ids)
        refs = [n.find(f"{W}abstractNumId").get(f"{W}val") for n in nums]
        self.assertTrue(all(ref in definitions for ref in refs))
        document = xml_part("word/document.xml")
        paragraph_ids = [n.find(f"{W}numId").get(f"{W}val") for n in document.findall(f".//{W}pPr/{W}numPr")]
        self.assertTrue(paragraph_ids)
        self.assertTrue(all(pid in set(num_ids) for pid in paragraph_ids))

    def test_core_metadata_is_deliberate_and_not_template_date(self):
        root = xml_part("docProps/core.xml")
        values = {child.tag.rsplit("}", 1)[-1]: child.text for child in root}
        self.assertEqual(values["title"], "Joshua Nwachinemere CV")
        self.assertEqual(values["subject"], "AI Engineer CV")
        self.assertEqual(values["creator"], "Joshua Nwachinemere")
        self.assertNotEqual(values["created"], "2013-12-23T23:15:00Z")
        self.assertNotEqual(values["modified"], "2013-12-23T23:15:00Z")

    def test_extended_metadata_matches_defined_extracted_text_count(self):
        app = xml_part("docProps/app.xml")
        tags = {child.tag.rsplit("}", 1)[-1]: child.text for child in app}
        self.assertNotIn("Pages", tags)
        document = xml_part("word/document.xml")
        self.assertEqual(int(tags["Words"]), len(doc_text(document).split()))
        self.assertGreater(int(tags["Paragraphs"]), 0)

    def test_links_and_wave_one_facts_survive(self):
        with zipfile.ZipFile(DOCX) as archive:
            document = archive.read("word/document.xml").decode()
            document_root = ET.fromstring(archive.read("word/document.xml"))
            rels = archive.read("word/_rels/document.xml.rels").decode()
            relationships = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
        hyperlinks = document_root.findall(f".//{W}hyperlink")
        referenced_relationships = {node.get(f"{R}id") for node in hyperlinks}
        external = [r for r in relationships if r.get("TargetMode") == "External"]
        external_relationships = {relationship.get("Id") for relationship in external}
        self.assertEqual(document.count("<w:hyperlink"), 16)
        self.assertEqual(external_relationships, referenced_relationships)
        self.assertTrue(all(r.get("Target", "").startswith(("http://", "https://", "mailto:")) for r in external))
        for url in [
            "openai-agents-python/pull/3991",
            "pydantic-ai-harness/pull/503",
            "mellea/pull/1471",
            "faststream/pull/2961",
            "arrow-rs/pull/10486",
            "altair/pull/4089",
            "faststream_fastapi/pull/2",
            "calkit/pull/1028",
            "football_predictor",
        ]:
            self.assertIn(url, rels)
        doc = Document(DOCX)
        text = "\n".join(p.text for p in doc.paragraphs)
        self.assertLess(text.index("PROFILE"), text.index("OPEN-SOURCE CONTRIBUTIONS"))
        self.assertLess(text.index("OPEN-SOURCE CONTRIBUTIONS"), text.index("EDUCATION"))
        for fact in ["53.77%", "56.70%", "1,140"]:
            self.assertIn(fact, text)

    def test_rebuilds_are_byte_reproducible(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            first_docx = output / "first.docx"
            second_docx = output / "second.docx"
            first_pdf = output / "first.pdf"
            second_pdf = output / "second.pdf"
            BUILD_CV.build_docx(first_docx)
            BUILD_CV.build_docx(second_docx)
            BUILD_CV.build_pdf(first_pdf)
            BUILD_CV.build_pdf(second_pdf)
            self.assertEqual(first_docx.read_bytes(), second_docx.read_bytes())
            self.assertEqual(first_pdf.read_bytes(), second_pdf.read_bytes())

    def test_pdf_is_exactly_two_pages_with_extractable_text(self):
        reader = PdfReader(str(PDF))
        self.assertEqual(len(reader.pages), 2)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        for expected in [
            "JOSHUA NWACHINEMERE",
            "PROFILE",
            "OPEN-SOURCE CONTRIBUTIONS",
            "OpenAI Agents Python SDK",
            "Pydantic AI Harness",
            "Mellea",
            "FastStream",
            "Additional verified upstream merges",
            "8 merged PRs",
            "EDUCATION",
        ]:
            self.assertIn(expected, text)

    def test_forbidden_whole_words_absent(self):
        text = doc_text(xml_part("word/document.xml"))
        for word in ["RAG", "Nigeria", "CAC"]:
            self.assertIsNone(re.search(rf"\b{word}\b", text))


if __name__ == "__main__":
    unittest.main()
