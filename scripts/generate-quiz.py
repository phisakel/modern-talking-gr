"""Generate fourteen repeatable quiz sets from existing Modern Talking previews."""
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
songs = {}
for path in sorted((ROOT / 'content/song').glob('*.md')):
    text = path.read_text()
    title_match = re.search(r'^title: (.+)$', text, re.M)
    preview = re.search(r'^preview_url: "(https:[^"]+)"', text, re.M)
    if not title_match or not preview or not re.search(r'^artist_id: 19109505$', text, re.M):
        continue
    original = json.loads(title_match[1])
    title = re.sub(r'\s*[\[(].*', '', original).strip()
    key = re.sub(r'[^a-z0-9]', '', title.lower())
    if any(word in title.lower() for word in ['mix', 'medley']) or re.search(r"'\d{2}$", title):
        continue
    candidate = {'id': path.stem, 'title': title, 'preview': preview[1]}
    if key not in songs or original == title:
        songs[key] = candidate
pool = sorted(songs.values(), key=lambda song: song['title'].lower())
assert len(pool) >= 140
rng = random.Random(1984)
rng.shuffle(pool)
selected = pool[:140]
# Each pair combines themes from songs in its set. A separate seeded RNG
# gives repeatable random nicknames without changing the answer choices.
nickname_choices = [
    ["Diamond Heroes", "Angie's Peacekeepers"],
    ["Cinderella's Blackbirds", "Stranded Dreamers"],
    ["Atlantis Countdown", "Lady Lai's Superstars"],
    ["Moonlight Drummers", "Sheila's Victory Lap"],
    ["December Angels", "New York Heartbeats"],
    ["Arabian Shooting Stars", "Charlene's Golden Hour"],
    ["Louie's Dream Machines", "Rouge Robotas"],
    ["Lucky Witchqueens", "Chinatown Dreamers"],
    ["Cosmic Paris Nights", "Wild Water Princesses"],
    ["Brooklyn Sky Riders", "Cadillac Angels"],
    ["Midnight Tango Crew", "Forever Night Owls"],
    ["Rainbow Swan Riders", "Juliet's Heaven Club"],
    ["Million Heartbeats", "Heaven's Love Letters"],
    ["Mystery Warriors", "Cheri's Christmas Hearts"],
]
name_rng = random.Random(2026)
sets = []
for index in range(14):
    questions = []
    for song in selected[index * 10:(index + 1) * 10]:
        wrong = rng.sample([item['title'] for item in pool if item['title'] != song['title']], 3)
        options = [song['title'], *wrong]
        rng.shuffle(options)
        questions.append({**song, 'options': options})
    sets.append({'id': index + 1, 'name': name_rng.choice(nickname_choices[index]), 'questions': questions})
(ROOT / 'static/quiz-questions.json').write_text(json.dumps({'version': 2, 'sets': sets}, indent=2, ensure_ascii=False) + '\n')
print('Generated 14 named sets with 10 unique songs each (140 songs total).')
