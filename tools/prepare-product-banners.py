"""Encode approved 2x Figma banner exports as pixel-identical, lossless WebP.

Originals stay read-only. Exports are downloaded into artifacts/product-banner-quality
with Figma download_assets (defaultScale=2); no retouching or artificial sharpening.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artifacts/product-banner-quality'
OUTPUT = ROOT / 'src/Novar.Web/wwwroot/media/products/banners'
NODES = {"first":"689:4834","precisa":"974:904","evolution":"964:3015","elife":"974:547","geo":"964:2244","single-vision":"992:1255","outdoor":"995:11749","indoor":"995:11751","slim":"992:2113","kriptok-blended":"989:713","ultex-blended":"992:2399","freeline":"992:2681","office":"1103:237","ai-lens":"977:10921","myolens":"977:11243","aiwork":"988:11448"}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for slug, node in NODES.items():
        source = SOURCE / f'{slug}-2x.png'
        target = OUTPUT / f'{slug}-2x.webp'
        with Image.open(source) as image:
            rgba = image.convert('RGBA')
            assert image.width >= 1920, (slug, image.size)
            assert rgba.getchannel('A').getextrema() == (255, 255), f'{slug}: transparent edge'
            image.save(target, 'WEBP', lossless=True, method=6, exact=True)
            with Image.open(target) as encoded:
                assert encoded.size == image.size
                assert encoded.convert('RGBA').tobytes() == rgba.tobytes(), f'{slug}: pixel changes'
            entries.append({'slug': slug, 'sourceNode': node, 'exportScale': 2,
                'sourceFile': 'BsmryGBLAW0gkLgs4Fw1X8', 'width': image.width, 'height': image.height,
                'sourceSha256': digest(source), 'sourceBytes': source.stat().st_size,
                'url': f'/media/products/banners/{target.name}',
                'sha256': digest(target), 'bytes': target.stat().st_size, 'opaque': True,
                'encoding': 'lossless WebP, unchanged pixels; no resize or sharpening'})
            print(f'{slug}: {image.width}x{image.height}, {target.stat().st_size} bytes')
    manifest = {'purpose': 'Banner-only assets; catalog, galleries and originals remain unchanged.',
        'sourceResolutionNote': '2x Figma exports preserve design filters and crop. Export scale does not create detail absent from the uploaded source.',
        'assets': entries}
    (ROOT / 'docs/product-banner-assets.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
