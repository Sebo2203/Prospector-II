"""Optional Freesound CC0 auditions; never changes game assets or assignments.

Uses public high-quality preview MP3s, not authenticated original downloads.
Requires Python 3.10+ and FFmpeg (same setup as preview-audio-candidates.py).
"""
from pathlib import Path
import argparse
import base64
import datetime
import hashlib
import html
import json
import shutil
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'art/source/audio-candidates/freesound-replacements-2026-11-12.json'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    options = parser.parse_args()
    ffmpeg = options.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        sys.path.insert(0, str(ROOT / '.tmp-tests/audio-encoder'))
        try:
            import imageio_ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            parser.error('Supply --ffmpeg or install imageio-ffmpeg==0.6.0; see docs/audio.md')
    cache = ROOT / '.tmp-tests/freesound-replacements'
    cache.mkdir(parents=True, exist_ok=True)
    stem = 'Prospector-II-sound-replacements-' + datetime.date.today().isoformat()
    suffix = ''; attempt = 1
    while (ROOT / 'outputs' / (stem + suffix + '.html')).exists():
        attempt += 1
        suffix = '-' + str(attempt)
    folder = ROOT / 'outputs' / (stem + suffix)
    folder.mkdir(parents=True, exist_ok=False)
    cards = []; reports = []
    for spec in json.loads(REFERENCE.read_text(encoding='utf-8')):
        source = cache / (str(spec['sound_id']) + '.mp3')
        if not source.exists():
            page = urllib.request.urlopen(spec['url'], timeout=30).read().decode('utf-8')
            if spec['license'] not in page:
                raise ValueError('Review changed source license: ' + spec['url'])
            source.write_bytes(urllib.request.urlopen(spec['preview_url'], timeout=30).read())
        if hashlib.sha256(source.read_bytes()).hexdigest() != spec['preview_sha256']:
            raise ValueError('Review changed preview bytes: ' + spec['url'])
        target = folder / (spec['id'] + '.mp3')
        command = [ffmpeg, '-v', 'error', '-nostdin', '-n', '-ss', str(spec['start_seconds']), '-i', str(source)]
        gain = .35 if spec['id'] == 'C7-A' else .7
        filters = ['volume=' + str(gain)]
        duration = spec['duration_seconds']
        if duration:
            command += ['-t', str(duration)]
            filters += ['afade=t=in:d=0.015', 'afade=t=out:st=' + str(duration - .08) + ':d=0.08']
        command += ['-af', ','.join(filters), '-ar', '44100', '-ac', '2', '-map_metadata', '-1',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', str(target)]
        subprocess.run(command, check=True)
        payload = target.read_bytes()
        treatment = ('Full public preview' if not duration else
                     f"Excerpt {spec['start_seconds']:.2f}â€“{spec['start_seconds'] + duration:.2f} seconds; short edge fades")
        treatment += f'; gain {gain}; 96 kbps stereo MP3. No layers or pitch changes.'
        report = {**spec, 'treatment': treatment, 'output_bytes': len(payload),
                  'output_sha256': hashlib.sha256(payload).hexdigest()}
        reports.append(report)
        cards.append('<article><h2>' + html.escape(spec['id'] + ' â€” ' + spec['role']) + '</h2><p>'
                     + html.escape(spec['title']) + ' â€” ' + html.escape(spec['creator']) + '</p>'
                     + '<audio controls preload="metadata" data-id="' + spec['id']
                     + '" src="data:audio/mpeg;base64,' + base64.b64encode(payload).decode() + '"></audio>'
                     + '<details><summary>Source / treatment</summary><p>Source notes (paraphrased): '
                     + html.escape(spec['description']) + '</p><p>' + html.escape(treatment)
                     + '</p><p><a href="' + html.escape(spec['url'], quote=True) + '">Freesound source</a> Â· '
                     + '<a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>'
                     + '</p></details></article>')
    document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prospector II â€” replacement sound auditions</title><style>body{background:#0c1119;color:#d9e5ee;font:16px system-ui;margin:auto;padding:28px;max-width:1100px}h1,a{color:#9ed3ff}p{line-height:1.5;color:#b2c3d2}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}article{background:#152130;border:1px solid #30475c;padding:18px;border-radius:8px}h2{font-size:18px}audio{width:100%}summary{cursor:pointer}label{display:block;margin:20px 0}</style>
<h1>Prospector II â€” replacement sounds</h1><p>C1â€“C6 and C11 are accepted. Original C7 remains a fallback. These alternatives replace the rejected directions for audition only; none is installed. Compare by label, including A/B where present.</p>
<p>Sources are public Freesound preview MP3s under CC0, not original lossless downloads. Creator descriptions explain the shortlist; playback checks cannot establish how convincing they sound. C7-A is a designed rocket effect; C9-A is described as a collapsing rock wall. C8-A, C10-A/B and C12-A/B have explicit recording descriptions. Volume varies between sources: begin low.</p>
<label>Listening volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.6"></label><main>''' + ''.join(cards) + '''</main>
<script>const clips=[...document.querySelectorAll('audio')],volume=document.getElementById('volume');function setVolume(){for(const a of clips)a.volume=Number(volume.value)}volume.addEventListener('input',setVolume);setVolume();for(const a of clips)a.addEventListener('play',()=>{for(const b of clips)if(b!==a){b.pause();b.currentTime=0}});</script></html>'''
    page = ROOT / 'outputs' / (stem + suffix + '.html')
    page.write_text(document, encoding='utf-8')
    (folder / 'manifest.json').write_text(json.dumps(reports, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'page': str(page), 'clips': len(reports), 'bytes': sum(r['output_bytes'] for r in reports)}))


if __name__ == '__main__':
    main()
