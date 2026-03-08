import json
import math
import os
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from datetime import datetime, timezone


BASE_API = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena"
XLSX_URL = (
    "https://servicebus2.caixa.gov.br/portaldeloterias/api/resultados/download"
    "?modalidade=MEGA_SENA"
)
NAMESPACE = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def get_json(url):
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode("utf-8"))


def download_xlsx(path):
    with urllib.request.urlopen(XLSX_URL) as response:
        content = response.read()
    with open(path, "wb") as output:
        output.write(content)


def read_draws_from_xlsx(path):
    with zipfile.ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for si in root.findall("a:si", NAMESPACE):
                text = "".join(t.text or "" for t in si.findall(".//a:t", NAMESPACE))
                shared.append(text)

        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = sheet.findall(".//a:sheetData/a:row", NAMESPACE)

        def get_cell_value(cell):
            cell_type = cell.attrib.get("t")
            value_node = cell.find("a:v", NAMESPACE)
            if value_node is None:
                return ""
            raw_value = value_node.text or ""
            if cell_type == "s" and raw_value.isdigit():
                return shared[int(raw_value)]
            return raw_value

        draws = []
        max_concurso = 0
        for row in rows[1:]:
            values = [get_cell_value(cell) for cell in row.findall("a:c", NAMESPACE)]
            if len(values) < 8:
                continue

            concurso_raw = values[0].strip()
            if concurso_raw.isdigit():
                concurso = int(concurso_raw)
                max_concurso = max(max_concurso, concurso)
            else:
                continue

            dezenas = [int(x) for x in values[2:8] if x.strip().isdigit()]
            if len(dezenas) != 6:
                continue

            draws.append(
                {
                    "concurso": concurso,
                    "data": values[1].strip(),
                    "dezenas": dezenas,
                }
            )

        return draws, max_concurso


def enrich_draws_with_latest(draws, max_concurso, latest_number):
    for concurso in range(max_concurso + 1, latest_number + 1):
        data = get_json(f"{BASE_API}/{concurso}")
        dezenas = [int(x) for x in data.get("listaDezenas", []) if str(x).isdigit()]
        if len(dezenas) != 6:
            continue
        draws.append(
            {
                "concurso": concurso,
                "data": data.get("dataApuracao", ""),
                "dezenas": dezenas,
            }
        )
    return draws


def build_stats(draws, latest):
    draws.sort(key=lambda x: x["concurso"])
    total_contests = len(draws)
    counts = Counter()
    for draw in draws:
        counts.update(draw["dezenas"])

    expected = total_contests * 0.1
    std = math.sqrt(total_contests * 0.1 * 0.9)

    ordered_desc = sorted(counts.items(), key=lambda item: (-item[1], item[0]))

    def to_rank_entry(item):
        number, freq = item
        deviation_pct = ((freq / expected) - 1) * 100
        z_score = (freq - expected) / std
        return {
            "number": number,
            "frequency": freq,
            "deviationPct": round(deviation_pct, 2),
            "zScore": round(z_score, 2),
        }

    top_global = [to_rank_entry(item) for item in ordered_desc[:15]]

    recent_window = draws[-100:] if total_contests >= 100 else draws[:]
    recent_counts = Counter()
    for draw in recent_window:
        recent_counts.update(draw["dezenas"])
    top_recent = [
        {"number": number, "frequency": frequency}
        for number, frequency in sorted(
            recent_counts.items(), key=lambda item: (-item[1], item[0])
        )[:10]
    ]

    odd_distribution = Counter(
        sum(1 for number in draw["dezenas"] if number % 2 == 1) for draw in draws
    )
    repeat_prev_distribution = Counter()
    for idx in range(1, total_contests):
        repeated = len(set(draws[idx]["dezenas"]) & set(draws[idx - 1]["dezenas"]))
        repeat_prev_distribution[repeated] += 1

    sums = [sum(draw["dezenas"]) for draw in draws]
    sum_mean = sum(sums) / total_contests if total_contests else 0
    sum_std = (
        math.sqrt(sum((value - sum_mean) ** 2 for value in sums) / total_contests)
        if total_contests
        else 0
    )

    decades = [0] * 6
    for number, frequency in counts.items():
        decades[(number - 1) // 10] += frequency

    return {
        "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "apiBase": BASE_API,
            "download": XLSX_URL,
        },
        "lastContest": {
            "number": latest.get("numero"),
            "date": latest.get("dataApuracao"),
        },
        "contestsAnalyzed": total_contests,
        "expectedFrequencyPerNumber": round(expected, 2),
        "topGlobal": top_global,
        "topRecent100": top_recent,
        "oddDistribution": {str(k): v for k, v in sorted(odd_distribution.items())},
        "repeatFromPrevious": {
            str(k): v for k, v in sorted(repeat_prev_distribution.items())
        },
        "sumStats": {
            "mean": round(sum_mean, 2),
            "stdDev": round(sum_std, 2),
            "min": min(sums) if sums else 0,
            "max": max(sums) if sums else 0,
        },
        "decadeDistribution": [
            {"range": "01-10", "frequency": decades[0]},
            {"range": "11-20", "frequency": decades[1]},
            {"range": "21-30", "frequency": decades[2]},
            {"range": "31-40", "frequency": decades[3]},
            {"range": "41-50", "frequency": decades[4]},
            {"range": "51-60", "frequency": decades[5]},
        ],
    }


def write_js_stats(path, stats):
    content = "window.MEGA_STATS = " + json.dumps(stats, ensure_ascii=False, indent=2) + ";\n"
    with open(path, "w", encoding="utf-8") as output:
        output.write(content)


def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    xlsx_path = os.path.join(root_dir, "mega.xlsx")
    js_output_path = os.path.join(root_dir, "js", "megaEstatisticasData.js")

    latest = get_json(BASE_API)
    download_xlsx(xlsx_path)
    draws, max_concurso = read_draws_from_xlsx(xlsx_path)
    draws = enrich_draws_with_latest(draws, max_concurso, int(latest["numero"]))
    stats = build_stats(draws, latest)
    write_js_stats(js_output_path, stats)

    print(
        "Estatisticas atualizadas com sucesso. "
        f"Concursos analisados: {stats['contestsAnalyzed']} "
        f"(ultimo {stats['lastContest']['number']} - {stats['lastContest']['date']})."
    )


if __name__ == "__main__":
    main()
