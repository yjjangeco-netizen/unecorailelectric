import argparse
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None


BOARD_TYPES = {
    "sop": "SOP",
    "tools": "TOOLS",
    "troubleshooting": "TROUBLESHOOTING",
    "tech": "TECH_DATA",
}

SERIES_TYPES = {
    "840d": "840D",
    "840dsl": "840Dsl",
    "one": "SINUMERIK ONE",
    "common": "Siemens 공통",
}

MACHINE_TYPES = {
    "lathe": "선반",
    "wheel": "전삭기",
    "common": "Siemens 공통",
}

SUPPORTED_EXTENSIONS = {".pdf", ".hwp", ".hwpx", ".docx", ".txt", ".md"}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9가-힣]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "document"


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def dollar_quote(value: str) -> str:
    tag = "content"
    while f"${tag}$" in value:
        tag += "x"
    return f"${tag}${value}${tag}$"


def extract_pdf_text(path: Path) -> str:
    if PdfReader is None:
        return ""
    try:
        reader = PdfReader(str(path))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception:
        return ""


def extract_plain_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="cp949").strip()
        except Exception:
            return ""
    except Exception:
        return ""


def extract_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return extract_pdf_text(path)
    if ext in {".txt", ".md"}:
        return extract_plain_text(path)
    return ""


def classify(path: Path, text: str, forced_type: str | None) -> str:
    if forced_type:
        return BOARD_TYPES[forced_type]

    haystack = f"{path.parent.name} {path.name} {text[:2000]}".lower()
    if any(keyword in haystack for keyword in ["sop", "표준", "절차", "작업순서", "작업 절차"]):
        return "SOP"
    if any(keyword in haystack for keyword in ["고장", "장애", "복구", "트러블", "trouble", "error", "알람"]):
        return "TROUBLESHOOTING"
    if any(keyword in haystack for keyword in ["tool", "툴", "프로그램", "사용법", "양식"]):
        return "TOOLS"
    return "TECH_DATA"


def classify_series(path: Path, text: str, forced_series: str | None) -> str:
    if forced_series:
        return SERIES_TYPES[forced_series]

    haystack = f"{path.parent.name} {path.name} {text[:3000]}".lower()
    if any(keyword in haystack for keyword in ["840dsl", "840d sl", "sl840d"]):
        return "840Dsl"
    if any(keyword in haystack for keyword in ["sinumerik one", "sinumerik-one"]):
        return "SINUMERIK ONE"
    if any(keyword in haystack for keyword in ["840d", "powerline", "pl840d"]):
        return "840D"
    return "Siemens 공통"


def classify_machine(path: Path, text: str, forced_machine: str | None) -> str:
    if forced_machine:
        return MACHINE_TYPES[forced_machine]

    haystack = f"{path.parent.name} {path.name} {text[:3000]}".lower()
    if any(keyword in haystack for keyword in ["\uc804\uc0ad\uae30", "\ucc28\ub95c", "\uc0ad\uc815", "wheel", "wheel lathe"]):
        return "전삭기"
    if any(keyword in haystack for keyword in ["\uc120\ubc18", "lathe", "turning"]):
        return "선반"
    return "Siemens 공통"


def build_display_title(title: str, series: str, machine: str) -> str:
    return f"[{series}][{machine}] {title}"


def build_content(title: str, public_url: str, text: str, ext: str, series: str, machine: str) -> str:
    lines = [
        f"## {title}",
        "",
        "### 분류",
        "",
        f"- 장비 구분: {series}",
        f"- 설비 구분: {machine}",
        "",
        f"원본 파일: [{title}]({public_url})",
        "",
    ]

    if text:
        normalized = re.sub(r"\n{3,}", "\n\n", text).strip()
        clipped = normalized[:12000]
        lines.extend([
            "### 문서 내용",
            "",
            clipped,
        ])
        if len(normalized) > len(clipped):
            lines.extend([
                "",
                "> 본문이 길어 일부만 표시했습니다. 전체 내용은 원본 파일을 확인하십시오.",
            ])
    else:
        lines.extend([
            "### 안내",
            "",
            f"{ext.upper()} 파일은 자동 본문 추출이 제한되어 원본 파일 링크로 등록했습니다.",
            "세부 내용은 상단 원본 파일을 열어서 확인하십시오.",
        ])

    return "\n".join(lines).strip()


def collect_files(input_dir: Path) -> list[Path]:
    files = []
    for path in input_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(path)
    return sorted(files, key=lambda item: str(item).lower())


def unique_destination(public_dir: Path, source: Path, used_names: set[str]) -> Path:
    base = slugify(source.stem)
    suffix = source.suffix.lower()
    candidate = f"{base}{suffix}"
    index = 2
    while candidate in used_names or (public_dir / candidate).exists():
        candidate = f"{base}-{index}{suffix}"
        index += 1
    used_names.add(candidate)
    return public_dir / candidate


def generate_sql(records: list[dict]) -> str:
    now = datetime.now(timezone.utc).isoformat()
    statements = [
        "-- 업무도구 문서 일괄 등록 SQL",
        f"-- generated_at: {now}",
        "-- 같은 board_type/title 조합은 중복 등록하지 않습니다.",
        "",
    ]

    for record in records:
        statements.append(
            "\n".join([
                "INSERT INTO work_tool_boards (",
                "  board_type, title, content, author_id, author_name, views, created_at, updated_at",
                ")",
                "SELECT",
                f"  {sql_literal(record['board_type'])},",
                f"  {sql_literal(record['title'])},",
                f"  {dollar_quote(record['content'])},",
                "  'system',",
                "  '관리자',",
                "  0,",
                "  NOW(),",
                "  NOW()",
                "WHERE NOT EXISTS (",
                "  SELECT 1 FROM work_tool_boards",
                f"  WHERE board_type = {sql_literal(record['board_type'])}",
                f"    AND title = {sql_literal(record['title'])}",
                ");",
                "",
            ])
        )

    return "\n".join(statements)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate SQL for bulk importing work-tool documents.")
    parser.add_argument("input_dir", help="Folder containing PDF/HWP/HWPX/DOCX/TXT/MD files.")
    parser.add_argument("--type", choices=BOARD_TYPES.keys(), help="Force all files into one board type.")
    parser.add_argument("--series", choices=SERIES_TYPES.keys(), help="Force Siemens series: 840d, 840dsl, one, common.")
    parser.add_argument("--machine", choices=MACHINE_TYPES.keys(), help="Force machine group: lathe, wheel, common.")
    parser.add_argument("--public-dir", default="public/work-tool-files/imported")
    parser.add_argument("--output", default="database/generated_work_tool_import.sql")
    args = parser.parse_args()

    root = Path.cwd()
    input_dir = Path(args.input_dir).expanduser()
    if not input_dir.is_absolute():
        input_dir = root / input_dir
    if not input_dir.exists():
        raise SystemExit(f"Input folder not found: {input_dir}")

    public_dir = root / args.public_dir
    output = root / args.output
    public_dir.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)

    files = collect_files(input_dir)
    if not files:
        raise SystemExit(f"No supported files found in: {input_dir}")

    records = []
    used_names = set()
    for source in files:
        dest = unique_destination(public_dir, source, used_names)
        shutil.copy2(source, dest)

        text = extract_text(source)
        board_type = classify(source, text, args.type)
        series = classify_series(source, text, args.series)
        machine = classify_machine(source, text, args.machine)
        raw_title = source.stem.strip()
        title = build_display_title(raw_title, series, machine)
        public_url = "/" + dest.relative_to(root / "public").as_posix()
        records.append({
            "board_type": board_type,
            "title": title,
            "content": build_content(title, public_url, text, source.suffix.lower(), series, machine),
        })

    output.write_text(generate_sql(records), encoding="utf-8")

    print(f"Imported files copied: {len(records)}")
    print(f"SQL generated: {output}")
    print(f"Public files folder: {public_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
