"""Generate sixteen repeatable quiz sets from existing Modern Talking previews."""
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
# Keep the original fourteen sets stable. Encore sets use remaining songs
# plus a repeatable sample of earlier songs, without repeats between them.
encore_rng = random.Random(2027)
encore = pool[140:160]
encore += encore_rng.sample(selected, 20 - len(encore))
encore_rng.shuffle(encore)
selected += encore
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
    ["Encore Heartbeats", "Encore Dreamers"],
    ["Midnight Encore", "Encore Superstars"],
]
name_rng = random.Random(2026)
sets = []
for index in range(16):
    questions = []
    for song in selected[index * 10:(index + 1) * 10]:
        wrong = rng.sample([item['title'] for item in pool if item['title'] != song['title']], 3)
        options = [song['title'], *wrong]
        rng.shuffle(options)
        questions.append({**song, 'options': options})
    sets.append({'id': index + 1, 'name': name_rng.choice(nickname_choices[index]), 'questions': questions})
(ROOT / 'static/quiz-questions.json').write_text(json.dumps({'version': 3, 'sets': sets}, indent=2, ensure_ascii=False) + '\n')
print('Generated 16 named sets with 10 distinct songs each (160 questions total).')
