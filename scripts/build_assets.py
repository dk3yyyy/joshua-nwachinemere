from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMAGES = PUBLIC / "images"

PROJECT_IMAGES = [
    "volyx-lens-context-aperture.jpg",
    "local-review-intelligence-dashboard-5b174ed3.jpg",
    "football-forecasting-dashboard-12cff076.jpg",
]


def build_icons() -> None:
    icons = PUBLIC / "icons"
    icons.mkdir(exist_ok=True)
    source = PUBLIC / "favicon.svg"
    outputs = [
        (180, PUBLIC / "apple-touch-icon.png"),
        (192, icons / "icon-192.png"),
        (512, icons / "icon-512.png"),
    ]
    for size, destination in outputs:
        cairosvg.svg2png(
            url=str(source),
            write_to=str(destination),
            output_width=size,
            output_height=size,
        )
    with Image.open(icons / "icon-512.png") as image:
        image.save(
            PUBLIC / "favicon.ico",
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)],
        )


def build_responsive_images() -> None:
    for filename in PROJECT_IMAGES:
        source = IMAGES / filename
        with Image.open(source) as image:
            image = image.convert("RGB")
            for width in (480, 800, 1200):
                if width > image.width:
                    continue
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                destination = IMAGES / f"{source.stem}-{width}.webp"
                resized.save(destination, "WEBP", quality=82, method=6)


if __name__ == "__main__":
    build_icons()
    build_responsive_images()
