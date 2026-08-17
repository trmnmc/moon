p = '/usr/share/zoneinfo/zone1970.tab'
names = set()
n = 0
for line in open(p):
    if line.startswith('#') or not line.strip():
        continue
    f = line.split('\t')
    for z in f[2].strip().split(','):
        names.add(z)
        n += 1
print('zone1970.tab zone entries:', n, 'unique canonical:', len(names))
print('US/Samoa is a canonical zone?', 'US/Samoa' in names)
print('Pacific/Pago_Pago is a canonical zone?', 'Pacific/Pago_Pago' in names)
