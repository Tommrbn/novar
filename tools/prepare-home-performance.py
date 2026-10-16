"""Prepare full-frame Home delivery derivatives; never overwrite supplied originals."""
import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path
from PIL import Image, __version__ as pillow_version, features

VIDEOS = {
    "world-earth": (640, 360, 25), "world-path": (1920, 1080, 23),
    "world-portrait-1": (432, 768, 25), "world-portrait-2": (432, 768, 25),
    "world-portrait-3": (432, 768, 25), "world-spectra-glasses": (986, 720, 25),
    "world-sunset-glasses": (1200, 680, 25), "world-boy-glasses": (640, 360, 25),
    "hero-banner": (1440, 840, 25),
}
POSTERS = {
    "world-path": 1920, "world-navy": 1280, "world-turquoise": 640,
    "world-spectra-glasses": 986, "world-sunset-glasses": 1024,
    "world-boy-glasses": 640, "world-earth": 640, "hero-banner": 1440,
}

def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def probe(executable, path):
    return json.loads(subprocess.check_output([
        str(executable), "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path)], text=True))

def audio_packets(executable, path):
    packets = json.loads(subprocess.check_output([
        str(executable), "-v", "error", "-select_streams", "a", "-show_packets",
        "-show_data_hash", "sha256", "-show_entries", "packet=pts_time,duration_time,data_hash",
        "-of", "json", str(path)], text=True))["packets"]
    return {"count": len(packets), "sha256": hashlib.sha256(
        json.dumps(packets, sort_keys=True).encode()).hexdigest()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--ffmpeg", type=Path, required=True)
    parser.add_argument("--ffprobe", type=Path, required=True)
    parser.add_argument("--only", choices=VIDEOS)
    parser.add_argument("--reuse", action="store_true", help="Verify and record existing derivatives instead of encoding again")
    args = parser.parse_args()
    root = args.root.resolve()
    web = root / "src/Novar.Web/wwwroot"
    home = web / "media/home"
    output = home / "optimized"
    output.mkdir(parents=True, exist_ok=True)
    version = subprocess.check_output([str(args.ffmpeg), "-version"], text=True).splitlines()[0]
    entries = []

    def target(name):
        path = (output / name).resolve()
        if path.parent != output.resolve() or path == home / name:
            raise ValueError("Derivative must remain inside optimized directory")
        return path

    def record(source, destination, **facts):
        return {"source_url": "/" + source.relative_to(web).as_posix(),
                "source_sha256": digest(source), "source_bytes": source.stat().st_size,
                "delivery_url": "/" + destination.relative_to(web).as_posix(),
                "delivery_sha256": digest(destination), "delivery_bytes": destination.stat().st_size,
                **facts}

    for name, (width, height, crf) in VIDEOS.items():
        if args.only and args.only != name:
            continue
        source, destination = home / f"{name}.mp4", target(f"{name}.mp4")
        before_hash = digest(source)
        original = probe(args.ffprobe, source)
        command = [str(args.ffmpeg), "-nostdin", "-y", "-i", str(source),
                   "-map", "0:v:0", "-map", "0:a?", "-vf", f"scale={width}:{height}:flags=lanczos",
                   "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-threads", "4",
                   "-pix_fmt", "yuv420p", "-fps_mode", "passthrough", "-c:a", "copy",
                   "-movflags", "+faststart", str(destination)]
        if name == "world-path":
            # Already native crop-aware resolution: avoid larger lossy recompression.
            command = [str(args.ffmpeg), "-nostdin", "-y", "-i", str(source),
                       "-map", "0:v:0", "-map", "0:a?", "-c", "copy", "-movflags", "+faststart", str(destination)]
        started = time.monotonic()
        if not (args.reuse and destination.exists()):
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        derivative = probe(args.ffprobe, destination)
        source_video = next(s for s in original["streams"] if s["codec_type"] == "video")
        video = next(s for s in derivative["streams"] if s["codec_type"] == "video")
        audios = [s for s in derivative["streams"] if s["codec_type"] == "audio"]
        source_audios = [s for s in original["streams"] if s["codec_type"] == "audio"]
        assert digest(source) == before_hash, "Original source changed"
        assert video["codec_name"] == "h264" and video["pix_fmt"] == "yuv420p"
        assert video["nb_frames"] == source_video["nb_frames"], "Frame count changed"
        assert video["avg_frame_rate"] == source_video["avg_frame_rate"], "Frame rate changed"
        assert abs(float(video["duration"]) - float(source_video["duration"])) < 0.001
        assert len(audios) == len(source_audios), "Audio presence changed"
        original_packets = audio_packets(args.ffprobe, source)
        packets = audio_packets(args.ffprobe, destination)
        assert packets == original_packets, "Audio packet content or timestamps changed"
        entry = record(source, destination, kind="video", width=width, height=height,
                       source_video=source_video, video=video, audio=audios, source_audio=source_audios,
                       source_audio_packets=original_packets, audio_packets=packets,
                       source_duration=original["format"]["duration"], duration=derivative["format"]["duration"],
                       encoder_arguments=command[1:-1], encoder_version=version,
                       delivery_strategy="lossless faststart remux" if name == "world-path" else "full-frame H264 downscale/re-encode",
                       elapsed_seconds=round(time.monotonic() - started, 3))
        # Portable provenance records use URL inputs, not workstation-specific paths.
        entry["encoder_arguments"][entry["encoder_arguments"].index("-i") + 1] = entry["source_url"]
        entries.append(entry)
        print(json.dumps({"asset": name, "bytes": entry["delivery_bytes"], "seconds": entry["elapsed_seconds"]}), flush=True)

    if not args.only:
        for name, width in POSTERS.items():
            source = web / "media/figma/home-hero-poster.png" if name == "hero-banner" else home / f"{name}.png"
            destination = target(f"{name}.webp")
            with Image.open(source) as image:
                original_size = image.size
                size = (width, round(image.height * width / image.width))
                if not (args.reuse and destination.exists()):
                    image.resize(size, Image.Resampling.LANCZOS).save(destination, "WEBP", quality=85, method=6)
            with Image.open(destination) as image:
                assert image.size == size and image.format == "WEBP"
            entries.append(record(source, destination, kind="poster", width=size[0], height=size[1],
                                  source_width=original_size[0], source_height=original_size[1],
                                  encoder="Pillow WebP", encoder_version=pillow_version,
                                  webp_version=features.version("webp"), quality=85, method=6,
                                  resampling="LANCZOS", operation="full-frame resize then WebP save"))
        manifest = {"schema_version": 1, "purpose": "Full-frame delivery derivatives, not new Figma exports",
                    "preserved": "Original films, posters, frame counts, frame rates, audio tracks and CSS crops",
                    "audio_integrity": "Ordered packet payload SHA256, presentation timestamps, durations and skip/padding side data; MP4 nb_frames tables may differ after lossless remux",
                    "assets": entries}
        (root / "docs/home-world-optimized-media.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
