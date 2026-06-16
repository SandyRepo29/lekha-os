import glob, os

files = (
    glob.glob(r'C:\Users\sandy\OneDrive\Desktop\LekhaOS\app\(app)\asset-intelligence\**\*.tsx', recursive=True) +
    glob.glob(r'C:\Users\sandy\OneDrive\Desktop\LekhaOS\app\(app)\asset-intelligence\*.tsx') +
    glob.glob(r'C:\Users\sandy\OneDrive\Desktop\LekhaOS\components\asset-intelligence\*.tsx')
)

# â€" display = double-encoded em-dash
# Em-dash (U+2014) = \xe2\x80\x94 in UTF-8
# When each byte is read as Windows-1252 and re-encoded to UTF-8:
#   \xe2 -> a-with-hat (U+00E2) -> \xc3\xa2
#   \x80 -> euro sign (U+20AC) -> \xe2\x82\xac
#   \x94 -> right-double-quote (U+201D) -> \xe2\x80\x9d
BAD_EM_DASH  = b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9d'
GOOD_EM_DASH = b'\xe2\x80\x94'

fixed = 0
for f in set(files):
    if not os.path.exists(f):
        continue
    data = open(f, 'rb').read()
    if BAD_EM_DASH in data:
        count = data.count(BAD_EM_DASH)
        data = data.replace(BAD_EM_DASH, GOOD_EM_DASH)
        open(f, 'wb').write(data)
        print(f'Fixed {count} em-dash(es) in: {os.path.basename(f)}')
        fixed += 1
    else:
        print(f'Clean: {os.path.basename(f)}')

print(f'\nDone. Fixed {fixed} file(s).')
