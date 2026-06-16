import os

f = open(r'C:\Users\sandy\OneDrive\Desktop\LekhaOS\app\(app)\asset-intelligence\page.tsx', 'rb').read()
print('File size:', len(f))

patterns = [
    (b'\xe2\x80\x94', 'correct em-dash'),
    (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9d', 'double-encoded em-dash'),
    (b'\xc3\xa2\xc2\x80\xc2\x94', 'another double-encoded'),
    (b'\xe2\x80\x93', 'en-dash'),
    (b'\xc3\xa2', 'garbled a-hat start'),
]
for p, name in patterns:
    if p in f:
        idx = f.index(p)
        ctx = f[max(0, idx-15):idx+20]
        try:
            print(f'Found {name} at {idx}: {ctx.decode("utf-8", errors="replace")}')
        except Exception:
            print(f'Found {name} at {idx}: hex={ctx.hex()}')
    else:
        print(f'NOT found: {name}')
