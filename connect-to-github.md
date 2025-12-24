# הוראות חיבור ל-GitHub

## ✅ Build הצליח - מוכן לחיבור!

### דרך 1: דרך GitHub Desktop (הכי קל - לא צריך Xcode Tools)

1. **הורד והתקן GitHub Desktop:**
   - https://desktop.github.com/

2. **פתח את GitHub Desktop:**
   - File → Add Local Repository
   - בחר את התיקייה: `/Users/citizenm/Desktop/spam/quickshop3-main`
   - לחץ "Add"

3. **צור Repository חדש:**
   - לחץ "Publish repository" או "Create repository"
   - בחר שם ל-repository (למשל: `quickshop3`)
   - בחר אם זה Private או Public
   - לחץ "Publish repository"

4. **Commit ו-Push:**
   - GitHub Desktop יזהה את השינויים
   - כתוב commit message: "feat: Add discount display in OrderQuickView"
   - לחץ "Commit to main"
   - לחץ "Push origin"

### דרך 2: דרך Cursor/VS Code (אם יש Git GUI)

1. **פתח את התיקייה ב-Cursor:**
   ```bash
   cd /Users/citizenm/Desktop/spam/quickshop3-main
   cursor .
   ```

2. **בחר Source Control (Ctrl+Shift+G):**
   - לחץ על "Initialize Repository" אם צריך
   - לחץ על "+" ליד "Changes" כדי להוסיף הכל
   - כתוב commit message
   - לחץ "Commit"
   - לחץ "Publish Branch" או "Push"

### דרך 3: דרך GitHub Website (יצירת Repository)

1. **צור Repository חדש ב-GitHub:**
   - לך ל: https://github.com/new
   - שם: `quickshop3` (או שם אחר)
   - בחר Private או Public
   - **אל תסמן** "Initialize with README"
   - לחץ "Create repository"

2. **העתק את ה-URL** של ה-repository (למשל: `https://github.com/yourusername/quickshop3.git`)

3. **השתמש ב-GitHub Desktop או Cursor** כדי לחבר:
   - פתח את התיקייה ב-GitHub Desktop
   - לחץ "Publish repository"
   - או ב-Cursor: Source Control → Push → Add Remote

### דרך 4: דרך Terminal (אם יש Xcode Tools)

אם התקנת Xcode Command Line Tools:

```bash
cd /Users/citizenm/Desktop/spam/quickshop3-main

# Initialize git (אם לא כבר)
git init

# Add all files
git add -A

# Commit
git commit -m "feat: Add discount display in OrderQuickView and fix premium club API"

# Add remote (החלף ב-URL שלך)
git remote add origin https://github.com/YOUR_USERNAME/quickshop3.git

# Push
git push -u origin main
```

## לאחר החיבור ל-GitHub:

1. **חבר את Vercel ל-GitHub:**
   - לך ל: https://vercel.com/new
   - לחץ "Import Git Repository"
   - בחר את ה-repository שיצרת
   - Vercel יבנה ויעלה אוטומטית!

## ✅ הכל מוכן - רק צריך לחבר!
