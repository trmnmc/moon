import json, time, shutil, sys

P = '/opt/swarm/runs/current.json'
r = json.load(open(P))
now = int(time.time())
hb = dict(ts=now, next_wakeup_at=now + 2700, pid=326222, limp=False, degraded_tiers=[])
r['heartbeat'] = hb
json.dump(r, open(P + '.tmp', 'w'), indent=2)
shutil.move(P + '.tmp', P)
stop = 1786807947
print('heartbeat ts', now, 'next_wakeup_at', now + 2700, 'pid 326222')
print('stop_at', stop, 'remaining_s', stop - now, 'hours', round((stop - now) / 3600.0, 2))
