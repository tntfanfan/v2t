"""Create app-only JPEGs; never change the source PNGs or their dimensions."""
import json
import sys
from pathlib import Path
from PIL import Image

repository = Path(sys.argv[1])
target = Path(sys.argv[2])
book = json.loads((repository / 'web/bluey-reader/data/s01e01.json').read_text(encoding='utf-8'))
target.mkdir(parents=True, exist_ok=True)
for page in book['pages']:
    source = repository / 'output/S01E01/comic-web-v4/dist' / page['image']
    with Image.open(source) as original:
        assert original.size == (page['width'], page['height'])
        image = original.convert('RGB')
        label = str(page['number']).zfill(2)
        image.save(target / f'page-{label}.jpg', quality=85, subsampling=0, optimize=True)
        thumb = image.copy()
        thumb.thumbnail((160, 240), Image.Resampling.LANCZOS)
        thumb.save(target / f'thumb-{label}.jpg', quality=82, optimize=True)
        if page['number'] == 1:
            # A crop only for the cover. Reading still uses the full page image.
            crop = image.crop((16, 89, 1008, 914))
            crop.thumbnail((720, 600), Image.Resampling.LANCZOS)
            crop.save(target / 'cover.jpg', quality=85, optimize=True)
print('Prepared 9 full-size page images, 9 thumbnails and the cover.')
