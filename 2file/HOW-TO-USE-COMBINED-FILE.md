# 📋 HOW TO USE THE COMBINED FILE

## Download the File
✅ **STEP2-ALL-FILES-COMBINED.txt** - Contains ALL 18 code files in one document

## How to Extract Files

### Method 1: Manual Copy-Paste (Easy)
1. Open `STEP2-ALL-FILES-COMBINED.txt`
2. Find each section marked with:
   ```
   ===========================================
   FILE: src/path/to/file.tsx
   ===========================================
   ```
3. Copy the code between the file markers
4. Create the file in your project at the specified path
5. Paste the code
6. Repeat for all files

### Method 2: Automated Script (Fast)

Save this script as `extract-files.sh` in the same folder as the combined file:

```bash
#!/bin/bash

# Usage: ./extract-files.sh STEP2-ALL-FILES-COMBINED.txt

INPUT_FILE="$1"
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File $INPUT_FILE not found"
    exit 1
fi

cd defendx-siem || exit 1

current_file=""
writing=0

while IFS= read -r line; do
    if [[ $line =~ ^FILE:\ (.+)$ ]]; then
        current_file="${BASH_REMATCH[1]}"
        writing=0
        continue
    fi
    
    if [[ $line == "===========================================  ]]; then
        if [ -n "$current_file" ] && [ $writing -eq 0 ]; then
            writing=1
            # Create directory
            mkdir -p "$(dirname "$current_file")"
            # Clear file
            > "$current_file"
            echo "Creating: $current_file"
        elif [ $writing -eq 1 ]; then
            writing=0
            current_file=""
        fi
        continue
    fi
    
    if [ $writing -eq 1 ] && [ -n "$current_file" ]; then
        echo "$line" >> "$current_file"
    fi
done < "$INPUT_FILE"

echo "✓ All files extracted!"
```

Run it:
```bash
chmod +x extract-files.sh
./extract-files.sh STEP2-ALL-FILES-COMBINED.txt
```

## File List (18 files total)

### Providers (1)
- src/lib/providers/react-query-provider.tsx

### Hooks (2)
- src/lib/hooks/use-agents.ts
- src/lib/hooks/use-alerts.ts

### Stores (3)
- src/lib/store/auth-store.ts
- src/lib/store/filters-store.ts
- src/lib/store/theme-store.ts

### Utils (4)
- src/lib/utils/cn.ts
- src/lib/utils/severity.ts
- src/lib/utils/date.ts
- src/lib/utils/format.ts

### Layouts (2)
- src/app/layout.tsx (REPLACE)
- src/app/(dashboard)/layout.tsx

### Components (4)
- src/components/layout/Sidebar.tsx
- src/components/layout/Header.tsx
- src/components/ui/card.tsx
- src/components/ui/badge.tsx

### Pages (2)
- src/app/page.tsx (REPLACE)
- src/app/(dashboard)/overview/page.tsx

## Quick Setup Steps

1. **Extract all files** using one of the methods above

2. **Update .env.local**:
```env
WAZUH_API_URL=https://YOUR_IP:55000
WAZUH_API_USERNAME=admin
WAZUH_API_PASSWORD=Eqt5N.sRzA8?qgeTLInrLUQ+2xohVxDV
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

3. **Install & Run**:
```bash
cd defendx-siem
npm install
npm run dev
```

4. **Open Browser**:
```
http://localhost:3000
```

## Verification

After setup, check:
- [ ] Dashboard loads without errors
- [ ] See real agent count
- [ ] See alert statistics
- [ ] Sidebar navigation works
- [ ] Theme toggle works
- [ ] No console errors (F12)

## Need Help?

If you get stuck:
1. Check the STEP2-PLACEMENT.md for file locations
2. Check the STEP2-SUMMARY.md for troubleshooting
3. Run `npm run type-check` to see TypeScript errors
4. Check browser console (F12) for runtime errors

## What You'll See

✅ Modern dark theme dashboard
✅ Real-time agent statistics
✅ Alert severity breakdown
✅ Recent alerts feed
✅ Security score
✅ Live connection status
✅ Collapsible sidebar
✅ Theme toggle

Ready? Let's go! 🚀
