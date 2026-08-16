import json, os, time, shutil

RUNFILE = '/opt/swarm/runs/current.json'
STOP = 1786942799
BASE = 90

now = int(time.time())
wake = now + BASE
# hard rule 8: never schedule past stop_at -- clamp so wake + 900 <= stop_at
if wake + 900 > STOP:
    wake = STOP - 900
r = json.load(open(RUNFILE))
r['heartbeat']['ts'] = now
r['heartbeat']['next_wakeup_at'] = wake
json.dump(r, open(RUNFILE + '.tmp', 'w'), indent=2)
os.replace(RUNFILE + '.tmp', RUNFILE)
shutil.copy(RUNFILE, RUNFILE + '.bak')
print('now', now, '-> next_wakeup_at', wake, '(+%ds)' % (wake - now),
      '| stop_at - wake =', STOP - wake, 's')
