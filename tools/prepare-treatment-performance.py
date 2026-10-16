"""Prepare resumable full-frame treatment derivatives; never modify originals."""
import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path
from PIL import Image

VIDEOS = {'uv': 'uv.mp4', 'blue-tech': 'blue-tech.mp4', 'antirraya': 'antirraya-rayas.mp4',
          'polarizado': 'polarizado.mp4', 'hidrofobico': 'hidrofobico.mp4', 'ilux': 'ilux-antirreflejo.mp4', 'fotosensible': 'fotosensible.mp4'}
POSTERS = {'uv': '16fed.png', 'blue-tech': 'f0cf4.png', 'antirraya': '3dd09.png',
           'polarizado': '8af8d.png', 'hidrofobico': 'dd2a0.png', 'fotosensible': '23aae.png', 'ilux': 'b6e78.png'}
RENDITIONS = {'desktop': (1920, 1080, 23), 'mobile': (960, 540, 25)}

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def probe(executable, path):
    return json.loads(subprocess.check_output([str(executable), '-v', 'error', '-show_streams',
        '-show_format', '-of', 'json', str(path)], text=True, encoding='utf-8'))

def audio_packets(executable, path):
    packets = json.loads(subprocess.check_output([str(executable), '-v', 'error', '-select_streams', 'a',
        '-show_packets', '-show_data_hash', 'sha256', '-show_entries', 'packet=pts_time,duration_time,data_hash',
        '-of', 'json', str(path)], text=True, encoding='utf-8'))['packets']
    return {'count': len(packets), 'sha256': hashlib.sha256(json.dumps(packets, sort_keys=True).encode('utf-8')).hexdigest()}

def faststart(path):
    boxes = []
    with path.open('rb') as stream:
        while header := stream.read(8):
            length, kind = struct.unpack('>I4s', header)
            offset = 8
            if length == 1:
                length = struct.unpack('>Q', stream.read(8))[0]
                offset = 16
            boxes.append(kind.decode('ascii'))
            if length == 0:
                break
            stream.seek(length - offset, 1)
    return boxes.index('moov') < boxes.index('mdat')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', type=Path, required=True)
    parser.add_argument('--ffprobe', type=Path, required=True)
    parser.add_argument('--validate', action='store_true', help='Verify existing bytes without encoding')
    parser.add_argument('--only', choices=VIDEOS, help='Encode only this film; all incumbent assets remain read-only')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    web = root / 'src/Novar.Web/wwwroot'
    media = web / 'media/treatments'
    output = media / 'optimized'
    output.mkdir(parents=True, exist_ok=True)
    checkpoint = root / 'artifacts/treatment-performance/encoding-checkpoint.json'
    checkpoint.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(checkpoint.read_text(encoding='utf-8')) if checkpoint.exists() else {}
    entries = []
    version = subprocess.check_output([str(args.ffmpeg), '-version'], text=True, encoding='utf-8').splitlines()[0]
    def record(source, dest, **details):
        return {'source_url': '/' + source.relative_to(web).as_posix(), 'source_sha256': digest(source),
            'source_bytes': source.stat().st_size, 'delivery_url': '/' + dest.relative_to(web).as_posix(),
            'delivery_sha256': digest(dest), 'delivery_bytes': dest.stat().st_size, **details}
    for name, original_name in VIDEOS.items():
        source = media / original_name
        source_hash = digest(source)
        original = probe(args.ffprobe, source)
        source_video = next(s for s in original['streams'] if s['codec_type'] == 'video')
        source_audio = audio_packets(args.ffprobe, source)
        for rendition, (width, height, crf) in RENDITIONS.items():
            dest = output / f'{name}-{rendition}.mp4'
            key = dest.name
            settings = {'width': width, 'height': height, 'crf': crf, 'preset': 'medium', 'source_sha256': source_hash}
            reusable = dest.exists() and cache.get(key, {}).get('settings') == settings and cache[key].get('sha256') == digest(dest)
            if not reusable and not args.validate and (not args.only or name == args.only):
                command = [str(args.ffmpeg), '-nostdin', '-y', '-i', str(source), '-map', '0:v:0', '-map', '0:a?',
                    '-vf', f'scale={width}:{height}:flags=lanczos', '-c:v', 'libx264', '-preset', 'medium',
                    '-crf', str(crf), '-threads', '4', '-pix_fmt', 'yuv420p', '-fps_mode', 'passthrough',
                    '-c:a', 'copy', '-movflags', '+faststart', str(dest)]
                subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            delivery = probe(args.ffprobe, dest)
            video = next(s for s in delivery['streams'] if s['codec_type'] == 'video')
            audio = audio_packets(args.ffprobe, dest)
            assert digest(source) == source_hash, 'Original changed'
            assert (video['width'], video['height']) == (width, height)
            assert video['codec_name'] == 'h264' and video['pix_fmt'] == 'yuv420p'
            assert video['nb_frames'] == source_video['nb_frames']
            assert video['avg_frame_rate'] == source_video['avg_frame_rate']
            assert abs(float(video['duration']) - float(source_video['duration'])) < .001
            assert audio == source_audio, 'Audio payload or timestamps changed'
            assert faststart(dest), 'Metadata must precede video payload'
            entries.append(record(source, dest, kind='video', treatment=name, rendition=rendition,
                width=width, height=height, source_video=source_video, video=video,
                audio_packets=audio, source_audio_packets=source_audio, faststart=True,
                encoder_version=version, settings=settings, operation='Full-frame H264 yuv420p downscale, audio copy, faststart'))
            cache[key] = {'settings': settings, 'sha256': digest(dest)}
            if not args.validate:
                checkpoint.write_text(json.dumps(cache, indent=2) + '\n', encoding='utf-8', newline='\n')
            print(json.dumps({'file': key, 'bytes': dest.stat().st_size, 'validated': True}), flush=True)
    for name, original_name in POSTERS.items():
        source = web / 'media/figma' / original_name
        source_hash = digest(source)
        for width in (640, 1280, 1920):
            dest = output / f'{name}-poster-{width}.webp'
            with Image.open(source) as image:
                size = (min(width, image.width), round(image.height * min(width, image.width) / image.width))
                if not args.validate and not args.only and not dest.exists():
                    image.resize(size, Image.Resampling.LANCZOS).save(dest, 'WEBP', quality=85, method=6)
                original_size = image.size
            with Image.open(dest) as image:
                assert image.size == size and image.format == 'WEBP'
            assert digest(source) == source_hash
            entries.append(record(source, dest, kind='poster', treatment=name, width=size[0], height=size[1],
                source_width=original_size[0], source_height=original_size[1], quality=85,
                operation='Full-frame LANCZOS resize and WebP encode, no crop'))
    manifest = {'schema_version': 1, 'purpose': 'Treatment delivery derivatives; originals remain authentic and unchanged',
        'audio_integrity': 'Ordered audio packet payload hashes and presentation timestamps/durations', 'assets': entries}
    path = root / 'docs/treatments-optimized-media.json'
    if args.validate:
        existing = json.loads(path.read_text(encoding='utf-8'))
        assert existing == manifest, 'Manifest no longer describes actual bytes'
    else:
        path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps({'validated_assets': len(entries), 'manifest': str(path)}), flush=True)

if __name__ == '__main__':
    main()
