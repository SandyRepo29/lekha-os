import os, glob

files = glob.glob(r'C:\Users\sandy\OneDrive\Desktop\LekhaOS\app\(app)\asset-intelligence\**\*.tsx', recursive=True)

replacements = [
    (b'\xc3\xa2\xe2\x80\x9e\xc2\xa2', b'\xe2\x84\xa2'),
    (b'\xc3\xa2\xe2\x80\x94',         b'\xe2\x80\x94'),
    (b'\xc3\xa2\xe2\x86\x92',         b'\xe2\x86\x92'),
    (b'\xc3\x82\xc2\xb7',             b'\xc2\xb7'),
    (b'\xc3\xa2\xe2\x80\x93',         b'\xe2\x80\x93'),
    (b'\xc3\x82\xc2\xa0',             b'\x20'),
]

for f in set(files):
    if not os.path.exists(f):
        continue
    data = open(f, 'rb').read()
    original = data
    for bad, good in replacements:
        data = data.replace(bad, good)
    if data != original:
        open(f, 'wb').write(data)
        print('Fixed: ' + os.path.basename(f))
    else:
        print('Clean: ' + os.path.basename(f))
