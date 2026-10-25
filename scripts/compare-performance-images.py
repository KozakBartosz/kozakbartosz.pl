"""Compare same-scene PNGs; Pillow is installed outside project dependencies."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageStat

parser = argparse.ArgumentParser()
parser.add_argument('baseline', type=Path)
parser.add_argument('candidate', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
a = Image.open(args.baseline).convert('RGB')
b = Image.open(args.candidate).convert('RGB')
if a.size != b.size:
    raise ValueError('Normalize to identical CSS screenshot dimensions before comparison')
diff = ImageChops.difference(a, b)
stats = ImageStat.Stat(diff)
result = {
    'baseline': str(args.baseline), 'candidate': str(args.candidate),
    'size': a.size, 'maeRGB': sum(stats.mean) / 3,
    'max': max(extreme[1] for extreme in diff.getextrema()),
    'changedChannels': sum(sum(channel.histogram()[1:]) for channel in diff.split()),
    'differenceAmplification': 8,
    'note': 'Pixel differences do not replace inspection of edges, glow, reflections and blur.'
}
ImageEnhance.Brightness(diff).enhance(8).save(args.output)
args.output.with_suffix('.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
