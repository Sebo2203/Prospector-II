"""Optional layered collision auditions; no runtime assets or assignments.

Uses the same Python/FFmpeg setup as preview-audio-candidates.py. Source effects
are pinned Kenney assets, public Freesound previews, and optional original
Prospector recordings with separate provenance notes. No synthesis.
"""
from pathlib import Path
import argparse
import base64
import datetime
import hashlib
import html
import json
import runpy
import shutil
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    parser.add_argument('--set', choices=['layers', 'crash'], default='layers')
    args = parser.parse_args()
    ffmpeg = args.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        sys.path.insert(0, str(ROOT / '.tmp-tests/audio-encoder'))
        try:
            import imageio_ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            parser.error('Supply --ffmpeg or install imageio-ffmpeg==0.6.0; see docs/audio.md')
    load_pack = runpy.run_path(str(ROOT / 'tools/preview-audio-candidates.py'))['load_pack']
    pack, license_text = load_pack('sci-fi-sounds')
    stem = ('Prospector-II-crash-comparisons-' if args.set == 'crash' else 'Prospector-II-collision-sounds-') + datetime.date.today().isoformat()
    suffix = ''; attempt = 1
    while (ROOT / 'outputs' / (stem + suffix + '.html')).exists():
        attempt += 1
        suffix = '-' + str(attempt)
    folder = ROOT / 'outputs' / (stem + suffix)
    folder.mkdir(parents=True, exist_ok=False)
    (folder / 'License-kenney.txt').write_text(license_text, encoding='utf-8')
    cards = []; reports = []
    manifest = 'crash-comparisons-2026-11-12.json' if args.set == 'crash' else 'collision-layers-2026-11-12.json'
    specs = json.loads((ROOT / 'art/source/audio-candidates' / manifest).read_text())
    for spec in specs:
        command = [ffmpeg, '-v', 'error', '-nostdin', '-n']
        chains = []; labels = []; notes = []
        for i, source in enumerate(spec['sources']):
            if source['provider'] == 'kenney':
                path = pack / 'Audio' / source['file']
                name = source['file']
            elif source['provider'] == 'freesound':
                path = ROOT / '.tmp-tests/freesound-replacements' / (str(source['sound_id']) + '.mp3')
                path.parent.mkdir(parents=True, exist_ok=True)
                name = 'Freesound ' + str(source['sound_id']) + ' public preview'
                if not path.exists():
                    page = urllib.request.urlopen(source['url'], timeout=30).read().decode()
                    if 'creativecommons.org/publicdomain/zero/1.0/' not in page:
                        raise ValueError('Review changed source license: ' + source['url'])
                    path.write_bytes(urllib.request.urlopen(source['preview_url'], timeout=30).read())
            elif source['provider'] == 'prospector':
                path = ROOT / '.tmp-tests/original-audio' / source['file']
                path.parent.mkdir(parents=True, exist_ok=True)
                name = 'Original Prospector ' + source['file']
                if not path.exists():
                    path.write_bytes(urllib.request.urlopen(source['download_url'], timeout=30).read())
            else:
                raise ValueError('Unknown source provider: ' + source['provider'])
            if hashlib.sha256(path.read_bytes()).hexdigest() != source['sha256']:
                raise ValueError('Review changed source bytes: ' + name)
            command += ['-i', str(path)]
            length = source['seconds'] / source['speed']
            start = source.get('start_seconds', 0)
            lowpass = f"lowpass=f={source['lowpass_hz']}," if source['lowpass_hz'] else ''
            chain = (f"[{i}:a]aresample=44100,atrim=start={start}:duration={source['seconds']},asetpts=PTS-STARTPTS,"
                     f"asetrate={round(44100 * source['speed'])},aresample=44100,"
                     f"{lowpass}volume={source['gain']},"
                     f"afade=t=out:st={max(0, length - .12)}:d=0.12,"
                     f"adelay={source['delay_ms']}:all=1[a{i}]")
            chains.append(chain); labels.append(f'[a{i}]')
            notes.append('<li><a href="' + html.escape(source['url'], quote=True) + '">'
                         + html.escape(name) + '</a>: ' + str(source['seconds'])
                         + ' s excerpt from ' + str(start)
                         + ' s, playback speed/pitch factor ' + str(source['speed'])
                         + (', low-pass ' + str(source['lowpass_hz']) + ' Hz' if source['lowpass_hz'] else ', no low-pass filter')
                         + ', gain ' + str(source['gain']) + ', delay ' + str(source['delay_ms'])
                         + ' ms. ' + html.escape(source['license']) + '.</li>')
        headroom = ',volume=0.7' if args.set == 'crash' else ''
        chains.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=longest,alimiter=limit=0.85:level=0{headroom}[out]')
        target = folder / (spec['id'] + '.mp3')
        command += ['-filter_complex', ';'.join(chains), '-map', '[out]', '-map_metadata', '-1',
                    '-ar', '44100', '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '96k', str(target)]
        subprocess.run(command, check=True)
        payload = target.read_bytes()
        reports.append({**spec, 'post_limiter_gain': .7 if args.set == 'crash' else 1,
                        'bytes': len(payload), 'output_sha256': hashlib.sha256(payload).hexdigest()})
        cards.append('<article><h2>' + html.escape(spec['id'] + ' — ' + spec['role'])
                     + '</h2><p>' + html.escape(spec['intent']) + '</p><audio controls preload="metadata" data-id="'
                     + spec['id'] + '" src="data:audio/mpeg;base64,' + base64.b64encode(payload).decode()
                     + '"></audio><details><summary>Layers / treatment</summary><ul>' + ''.join(notes)
                     + '</ul><p>Short tail fades, additive mix with 0.85 ceiling limiter (no automatic gain), '
                     + ('post-limiter gain 0.7 for codec headroom, ' if args.set == 'crash' else '')
                     + '96 kbps stereo MP3. Source licenses/provenance are listed above; original Prospector audio is not claimed as CC0.</p></details></article>')
    document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prospector II — collision auditions</title><style>body{background:#0c1119;color:#d9e5ee;font:16px system-ui;margin:auto;padding:28px;max-width:1000px}h1,a{color:#9ed3ff}p,li{line-height:1.5;color:#b2c3d2}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}article{background:#152130;border:1px solid #30475c;padding:18px;border-radius:8px}h2{font-size:18px}audio{width:100%}summary{cursor:pointer}label{display:block;margin:20px 0}</style>
<h1>Prospector II — collision auditions</h1><p>Collision audition comparisons. C8-D is now accepted for ramming; other comparisons retain their recorded status. These are processed effects, not recordings of actual spacecraft. Only listening can decide if they work. Begin at a low volume.</p>
<p>Accepted and unchanged: C1–C6, C7-A boost, C10-B thunder, C11 scan, both C12-A/B doors. C10-A is too short; the standalone C8-A/C9-A are rejected. This page changes no game audio.</p>
<p>C8-B improved but lacks a crash; C9-B is only a tentative fallback. C8-C/C9-C are rejected as boost-like. Accepted C8-D restores the metal crash attack that the first 0.48-second excerpt missed; unselected C8-E compares the restored crash with original W5.</p>
<label>Listening volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.5"></label><main>''' + ''.join(cards) + '''</main><script>const clips=[...document.querySelectorAll('audio')],volume=document.getElementById('volume');function setVolume(){for(const a of clips)a.volume=Number(volume.value)}volume.addEventListener('input',setVolume);setVolume();for(const a of clips)a.addEventListener('play',()=>{for(const b of clips)if(b!==a){b.pause();b.currentTime=0}});</script></html>'''
    page = ROOT / 'outputs' / (stem + suffix + '.html')
    page.write_text(document, encoding='utf-8')
    (folder / 'manifest.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'page': str(page), 'clips': len(reports), 'audio_bytes': sum(r['bytes'] for r in reports)}))


if __name__ == '__main__':
    main()
