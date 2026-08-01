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
    "PROFILE", "SELECTED AI & ML PROJECTS", "OPEN-SOURCE CONTRIBUTIONS",
    "EXPERIENCE", "CORE SKILLS", "EDUCATION", "CERTIFICATIONS & TRAINING",
]

EXPECTED_CREDENTIALS = [
    ("Scientific Computing with Python Developer Certification | freeCodeCamp | May 2026", "https://www.freecodecamp.org/certification/joshua_nwachinemere/scientific-computing-with-python-v7"),
    ("Google AI Professional Certificate | Google/Coursera | February 2026", "https://www.coursera.org/account/accomplishments/professional-cert/L1UIFMPUME30"),
    ("Model Context Protocol: Advanced Topics | Anthropic training | March 2026", "https://verify.skilljar.com/c/fwqra86yief7"),
]
EXPECTED_EMAIL = "joshua0nwachinemere@gmail.com"
RETIRED_EMAIL = "josh0victor@outlook.com"
EXPECTED_FOOTBALL_PROJECT = "Football Forecasting Lab | Temporal ML Evaluation Pipeline"
RETIRED_FOOTBALL_PROJECT = "Football Predictor | Experimental ML Pipeline"
EXPECTED_LOCAL_AI_PROJECT = "Local Review Intelligence | Local Retrieval & Evaluation"
RETIRED_MULTIPLAYER_PROJECT = "Noughtline | Real-Time Multiplayer System"
RETIRED_AVAILABILITY_COPY = "Open to AI Engineer and ML Engineer opportunities."
RETIRED_GOOGLE_CREDENTIAL = "Google AI Specialization"
RETIRED_EXPERIENCE_HEADING = "INDEPENDENT PRODUCT & ENGINEERING WORK"
RETIRED_GENERIC_EXPERIENCE = "AI, Backend & Automation Projects"
RETIRED_FOOTBALL_INTERPRETATION = "showing signal"
EXPECTED_CONTRIBUTION_STACKS = [
    "Python, WebSockets, retry policies, pytest | Jul 2026",
    "Python, agent recovery, Code Mode, pytest | Jul 2026",
    "Python, OpenTelemetry tracing, async tests, pytest | Jul 2026",
    "Python, FastAPI compatibility, dependency injection, pytest | Jul 2026",
    "Correctness, dependency errors, schema generation, workflow scoping | Jul 2026",
]


def xml_part(name):
    with zipfile.ZipFile(DOCX) as archive:
        return ET.fromstring(archive.read(name))


def doc_text(root):
    return " ".join(node.text or "" for node in root.findall(f".//{W}t"))


class CvArtifactTests(unittest.TestCase):
    def test_contact_email_is_current_and_clickable_in_both_artifacts(self):
        root = xml_part("word/document.xml")
        docx_text = doc_text(root)
        with zipfile.ZipFile(DOCX) as archive:
            rels = archive.read("word/_rels/document.xml.rels").decode()
        self.assertIn(EXPECTED_EMAIL, docx_text)
        self.assertNotIn(RETIRED_EMAIL, docx_text)
        self.assertIn(f"mailto:{EXPECTED_EMAIL}", rels)
        self.assertNotIn(RETIRED_EMAIL, rels)

        reader = PdfReader(str(PDF))
        pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        pdf_uris = []
        for page in reader.pages:
            for annotation in page.get("/Annots", []):
                action = annotation.get_object().get("/A")
                if action and action.get("/URI"):
                    pdf_uris.append(str(action.get("/URI")))
        self.assertIn(EXPECTED_EMAIL, pdf_text)
        self.assertNotIn(RETIRED_EMAIL, pdf_text)
        self.assertIn(f"mailto:{EXPECTED_EMAIL}", pdf_uris)
        self.assertFalse(any(RETIRED_EMAIL in uri for uri in pdf_uris))

    def test_football_project_uses_capability_first_title_in_both_artifacts(self):
        docx_text = doc_text(xml_part("word/document.xml"))
        reader = PdfReader(str(PDF))
        pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)

        for artifact_text in (docx_text, pdf_text):
            self.assertIn(EXPECTED_FOOTBALL_PROJECT, artifact_text)
            self.assertNotIn(RETIRED_FOOTBALL_PROJECT, artifact_text)

    def test_local_ai_project_replaces_less_relevant_multiplayer_project(self):
        docx_text = doc_text(xml_part("word/document.xml"))
        reader = PdfReader(str(PDF))
        pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)

        for artifact_text in (docx_text, pdf_text):
            self.assertIn(EXPECTED_LOCAL_AI_PROJECT, artifact_text)
            self.assertNotIn(RETIRED_MULTIPLAYER_PROJECT, artifact_text)

    def test_profile_leads_with_evidence_instead_of_generic_availability(self):
        docx_text = doc_text(xml_part("word/document.xml"))
        reader = PdfReader(str(PDF))
        pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)

        for artifact_text in (docx_text, pdf_text):
            normalized = re.sub(r"\s+", " ", artifact_text)
            self.assertNotIn(RETIRED_AVAILABILITY_COPY, normalized)
            self.assertIn("eight merged fixes and tests", normalized)

    def test_contribution_stacks_and_dates_are_present_in_both_artifacts(self):
        docx_text = re.sub(r"\s+", " ", doc_text(xml_part("word/document.xml")))
        reader = PdfReader(str(PDF))
        pdf_text = re.sub(r"\s+", " ", "\n".join(page.extract_text() or "" for page in reader.pages))

        for stack in EXPECTED_CONTRIBUTION_STACKS:
            self.assertIn(stack, docx_text)
            self.assertIn(stack, pdf_text)

    def test_page_one_leads_with_projects_and_external_evidence(self):
        reader = PdfReader(str(PDF))
        page_one = re.sub(r"\s+", " ", reader.pages[0].extract_text() or "")
        page_two = re.sub(r"\s+", " ", reader.pages[1].extract_text() or "")
        self.assertIn(EXPECTED_LOCAL_AI_PROJECT, page_one)
        self.assertIn("OpenAI Agents Python SDK | Merged PR #3991", page_one)
        self.assertIn("Pydantic AI Harness | Merged PR #503", page_one)
        self.assertNotIn("Mellea | Merged PR #1471", page_one)
        self.assertIn("Mellea | Merged PR #1471", page_two)

    def test_docx_has_one_explicit_page_break_before_mellea(self):
        root = xml_part("word/document.xml")
        paragraphs = root.findall(f".//{W}body/{W}p")
        mellea_index = next(
            index
            for index, paragraph in enumerate(paragraphs)
            if "Mellea | Merged PR #1471" in "".join(paragraph.itertext())
        )
        page_break_paragraphs = [
            index
            for index, paragraph in enumerate(paragraphs)
            if paragraph.find(f".//{W}br[@{W}type='page']") is not None
        ]
        self.assertEqual(page_break_paragraphs, [mellea_index - 1])

    def test_sections_and_roles_use_clear_early_career_positioning(self):
        docx_text = re.sub(r"\s+", " ", doc_text(xml_part("word/document.xml")))
        reader = PdfReader(str(PDF))
        pdf_text = re.sub(r"\s+", " ", "\n".join(page.extract_text() or "" for page in reader.pages))

        for artifact_text in (docx_text, pdf_text):
            self.assertIn("EXPERIENCE", artifact_text)
            self.assertIn("Independent AI product development", artifact_text)
            self.assertNotIn(RETIRED_EXPERIENCE_HEADING, artifact_text)
            self.assertNotIn(RETIRED_GENERIC_EXPERIENCE, artifact_text)

    def test_paid_freelance_work_is_preserved_from_2023(self):
        for artifact_text in (
            doc_text(xml_part("word/document.xml")),
            "\n".join(page.extract_text() or "" for page in PdfReader(str(PDF)).pages),
        ):
            normalized = re.sub(r"\s+", " ", artifact_text)
            self.assertIn("Python Automation Developer", normalized)
            self.assertIn("Freelance | Independent paid client work", normalized)
            self.assertIn("Jan 2023 - Present", normalized)
            self.assertIn("streaming utilities for large text datasets", normalized)
            self.assertIn("domain filtering, deduplication, splitting, and list curation", normalized)
            self.assertIn("Telegram integrations and asynchronous services", normalized)
            self.assertIn("PostgreSQL, Redis, and Docker", normalized)
            self.assertIn("error handling, rate limits, and operational logging", normalized)
            self.assertIn("licensing and key-management components", normalized)
            self.assertIn("reusable command-line utilities for splitting and sorting large text datasets", normalized)
            self.assertNotIn("combo-splitter and combosorter", normalized)
            self.assertNotIn("paid Python, backend, and automation work", normalized)
            self.assertNotIn("AI automation", normalized)
            self.assertNotIn("Jan 2021 - Present", normalized)

    def test_project_and_education_order_prioritises_current_relevance(self):
        for artifact_text in (
            doc_text(xml_part("word/document.xml")),
            "\n".join(page.extract_text() or "" for page in PdfReader(str(PDF)).pages),
        ):
            self.assertLess(artifact_text.index(EXPECTED_LOCAL_AI_PROJECT), artifact_text.index("Volyx Lens"))
            self.assertLess(artifact_text.index("Volyx Lens"), artifact_text.index(EXPECTED_FOOTBALL_PROJECT))
            self.assertLess(artifact_text.index("MSc Artificial Intelligence"), artifact_text.index("Bachelor of Technology"))

    def test_football_result_is_descriptive_not_interpretive(self):
        for artifact_text in (
            doc_text(xml_part("word/document.xml")),
            "\n".join(page.extract_text() or "" for page in PdfReader(str(PDF)).pages),
        ):
            self.assertNotIn(RETIRED_FOOTBALL_INTERPRETATION, artifact_text)
            self.assertIn("did not outperform the benchmark", artifact_text)

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
        self.assertEqual(document.count("<w:hyperlink"), 18)
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
            "local_AI_agent",
        ]:
            self.assertIn(url, rels)
        doc = Document(DOCX)
        text = "\n".join(p.text for p in doc.paragraphs)
        self.assertLess(text.index("PROFILE"), text.index("OPEN-SOURCE CONTRIBUTIONS"))
        self.assertLess(text.index("OPEN-SOURCE CONTRIBUTIONS"), text.index("EDUCATION"))
        for fact in ["53.77%", "56.70%", "1,140"]:
            self.assertIn(fact, text)

    def test_selected_credentials_are_named_dated_and_verifiable(self):
        root = xml_part("word/document.xml")
        text = doc_text(root)
        paragraphs = ["".join(paragraph.itertext()).strip() for paragraph in root.findall(f".//{W}p")]
        start = paragraphs.index("CERTIFICATIONS & TRAINING") + 1
        credential_paragraphs = [paragraph for paragraph in paragraphs[start:] if paragraph]
        with zipfile.ZipFile(DOCX) as archive:
            rels = archive.read("word/_rels/document.xml.rels").decode()
        expected_paragraphs = [f"{label} | Verify credential" for label, _ in EXPECTED_CREDENTIALS]
        self.assertEqual(credential_paragraphs, expected_paragraphs)
        self.assertEqual(text.count("Verify credential"), 3)
        for label, url in EXPECTED_CREDENTIALS:
            self.assertIn(label, text)
            self.assertIn(url, rels)
        for excluded in [RETIRED_GOOGLE_CREDENTIAL, "Google Cybersecurity Professional Certificate", "Claude Code in Action", "Introduction to Model Context Protocol", "AI Fluency"]:
            self.assertNotIn(excluded, text)

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
            "CERTIFICATIONS & TRAINING",
            "Scientific Computing with Python Developer Certification | freeCodeCamp | May 2026",
            "Google AI Professional Certificate | Google/Coursera | February 2026",
            "Model Context Protocol: Advanced Topics",
            "EDUCATION",
            "MSc Artificial Intelligence · Northumbria University · September 2026 intake",
        ]:
            self.assertIn(expected, text)

    def test_forbidden_whole_words_absent(self):
        text = doc_text(xml_part("word/document.xml"))
        for word in ["RAG", "Nigeria", "CAC"]:
            self.assertIsNone(re.search(rf"\b{word}\b", text))


if __name__ == "__main__":
    unittest.main()
