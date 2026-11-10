#!/usr/bin/env python3
"""Generate local donation QR SVGs from site/donation-wallets.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_Q

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
CONFIG = SITE / "donation-wallets.json"
ASSET_PREFIX = "/assets/donations/"
PLACEHOLDER = re.compile(r"(?:placeholder|your(?:[_ -][a-z0-9]+)*[_ -]address|wallet[_ -]address|\btbd\b|\btodo\b|\bexample\b|\benter\b)", re.IGNORECASE)
ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$", re.IGNORECASE)


def qr_svg(address: str) -> str:
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_Q, border=4)
    qr.add_data(address, optimize=0)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    size = len(matrix)
    path_parts: list[str] = []

    for y, row in enumerate(matrix):
        x = 0
        while x < size:
            if not row[x]:
                x += 1
                continue
            start = x
            while x < size and row[x]:
                x += 1
            width = x - start
            path_parts.append(f"M{start} {y}h{width}v1h-{width}z")

    path = "".join(path_parts)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
        f'width="{size}" height="{size}" shape-rendering="crispEdges">'
        f'<rect width="{size}" height="{size}" fill="#fff"/>'
        f'<path d="{path}" fill="#06110f"/>'
        "</svg>\n"
    )


def output_path(qr_path: str) -> Path:
    if not qr_path.startswith(ASSET_PREFIX):
        raise ValueError(f"QR path must begin with {ASSET_PREFIX}: {qr_path!r}")
    relative = Path(qr_path.lstrip("/"))
    if ".." in relative.parts or relative.suffix.lower() != ".svg":
        raise ValueError(f"Unsafe QR output path: {qr_path!r}")
    return SITE / relative


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify existing SVGs match the wallet configuration without writing files.")
    args = parser.parse_args()

    configuration = json.loads(CONFIG.read_text(encoding="utf-8"))
    wallets = configuration.get("wallets")
    if not isinstance(wallets, list):
        raise ValueError("The wallet configuration must contain a wallets array.")

    expected: set[Path] = set()
    issues: list[str] = []
    for wallet in wallets:
        if not isinstance(wallet, dict):
            issues.append("Skipped a malformed wallet entry.")
            continue
        symbol = wallet.get("symbol", "?")
        identifier = wallet.get("symbol", "").lower() if isinstance(wallet.get("symbol"), str) else ""
        address = wallet.get("address", "")
        configured = wallet.get("configured") is True
        qr_path = wallet.get("qr", "")

        if not ID_PATTERN.fullmatch(identifier):
            issues.append(f"{symbol}: invalid or missing symbol; QR not generated.")
            continue
        if not isinstance(qr_path, str) or not qr_path:
            issues.append(f"{symbol}: QR path is not configured; QR not generated.")
            continue
        destination = output_path(qr_path)

        usable = configured and isinstance(address, str) and bool(address.strip()) and not PLACEHOLDER.search(address)
        if not usable:
            if destination.exists():
                if args.check:
                    issues.append(f"{symbol}: stale QR exists for an unconfigured wallet.")
                else:
                    destination.unlink()
                    print(f"removed stale {destination.relative_to(ROOT)}")
            continue

        expected.add(destination)
        generated = qr_svg(address.strip())
        if args.check:
            if not destination.is_file() or destination.read_text(encoding="utf-8") != generated:
                issues.append(f"{symbol}: QR SVG is missing or does not match the configured address.")
            else:
                print(f"verified {symbol} QR")
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(generated, encoding="utf-8")
            print(f"generated {symbol} QR: {destination.relative_to(ROOT)}")

    if args.check:
        for existing in (SITE / "assets" / "donations").glob("qr-*.svg"):
            if existing not in expected:
                issues.append(f"Unexpected or stale QR file: {existing.relative_to(ROOT)}")

    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
