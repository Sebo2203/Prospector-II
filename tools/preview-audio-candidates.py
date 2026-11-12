"""Optional CC0 audition builder; no game assets or runtime assignments are changed.

Requires ffmpeg on PATH, or imageio-ffmpeg==0.6.0 installed normally or under
.tmp-tests/audio-encoder. Downloads public Kenney packs into an ignored cache.
"""
from pathlib import Path
import argparse
import base64
import datetime
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.tmp-tests/audio-candidates'
PACKS = ['sci-fi-sounds', 'impact-sounds', 'interface-sounds', 'digital-audio']


def source(pack, file, trim=None, delay=0):
    return dict(pack=pack, file=file, trim=trim, delay=delay)


CANDIDATES = [
    ('C1', 'Mass Driver', 'A low report with a mechanical strike; a candidate for a single kinetic shot.',
     [source('sci-fi-sounds', 'lowFrequency_explosion_000.ogg', .65), source('sci-fi-sounds', 'impactMetal_000.ogg')]),
    ('C2', 'Railgun', 'A brief electronic rise followed by a harder discharge. The lead-in is presentation, not an extra charging turn.',
     [source('digital-audio', 'highUp.ogg', .18), source('sci-fi-sounds', 'laserLarge_001.ogg', delay=.14)]),
    ('C3', 'Laser Cannon', 'A larger energy-weapon candidate, separate from the original ground-laser recording.',
     [source('sci-fi-sounds', 'laserLarge_003.ogg')]),
    ('C4', 'Pulse Laser', 'A short energy pulse for a faster weapon; compare its identity with C3.',
     [source('sci-fi-sounds', 'laserSmall_001.ogg')]),
    ('C5', 'Artemis launch', 'A short thruster burst at missile launch. Detonation would remain a separate sound at actual impact.',
     [source('sci-fi-sounds', 'thrusterFire_002.ogg', .7)]),
    ('C6', 'Shield absorption', 'An electronic force-field candidate for a shield hit, keeping it distinct from W5 hull damage.',
     [source('sci-fi-sounds', 'forceField_001.ogg')]),
    ('C7', 'Boost', 'A bounded engine burst for one boost action, without a continuous background engine loop.',
     [source('sci-fi-sounds', 'spaceEngineSmall_001.ogg', .85)]),
    ('C8', 'Ship ramming', 'A direct metal collision candidate, separate from weapon fire and the original W5 explosion.',
     [source('impact-sounds', 'impactMetal_heavy_001.ogg')]),
    ('C9', 'Asteroid collision', 'Mining and plate impacts layered into a collision candidate with a different identity from C8.',
     [source('impact-sounds', 'impactMining_003.ogg'), source('impact-sounds', 'impactPlate_heavy_001.ogg')]),
    ('C10', 'Nebula lightning', 'A short zap and force-field layer for the resolved strike, without an advance warning sound.',
     [source('digital-audio', 'zap1.ogg', .6), source('sci-fi-sounds', 'forceField_003.ogg', .6)]),
    ('C11', 'Successful scan', 'A short computer phrase and confirmation for an actual successful scan, rather than every menu movement.',
     [source('sci-fi-sounds', 'computerNoise_001.ogg', .45), source('interface-sounds', 'confirmation_003.ogg', delay=.4)]),
    ('C12', 'Door / docking latch', 'A mechanical closing candidate for on-foot doors or the latch part of docking.',
     [source('sci-fi-sounds', 'doorClose_001.ogg')]),
]


def load_pack(pack):
    CACHE.mkdir(parents=True, exist_ok=True)
    archive = CACHE / (pack + '.zip')
    if not archive.exists() or not zipfile.is_zipfile(archive):
        # The public download button requests a fresh link; stale media URLs redirect.
        page = urllib.request.urlopen('https://kenney.nl/assets/' + pack, timeout=30).read().decode('utf-8')
        identifier = re.search(r'data-download-id=[\"\']([^\"\']+)', page).group(1)
        request = urllib.request.Request('https://kenney.nl/download-link/' + identifier,
                                         headers={'Referer': 'https://kenney.nl/assets/' + pack, 'Cache-Control': 'no-store'})
        link = json.load(urllib.request.urlopen(request, timeout=30))['url']
        data = urllib.request.urlopen(link, timeout=60).read()
        if not data.startswith(b'PK'):
            raise ValueError('Expected a sound archive for ' + pack)
        archive.write_bytes(data)
    folder = CACHE / pack
    folder.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as zipped:
        for item in zipped.infolist():
            if not (folder / item.filename).resolve().is_relative_to(folder.resolve()):
                raise ValueError('Unsafe archive path')
        zipped.extractall(folder)
    license_text = (folder / 'License.txt').read_text(encoding='utf-8-sig')
    if 'CC0' not in license_text or 'Kenney' not in license_text:
        raise ValueError('Unexpected source license for ' + pack)
    return folder, license_text


def main():
    parser = argparse.ArgumentParser()
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
    packs = {pack: load_pack(pack) for pack in PACKS}
    reference = ROOT / 'art/source/audio-candidates/kenney-2026-11-12.json'
    pins = {(s['pack'], s['file']): s['sha256']
            for item in json.loads(reference.read_text(encoding='utf-8')) for s in item['sources']}
    tag = datetime.date.today().isoformat()
    stem = 'Prospector-II-sound-pitches-' + tag
    suffix = ''; attempt = 1
    while (ROOT / 'outputs' / (stem + suffix + '.html')).exists():
        attempt += 1; suffix = '-' + str(attempt)
    output = ROOT / 'outputs' / ('audio-pitches-' + tag + suffix)
    output.mkdir(parents=True, exist_ok=False)
    for pack, (_, license_text) in packs.items():
        (output / ('License-' + pack + '.txt')).write_text(license_text, encoding='utf-8')
    reports = []
    cards = []
    for ident, role, pitch, stems in CANDIDATES:
        command = [ffmpeg, '-v', 'error', '-nostdin', '-n']
        filters = []; labels = []; sources = []
        for index, spec in enumerate(stems):
            src = packs[spec['pack']][0] / 'Audio' / spec['file']
            digest = hashlib.sha256(src.read_bytes()).hexdigest()
            if pins.get((spec['pack'], spec['file'])) != digest:
                raise ValueError('Candidate source changed; review before re-auditioning: ' + spec['file'])
            command += ['-i', str(src)]
            chain = 'aresample=44100'
            if spec['trim']:
                length = spec['trim']
                chain += ',atrim=duration=' + str(length) + ',asetpts=PTS-STARTPTS,afade=t=out:st=' + str(max(0, length - .06)) + ':d=0.06'
            if spec['delay']:
                chain += ',adelay=' + str(round(spec['delay'] * 1000)) + ':all=1'
            filters.append('[' + str(index) + ':a]' + chain + '[a' + str(index) + ']')
            labels.append('[a' + str(index) + ']')
            sources.append({**spec, 'sha256': digest,
                            'url': 'https://kenney.nl/assets/' + spec['pack'], 'license': 'CC0'})
        if len(stems) > 1:
            filters.append(''.join(labels) + 'amix=inputs=' + str(len(stems)) + ':duration=longest:normalize=1,volume=0.7[out]')
        else:
            filters.append(labels[0] + 'volume=0.7[out]')
        target = output / (ident + '.mp3')
        command += ['-filter_complex', ';'.join(filters), '-map', '[out]', '-map_metadata', '-1',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', '-ac', '2', str(target)]
        subprocess.run(command, check=True)
        payload = target.read_bytes()
        reports.append({'id': ident, 'role': role, 'pitch': pitch, 'bytes': len(payload),
                        'output_sha256': hashlib.sha256(payload).hexdigest(), 'sources': sources})
        detail = '; '.join(spec['file'] + (' (excerpt)' if spec['trim'] else '') for spec in stems)
        cards.append('<article><h2>' + ident + ' — ' + html.escape(role) + '</h2><p>' + html.escape(pitch) + '</p>'
                     '<audio controls preload="metadata" data-id="' + ident + '" src="data:audio/mpeg;base64,' + base64.b64encode(payload).decode() + '"></audio>'
                     '<details><summary>Source / treatment</summary><p>' + html.escape(detail) + '</p><p>Kenney, CC0. '
                     + ('Layered recordings; ' if len(stems) > 1 else '') + '96 kbps MP3, gain 0.7. No pitch change.</p></details></article>')
    document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prospector II — sound pitches</title><style>body{background:#0c1119;color:#d9e5ee;font:16px system-ui;margin:0;padding:28px;max-width:1100px;margin:auto}h1{color:#9ed3ff}p{color:#a5b7c7;line-height:1.5}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:16px}article{background:#152130;border:1px solid #30475c;padding:18px;border-radius:8px}h2{font-size:18px;margin:0}audio{width:100%;margin:8px 0}summary{color:#8bb3ce;cursor:pointer}label{display:block;margin:20px 0}a{color:#9ed3ff}</style>
<h1>Prospector II — new sound pitches</h1><p>These are proposals to audition, with no changes to the game. Use C1–C12 when giving feedback. Your original Prospector assignments remain separate. Some candidates are excerpts or layers; each card identifies the treatment.</p>
<label>Listening volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.8"></label><main>''' + ''.join(cards) + '''</main>
<p>Sources: <a href="https://kenney.nl/assets/sci-fi-sounds">Sci-fi Sounds</a>, <a href="https://kenney.nl/assets/impact-sounds">Impact Sounds</a>, <a href="https://kenney.nl/assets/interface-sounds">Interface Sounds</a>, <a href="https://kenney.nl/assets/digital-audio">Digital Audio</a>. Kenney, CC0.</p>
<script>const clips=[...document.querySelectorAll('audio')],volume=document.getElementById('volume');function setVolume(){for(const a of clips)a.volume=Number(volume.value)}volume.addEventListener('input',setVolume);setVolume();for(const a of clips)a.addEventListener('play',()=>{for(const b of clips)if(b!==a){b.pause();b.currentTime=0}});</script></html>'''
    page = ROOT / 'outputs' / (stem + suffix + '.html')
    page.write_text(document, encoding='utf-8')
    (output / 'manifest.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
    print(json.dumps({'page': str(page), 'clips': len(reports), 'audio_bytes': sum(r['bytes'] for r in reports), 'folder': str(output)}))


if __name__ == '__main__':
    main()
